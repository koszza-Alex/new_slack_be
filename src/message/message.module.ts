// =========================
// message/message.module.ts
// =========================
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Message } from './model/message.entity';
import { MessageReaction } from './model/message-reaction.entity';
import { MessageReactionUser } from './model/message-reaction-user.entity';
import { MessageRepository } from './model/message.repository';
import { MessageReactionRepository } from './model/message-reaction.repository';
import { MessagePresenter } from './presenter/message.presenter';
import { MessageController } from './view/message.controller';
import { MessageGateway } from './view/message.gateway';
import { FileController } from './file.controller';
import { File } from './entities/file.entity';
import { User } from 'src/user/entities/user.entity';
import { Channel } from 'src/channel/entities/channel.entity';
import { Workspace } from 'src/workspace/entities/workspace.entity';
import { ActivityModule } from 'src/activity/activity.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Message,
      MessageReaction,
      MessageReactionUser,
      File,
      User,
      Channel,
      Workspace,
    ]),
    ActivityModule,
  ],
  controllers: [MessageController, FileController],
  providers: [
    MessagePresenter,
    MessageRepository,
    MessageReactionRepository,
    MessageGateway,
  ],
  exports: [MessagePresenter],
})
export class MessagesModule {}
