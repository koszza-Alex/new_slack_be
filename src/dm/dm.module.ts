import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DmConversation } from './entities/dm-conversation.entity';
import { DmParticipant } from './entities/dm-participant.entity';
import { DmMessage } from './entities/dm-message.entity';
import { DmMessageReaction } from './entities/dm-message-reaction.entity';
import { DmMessageReactionUser } from './entities/dm-message-reaction-user.entity';
import { Workspace } from 'src/workspace/entities/workspace.entity';
import { User } from 'src/user/entities/user.entity';
import { File } from 'src/message/entities/file.entity';
import { DmService } from './dm.service';
import { DmPresenter } from './presenter/dm.presenter';
import { DmController } from './view/dm.controller';
import { DmGateway } from './view/dm.gateway';
import { ActivityModule } from 'src/activity/activity.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            DmConversation,
            DmParticipant,
            DmMessage,
            DmMessageReaction,
            DmMessageReactionUser,
            Workspace,
            User,
            File,
        ]),
        ActivityModule,
    ],
    controllers: [DmController],
    providers: [DmService, DmPresenter, DmGateway],
})
export class DmModule {}
