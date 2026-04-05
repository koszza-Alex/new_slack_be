import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Channel } from '../channel/entities/channel.entity';

@WebSocketGateway({ cors: { origin: '*' } })
export class FileGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinWorkspace')
  handleJoinWorkspace(client: Socket, workspaceId: string) {
    client.join(`workspace-${workspaceId}`);
  }

  emitFilesUploaded(workspaceId: string, files: any[]) {
    this.server.to(`workspace-${workspaceId}`).emit('filesUploaded', files);
  }

  emitFileDeleted(workspaceId: string, fileId: string) {
    this.server.to(`workspace-${workspaceId}`).emit('fileDeleted', fileId);
  }
}