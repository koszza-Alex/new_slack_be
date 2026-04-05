import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { File } from './entities/file.entity';
import { FileService } from './file.service';
import { FileController } from './file.controller';
import { Workspace } from '../workspace/entities/workspace.entity';
import { Channel } from '../channel/entities/channel.entity';
import { Message } from '../message/entities/message.entity';
import { FileGateway } from './file.gateway';
import { User } from 'src/user/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([File, Workspace, Channel, Message, User])],
  providers: [FileService, FileGateway],
  controllers: [FileController],
  exports: [FileService],
})
export class FileModule {}