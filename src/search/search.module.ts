import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { SearchController } from "./search.controller";
import { SearchService } from "./search.service";

import { User } from "src/user/entities/user.entity";
import { Channel } from "src/channel/entities/channel.entity";
import { Message } from "src/message/model/message.entity";
import { Workspace } from "src/workspace/entities/workspace.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Channel,
      Message,
      Workspace,
    ]),
  ],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}