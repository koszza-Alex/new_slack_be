import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Workspace } from './entities/workspace.entity';
// import { AppController } from './sample.controller';
// import { AppService } from './sample.service';

@Module({
  imports: [TypeOrmModule.forFeature([Workspace])],
  // controllers: [AppController],
  // providers: [AppService],
  // exports: [AppService],
})
export class WorkspaceModule { }
