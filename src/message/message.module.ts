// =========================
// messages.module.ts
// =========================
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Message } from './model/message.entity';
import { MessageRepository } from './model/message.repository';
import { MessagePresenter } from './presenter/message.presenter';
import { MessageController } from './message.controller';
import { MessageGateway } from './message.gateway';
import { User } from 'src/user/entities/user.entity';
import { Channel } from 'src/channel/entities/channel.entity';
import { Workspace } from 'src/workspace/entities/workspace.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Message, User, Channel, Workspace])],
  controllers: [MessageController],
  providers: [MessagePresenter, MessageRepository, MessageGateway],
  exports: [MessagePresenter],
})
export class MessagesModule { }

