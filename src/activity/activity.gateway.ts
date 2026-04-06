import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ActivityService } from './activity.service';
import { Activity } from './entities/activity.entity';

@WebSocketGateway({ cors: { origin: '*' } })
export class ActivityGateway {
    @WebSocketServer()
    server: Server;

    constructor(private readonly activityService: ActivityService) {}

    /** Client joins its personal activity room on connect */
    @SubscribeMessage('join_activity')
    handleJoin(
        @ConnectedSocket() client: Socket,
        @MessageBody() userId: string,
    ) {
        client.join(`activity:${userId}`);
    }

    /** Fetch activity history for the authenticated user */
    @SubscribeMessage('activity:fetch')
    async handleFetch(
        @ConnectedSocket() client: Socket,
        @MessageBody() userId: string,
    ) {
        const items = await this.activityService.getForUser(userId);
        client.emit('activity:list', items);
    }

    /** Mark all activities as read */
    @SubscribeMessage('activity:mark_all_read')
    async handleMarkAllRead(@MessageBody() userId: string) {
        await this.activityService.markAllRead(userId);
    }

    /** Mark a single activity as read */
    @SubscribeMessage('activity:mark_read')
    async handleMarkRead(
        @MessageBody() payload: { activityId: string; userId: string },
    ) {
        await this.activityService.markOneRead(payload.activityId, payload.userId);
    }

    /**
     * Called internally (from MessageGateway / DmGateway) to push a new
     * activity to the recipient's personal room.
     */
    emitToUser(userId: string, activity: Activity) {
        this.server.to(`activity:${userId}`).emit('new_activity', activity);
    }
}
