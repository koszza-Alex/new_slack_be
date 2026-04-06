// =========================
// message/view/message.controller.ts
// =========================
import {
    Controller,
    Post,
    Patch,
    Delete,
    Get,
    Body,
    Param,
    Query,
    ForbiddenException,
} from '@nestjs/common';
import { MessagePresenter } from '../presenter/message.presenter';
import { CreateMessageDto } from '../dto/create-message.dto';
import { ToggleReactionDto } from '../dto/toggle-reaction.dto';

/**
 * Message View (REST) — HTTP interface only. No business logic.
 * Delegates everything to MessagePresenter.
 */
@Controller('channels/:channelId/messages')
export class MessageController {
    constructor(private readonly presenter: MessagePresenter) {}

    @Get()
    list(@Param('channelId') channelId: string, @Query('cursor') cursor?: string) {
        return this.presenter.getChannelMessages(channelId, cursor);
    }

    @Post()
    create(@Param('channelId') channelId: string, @Body() dto: CreateMessageDto) {
        return this.presenter.sendMessage({ ...dto, channelId });
    }

    @Get(':messageId/thread')
    getThread(@Param('messageId') messageId: string) {
        return this.presenter.getThread(messageId);
    }

    @Patch(':messageId/reaction')
    async toggleReaction(
        @Param('messageId') messageId: string,
        @Body() dto: ToggleReactionDto,
    ) {
        const reactions = await this.presenter.toggleReaction(messageId, dto.emoji, dto.userId);
        return { messageId, reactions };
    }

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

    @Delete(':messageId')
    async deleteMessage(
        @Param('messageId') messageId: string,
        @Body() _body: { senderId: string },
    ) {
        const result = await this.presenter.deleteMessage(messageId);
        return { messageId, updatedRoot: result?.updatedRoot ?? null };
    }
}
