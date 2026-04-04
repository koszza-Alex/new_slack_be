// =========================
// view/message.controller.ts
// =========================
import { Controller, Post, Patch, Delete, Get, Body, Param, Query, ForbiddenException } from '@nestjs/common';
import { MessagePresenter } from './presenter/message.presenter';
import { CreateMessageDto } from './dto/create-message.dto';
import { ToggleReactionDto } from './dto/toggle-reaction.dto';

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

    // PATCH /channels/:channelId/messages/:messageId/reaction
    // Toggle a user's reaction on a message (add or remove).
    // Returns { messageId, reactions: ReactionView[] } — the full updated reaction state.
    @Patch(':messageId/reaction')
    async toggleReaction(
        @Param('messageId') messageId: string,
        @Body() dto: ToggleReactionDto,
    ) {
        const reactions = await this.presenter.toggleReaction(
            messageId,
            dto.emoji,
            dto.userId,
        );
        return { messageId, reactions };
    }

    // PATCH /channels/:channelId/messages/:messageId — edit message content
    @Patch(':messageId')
    async updateMessage(
        @Param('messageId') messageId: string,
        @Body() body: { content: string; senderId: string },
    ) {
        if (!body.content?.trim()) {
            throw new ForbiddenException('Content cannot be empty');
        }
        return this.presenter.updateMessage(messageId, body.content.trim());
    }

    // DELETE /channels/:channelId/messages/:messageId — delete a message
    @Delete(':messageId')
    async deleteMessage(
        @Param('messageId') messageId: string,
        @Body() body: { senderId: string },
    ) {
        await this.presenter.deleteMessage(messageId);
        return { messageId };
    }
}

