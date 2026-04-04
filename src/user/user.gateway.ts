import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';

import { Server, Socket } from 'socket.io';

/**
 * Tracks which userIds are currently connected (online/joined).
 * Key: socketId → userId
 */
const socketToUser = new Map<string, string>();

@WebSocketGateway({
  cors: { origin: '*' },
})
export class UserGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    // userId is sent as a query param when the socket connects
    const userId = client.handshake.query.userId as string | undefined;
    if (userId) {
      socketToUser.set(client.id, userId);
      // Broadcast to all clients that this user is now online
      this.server.emit('user_presence', { userId, isOnline: true });
    }
  }

  handleDisconnect(client: Socket) {
    const userId = socketToUser.get(client.id);
    if (userId) {
      socketToUser.delete(client.id);
      // Only mark offline if no other socket for this user is connected
      const stillConnected = [...socketToUser.values()].includes(userId);
      if (!stillConnected) {
        this.server.emit('user_presence', { userId, isOnline: false });
      }
    }
  }

  /** Returns the set of currently online userIds */
  getOnlineUserIds(): string[] {
    return [...new Set(socketToUser.values())];
  }

  // Optional: frontend can explicitly register userId after connect
  @SubscribeMessage('register_user')
  handleRegisterUser(client: Socket, @MessageBody() userId: string) {
    if (userId) {
      socketToUser.set(client?.id, userId);
      this.server.emit('user_presence', { userId, isOnline: true });
    }
  }

  @SubscribeMessage('profile:update')
  handleProfileUpdate(@MessageBody() payload: any) {
    this.server.emit('updated_profile', payload);
  }

  emitProfileUpdated(payload: any) {
    this.server.emit('updated_profile', payload);
  }
}
