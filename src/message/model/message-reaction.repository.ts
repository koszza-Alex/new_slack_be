import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { MessageReaction } from './message-reaction.entity';
import { MessageReactionUser } from './message-reaction-user.entity';
import { User } from 'src/user/entities/user.entity';

export interface ReactionView {
    emoji: string;
    count: number;
    reactedUserIds: string[];
    reactedUsers?: { id: string; dispname: string | null; email: string | null }[];
}

@Injectable()
export class MessageReactionRepository {
    constructor(
        @InjectRepository(MessageReaction)
        private readonly reactionRepo: Repository<MessageReaction>,
        private readonly dataSource: DataSource,
    ) {}

    /** Load all reactions (with users) for a single message. */
    async findByMessage(messageId: string): Promise<MessageReaction[]> {
        return this.reactionRepo.find({
            where: { messageId },
            relations: ['users'],
        });
    }

    /**
     * Toggle a user's participation on a specific emoji reaction for a message.
     *
     * Rules (Slack multi-reaction model):
     * - Each (messageId, emoji) pair has its own reaction row.
     * - If no row exists for this emoji → create it and add the user.
     * - If row exists and user already reacted → remove user; delete row if empty.
     * - If row exists and user has NOT reacted → add user.
     * - Different emoji types on the same message are fully allowed.
     *
     * Returns the full updated reactions array for the message.
     */
    async toggle(
        messageId: string,
        emoji: string,
        userId: string,
    ): Promise<ReactionView[]> {
        await this.dataSource.transaction(async (manager) => {
            const reactionRepo = manager.getRepository(MessageReaction);
            const userRepo = manager.getRepository(MessageReactionUser);

            // Find the reaction row for this specific (messageId, emoji) pair
            const existing = await reactionRepo.findOne({
                where: { messageId, emoji },
                relations: ['users'],
            });

            if (!existing) {
                // No reaction for this emoji yet — create row and add user
                const reaction = reactionRepo.create({ messageId, emoji });
                const saved = await reactionRepo.save(reaction);
                await userRepo.save(
                    userRepo.create({ messageReactionId: saved.id, userId }),
                );
                return;
            }

            // Row exists — check if this user already reacted
            const userEntry = existing.users.find((u) => u.userId === userId);

            if (userEntry) {
                // User already reacted → remove them
                await userRepo.delete(userEntry.id);
                const remaining = existing.users.filter((u) => u.userId !== userId);

                if (remaining.length === 0) {
                    // Last user removed → delete the whole reaction row
                    await reactionRepo.delete(existing.id);
                }
            } else {
                // User has not reacted yet → add them
                await userRepo.save(
                    userRepo.create({ messageReactionId: existing.id, userId }),
                );
            }
        });

        // Return the full updated reactions for this message
        return this.getReactionViews(messageId);
    }

    /** Build the ReactionView[] for a message from DB. */
    async getReactionViews(messageId: string): Promise<ReactionView[]> {
        const rows = await this.reactionRepo.find({
            where: { messageId },
            relations: ['users'],
        });

        return Promise.all(rows.map(async (r) => {
            const userIds = r.users.map((u) => u.userId);
            const users = userIds.length > 0
                ? await this.dataSource.getRepository(User).find({ where: { id: In(userIds) } })
                : [];
            const userMap = new Map(users.map((u) => [u.id, u]));
            return {
                emoji: r.emoji,
                count: r.users.length,
                reactedUserIds: userIds,
                reactedUsers: userIds.map((uid) => ({
                    id: uid,
                    dispname: userMap.get(uid)?.dispname ?? null,
                    email: userMap.get(uid)?.email ?? null,
                })),
            };
        }));
    }
}
