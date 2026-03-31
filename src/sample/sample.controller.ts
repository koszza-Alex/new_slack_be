import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { AppService } from './sample.service';

@Controller('sample') // --> localhost:{port}/sample <--
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('getAll') // ---> localhost:{port}/sample/getAll <--
  getRouter() {
    return this.appService.getSample();
  }

  @Post() // ---> localhost:{port}/sample/ <---
  postRouter(@Body() body: any) {
    return this.appService.postSample(body);
  }

  @Put(':id') // ---> localhost:{port}/sample/[id] <---
  putRouter(@Param('id') id: string, @Body() body: any) {
    return this.appService.putSample(id, body);
  }

  @Delete(':id') // ---> localhost:{port}/sample/[id] <---
  deleteRouter(@Param('id') id: string) {
    return this.appService.deleteSample(id);
  }
}
