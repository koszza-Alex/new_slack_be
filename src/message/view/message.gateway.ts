// =========================
// message/view/message.gateway.ts
// =========================
import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessagePresenter } from '../presenter/message.presenter';

/**
 * Message View (WebSocket) — socket interface only. No business logic.
 * Delegates everything to MessagePresenter.
 */
@WebSocketGateway({ cors: true })
export class MessageGateway {
    @WebSocketServer()
    server: Server;

    constructor(private readonly presenter: MessagePresenter) {}

    @SubscribeMessage('join_channel')
    handleJoin(client: Socket, channelId: string) {
        client.join(channelId);
    }

    @SubscribeMessage('leave_channel')
    handleLeave(client: Socket, channelId: string) {
        client.leave(channelId);
    }

    @SubscribeMessage('send_message')
    async handleMessage(@MessageBody() payload: any) {
        const message = await this.presenter.sendMessage(payload);

        if (payload.parentId) {
            this.server.to(payload.channelId).emit('new_thread_message', message);
            const [rootMessage] = await this.presenter.getThread(payload.parentId);
            if (rootMessage) {
                this.server.to(payload.channelId).emit('thread_updated', rootMessage);
            }
        } else {
            this.server.to(payload.channelId).emit('new_message', message);
        }

        return message;
    }

    /** toggle_reaction — broadcasts reaction_updated to all channel subscribers */
    @SubscribeMessage('toggle_reaction')
    handleReactionToggle(
        @MessageBody() payload: { channelId: string; messageId: string; reactions: any[] },
    ) {
        this.server.to(payload.channelId).emit('reaction_updated', {
            messageId: payload.messageId,
            reactions: payload.reactions,
        });
    }

    /** message_edit — broadcasts messageEdited to all channel subscribers */
    @SubscribeMessage('message_edit')
    handleMessageEdit(
        @MessageBody() payload: { channelId: string; messageId: string; content: string; updatedAt: string },
    ) {
        this.server.to(payload.channelId).emit('messageEdited', {
            messageId: payload.messageId,
            content: payload.content,
            updatedAt: payload.updatedAt,
        });
    }

    /** message_delete — broadcasts messageDeleted (and thread_updated if reply) */
    @SubscribeMessage('message_delete')
    handleMessageDelete(
        @MessageBody() payload: { channelId: string; messageId: string; updatedRoot?: any },
    ) {
        this.server.to(payload.channelId).emit('messageDeleted', { messageId: payload.messageId });
        if (payload.updatedRoot) {
            this.server.to(payload.channelId).emit('thread_updated', payload.updatedRoot);
        }
    }
}
