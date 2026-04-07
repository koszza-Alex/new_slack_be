import type { Express } from 'express';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Put,
  Post,
  UseInterceptors,
  UploadedFile,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Roles, RolesGuard } from 'src/guards';
import { Role } from '../enums/role.enum';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserPresenter } from '../presenter/user.presenter';

/**
 * User View — HTTP interface only. No business logic.
 * Delegates everything to UserPresenter.
 */
@Controller('user')
export class UserController {
  constructor(private readonly presenter: UserPresenter) {}

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.presenter.create(dto);
  }

  @Get('count')
  count() {
    return this.presenter.countAll();
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Get()
  findAll() {
    return this.presenter.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.presenter.findOne(id);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.presenter.update(+id, dto);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.presenter.remove(+id);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Post('import')
  import(@Body() dto: any) {
    return this.presenter.import(dto);
  }

  @Put('profile/:id')
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: diskStorage({
        destination: './uploads/avatars',
        filename: (_req, file, cb) => {
          const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, unique + extname(file.originalname));
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(new Error('Only image files allowed'), false);
        }
        cb(null, true);
      },
    }),
  )
  async updateProfile(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
  ) {
    return this.presenter.updateProfile(id, {
      dispname: body.dispname,
      avatar: file ? `/uploads/avatars/${file.filename}` : undefined,
    });
  }
}
