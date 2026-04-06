import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { User } from 'src/user/entities/user.entity';

export type ActivityType = 'mention' | 'reply' | 'reaction' | 'thread';

@Entity('activities')
export class Activity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    /** The user who should receive this notification */
    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'recipientId' })
    recipient: User;

    @Column()
    recipientId: string;

    /** The user who triggered the activity */
    @Column()
    actorId: string;

    @Column({ nullable: true })
    actorUsername: string;

    @Column({ nullable: true })
    actorAvatar: string;

    @Column({ type: 'varchar' })
    type: ActivityType;

    /** Short preview of the message content */
    @Column({ nullable: true })
    messagePreview: string;

    @Column({ nullable: true })
    messageId: string;

    @Column({ nullable: true })
    channelId: string;

    @Column({ nullable: true })
    workspaceId: string;

    /** For DM activities */
    @Column({ nullable: true })
    conversationId: string;

    @Column({ default: false })
    isRead: boolean;

    @CreateDateColumn()
    createdAt: Date;
}
