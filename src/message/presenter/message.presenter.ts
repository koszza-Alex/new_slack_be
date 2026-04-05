// =========================
// presenter/message.presenter.ts
// =========================
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { MessageRepository } from '../model/message.repository';
import {
  MessageReactionRepository,
  ReactionView,
} from '../model/message-reaction.repository';
import { Message } from '../model/message.entity';
import { File } from '../entities/file.entity';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class MessagePresenter {
  constructor(
    private readonly repo: MessageRepository,
    private readonly reactionRepo: MessageReactionRepository,
    @InjectRepository(File)
    private readonly fileRepo: Repository<File>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async sendMessage(payload: any) {
    const { content, channelId, senderId, parentId, fileIds } = payload;

    let parent: Message | null = null;
    let threadRootId: string | null = null;

    if (parentId) {
      parent = await this.repo.findOne(parentId);
      if (!parent) throw new Error('Parent message not found');
      threadRootId = parent.threadRootId ?? parent.id;
    }

    const message = this.repo.create({
      content,
      parent: parent ?? undefined,
      parentId: parentId ?? undefined,
      threadRootId: threadRootId ?? undefined,
    });

    message.sender = { id: senderId } as any;
    message.channel = { id: channelId } as any;

    const saved = await this.repo.save(message);

    // Link any pre-uploaded files to this message
    if (Array.isArray(fileIds) && fileIds.length > 0) {
      await this.fileRepo.update(fileIds, { messageId: saved.id });
    }

    if (threadRootId) {
      await this.repo.incrementReplyCount(threadRootId);
      await this.repo.updateLastReply(threadRootId);
    }

    const full = await this.repo.findOne(saved.id);
    return this.formatMessage(full!);
  }

  async getChannelMessages(channelId: string, cursor?: string) {
    const messages = await this.repo.findByChannel(channelId, cursor);
    return Promise.all(messages.map((m) => this.formatMessage(m)));
  }

  async getThread(messageId: string) {
    const message = await this.repo.findOne(messageId);
    if (!message) throw new Error('Message not found');

    const threadRootId = message.threadRootId ?? message.id;
    const messages = await this.repo.findThread(threadRootId);
    return Promise.all(messages.map((m) => this.formatMessage(m)));
  }

  async toggleReaction(
    messageId: string,
    emoji: string,
    userId: string,
  ): Promise<ReactionView[]> {
    return this.reactionRepo.toggle(messageId, emoji, userId);
  }

  async updateMessage(messageId: string, content: string) {
    const updated = await this.repo.updateContent(messageId, content);
    if (!updated) throw new Error('Message not found');
    return this.formatMessage(updated);
  }

  async deleteMessage(messageId: string): Promise<{ updatedRoot: any } | null> {
    const message = await this.repo.findOne(messageId);
    if (!message) throw new Error('Message not found');

    const threadRootId = message.threadRootId ?? (message.parentId ? message.parentId : null);

    await this.repo.deleteById(messageId);

    if (threadRootId) {
      await this.repo.decrementReplyCount(threadRootId);
      const updatedRoot = await this.repo.findOne(threadRootId);
      if (updatedRoot) {
        return { updatedRoot: await this.formatMessage(updatedRoot) };
      }
    }

    return null;
  }

  /** Normalize a Message entity into the shape the frontend expects. */
  async formatMessage(message: Message) {
    // Collect all unique user IDs across all reactions for this message
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

    const reactions: ReactionView[] = (message.reactions ?? []).map((r) => {
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

    const file = (message.files ?? []).map((f) => ({
      id: f.id,
      name: f.originalname,
      type: f.mimetype ?? '',
      path: f.path,
      size: f.size,
    }));

    return {
      id: message.id,
      content: message.content,
      sender: message.sender,
      channel: message.channel,
      parentId: message.parentId ?? null,
      threadRootId: message.threadRootId ?? null,
      replyCount: message.replyCount,
      lastReplyAt: message.lastReplyAt ?? null,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
      reactions,
      files: file,
    };
  }
}
