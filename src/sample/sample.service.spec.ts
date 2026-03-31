import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppService } from './sample.service';
import { Sample } from './entity/sample.entity';

describe('AppService', () => {
  let service: AppService;
  let repository: Repository<Sample>;

  const mockRepository = {
    find: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppService,
        {
          provide: getRepositoryToken(Sample),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<AppService>(AppService);
    repository = module.get<Repository<Sample>>(getRepositoryToken(Sample));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getSample', () => {
    it('should return samples', async () => {
      const result = [{ id: 1, name: 'test' }];
      mockRepository.find.mockResolvedValue(result);

      expect(await service.getSample()).toEqual(result);
      expect(repository.find).toHaveBeenCalled();
    });
  });

  describe('postSample', () => {
    it('should save sample', async () => {
      const data = { name: 'test', age: 18 };
      mockRepository.save.mockResolvedValue(data);

      expect(await service.postSample(data)).toEqual(data);
      expect(repository.save).toHaveBeenCalledWith(data);
    });
  });

  describe('putSample', () => {
    it('should update sample', async () => {
      const id = '1';
      const data = { name: 'updated' };

      mockRepository.update.mockResolvedValue(true);

      await service.putSample(id, data);

      expect(repository.update).toHaveBeenCalledWith(id, data);
    });
  });

  describe('deleteSample', () => {
    it('should delete sample', async () => {
      const id = '1';

      mockRepository.delete.mockResolvedValue(true);

      await service.deleteSample(id);

      expect(repository.delete).toHaveBeenCalledWith(id);
    });
  });
});
