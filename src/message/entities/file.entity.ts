import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { User } from 'src/user/entities/user.entity';
import { Message } from '../model/message.entity';

@Entity('files')
export class File {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  path: string;

  @Column()
  originalname: string;

  @Column()
  size: number;

  @Column()
  filename: string;

  @Column({ nullable: true })
  mimetype: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  sender: User;

  /** Link to a channel message */
  @ManyToOne(() => Message, (m) => m.files, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'messageId' })
  message: Message;

  @Column({ nullable: true })
  messageId: string;

  /** Link to a DM message (stored as plain UUID — no FK to avoid circular deps) */
  @Column({ nullable: true })
  dmMessageId: string;

  @CreateDateColumn()
  createdAt: Date;
}
