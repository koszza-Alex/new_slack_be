import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sample } from './entity/sample.entity';
import { ImportSampleData } from './dto/postData.dto';

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(Sample)
    private sampleRepository: Repository<Sample>,
  ) {}

  async getSample() {
    console.log('get all request');
    return await this.sampleRepository.find();
  }

  async postSample(data: ImportSampleData) {
    console.log(data, 'post request');
    return await this.sampleRepository.save(data);
  }

  async putSample(id: string, data: any) {
    console.log(id, 'put request');
    return await this.sampleRepository.update(id, data);
  }

  async deleteSample(id: string) {
    console.log(id, 'delete request');
    return await this.sampleRepository.delete(id);
  }
}
