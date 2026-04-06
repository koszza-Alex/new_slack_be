import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Activity } from './entities/activity.entity';
import { ActivityService } from './activity.service';
import { ActivityGateway } from './activity.gateway';
import { ActivityController } from './activity.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Activity])],
    controllers: [ActivityController],
    providers: [ActivityService, ActivityGateway],
    exports: [ActivityService, ActivityGateway],
})
export class ActivityModule {}
