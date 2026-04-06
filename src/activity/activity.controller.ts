import { Controller, Get, Patch, Param, Query } from '@nestjs/common';
import { ActivityService } from './activity.service';

@Controller('activity')
export class ActivityController {
    constructor(private readonly activityService: ActivityService) {}

    /** GET /api/activity?userId=xxx  — fetch activity list */
    @Get()
    getForUser(@Query('userId') userId: string) {
        return this.activityService.getForUser(userId);
    }

    /** GET /api/activity/unread-count?userId=xxx */
    @Get('unread-count')
    getUnreadCount(@Query('userId') userId: string) {
        return this.activityService.getUnreadCount(userId).then((count) => ({ count }));
    }

    /** PATCH /api/activity/read-all?userId=xxx */
    @Patch('read-all')
    markAllRead(@Query('userId') userId: string) {
        return this.activityService.markAllRead(userId);
    }

    /** PATCH /api/activity/:id/read?userId=xxx */
    @Patch(':id/read')
    markOneRead(@Param('id') id: string, @Query('userId') userId: string) {
        return this.activityService.markOneRead(id, userId);
    }
}
