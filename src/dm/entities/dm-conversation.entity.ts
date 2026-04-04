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
import { Workspace } from 'src/workspace/entities/workspace.entity';
import { DmParticipant } from './dm-participant.entity';
import { DmMessage } from './dm-message.entity';

/**
 * Represents a one-to-one DM conversation between two workspace members.
 * Uniqueness of the pair is enforced in service logic.
 */
@Entity('dm_conversations')
export class DmConversation {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Workspace, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'workspaceId' })
    workspace: Workspace;

    @Column()
    workspaceId: string;

    @OneToMany(() => DmParticipant, (p: DmParticipant) => p.conversation, { cascade: true })
    participants: DmParticipant[];

    @OneToMany(() => DmMessage, (m: DmMessage) => m.conversation)
    messages: DmMessage[];

    @Column({ nullable: true })
    lastMessageAt: Date;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
