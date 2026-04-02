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
            relations: ['sender', 'channel', 'reactions', 'reactions.users'],
        });
    }

    async findOne(id: string) {
        return this.repo.findOne({
            where: { id: id },
            relations: ['sender', 'reactions', 'reactions.users'],
        });
    }

    async findThread(threadRootId: string) {
        return this.repo.find({
            where: [
                { id: threadRootId },
                { threadRootId: threadRootId },
            ],
            relations: ['sender', 'reactions', 'reactions.users'],
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

    async updateLastReply(id: string) {
        return this.repo.update(id, {
            lastReplyAt: new Date(),
        });
    }
}
