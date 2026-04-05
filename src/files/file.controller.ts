import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  Body,
  Req,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { FileService } from './file.service';
import { UploadFileDto } from './dto/upload-file.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { diskStorage } from 'multer';
import { extname } from 'path';


@Controller('files')
@UseGuards(JwtAuthGuard)
export class FileController {
  constructor(private readonly fileService: FileService) { }

  @Post()
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueName =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, uniqueName + extname(file.originalname));
        },
      }),
    }),
  )
  uploadFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: any,  // 🔹 Use `any` first to ensure it receives data
    @Req() req,
  ) {
 console.log("1111111111111111111111111111",req,body,files)
    if (!body) {
      throw new BadRequestException('Request body is missing');
    }

    return this.fileService.uploadFiles(req.user.email, body, files);
  }

  @Delete(':id')
  deleteFile(@Param('id') id: string, @Req() req) {
    return this.fileService.deleteFile(req.user.email, id);
  }

  @Get()
  getFiles(
    @Query('workspaceId') workspaceId: string,
    @Query('channelId') channelId?: string,
  ) {
    return this.fileService.getFiles(workspaceId, channelId);
  }
}