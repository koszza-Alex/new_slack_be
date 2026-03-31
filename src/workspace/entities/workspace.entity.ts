import { User } from 'src/user/entities/user.entity';
import { Channel } from "src/channel/entities/channel.entity";
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
  OneToMany,
  JoinTable,
} from 'typeorm';

@Entity()
export class Workspace {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  // creator (one-to-many)
  @ManyToOne(() => User)
  creator: User;

  // members (many-to-many)
  @ManyToMany(() => User, (user) => user.workspaces)
  @JoinTable()
  members: User[];

  @OneToMany(() => Channel, (channel) => channel.workspace)
  channels: Channel[];
}
