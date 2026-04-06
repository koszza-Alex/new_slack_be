import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { DmPresenter } from '../presenter/dm.presenter';
import { CreateConversationDto } from '../dto/create-conversation.dto';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { SendDmMessageDto } from '../dto/send-dm-message.dto';

class ToggleDmReactionDto {
    @IsString() @IsNotEmpty() emoji: string;
    @IsString() @IsNotEmpty() userId: string;
}

class SendDmMessageWithParentDto extends SendDmMessageDto {
    @IsOptional() @IsString() parentId?: string;
}

/**
 * DM View (REST) — HTTP interface only. No business logic.
 * Delegates everything to DmPresenter.
 */
@Controller('workspaces/:workspaceId/dm')
export class DmController {
    constructor(private readonly presenter: DmPresenter) {}

    @Get('candidates')
    getCandidates(
        @Param('workspaceId') workspaceId: string,
        @Query('currentUserId') currentUserId: string,
    ) {
        return this.presenter.getCandidates(workspaceId, currentUserId);
    }

    @Get('conversations')
    listConversations(
        @Param('workspaceId') workspaceId: string,
        @Query('currentUserId') currentUserId: string,
    ) {
        return this.presenter.listConversations(workspaceId, currentUserId);
    }

    @Post('conversations')
    getOrCreate(
        @Param('workspaceId') workspaceId: string,
        @Body() dto: CreateConversationDto,
    ) {
        return this.presenter.getOrCreateConversation(workspaceId, dto.currentUserId, dto.targetUserId);
    }

    @Post('conversations/:conversationId/read')
    markAsRead(
        @Param('conversationId') conversationId: string,
        @Query('currentUserId') currentUserId: string,
    ) {
        return this.presenter.markAsRead(conversationId, currentUserId);
    }

    @Get('conversations/:conversationId/messages')
    getMessages(
        @Param('conversationId') conversationId: string,
        @Query('currentUserId') currentUserId: string,
    ) {
        return this.presenter.getMessages(conversationId, currentUserId);
    }

    @Post('conversations/:conversationId/messages')
    sendMessage(
        @Param('conversationId') conversationId: string,
        @Body() dto: SendDmMessageWithParentDto,
    ) {
        return this.presenter.sendMessage(conversationId, dto.senderId, dto.content, dto.parentId);
    }

    @Get('conversations/:conversationId/messages/:messageId/thread')
    getThread(
        @Param('messageId') messageId: string,
        @Query('currentUserId') currentUserId: string,
    ) {
        return this.presenter.getThread(messageId, currentUserId);
    }

    @Patch('conversations/:conversationId/messages/:messageId/reaction')
    toggleReaction(
        @Param('messageId') messageId: string,
        @Body() dto: ToggleDmReactionDto,
    ) {
        return this.presenter.toggleReaction(messageId, dto.emoji, dto.userId);
    }

    @Patch('conversations/:conversationId/messages/:messageId')
    updateMessage(
        @Param('messageId') messageId: string,
        @Body() body: { content: string; senderId: string },
    ) {
        return this.presenter.updateMessage(messageId, body.content, body.senderId);
    }

    @Delete('conversations/:conversationId/messages/:messageId')
    deleteMessage(
        @Param('messageId') messageId: string,
        @Body() body: { senderId: string },
    ) {
        return this.presenter.deleteMessage(messageId, body.senderId);
    }
}
