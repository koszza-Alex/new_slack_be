import { Controller, Post, Body, Param, Get, Delete } from '@nestjs/common';
import { ChannelService } from './channel.service';

@Controller('channels')
export class ChannelController {
  constructor(private readonly channelService: ChannelService) {}
//invite people
  @Post(':id/join')
  join(@Param('id') id: string, @Body('userId') userId: string) {
    return this.channelService.joinChannel(id, userId);
  }
}