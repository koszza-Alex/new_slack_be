// =========================
// model/message.repository.ts
// =========================
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Message } from './message.entity';

@Injectable()
export class MessageRepository {
    constructor(
        @InjectRepository(Message)
        private readonly repo: Repository<Message>,
    ) { }

    create(data: Partial<Message>) {
        return this.repo.create(data);
    }

    save(message: Message) {
        return this.repo.save(message);
    }

    async findByChannel(channelId: string, cursor?: string) {
        const where: any = {
            channel: { id: channelId },
            parentId: null,
        };
        if (cursor) {
            where.createdAt = LessThan(new Date(cursor));
        }

        return this.repo.find({
            where,
            order: { createdAt: 'DESC' },
            // take: 20,
            relations: ['sender', 'channel', 'reactions', 'reactions.users', 'files'],
        });
    }

    async findOne(id: string) {
        return this.repo.findOne({
            where: { id: id },
            relations: ['sender', 'reactions', 'reactions.users', 'files'],
        });
    }

    async findThread(threadRootId: string) {
        return this.repo.find({
            where: [
                { id: threadRootId },
                { threadRootId: threadRootId },
            ],
            relations: ['sender', 'reactions', 'reactions.users', 'files'],
            order: { createdAt: 'ASC' },
        });
    }

    async findReplies(parentId: string) {
        return this.repo.find({
            where: { parentId },
            relations: ['sender', 'reactions', 'reactions.users'],
            order: { createdAt: 'ASC' },
        });
    }

    async incrementReplyCount(id: string) {
        return this.repo.increment({ id }, 'replyCount', 1);
    }

    async decrementReplyCount(id: string) {
        // Clamp at 0 — never go negative
        await this.repo.decrement({ id }, 'replyCount', 1);
        await this.repo.update({ id }, {}); // no-op flush; decrement already persists
        // Re-read to ensure we don't return a negative value
        const msg = await this.findOne(id);
        if (msg && msg.replyCount < 0) {
            await this.repo.update(id, { replyCount: 0 });
        }
    }

    async updateLastReply(id: string) {
        return this.repo.update(id, {
            lastReplyAt: new Date(),
        });
    }

    async updateContent(id: string, content: string) {
        await this.repo.update(id, { content });
        return this.findOne(id);
    }

    async deleteById(id: string) {
        await this.repo.delete(id);
    }
}
