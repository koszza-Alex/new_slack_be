import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    Unique,
} from 'typeorm';
import { MessageReaction } from './message-reaction.entity';

/**
 * Join table: one row per (reaction, user) pair.
 * Unique constraint on (messageReactionId, userId) prevents a user reacting twice.
 */
@Entity('message_reaction_users')
@Unique(['messageReactionId', 'userId'])
export class MessageReactionUser {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => MessageReaction, (reaction) => reaction.users, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'messageReactionId' })
    reaction: MessageReaction;

    @Column()
    messageReactionId: string;

    @Column()
    userId: string;

    @CreateDateColumn()
    createdAt: Date;
}
