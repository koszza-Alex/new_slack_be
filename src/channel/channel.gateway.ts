import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { ChannelService } from './channel.service';
import { Socket } from 'dgram';

@WebSocketGateway({
  cors: {
    origin: "*",
    credentials: true,
  },
})
export class ChannelGateway {
  @WebSocketServer()
  server: Server;

  constructor(private channelService: ChannelService) { }

  // GET CHANNEL LIST
  @SubscribeMessage("channel:list")
  async handleList(client: any, payload: { workspaceId: string }) {
    const channels = await this.channelService.getChannels(payload.workspaceId);

    client.emit("channel:list", channels);
  }

  // CREATE CHANNEL
  @SubscribeMessage("channel:create")
  async handleCreate(@MessageBody() payload) {
    const channel = await this.channelService.createChannel(payload);
    this.server
      .emit("channel:created", channel);
  }

  // DELETE CHANNEL
  @SubscribeMessage("channel:delete")
  async handleDelete(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { channelId: string; workspaceId: string }
  ) {
    await this.channelService.deleteChannel(payload.channelId);

    this.server.emit("channel:deleted", {
      channelId: payload.channelId,
    });

  }
  
   // update channel
  @SubscribeMessage("channel:update")
async handleUpdate(client: any, payload: any) {
  const updatedChannel = await this.channelService.updateChannel(payload);

  // ✅ broadcast to workspace only (important)
  this.server.emit("channel:updated", updatedChannel);

  return updatedChannel;
}
}