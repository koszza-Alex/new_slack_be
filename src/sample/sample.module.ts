import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './sample.controller';
import { Sample } from './entity/sample.entity';
import { AppService } from './sample.service';

@Module({
  imports: [TypeOrmModule.forFeature([Sample])],
  controllers: [AppController],
  providers: [AppService],
  exports: [AppService],
})
export class SampleModule { }
