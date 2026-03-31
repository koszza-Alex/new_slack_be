import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';

import { Channel } from '../../../src/channel/entities/channel.entity';
import { User } from '../../../src/user/entities/user.entity';

@Entity()
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  content: string;

  // user (one-to-many)
  @ManyToOne(() => User)
  sender: User;

  // channel (one-to-many)
  @ManyToOne(() => Channel)
  channel: Channel;

  // user (one-to-many)
  @Column({ nullable: true })
  parentId?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
