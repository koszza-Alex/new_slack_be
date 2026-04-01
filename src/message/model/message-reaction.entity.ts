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
import { Message } from './message.entity';
import { MessageReactionUser } from './message-reaction-user.entity';

/**
 * One record per (message, emoji) pair — supports multiple emoji types per message.
 * Unique constraint on (messageId, emoji) prevents duplicate emoji rows per message.
 */
@Entity('message_reactions')
@Unique(['messageId', 'emoji'])
export class MessageReaction {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Message, (message) => message.reactions, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'messageId' })
    message: Message;

    @Column()
    messageId: string;

    @Column()
    emoji: string;

    @OneToMany(() => MessageReactionUser, (ru: MessageReactionUser) => ru.reaction, { cascade: true })
    users: MessageReactionUser[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
