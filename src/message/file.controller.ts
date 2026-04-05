import {
  Controller,
  Post,
  UploadedFiles,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { File } from './entities/file.entity';

@Controller('files')
export class FileController {
  constructor(
    @InjectRepository(File)
    private readonly fileRepo: Repository<File>,
  ) {}

  /**
   * POST /api/files
   * Accepts multipart/form-data with field name "files".
   * Saves files to uploads/ and persists metadata to DB.
   * Returns array of { id, filename, originalname, path, mimetype, size }.
   */
  @Post()
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: diskStorage({
        destination: join(process.cwd(), 'uploads'),
        filename: (_req, file, cb) => {
          const unique = randomUUID();
          cb(null, `${unique}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB per file
    }),
  )
  async uploadFiles(
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files?.length) {
      throw new BadRequestException('No files provided');
    }

    const saved = await Promise.all(
      files.map((f) =>
        this.fileRepo.save(
          this.fileRepo.create({
            filename: f.filename,
            originalname: f.originalname,
            path: `/uploads/${f.filename}`,
            size: f.size,
            mimetype: f.mimetype,
          }),
        ),
      ),
    );

    return saved.map((f) => ({
      id: f.id,
      filename: f.filename,
      originalname: f.originalname,
      path: f.path,
      mimetype: f.mimetype,
      size: f.size,
    }));
  }
}
