import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Channel } from './entities/channel.entity';
import { ChannelService } from './channel.service';
import { ChannelController } from './channel.controller';
import { User } from 'src/user/entities/user.entity';
import { Workspace } from 'src/workspace/entities/workspace.entity';
import { ChannelGateway } from './channel.gateway';

@Module({
  imports: [TypeOrmModule.forFeature([Channel, User, Workspace])],
  controllers: [ChannelController],
  providers: [ChannelService,ChannelGateway],
})
export class ChannelModule {}