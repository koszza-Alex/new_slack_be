// =========================
// presenter/message.presenter.ts
// =========================
import { Injectable } from '@nestjs/common';
import { MessageRepository } from '../model/message.repository';
import { Message } from '../model/message.entity';

@Injectable()
export class MessagePresenter {
    constructor(private readonly repo: MessageRepository) { }

    async sendMessage(payload: any) {
        const { content, channelId, senderId, parentId } = payload;

        let parent: Message | null = null;
        let threadRootId: string | null = null;

        if (parentId) {
            parent = await this.repo.findOne(parentId);

            if (!parent) {
                throw new Error('Parent message not found');
            }

            // threadRootId always points to the top-level root
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

        // Update root message metadata when a reply is created
        if (threadRootId) {
            await this.repo.incrementReplyCount(threadRootId);
            await this.repo.updateLastReply(threadRootId);
        }

        // Return full message with sender populated
        return await this.repo.findOne(saved.id);
    }

    async getChannelMessages(channelId: string, cursor?: string) {
        return this.repo.findByChannel(channelId, cursor);
    }

    async getThread(messageId: string) {
        const message = await this.repo.findOne(messageId);

        if (!message) {
            throw new Error('Message not found');
        }

        // The root of the thread is either the message itself or its threadRootId
        const threadRootId = message.threadRootId ?? message.id;

        // Return root message + all replies ordered ASC
        return this.repo.findThread(threadRootId);
    }
}

