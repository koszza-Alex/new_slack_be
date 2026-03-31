import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';

import { Server } from 'socket.io';

@WebSocketGateway({
  cors: { origin: '*' },
})
export class UserGateway {
  @WebSocketServer()
  server: Server;

  // Optional (only if frontend emits)
  @SubscribeMessage('profile:update')
  handleProfileUpdate(@MessageBody() payload: any) {
    console.log('📡 profile:update received:', payload);

    this.server.emit('updated_profile', payload);
  }

  // ✅ ADD THIS (important)
  emitProfileUpdated(payload: any) {
    this.server.emit('updated_profile', payload);
  }
}
