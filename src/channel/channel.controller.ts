import { Controller, Post, Body, Param, Get, Delete } from '@nestjs/common';
import { ChannelService } from './channel.service';

@Controller('channels')
export class ChannelController {
  constructor(private readonly channelService: ChannelService) {}

  // GET /api/channels/:id — returns channel with members array
  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.channelService.getChannelById(id);
  }

  // invite people
  @Post(':id/join')
  join(@Param('id') id: string, @Body('userId') userId: string) {
    return this.channelService.joinChannel(id, userId);
  }
}