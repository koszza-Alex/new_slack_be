// message.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { MessageController } from './message.controller';
import { MessagePresenter } from './presenter/message.presenter';

describe('MessageController', () => {
  let controller: MessageController;
  let presenter: MessagePresenter;

  const mockPresenter = {
    sendMessage: jest.fn(),
    getChannelMessages: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MessageController],
      providers: [
        {
          provide: MessagePresenter,
          useValue: mockPresenter,
        },
      ],
    }).compile();

    controller = module.get<MessageController>(MessageController);
    presenter = module.get<MessagePresenter>(MessagePresenter);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ✅ POST /channels/:channelId/messages
  it('should send message', async () => {
    const dto = { content: 'hello' };
    const channelId = '123';

    mockPresenter.sendMessage.mockResolvedValue({
      id: 1,
      content: 'hello',
    });

    const result = await controller.send(channelId, dto as any);

    expect(presenter.sendMessage).toHaveBeenCalledWith({
      ...dto,
      channelId,
    });

    expect(result).toEqual({
      id: 1,
      content: 'hello',
    });
  });

  // ✅ GET /channels/:channelId/messages
  it('should get channel messages', async () => {
    const channelId = '123';
    const cursor = 'abc';

    mockPresenter.getChannelMessages.mockResolvedValue([
      { id: 1, content: 'test' },
    ]);

    const result = await controller.list(channelId, cursor);

    expect(presenter.getChannelMessages).toHaveBeenCalledWith(
      channelId,
      cursor,
    );

    expect(result).toEqual([{ id: 1, content: 'test' }]);
  });
});
