import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Activity, ActivityType } from './entities/activity.entity';

export interface CreateActivityDto {
    recipientId: string;
    actorId: string;
    actorUsername: string;
    actorAvatar: string;
    type: ActivityType;
    messagePreview: string;
    messageId?: string;
    channelId?: string;
    workspaceId?: string;
    conversationId?: string;
}

@Injectable()
export class ActivityService {
    constructor(
        @InjectRepository(Activity)
        private readonly repo: Repository<Activity>,
    ) {}

    async create(dto: CreateActivityDto): Promise<Activity> {
        const activity = this.repo.create({
            recipientId: dto.recipientId,
            actorId: dto.actorId,
            actorUsername: dto.actorUsername,
            actorAvatar: dto.actorAvatar,
            type: dto.type,
            messagePreview: dto.messagePreview,
            messageId: dto.messageId,
            channelId: dto.channelId,
            workspaceId: dto.workspaceId,
            conversationId: dto.conversationId,
            isRead: false,
        });
        return this.repo.save(activity);
    }

    async getForUser(userId: string, limit = 50): Promise<Activity[]> {
        return this.repo.find({
            where: { recipientId: userId },
            order: { createdAt: 'DESC' },
            take: limit,
        });
    }

    async markAllRead(userId: string): Promise<void> {
        await this.repo.update({ recipientId: userId, isRead: false }, { isRead: true });
    }

    async markOneRead(activityId: string, userId: string): Promise<void> {
        await this.repo.update({ id: activityId, recipientId: userId }, { isRead: true });
    }

    async getUnreadCount(userId: string): Promise<number> {
        return this.repo.count({ where: { recipientId: userId, isRead: false } });
    }
}
