// =========================
// messages.module.ts
// =========================
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Message } from './model/message.entity';
import { MessageReaction } from './model/message-reaction.entity';
import { MessageReactionUser } from './model/message-reaction-user.entity';
import { MessageRepository } from './model/message.repository';
import { MessageReactionRepository } from './model/message-reaction.repository';
import { MessagePresenter } from './presenter/message.presenter';
import { MessageController } from './message.controller';
import { MessageGateway } from './message.gateway';
import { User } from 'src/user/entities/user.entity';
import { Channel } from 'src/channel/entities/channel.entity';
import { Workspace } from 'src/workspace/entities/workspace.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Message,
      MessageReaction,
      MessageReactionUser,
      User,
      Channel,
      Workspace,
    ]),
  ],
  controllers: [MessageController],
  providers: [
    MessagePresenter,
    MessageRepository,
    MessageReactionRepository,
    MessageGateway,
  ],
  exports: [MessagePresenter],
})
export class MessagesModule { }

