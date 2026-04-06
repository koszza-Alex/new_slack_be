import { Controller, Post, Body, Param, Get } from '@nestjs/common';
import { ChannelPresenter } from '../presenter/channel.presenter';

/**
 * Channel View (REST) — HTTP interface only. No business logic.
 * Delegates everything to ChannelPresenter.
 */
@Controller('channels')
export class ChannelController {
    constructor(private readonly presenter: ChannelPresenter) {}

    /** GET /api/channels/:id — returns channel with members array */
    @Get(':id')
    getOne(@Param('id') id: string) {
        return this.presenter.getChannelById(id);
    }

    /** POST /api/channels/:id/join */
    @Post(':id/join')
    join(@Param('id') id: string, @Body('userId') userId: string) {
        return this.presenter.joinChannel(id, userId);
    }
}
