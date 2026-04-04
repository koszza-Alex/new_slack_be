import {
    Injectable,
    BadRequestException,
    NotFoundException,
    ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { DmConversation } from './entities/dm-conversation.entity';
import { DmParticipant } from './entities/dm-participant.entity';
import { DmMessage } from './entities/dm-message.entity';
import { DmMessageReaction } from './entities/dm-message-reaction.entity';
import { DmMessageReactionUser } from './entities/dm-message-reaction-user.entity';
import { Workspace } from 'src/workspace/entities/workspace.entity';
import { User } from 'src/user/entities/user.entity';

export interface DmReactionView {
    emoji: string;
    count: number;
    reactedUserIds: string[];
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

        return messages.map((m) => this.formatMessage(m));
    }

    async sendMessage(conversationId: string, senderId: string, content: string, parentId?: string) {
        if (!content?.trim()) throw new BadRequestException('Content cannot be empty');

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
            content,
            parentId: parentId ?? undefined,
            threadRootId: threadRootId ?? undefined,
        });
        const saved = await this.messageRepo.save(message);

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

        return this.formatMessage(full!);
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

        return messages.map((m) => this.formatMessage(m));
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

        // Return full updated reactions
        const rows = await this.reactionRepo.find({
            where: { messageId },
            relations: ['users'],
        });

        return rows.map((r) => ({
            emoji: r.emoji,
            count: r.users.length,
            reactedUserIds: r.users.map((u) => u.userId),
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
    formatMessage(message: DmMessage) {
        const reactions: DmReactionView[] = (message.reactions ?? []).map((r) => ({
            emoji: r.emoji,
            count: r.users?.length ?? 0,
            reactedUserIds: r.users?.map((u) => u.userId) ?? [],
        }));

        return {
            id: message.id,
            conversationId: message.conversationId,
            content: message.content,
            sender: message.sender,
            parentId: message.parentId ?? null,
            threadRootId: message.threadRootId ?? null,
            replyCount: message.replyCount,
            lastReplyAt: message.lastReplyAt ?? null,
            createdAt: message.createdAt,
            updatedAt: message.updatedAt,
            reactions,
        };
    }
}
