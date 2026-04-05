import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    OneToMany,
    UpdateDateColumn,
} from 'typeorm';

import { User } from 'src/user/entities/user.entity';
import { Channel } from 'src/channel/entities/channel.entity';
import { MessageReaction } from './message-reaction.entity';
import { File } from '../entities/file.entity';

@Entity('messages')
export class Message {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    content: string;

    @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'senderId' })
    sender: User;

    @ManyToOne(() => Channel, { nullable: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'channelId' })
    channel: Channel;

    // THREAD: self-referential parent
    @ManyToOne(() => Message, (message) => message.replies, {
        nullable: true,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'parentId' })
    parent: Message;

    @Column({ nullable: true })
    parentId: string;

    @OneToMany(() => Message, (message) => message.parent)
    replies: Message[];

    @Column({ nullable: true })
    threadRootId: string;

    @Column({ default: 0 })
    replyCount: number;

    @Column({ nullable: true })
    lastReplyAt: Date;

    // One message can have many reaction rows (one per emoji type)
    @OneToMany(() => MessageReaction, (r) => r.message, { nullable: true, eager: false })
    reactions: MessageReaction[];

    // Attached files
    @OneToMany(() => File, (f) => f.message, { nullable: true, eager: false })
    files: File[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}