import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';

import { User } from '../user/entities/user.entity';
import { Workspace } from '../workspace/entities/workspace.entity';
import { JwtStrategy } from './jwt.strategy';
import { AuthService } from './auth.service';
import { AuthPresenter } from './presenter/auth.presenter';
import { AuthController } from './view/auth.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([User, Workspace]),
        JwtModule.register({
            secret: process.env.JWT_SECRET,
            signOptions: { expiresIn: '24h' },
        }),
    ],
    controllers: [AuthController],
    providers: [AuthService, AuthPresenter, JwtStrategy],
})
export class AuthModule {}
