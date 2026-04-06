import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Channel } from './entities/channel.entity';
import { User } from 'src/user/entities/user.entity';
import { Workspace } from 'src/workspace/entities/workspace.entity';
import { ChannelService } from './channel.service';
import { ChannelPresenter } from './presenter/channel.presenter';
import { ChannelController } from './view/channel.controller';
import { ChannelGateway } from './view/channel.gateway';

@Module({
    imports: [TypeOrmModule.forFeature([Channel, User, Workspace])],
    controllers: [ChannelController],
    providers: [ChannelService, ChannelPresenter, ChannelGateway],
})
export class ChannelModule {}
