import {
  Column,
  Entity,
  JoinTable,
  // JoinColumn,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { User } from 'src/user/entities/user.entity';
import { ChannelType } from '../dto/create-channel.dto';
import { Workspace } from 'src/workspace/entities/workspace.entity';
import { Message } from 'src/message/model/message.entity';

@Entity()
export class Channel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  // workspace (one-to-many)
  @ManyToOne(() => Workspace, (workspace) => workspace.channels, {
    onDelete: 'CASCADE',
  })
  // @JoinColumn({ name: "workspaceId" })
  workspace: Workspace;

  @Column()
  workspaceId: string;

  @Column({ type: 'enum', enum: ChannelType, default: ChannelType.PUBLIC })
  channelType: ChannelType;

  /** The user who created this channel — used for ownership checks on edit/delete */
  @Column({ nullable: true })
  creatorId: string;

  // privacy channel members (many-to-many)
  @ManyToMany(() => User, (user) => user.channels)
  @JoinTable()
  members: User[];

  // inside Channel class
  @OneToMany(() => Message, (message) => message.channel)
  messages: Message[];
}
