import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn
} from 'typeorm';

import { User } from 'src/user/entities/user.entity';
import { Message } from './message.entity';

@Entity()
export class Emoji {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  code: string;

  // user (one-to-many)
  @ManyToOne(() => User)
  sender: User;

  // channel (one-to-many)
  @ManyToOne(() => Message)
  message: Message;

}
