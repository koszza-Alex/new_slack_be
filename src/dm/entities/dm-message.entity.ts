import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToMany,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { DmConversation } from './dm-conversation.entity';
import { User } from 'src/user/entities/user.entity';
import { DmMessageReaction } from './dm-message-reaction.entity';

@Entity('dm_messages')
export class DmMessage {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => DmConversation, (c) => c.messages, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'conversationId' })
    conversation: DmConversation;

    @Column()
    conversationId: string;

    @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'senderId' })
    sender: User;

    @Column()
    senderId: string;

    @Column('text')
    content: string;

    // Thread: self-referential parent (mirrors channel Message entity)
    @ManyToOne(() => DmMessage, (m) => m.replies, { nullable: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'parentId' })
    parent: DmMessage;

    @Column({ nullable: true })
    parentId: string;

    @OneToMany(() => DmMessage, (m: DmMessage) => m.parent)
    replies: DmMessage[];

    @Column({ nullable: true })
    threadRootId: string;

    @Column({ default: 0 })
    replyCount: number;

    @Column({ nullable: true })
    lastReplyAt: Date;

    // Reactions (mirrors channel MessageReaction pattern)
    @OneToMany(() => DmMessageReaction, (r: DmMessageReaction) => r.message, { eager: false })
    reactions: DmMessageReaction[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
