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

  @SubscribeMessage('join_channel')
  handleJoin(client: Socket, channelId: string) {
    client.join(channelId);
  }

  @SubscribeMessage('leave_channel')
  handleLeave(client: Socket, channelId: string) {
    client.leave(channelId);
  }

  constructor(private readonly presenter: MessagePresenter) { }

  @SubscribeMessage('send_message')
  async handleMessage(@MessageBody() payload: any) {
    const message = await this.presenter.sendMessage(payload);

    if (payload.parentId) {
      // 🔥 thread event
      this.server
        .to(payload.channelId)
        .emit('new_thread_message', message);
    } else {
      this.server
        .to(payload.channelId)
        .emit('new_message', message);
    }

    return message;
  }
}
