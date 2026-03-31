// presenter/channel.presenter.ts
export class ChannelPresenter {
  static toResponse(channel: any) {
    return {
      id: channel.id,
      name: channel.name,
      type: channel.channelType,
      members: channel.members?.map((m) => ({
        id: m.id,
        name: m.fullname,
      })),
    };
  }
}