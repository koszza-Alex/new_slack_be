// message.gateway.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { MessageGateway } from './message.gateway';
import { MessagePresenter } from './presenter/message.presenter';

describe('MessageGateway', () => {
  let gateway: MessageGateway;
  let presenter: MessagePresenter;

  const mockPresenter = {
    sendMessage: jest.fn(),
  };

  const mockClient = {
    join: jest.fn(),
    leave: jest.fn(),
  };

  const mockServer = {
    to: jest.fn().mockReturnThis(),
    emit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessageGateway,
        {
          provide: MessagePresenter,
          useValue: mockPresenter,
        },
      ],
    }).compile();

    gateway = module.get<MessageGateway>(MessageGateway);
    presenter = module.get<MessagePresenter>(MessagePresenter);

    // attach mocked server
    gateway.server = mockServer as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ✅ join channel
  it('should join channel', () => {
    gateway.handleJoin(mockClient as any, 'room1');

    expect(mockClient.join).toHaveBeenCalledWith('room1');
  });

  // ✅ leave channel
  it('should leave channel', () => {
    gateway.handleLeave(mockClient as any, 'room1');

    expect(mockClient.leave).toHaveBeenCalledWith('room1');
  });

  // ✅ send message via websocket
  it('should handle send_message and emit to room', async () => {
    const payload = {
      channelId: 'room1',
      content: 'hello',
    };

    const savedMessage = { id: 1, ...payload };

    mockPresenter.sendMessage.mockResolvedValue(savedMessage);

    const result = await gateway.handleMessage(payload);

    expect(presenter.sendMessage).toHaveBeenCalledWith(payload);

    expect(mockServer.to).toHaveBeenCalledWith('room1');
    expect(mockServer.emit).toHaveBeenCalledWith('new_message', savedMessage);

    expect(result).toEqual(savedMessage);
  });
});
