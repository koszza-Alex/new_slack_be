// =========================
// view/message.controller.ts
// =========================
import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { MessagePresenter } from './presenter/message.presenter';
import { CreateMessageDto } from './dto/create-message.dto';

@Controller('channels/:channelId/messages')
export class MessageController {
    constructor(private readonly presenter: MessagePresenter) { }

    @Get()
    async list(
        @Param('channelId') channelId: string,
        @Query('cursor') cursor?: string,
    ) {
        return this.presenter.getChannelMessages(channelId, cursor);
    }

    // POST /channels/:channelId/messages — create root or thread reply
    @Post()
    async create(
        @Param('channelId') channelId: string,
        @Body() dto: CreateMessageDto,
    ) {
        return this.presenter.sendMessage({ ...dto, channelId });
    }

    // GET /channels/:channelId/messages/:messageId/thread
    @Get(':messageId/thread')
    async getThread(
        @Param('messageId') messageId: string,
    ) {
        return this.presenter.getThread(messageId);
    }
}
