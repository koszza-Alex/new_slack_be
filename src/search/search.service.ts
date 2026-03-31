import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";

import { Repository, Brackets } from "typeorm";

import { User } from "src/user/entities/user.entity";
import { Channel } from "src/channel/entities/channel.entity";
import { Message } from "src/message/model/message.entity";

import { SearchResult } from "./interfaces/search-result.interface";

@Injectable()
export class SearchService {

  constructor(

    @InjectRepository(User)
    private userRepo: Repository<User>,

    @InjectRepository(Channel)
    private channelRepo: Repository<Channel>,

    @InjectRepository(Message)
    private messageRepo: Repository<Message>,

  ) { }

  async multiSearch(
    keyword: string,
    workspaceId: string,
  ): Promise<SearchResult[]> {

    if (!keyword) return [];

    const like = `%${keyword}%`;

    /* ============================
       USERS (workspace members)
    ============================ */

    const users = await this.userRepo
      .createQueryBuilder("user")

      .leftJoin(
        "user.workspaces",
        "workspace",
      )

      .where(
        "workspace.id = :workspaceId",
        { workspaceId },
      )

      .andWhere(
        `(user.email ILIKE :like
        OR user.dispname ILIKE :like)`,
        { like },
      )

      .limit(5)

      .getMany();



    /* ============================
       CHANNELS
    ============================ */

    const channels = await this.channelRepo
      .createQueryBuilder("channel")

      .leftJoin(
        "channel.workspace",
        "workspace",
      )

      .where(
        "workspace.id = :workspaceId",
        { workspaceId },
      )

      .andWhere(
        "channel.name ILIKE :like",
        { like },
      )

      .limit(5)

      .getMany();



    /* ============================
       MESSAGES
    ============================ */

    const messages = await this.messageRepo
      .createQueryBuilder("message")

      .leftJoinAndSelect(
        "message.channel",
        "channel",
      )

      .leftJoinAndSelect(
        "message.sender",
        "user",
      )

      .where(
        "channel.workspaceId = :workspaceId",
        { workspaceId },
      )

      .andWhere(
        `
      regexp_replace(
        message.content,
        '<[^>]*>',
        '',
        'g'
      ) ILIKE :like
      `,
        { like },
      )

      .limit(10)

      .getMany();



    /* ============================
       FORMAT RESULTS
    ============================ */

    const userResults: SearchResult[] =
      users.map((u) => ({

        type: "user",

        id: u.id,

        title:
          u.dispname || u.email,

        desc: u.email,

      }));



    const channelResults: SearchResult[] =
      channels.map((c) => ({

        type: "channel",

        id: c.id,

        title: c.name,

        desc: "Channel",

      }));



    const messageResults: SearchResult[] =
      messages.map((m) => ({

        type: "message",

        id: m.id,

        title:
          m.sender?.dispname
          || m.sender?.email,

        desc: m.content,

        channelId: m.channel?.id,

      }));



    /* ============================
       MERGE RESULTS
    ============================ */
    console.log("1111", [

      ...userResults,

      ...channelResults,

      ...messageResults,

    ])

    return [

      ...userResults,

      ...channelResults,

      ...messageResults,

    ];
  }
}