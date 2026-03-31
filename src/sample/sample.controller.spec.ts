import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './sample.controller';
import { AppService } from './sample.service';

describe('AppController', () => {
  let controller: AppController;
  let service: AppService;

  const mockAppService = {
    getSample: jest.fn(() => {
      return [{ id: 1, name: 'test' }];
    }),

    postSample: jest.fn((body) => {
      return body;
    }),

    putSample: jest.fn((id, body) => {
      return { id, ...body };
    }),

    deleteSample: jest.fn((id) => {
      return { deleted: id };
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: mockAppService,
        },
      ],
    }).compile();

    controller = module.get<AppController>(AppController);
    service = module.get<AppService>(AppService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getRouter', () => {
    it('should return all samples', () => {
      expect(controller.getRouter()).toEqual([{ id: 1, name: 'test' }]);
      expect(service.getSample).toHaveBeenCalled();
    });
  });

  describe('postRouter', () => {
    it('should create sample', () => {
      const body = { name: 'test' };
      expect(controller.postRouter(body)).toEqual(body);
      expect(service.postSample).toHaveBeenCalledWith(body);
    });
  });

  describe('putRouter', () => {
    it('should update sample', () => {
      const body = { name: 'updated' };
      expect(controller.putRouter('1', body)).toEqual({
        id: '1',
        name: 'updated',
      });

      expect(service.putSample).toHaveBeenCalledWith('1', body);
    });
  });

  describe('deleteRouter', () => {
    it('should delete sample', () => {
      expect(controller.deleteRouter('1')).toEqual({ deleted: '1' });
      expect(service.deleteSample).toHaveBeenCalledWith('1');
    });
  });
});
