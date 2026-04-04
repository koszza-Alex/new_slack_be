import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { DmService } from './dm.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendDmMessageDto } from './dto/send-dm-message.dto';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

class ToggleDmReactionDto {
    @IsString() @IsNotEmpty() emoji: string;
    @IsString() @IsNotEmpty() userId: string;
}

class SendDmMessageWithParentDto extends SendDmMessageDto {
    @IsOptional() @IsString() parentId?: string;
}

@Controller('workspaces/:workspaceId/dm')
export class DmController {
    constructor(private readonly dmService: DmService) {}

    @Get('candidates')
    getCandidates(
        @Param('workspaceId') workspaceId: string,
        @Query('currentUserId') currentUserId: string,
    ) {
        return this.dmService.getCandidates(workspaceId, currentUserId);
    }

    @Get('conversations')
    listConversations(
        @Param('workspaceId') workspaceId: string,
        @Query('currentUserId') currentUserId: string,
    ) {
        return this.dmService.listConversations(workspaceId, currentUserId);
    }

    @Post('conversations')
    getOrCreate(
        @Param('workspaceId') workspaceId: string,
        @Body() dto: CreateConversationDto,
    ) {
        return this.dmService.getOrCreateConversation(workspaceId, dto.currentUserId, dto.targetUserId);
    }

    /** POST mark a conversation as read for the current user */
    @Post('conversations/:conversationId/read')
    markAsRead(
        @Param('conversationId') conversationId: string,
        @Query('currentUserId') currentUserId: string,
    ) {
        return this.dmService.markAsRead(conversationId, currentUserId);
    }

    /** GET root messages only (parentId IS NULL) */
    @Get('conversations/:conversationId/messages')
    getMessages(
        @Param('conversationId') conversationId: string,
        @Query('currentUserId') currentUserId: string,
    ) {
        return this.dmService.getMessages(conversationId, currentUserId);
    }

    /** POST a root or thread reply DM message */
    @Post('conversations/:conversationId/messages')
    sendMessage(
        @Param('conversationId') conversationId: string,
        @Body() dto: SendDmMessageWithParentDto,
    ) {
        return this.dmService.sendMessage(conversationId, dto.senderId, dto.content, dto.parentId);
    }

    /** GET thread: root message + all replies for a DM message */
    @Get('conversations/:conversationId/messages/:messageId/thread')
    getThread(
        @Param('messageId') messageId: string,
        @Query('currentUserId') currentUserId: string,
    ) {
        return this.dmService.getThread(messageId, currentUserId);
    }

    /** PATCH toggle a reaction on a DM message */
    @Patch('conversations/:conversationId/messages/:messageId/reaction')
    toggleReaction(
        @Param('messageId') messageId: string,
        @Body() dto: ToggleDmReactionDto,
    ) {
        return this.dmService.toggleReaction(messageId, dto.emoji, dto.userId)
            .then((reactions) => ({ messageId, reactions }));
    }
}
