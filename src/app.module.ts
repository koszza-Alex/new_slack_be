import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import typeorm from '../db/data-source';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
// import { UserAttributionsModule } from './user-attributions/user-attributions.module';
// import { SurveyModule } from './survey/survey.module';
// import { SeedModule } from './seed/seed.module';
// import { SettingModule } from './setting/setting.module';
import { SampleModule } from './sample/sample.module';
import { MessagesModule } from './message/message.module';
import { UserModule } from './user/user.module';
import { ChannelModule } from './channel/channel.module';
import { SearchModule } from './search/search.module';
import { DmModule } from './dm/dm.module';
import { ActivityModule } from './activity/activity.module';

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1h' },
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [typeorm],
    }),
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) =>
        configService.get('typeorm') as TypeOrmModuleOptions,
      inject: [ConfigService],
    }),
    // UserAttributionsModule,
    // AuthModule,
    // SurveyModule,
    SampleModule,
    ChannelModule,
    AuthModule,
    // SeedModule,
    // SettingModule,
    UserModule,
    MessagesModule,
    SearchModule,
    DmModule,
    ActivityModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
