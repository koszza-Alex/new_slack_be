import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { DmPresenter } from '../presenter/dm.presenter';
import { ActivityService } from 'src/activity/activity.service';
import { ActivityGateway } from 'src/activity/activity.gateway';

function toPreview(html: string, maxLen = 80): string {
    const plain = html.replace(/<[^>]*>/g, '').trim();
    return plain.length > maxLen ? plain.slice(0, maxLen) + '…' : plain;
}

/** Extract all @userId mentions from HTML message content */
function extractMentions(content: string): string[] {
    const matches = content.match(/data-id="([^"]+)"/g) ?? [];
    return matches.map((m) => m.replace(/data-id="|"/g, ''));
}

@WebSocketGateway({ cors: true })
export class DmGateway {
    @WebSocketServer()
    server: Server;

    constructor(
        private readonly presenter: DmPresenter,
        private readonly activityService: ActivityService,
        private readonly activityGateway: ActivityGateway,
    ) {}

    @SubscribeMessage('join_dm')
    handleJoinDm(client: Socket, conversationId: string) {
        client.join(`dm:${conversationId}`);
    }

    @SubscribeMessage('leave_dm')
    handleLeaveDm(client: Socket, conversationId: string) {
        client.leave(`dm:${conversationId}`);
    }

    @SubscribeMessage('send_dm_message')
    async handleDmMessage(
        @MessageBody() payload: {
            conversationId: string;
            senderId: string;
            content: string;
            parentId?: string;
            fileIds?: string[];
            workspaceId?: string;
        },
    ) {
        const message = await this.presenter.sendMessage(
            payload.conversationId,
            payload.senderId,
            payload.content,
            payload.parentId,
            payload.fileIds,
        );

        const room = `dm:${payload.conversationId}`;
        const actor = message.sender;
        const actorUsername: string = actor?.dispname || actor?.email || 'Someone';
        const actorAvatar: string = actor?.avatar ?? '/uploads/avatar.png';
        const preview = toPreview(payload.content ?? '');

        if (payload.parentId) {
            this.server.to(room).emit('new_dm_thread_message', message);
            const thread = await this.presenter.getThread(payload.parentId, payload.senderId);
            if (thread[0]) {
                this.server.to(room).emit('dm_thread_updated', thread[0]);

                // Activity: DM reply — notify root message sender
                const rootSenderId: string = (thread[0] as any).sender?.id;
                if (rootSenderId && rootSenderId !== payload.senderId) {
                    const activity = await this.activityService.create({
                        recipientId: rootSenderId,
                        actorId: payload.senderId,
                        actorUsername,
                        actorAvatar,
                        type: 'reply',
                        messagePreview: preview,
                        messageId: message.id,
                        conversationId: payload.conversationId,
                        workspaceId: payload.workspaceId,
                    });
                    this.activityGateway.emitToUser(rootSenderId, activity);
                }
            }
        } else {
            this.server.to(room).emit('new_dm_message', message);

            // Activity: DM mentions — notify each mentioned user
            const mentionedIds = extractMentions(payload.content ?? '');
            for (const recipientId of mentionedIds) {
                if (recipientId === payload.senderId) continue;
                const activity = await this.activityService.create({
                    recipientId,
                    actorId: payload.senderId,
                    actorUsername,
                    actorAvatar,
                    type: 'mention',
                    messagePreview: preview,
                    messageId: message.id,
                    conversationId: payload.conversationId,
                    workspaceId: payload.workspaceId,
                });
                this.activityGateway.emitToUser(recipientId, activity);
            }
        }

        return message;
    }

    @SubscribeMessage('toggle_dm_reaction')
    handleDmReaction(
        @MessageBody() payload: {
            conversationId: string;
            messageId: string;
            reactions: any[];
            senderId?: string;
            messageOwnerId?: string;
            workspaceId?: string;
            actorUsername?: string;
            actorAvatar?: string;
            emoji?: string;
        },
    ) {
        this.server.to(`dm:${payload.conversationId}`).emit('dm_reaction_updated', {
            conversationId: payload.conversationId,
            messageId: payload.messageId,
            reactions: payload.reactions,
        });
    }

    @SubscribeMessage('dm_message_edit')
    handleDmMessageEdit(
        @MessageBody() payload: { conversationId: string; messageId: string; content: string; updatedAt: string },
    ) {
        this.server.to(`dm:${payload.conversationId}`).emit('dmMessageEdited', {
            conversationId: payload.conversationId,
            messageId: payload.messageId,
            content: payload.content,
            updatedAt: payload.updatedAt,
        });
    }

    @SubscribeMessage('dm_message_delete')
    handleDmMessageDelete(
        @MessageBody() payload: { conversationId: string; messageId: string; updatedRoot?: any },
    ) {
        const room = `dm:${payload.conversationId}`;
        this.server.to(room).emit('dmMessageDeleted', {
            conversationId: payload.conversationId,
            messageId: payload.messageId,
        });
        if (payload.updatedRoot) {
            this.server.to(room).emit('dm_thread_updated', payload.updatedRoot);
        }
    }
}
