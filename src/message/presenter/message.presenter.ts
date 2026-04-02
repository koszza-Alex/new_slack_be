// =========================
// presenter/message.presenter.ts
// =========================
import { Injectable } from '@nestjs/common';
import { MessageRepository } from '../model/message.repository';
import {
  MessageReactionRepository,
  ReactionView,
} from '../model/message-reaction.repository';
import { Message } from '../model/message.entity';

@Injectable()
export class MessagePresenter {
  constructor(
    private readonly repo: MessageRepository,
    private readonly reactionRepo: MessageReactionRepository,
  ) {}

  async sendMessage(payload: any) {
    const { content, channelId, senderId, parentId } = payload;

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

    if (threadRootId) {
      await this.repo.incrementReplyCount(threadRootId);
      await this.repo.updateLastReply(threadRootId);
    }

    const full = await this.repo.findOne(saved.id);
    return this.formatMessage(full!);
  }

  async getChannelMessages(channelId: string, cursor?: string) {
    const messages = await this.repo.findByChannel(channelId, cursor);
    return messages.map((m) => this.formatMessage(m));
  }

  async getThread(messageId: string) {
    const message = await this.repo.findOne(messageId);
    if (!message) throw new Error('Message not found');

    const threadRootId = message.threadRootId ?? message.id;
    const messages = await this.repo.findThread(threadRootId);
    return messages.map((m) => this.formatMessage(m));
  }

  /**
   * Toggle one emoji reaction for one user on one message.
   * Returns the full updated reactions array for that message.
   */
  async toggleReaction(
    messageId: string,
    emoji: string,
    userId: string,
  ): Promise<ReactionView[]> {
    return this.reactionRepo.toggle(messageId, emoji, userId);
  }

  /** Normalize a Message entity into the shape the frontend expects. */
  private formatMessage(message: Message) {
    const reactions: ReactionView[] = (message.reactions ?? []).map((r) => ({
      emoji: r.emoji,
      count: r.users?.length ?? 0,
      reactedUserIds: r.users?.map((u) => u.userId) ?? [],
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
    };
  }
}
