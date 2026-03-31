import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Channel } from 'src/channel/entities/channel.entity';
import { Workspace } from 'src/workspace/entities/workspace.entity';
import { Role } from '../enums/role.enum';
import { Message } from 'src/message/model/message.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({nullable: true })
  dispname: string;

  // many-to-many workspace members
  @ManyToMany(() => Workspace, (workspace) => workspace.members)
  workspaces: Workspace[];

  // many-to-many privacy channel members
  @ManyToMany(() => Channel, (channel) => channel.members)
  channels: Channel[];

  @Column({ type: 'enum', enum: Role, default: Role.USER })
  role: Role;

  @Column({ default: '/uploads/avatar.png', nullable: true })
  avatar: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  lastLogin: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
  @OneToMany(() => Message, (message) => message.sender)
  messages: Message[];
}
