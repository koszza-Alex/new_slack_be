import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    Unique,
} from 'typeorm';
import { DmMessageReaction } from './dm-message-reaction.entity';

@Entity('dm_message_reaction_users')
@Unique(['messageReactionId', 'userId'])
export class DmMessageReactionUser {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => DmMessageReaction, (r) => r.users, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'messageReactionId' })
    reaction: DmMessageReaction;

    @Column()
    messageReactionId: string;

    @Column()
    userId: string;

    @CreateDateColumn()
    createdAt: Date;
}
