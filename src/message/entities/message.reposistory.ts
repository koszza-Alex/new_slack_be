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
  ) {}

  create(data: Partial<Message>) {
    return this.repo.create(data);
  }

  save(message: Message) {
    return this.repo.save(message);
  }

  async findByChannel(channelId: string, cursor?: string) {
    const where: any = { channelId };

    if (cursor) {
      where.createdAt = LessThan(new Date(cursor));
    }

    return this.repo.find({
      where,
      order: { createdAt: 'DESC' },
      take: 200,
    });
  }
}