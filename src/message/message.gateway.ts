// =========================
// view/message.gateway.ts
// =========================
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessagePresenter } from './presenter/message.presenter';

@WebSocketGateway({ cors: true })
export class MessageGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly presenter: MessagePresenter) { }

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
      // Emit the new thread reply to all clients in the channel
      this.server.to(payload.channelId).emit('new_thread_message', message);

      // Also emit updated root message metadata so channel list can refresh reply count
      const [rootMessage] = await this.presenter.getThread(payload.parentId);
      if (rootMessage) {
        this.server.to(payload.channelId).emit('thread_updated', rootMessage);
      }
    } else {
      this.server.to(payload.channelId).emit('new_message', message);
    }

    return message;
  }
}

