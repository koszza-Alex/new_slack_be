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
import { Roles, RolesGuard } from 'src/guards';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Role } from './enums/role.enum';
import { UserService } from './user.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}
  // ================================================================
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }
  // ================================================================

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Get()
  findAll() {
    return this.userService.findAll();
  }

  // ================================================================
  // @UseGuards(RolesGuard)
  // @Roles(Role.ADMIN)
  @Get(':id')
  findOne(@Param('id') id: string) {
    console.log('id=======>', id);

    return this.userService.findOne(id);
  }

  // ================================================================
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    console.log(id);

    return this.userService.update(+id, updateUserDto);
  }

  // ================================================================
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(+id);
  }
  // ================================================================

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Post('import')
  import(@Body() importUserDto: any) {
    // import(@Body() importUserDto: ImportUserDto) {
    return this.userService.import(importUserDto);
  }

  // ===================profile=============================
  @Put('profile/:id')
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: diskStorage({
        destination: './uploads/avatars',
        filename: (req, file, cb) => {
          const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, unique + extname(file.originalname));
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(new Error('Only image files allowed'), false);
        }
        cb(null, true);
      },
    }),
  )
  async updateProfileById(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
  ) {
    try {
      console.log('id====>', id);
      console.log('body====>', body);
      console.log('file====>', file);

      // const avatarUrl = file ? `/uploads/avatars/${file.filename}` : undefined;

      // Use await to ensure errors propagate correctly
      const updated = await this.userService.updateProfile(id, {
        // name: body.name,
        dispname: body.dispname,
        // displayName: body.displayName,
        // avatarUrl,
        avatar: file ? `/uploads/avatars/${file.filename}` : undefined,
      });

      return updated;
    } catch (err) {
      console.error('Update profile error:', err);
      throw err; // let Nest handle the error response
    }
  }
  // =====================soket============================
}
