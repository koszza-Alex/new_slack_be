import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

/**
 * userId → Set<socketId>  (one user can have multiple tabs/devices)
 */
const userToSockets = new Map<string, Set<string>>();

function addSocket(userId: string, socketId: string) {
  if (!userToSockets.has(userId)) userToSockets.set(userId, new Set());
  userToSockets.get(userId)!.add(socketId);
}

function removeSocket(userId: string, socketId: string): boolean {
  const sockets = userToSockets.get(userId);
  if (!sockets) return false;
  sockets.delete(socketId);
  if (sockets.size === 0) {
    userToSockets.delete(userId);
    return true; // last socket — user is now offline
  }
  return false;
}

function getOnlineUserIds(): string[] {
  return [...userToSockets.keys()];
}

/** socketId → userId  (for fast disconnect lookup) */
const socketToUser = new Map<string, string>();

@WebSocketGateway({ cors: { origin: '*' } })
export class UserGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string | undefined;
    if (userId) {
      this.registerUser(client, userId);
    }
    // Always send the current snapshot so the connecting client knows who is online
    client.emit('presence:snapshot', getOnlineUserIds());
  }

  handleDisconnect(client: Socket) {
    const userId = socketToUser.get(client.id);
    if (!userId) return;
    socketToUser.delete(client.id);
    const wentOffline = removeSocket(userId, client.id);
    if (wentOffline) {
      this.server.emit('user_presence', { userId, isOnline: false });
    }
  }

  private registerUser(client: Socket, userId: string) {
    const wasOffline = !userToSockets.has(userId);
    socketToUser.set(client.id, userId);
    addSocket(userId, client.id);
    if (wasOffline) {
      // Only broadcast online if this is the first socket for this user
      this.server.emit('user_presence', { userId, isOnline: true });
    }
  }

  @SubscribeMessage('register_user')
  handleRegisterUser(
    @ConnectedSocket() client: Socket,
    @MessageBody() userId: string,
  ) {
    if (!userId) return;
    this.registerUser(client, userId);
    client.emit('presence:snapshot', getOnlineUserIds());
  }

  @SubscribeMessage('user_signed_out')
  handleUserSignedOut(
    @ConnectedSocket() client: Socket,
    @MessageBody() userId: string,
  ) {
    if (!userId) return;

    const sockets = userToSockets.get(userId);
    if (sockets) {
      sockets.forEach((sid) => socketToUser.delete(sid));
      userToSockets.delete(userId);
    } else {
      socketToUser.delete(client.id);
    }

    this.server.emit('user_presence', { userId, isOnline: false });
  }

  @SubscribeMessage('profile:update')
  handleProfileUpdate(
    @ConnectedSocket() _client: Socket,
    @MessageBody() payload: any,
  ) {
    this.server.emit('updated_profile', payload);
  }

  emitProfileUpdated(payload: any) {
    this.server.emit('updated_profile', payload);
  }

  /** Returns the set of currently online userIds (used by other services) */
  getOnlineUserIds(): string[] {
    return getOnlineUserIds();
  }
}
