import { Injectable } from '@nestjs/common';
import { DmService } from '../dm.service';

/**
 * DM Presenter — mediates between DM views (controller + gateway) and DmService.
 * All business orchestration lives here; views are pure I/O.
 */
@Injectable()
export class DmPresenter {
    constructor(private readonly dmService: DmService) {}

    getCandidates(workspaceId: string, currentUserId: string) {
        return this.dmService.getCandidates(workspaceId, currentUserId);
    }

    listConversations(workspaceId: string, currentUserId: string) {
        return this.dmService.listConversations(workspaceId, currentUserId);
    }

    getOrCreateConversation(workspaceId: string, currentUserId: string, targetUserId: string) {
        return this.dmService.getOrCreateConversation(workspaceId, currentUserId, targetUserId);
    }

    markAsRead(conversationId: string, userId: string) {
        return this.dmService.markAsRead(conversationId, userId);
    }

    getMessages(conversationId: string, currentUserId: string) {
        return this.dmService.getMessages(conversationId, currentUserId);
    }

    sendMessage(
        conversationId: string,
        senderId: string,
        content: string,
        parentId?: string,
        fileIds?: string[],
    ) {
        return this.dmService.sendMessage(conversationId, senderId, content, parentId, fileIds);
    }

    getThread(messageId: string, currentUserId: string) {
        return this.dmService.getThread(messageId, currentUserId);
    }

    async toggleReaction(messageId: string, emoji: string, userId: string) {
        const reactions = await this.dmService.toggleReaction(messageId, emoji, userId);
        return { messageId, reactions };
    }

    updateMessage(messageId: string, content: string, senderId: string) {
        return this.dmService.updateMessage(messageId, content, senderId);
    }

    deleteMessage(messageId: string, senderId: string) {
        return this.dmService.deleteMessage(messageId, senderId);
    }
}
