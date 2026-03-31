import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn
} from 'typeorm';

import { Channel } from 'src/channel/entities/channel.entity';
import { User } from 'src/user/entities/user.entity';
import { Workspace } from 'src/workspace/entities/workspace.entity';
import { Message } from './message.entity';

@Entity()
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

  // user (one-to-many)
  @ManyToOne(() => User)
  sender: User;
  
  // workspace
  @ManyToOne(() => Workspace, { nullable: false })
  workspace: Workspace;

  // message (one-to-many)
  @ManyToOne(() => Channel)
  channel: Channel;

  // message (one-to-many)
  @ManyToOne(() => Message)
  message: Message;

  @CreateDateColumn()
  createdAt: Date;
}