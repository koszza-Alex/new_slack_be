import { Test, TestingModule } from '@nestjs/testing';
import { UserGateway } from './user.gateway';

describe('UserGateway', () => {
    let gateway: UserGateway;

    const mockServer = {
        to: jest.fn().mockReturnThis(),
        emit: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [UserGateway],
        }).compile();

        gateway = module.get<UserGateway>(UserGateway);
        gateway.server = mockServer as any;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(gateway).toBeDefined();
    });

    it('should emit user_presence on register_user', () => {
        const mockClient = { id: 'socket1', handshake: { query: {} } } as any;
        gateway.handleRegisterUser(mockClient, 'user-123');
        expect(mockServer.emit).toHaveBeenCalledWith('user_presence', { userId: 'user-123', isOnline: true });
    });

    it('should emit updated_profile on profile:update', () => {
        const payload = { id: 'user-123', dispname: 'Alice', avatar: '/uploads/a.png' };
        gateway.handleProfileUpdate(payload);
        expect(mockServer.emit).toHaveBeenCalledWith('updated_profile', payload);
    });
});
