import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserController } from './user.controller';
import { UserService, } from './user.service';
import { Workspace } from 'src/workspace/entities/workspace.entity';
import { Channel } from 'src/channel/entities/channel.entity';
import { UserGateway } from './user.gateway';

@Module({
  imports: [TypeOrmModule.forFeature([User, Workspace, Channel])],
  controllers: [UserController],
  providers: [UserService,UserGateway],
  exports: [UserService,],
})
export class UserModule {}
