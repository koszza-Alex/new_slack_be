import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { DmPresenter } from '../presenter/dm.presenter';

/**
 * DM View (WebSocket) — socket interface only. No business logic.
 * Delegates everything to DmPresenter.
 */
@WebSocketGateway({ cors: true })
export class DmGateway {
    @WebSocketServer()
    server: Server;

    constructor(private readonly presenter: DmPresenter) {}

    @SubscribeMessage('join_dm')
    handleJoinDm(client: Socket, conversationId: string) {
        client.join(`dm:${conversationId}`);
    }

    @SubscribeMessage('leave_dm')
    handleLeaveDm(client: Socket, conversationId: string) {
        client.leave(`dm:${conversationId}`);
    }

    /**
     * send_dm_message — handles both root DM messages and DM thread replies.
     * Payload: { conversationId, senderId, content, parentId?, fileIds? }
     */
    @SubscribeMessage('send_dm_message')
    async handleDmMessage(
        @MessageBody() payload: {
            conversationId: string;
            senderId: string;
            content: string;
            parentId?: string;
            fileIds?: string[];
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

        if (payload.parentId) {
            this.server.to(room).emit('new_dm_thread_message', message);
            const thread = await this.presenter.getThread(payload.parentId, payload.senderId);
            if (thread[0]) {
                this.server.to(room).emit('dm_thread_updated', thread[0]);
            }
        } else {
            this.server.to(room).emit('new_dm_message', message);
        }

        return message;
    }

    /** toggle_dm_reaction — broadcasts dm_reaction_updated to the DM room */
    @SubscribeMessage('toggle_dm_reaction')
    handleDmReaction(
        @MessageBody() payload: { conversationId: string; messageId: string; reactions: any[] },
    ) {
        this.server.to(`dm:${payload.conversationId}`).emit('dm_reaction_updated', {
            messageId: payload.messageId,
            reactions: payload.reactions,
        });
    }

    /** dm_message_edit — broadcasts dmMessageEdited to the DM room */
    @SubscribeMessage('dm_message_edit')
    handleDmMessageEdit(
        @MessageBody() payload: { conversationId: string; messageId: string; content: string; updatedAt: string },
    ) {
        this.server.to(`dm:${payload.conversationId}`).emit('dmMessageEdited', {
            messageId: payload.messageId,
            content: payload.content,
            updatedAt: payload.updatedAt,
        });
    }

    /** dm_message_delete — broadcasts dmMessageDeleted (and dm_thread_updated if reply) */
    @SubscribeMessage('dm_message_delete')
    handleDmMessageDelete(
        @MessageBody() payload: { conversationId: string; messageId: string; updatedRoot?: any },
    ) {
        const room = `dm:${payload.conversationId}`;
        this.server.to(room).emit('dmMessageDeleted', { messageId: payload.messageId });
        if (payload.updatedRoot) {
            this.server.to(room).emit('dm_thread_updated', payload.updatedRoot);
        }
    }
}
