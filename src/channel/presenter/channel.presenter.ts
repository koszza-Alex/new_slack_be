import { Injectable } from '@nestjs/common';
import { ChannelService } from '../channel.service';
import { ChannelType } from '../dto/create-channel.dto';

/**
 * Channel Presenter — mediates between Channel views (controller + gateway) and ChannelService.
 * All business orchestration lives here; views are pure I/O.
 */
@Injectable()
export class ChannelPresenter {
    constructor(private readonly channelService: ChannelService) {}

    getChannels(workspaceId: string) {
        return this.channelService.getChannels(workspaceId);
    }

    getChannelById(channelId: string) {
        return this.channelService.getChannelById(channelId);
    }

    createChannel(data: { name: string; workspaceId: string; userId: string; type: ChannelType }) {
        return this.channelService.createChannel(data);
    }

    updateChannel(payload: { channelId: string; name?: string; type?: ChannelType; userId: string }) {
        return this.channelService.updateChannel(payload);
    }

    deleteChannel(channelId: string, userId: string) {
        return this.channelService.deleteChannel(channelId, userId);
    }

    joinChannel(channelId: string, userId: string) {
        return this.channelService.joinChannel(channelId, userId);
    }
}
