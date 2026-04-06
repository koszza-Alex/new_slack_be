import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Workspace } from 'src/workspace/entities/workspace.entity';
import { Channel } from 'src/channel/entities/channel.entity';
import { UserService } from './user.service';
import { UserPresenter } from './presenter/user.presenter';
import { UserController } from './view/user.controller';
import { UserGateway } from './user.gateway';

@Module({
    imports: [TypeOrmModule.forFeature([User, Workspace, Channel])],
    controllers: [UserController],
    providers: [UserService, UserPresenter, UserGateway],
    exports: [UserService],
})
export class UserModule {}
