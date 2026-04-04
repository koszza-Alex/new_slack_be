import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { DmService } from './dm.service';

@WebSocketGateway({ cors: true })
export class DmGateway {
    @WebSocketServer()
    server: Server;

    constructor(private readonly dmService: DmService) {}

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
     * Payload: { conversationId, senderId, content, parentId? }
     *
     * If parentId is set → emits new_dm_thread_message + dm_thread_updated (root metadata)
     * Otherwise → emits new_dm_message
     */
    @SubscribeMessage('send_dm_message')
    async handleDmMessage(@MessageBody() payload: {
        conversationId: string;
        senderId: string;
        content: string;
        parentId?: string;
    }) {
        const message = await this.dmService.sendMessage(
            payload.conversationId,
            payload.senderId,
            payload.content,
            payload.parentId,
        );

        const room = `dm:${payload.conversationId}`;

        if (payload.parentId) {
            // Thread reply — broadcast to thread listeners
            this.server.to(room).emit('new_dm_thread_message', message);

            // Also emit updated root message so DM list can refresh replyCount
            const thread = await this.dmService.getThread(payload.parentId, payload.senderId);
            if (thread[0]) {
                this.server.to(room).emit('dm_thread_updated', thread[0]);
            }
        } else {
            this.server.to(room).emit('new_dm_message', message);
        }

        return message;
    }

    /**
     * toggle_dm_reaction — client emits after a successful REST toggle.
     * Broadcasts dm_reaction_updated to all clients in the DM room.
     * Payload: { conversationId, messageId, reactions }
     */
    @SubscribeMessage('toggle_dm_reaction')
    handleDmReaction(@MessageBody() payload: {
        conversationId: string;
        messageId: string;
        reactions: any[];
    }) {
        this.server.to(`dm:${payload.conversationId}`).emit('dm_reaction_updated', {
            messageId: payload.messageId,
            reactions: payload.reactions,
        });
    }
}
