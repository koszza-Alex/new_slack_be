import {
    Injectable,
    BadRequestException,
    NotFoundException,
    ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { DmConversation } from './entities/dm-conversation.entity';
import { DmParticipant } from './entities/dm-participant.entity';
import { DmMessage } from './entities/dm-message.entity';
import { DmMessageReaction } from './entities/dm-message-reaction.entity';
import { DmMessageReactionUser } from './entities/dm-message-reaction-user.entity';
import { Workspace } from 'src/workspace/entities/workspace.entity';
import { User } from 'src/user/entities/user.entity';
import { File } from 'src/message/entities/file.entity';

export interface DmReactionView {
    emoji: string;
    count: number;
    reactedUserIds: string[];
    reactedUsers: { id: string; dispname: string | null; email: string | null }[];
}

@Injectable()
export class DmService {
    constructor(
        @InjectRepository(DmConversation)
        private conversationRepo: Repository<DmConversation>,
        @InjectRepository(DmParticipant)
        private participantRepo: Repository<DmParticipant>,
        @InjectRepository(DmMessage)
        private messageRepo: Repository<DmMessage>,
        @InjectRepository(DmMessageReaction)
        private reactionRepo: Repository<DmMessageReaction>,
        @InjectRepository(DmMessageReactionUser)
        private reactionUserRepo: Repository<DmMessageReactionUser>,
        @InjectRepository(Workspace)
        private workspaceRepo: Repository<Workspace>,
        @InjectRepository(User)
        private userRepo: Repository<User>,
        @InjectRepository(File)
        private fileRepo: Repository<File>,
        private dataSource: DataSource,
    ) {}

    // ── Workspace candidates ──────────────────────────────────────────────────

    async getCandidates(workspaceId: string, currentUserId: string) {
        const workspace = await this.workspaceRepo.findOne({
            where: { id: workspaceId },
            relations: ['members'],
        });
        if (!workspace) throw new NotFoundException('Workspace not found');

        const isMember = workspace.members.some((m) => m.id === currentUserId);
        if (!isMember) throw new ForbiddenException('Not a member of this workspace');

        return workspace.members
            .filter((m) => m.id !== currentUserId)
            .map((m) => ({
                id: m.id,
                dispname: m.dispname,
                email: m.email,
                avatar: m.avatar,
            }));
    }

    // ── Conversations ─────────────────────────────────────────────────────────

    async getOrCreateConversation(
        workspaceId: string,
        currentUserId: string,
        targetUserId: string,
    ) {
        if (currentUserId === targetUserId) {
            throw new BadRequestException('Cannot create a DM with yourself');
        }

        const workspace = await this.workspaceRepo.findOne({
            where: { id: workspaceId },
            relations: ['members'],
        });
        if (!workspace) throw new NotFoundException('Workspace not found');

        const memberIds = workspace.members.map((m) => m.id);
        if (!memberIds.includes(currentUserId)) {
            throw new ForbiddenException('Current user is not a workspace member');
        }
        if (!memberIds.includes(targetUserId)) {
            throw new ForbiddenException('Target user is not a workspace member');
        }

        const existing = await this.dataSource
            .createQueryBuilder(DmConversation, 'conv')
            .innerJoin('conv.participants', 'p1', 'p1.userId = :uid1', { uid1: currentUserId })
            .innerJoin('conv.participants', 'p2', 'p2.userId = :uid2', { uid2: targetUserId })
            .where('conv.workspaceId = :workspaceId', { workspaceId })
            .getOne();

        if (existing) return this.formatConversation(existing);

        const conversation = await this.dataSource.transaction(async (manager) => {
            const conv = manager.create(DmConversation, { workspaceId });
            const saved = await manager.save(conv);
            await manager.save(manager.create(DmParticipant, { conversationId: saved.id, userId: currentUserId }));
            await manager.save(manager.create(DmParticipant, { conversationId: saved.id, userId: targetUserId }));
            return saved;
        });

        return this.formatConversation(conversation);
    }

    async listConversations(workspaceId: string, currentUserId: string) {
        const participants = await this.participantRepo.find({
            where: { userId: currentUserId },
            relations: ['conversation', 'conversation.participants', 'conversation.participants.user'],
        });

        const conversations = participants
            .map((p) => p.conversation)
            .filter((c) => c.workspaceId === workspaceId);

        const result = await Promise.all(
            conversations.map(async (conv) => {
                const latestMessage = await this.messageRepo.findOne({
                    where: { conversationId: conv.id, parentId: null as any },
                    order: { createdAt: 'DESC' },
                    relations: ['sender'],
                });

                const otherParticipant = conv.participants.find((p) => p.userId !== currentUserId);
                const myParticipant = conv.participants.find((p) => p.userId === currentUserId);

                // Count messages sent after the current user's lastReadAt
                let unreadCount = 0;
                if (myParticipant) {
                    const since = myParticipant.lastReadAt ?? new Date(0);
                    unreadCount = await this.messageRepo.count({
                        where: {
                            conversationId: conv.id,
                            parentId: null as any,
                        },
                    }).then(async () => {
                        // Count messages newer than lastReadAt that were NOT sent by current user
                        const { MoreThan } = await import('typeorm');
                        return this.messageRepo.count({
                            where: {
                                conversationId: conv.id,
                                parentId: null as any,
                                createdAt: MoreThan(since),
                            },
                        });
                    });
                    // Subtract messages sent by the current user (they don't count as unread for themselves)
                    if (unreadCount > 0) {
                        const { MoreThan } = await import('typeorm');
                        const ownMessages = await this.messageRepo.count({
                            where: {
                                conversationId: conv.id,
                                senderId: currentUserId,
                                parentId: null as any,
                                createdAt: MoreThan(since),
                            },
                        });
                        unreadCount = Math.max(0, unreadCount - ownMessages);
                    }
                }

                return {
                    id: conv.id,
                    otherUser: otherParticipant
                        ? {
                              id: otherParticipant.user.id,
                              dispname: otherParticipant.user.dispname,
                              email: otherParticipant.user.email,
                              avatar: otherParticipant.user.avatar,
                          }
                        : null,
                    latestMessage: latestMessage
                        ? {
                              id: latestMessage.id,
                              content: latestMessage.content,
                              createdAt: latestMessage.createdAt,
                              senderId: latestMessage.senderId,
                          }
                        : null,
                    unreadCount,
                    updatedAt: conv.updatedAt,
                    lastMessageAt: conv.lastMessageAt,
                };
            }),
        );

        return result.sort((a, b) => {
            const aTime = a.lastMessageAt ?? a.updatedAt;
            const bTime = b.lastMessageAt ?? b.updatedAt;
            return new Date(bTime).getTime() - new Date(aTime).getTime();
        });
    }

    /** Mark a conversation as read for the current user */
    async markAsRead(conversationId: string, userId: string) {
        await this.assertParticipant(conversationId, userId);
        await this.participantRepo.update(
            { conversationId, userId },
            { lastReadAt: new Date() },
        );
        return { ok: true };
    }

    // ── Messages ──────────────────────────────────────────────────────────────

    /** Fetch root messages only (parentId IS NULL) for the DM main list */
    async getMessages(conversationId: string, currentUserId: string) {
        await this.assertParticipant(conversationId, currentUserId);

        const messages = await this.messageRepo.find({
            where: { conversationId, parentId: null as any },
            order: { createdAt: 'ASC' },
            relations: ['sender', 'reactions', 'reactions.users'],
        });

        return Promise.all(messages.map((m) => this.formatMessage(m)));
    }

    async sendMessage(conversationId: string, senderId: string, content: string, parentId?: string, fileIds?: string[]) {
        if (!content?.trim() && !(fileIds?.length)) throw new BadRequestException('Content cannot be empty');

        await this.assertParticipant(conversationId, senderId);

        let threadRootId: string | undefined;

        if (parentId) {
            const parent = await this.messageRepo.findOne({ where: { id: parentId } });
            if (!parent) throw new NotFoundException('Parent message not found');
            threadRootId = parent.threadRootId ?? parent.id;
        }

        const message = this.messageRepo.create({
            conversationId,
            senderId,
            content: content?.trim() || '',
            parentId: parentId ?? undefined,
            threadRootId: threadRootId ?? undefined,
        });
        const saved = await this.messageRepo.save(message);

        // Link any pre-uploaded files to this DM message
        if (Array.isArray(fileIds) && fileIds.length > 0) {
            await this.fileRepo.update(fileIds, { dmMessageId: saved.id });
        }

        // Update thread metadata on root message
        if (threadRootId) {
            await this.messageRepo.increment({ id: threadRootId }, 'replyCount', 1);
            await this.messageRepo.update(threadRootId, { lastReplyAt: new Date() });
        }

        await this.conversationRepo.update(conversationId, { lastMessageAt: new Date() });

        const full = await this.messageRepo.findOne({
            where: { id: saved.id },
            relations: ['sender', 'reactions', 'reactions.users'],
        });

        return await this.formatMessage(full!);
    }

    // ── Threads ───────────────────────────────────────────────────────────────

    /** Fetch a DM thread: root message + all replies ordered ASC */
    async getThread(messageId: string, currentUserId: string) {
        const message = await this.messageRepo.findOne({ where: { id: messageId } });
        if (!message) throw new NotFoundException('Message not found');

        await this.assertParticipant(message.conversationId, currentUserId);

        const threadRootId = message.threadRootId ?? message.id;

        const messages = await this.messageRepo.find({
            where: [
                { id: threadRootId },
                { threadRootId },
            ],
            relations: ['sender', 'reactions', 'reactions.users'],
            order: { createdAt: 'ASC' },
        });

        return Promise.all(messages.map((m) => this.formatMessage(m)));
    }

    // ── Edit / Delete ─────────────────────────────────────────────────────────

    /** Update the content of a DM message. Caller must be the sender. */
    async updateMessage(messageId: string, content: string, senderId: string) {
        if (!content?.trim()) throw new BadRequestException('Content cannot be empty');
        const message = await this.messageRepo.findOne({ where: { id: messageId } });
        if (!message) throw new NotFoundException('DM message not found');
        if (message.senderId !== senderId) throw new ForbiddenException('Not the sender');
        await this.messageRepo.update(messageId, { content: content.trim() });
        const updated = await this.messageRepo.findOne({
            where: { id: messageId },
            relations: ['sender', 'reactions', 'reactions.users'],
        });
        return await this.formatMessage(updated!);
    }

    /** Hard-delete a DM message. Caller must be the sender.
     * If the message is a thread reply, decrements replyCount on the root
     * and returns the updated root so the gateway can broadcast dm_thread_updated.
     */
    async deleteMessage(messageId: string, senderId: string): Promise<{ messageId: string; updatedRoot: any | null }> {
        const message = await this.messageRepo.findOne({ where: { id: messageId } });
        if (!message) throw new NotFoundException('DM message not found');
        if (message.senderId !== senderId) throw new ForbiddenException('Not the sender');

        const threadRootId = message.threadRootId ?? (message.parentId ? message.parentId : null);

        await this.messageRepo.delete(messageId);

        if (threadRootId) {
            // Decrement, clamping at 0
            await this.messageRepo.decrement({ id: threadRootId }, 'replyCount', 1);
            const root = await this.messageRepo.findOne({
                where: { id: threadRootId },
                relations: ['sender', 'reactions', 'reactions.users'],
            });
            if (root && root.replyCount < 0) {
                await this.messageRepo.update(threadRootId, { replyCount: 0 });
                root.replyCount = 0;
            }
            return { messageId, updatedRoot: root ? await this.formatMessage(root) : null };
        }

        return { messageId, updatedRoot: null };
    }

    // ── Reactions ─────────────────────────────────────────────────────────────
    /**
     * Toggle a reaction on a DM message.
     * Mirrors the channel reaction toggle logic exactly.
     * Returns the full updated reactions array for the message.
     */
    async toggleReaction(messageId: string, emoji: string, userId: string): Promise<DmReactionView[]> {
        // Verify the message exists and the user is a participant
        const message = await this.messageRepo.findOne({ where: { id: messageId } });
        if (!message) throw new NotFoundException('DM message not found');
        await this.assertParticipant(message.conversationId, userId);

        await this.dataSource.transaction(async (manager) => {
            const reactionRepo = manager.getRepository(DmMessageReaction);
            const userRepo = manager.getRepository(DmMessageReactionUser);

            const existing = await reactionRepo.findOne({
                where: { messageId, emoji },
                relations: ['users'],
            });

            if (!existing) {
                const reaction = reactionRepo.create({ messageId, emoji });
                const saved = await reactionRepo.save(reaction);
                await userRepo.save(userRepo.create({ messageReactionId: saved.id, userId }));
                return;
            }

            const userEntry = existing.users.find((u) => u.userId === userId);
            if (userEntry) {
                await userRepo.delete(userEntry.id);
                if (existing.users.length === 1) {
                    await reactionRepo.delete(existing.id);
                }
            } else {
                await userRepo.save(userRepo.create({ messageReactionId: existing.id, userId }));
            }
        });

        // Return full updated reactions with real user data
        const rows = await this.reactionRepo.find({
            where: { messageId },
            relations: ['users'],
        });

        const allUserIds = [...new Set(rows.flatMap((r) => r.users.map((u) => u.userId)))];
        const users = allUserIds.length > 0
            ? await this.userRepo.find({ where: { id: In(allUserIds) } })
            : [];
        const userMap = new Map(users.map((u) => [u.id, u]));

        return rows.map((r) => ({
            emoji: r.emoji,
            count: r.users.length,
            reactedUserIds: r.users.map((u) => u.userId),
            reactedUsers: r.users.map((u) => ({
                id: u.userId,
                dispname: userMap.get(u.userId)?.dispname ?? null,
                email: userMap.get(u.userId)?.email ?? null,
            })),
        }));
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private async assertParticipant(conversationId: string, userId: string) {
        const participant = await this.participantRepo.findOne({
            where: { conversationId, userId },
        });
        if (!participant) throw new ForbiddenException('Not a participant in this conversation');
    }

    private formatConversation(conv: DmConversation) {
        return { id: conv.id, workspaceId: conv.workspaceId, createdAt: conv.createdAt, updatedAt: conv.updatedAt };
    }

    /** Normalize a DmMessage into the shape the frontend expects (mirrors channel formatMessage) */
    async formatMessage(message: DmMessage) {
        // Collect all unique reactor user IDs across all reactions for this message
        const allUserIds = [
            ...new Set(
                (message.reactions ?? []).flatMap((r) => r.users?.map((u) => u.userId) ?? []),
            ),
        ];

        // Batch-load User rows so we have email + dispname for every reactor
        const userMap = new Map<string, User>();
        if (allUserIds.length > 0) {
            const users = await this.userRepo.find({ where: { id: In(allUserIds) } });
            users.forEach((u) => userMap.set(u.id, u));
        }

        const reactions: DmReactionView[] = (message.reactions ?? []).map((r) => {
            const userIds = r.users?.map((u) => u.userId) ?? [];
            return {
                emoji: r.emoji,
                count: userIds.length,
                reactedUserIds: userIds,
                reactedUsers: userIds.map((uid) => ({
                    id: uid,
                    dispname: userMap.get(uid)?.dispname ?? null,
                    email: userMap.get(uid)?.email ?? null,
                })),
            };
        });

        // Load files linked to this DM message
        const fileRows = await this.fileRepo.find({ where: { dmMessageId: message.id } });
        const files = fileRows.map((f) => ({
            id: f.id,
            name: f.originalname,
            type: f.mimetype ?? '',
            path: f.path,
            size: f.size,
        }));

        return {
            id: message.id,
            conversationId: message.conversationId,
            content: message.content,
            senderId: message.senderId,
            sender: message.sender,
            parentId: message.parentId ?? null,
            threadRootId: message.threadRootId ?? null,
            replyCount: message.replyCount,
            lastReplyAt: message.lastReplyAt ?? null,
            createdAt: message.createdAt,
            updatedAt: message.updatedAt,
            reactions,
            files,
        };
    }
}
