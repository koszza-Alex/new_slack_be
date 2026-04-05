import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChannelService } from './channel.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

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
  async handleCreate(@MessageBody() payload: any) {
    const channel = await this.channelService.createChannel(payload);
    this.server.emit("channel:created", channel);
  }

  // DELETE CHANNEL — requires userId for ownership check
  @SubscribeMessage("channel:delete")
  async handleDelete(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { channelId: string; workspaceId: string; userId: string }
  ) {
    try {
      await this.channelService.deleteChannel(payload.channelId, payload.userId);
      this.server.emit("channel:deleted", { channelId: payload.channelId });
    } catch (err) {
      if (err instanceof ForbiddenException || err instanceof NotFoundException) {
        client.emit("channel:error", { message: err.message });
      } else {
        client.emit("channel:error", { message: "Failed to delete channel" });
      }
    }
  }

  // UPDATE CHANNEL — requires userId for ownership check
  @SubscribeMessage("channel:update")
  async handleUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any
  ) {
    try {
      const updatedChannel = await this.channelService.updateChannel(payload);
      this.server.emit("channel:updated", updatedChannel);
      return updatedChannel;
    } catch (err) {
      if (err instanceof ForbiddenException || err instanceof NotFoundException) {
        client.emit("channel:error", { message: err.message });
      } else {
        client.emit("channel:error", { message: "Failed to update channel" });
      }
    }
  }
}
