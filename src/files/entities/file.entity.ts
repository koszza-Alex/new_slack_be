import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Channel } from 'src/channel/entities/channel.entity';
import { User } from 'src/user/entities/user.entity';
import { Workspace } from 'src/workspace/entities/workspace.entity';
import { Message } from 'src/message/entities/message.entity';

@Entity()
export class File {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  path: string;

  @Column()
  originalname: string;

  @Column()
  filename: string;

  @Column()
  size: number;

  @ManyToOne(() => User, { nullable: false })
  sender: User;

  @ManyToOne(() => Workspace, { nullable: false })
  workspace: Workspace;

  @ManyToOne(() => Channel, { nullable: true })
  channel?: Channel;

  @ManyToOne(() => Message, { nullable: true })
  message?: Message;

  @CreateDateColumn()
  createdAt: Date;
}