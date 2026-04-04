import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToMany,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Unique,
} from 'typeorm';
import { DmMessage } from './dm-message.entity';
import { DmMessageReactionUser } from './dm-message-reaction-user.entity';

/**
 * One record per (dm_message, emoji) pair.
 * Mirrors MessageReaction for channel messages.
 */
@Entity('dm_message_reactions')
@Unique(['messageId', 'emoji'])
export class DmMessageReaction {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => DmMessage, (m) => m.reactions, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'messageId' })
    message: DmMessage;

    @Column()
    messageId: string;

    @Column()
    emoji: string;

    @OneToMany(() => DmMessageReactionUser, (u: DmMessageReactionUser) => u.reaction, { cascade: true })
    users: DmMessageReactionUser[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
