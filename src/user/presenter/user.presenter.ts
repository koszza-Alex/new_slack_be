import { Injectable } from '@nestjs/common';
import { UserService } from '../user.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { ImportUserDto } from '../dto/import-user.dto';

/**
 * User Presenter — mediates between UserController and UserService.
 * All business orchestration lives here; the controller is a pure view.
 */
@Injectable()
export class UserPresenter {
  constructor(private readonly userService: UserService) {}

  create(dto: CreateUserDto) {
    return this.userService.create(dto);
  }

  findAll() {
    return this.userService.findAll();
  }

  countAll() {
    return this.userService.countAll();
  }

  findOne(id: string) {
    return this.userService.findOne(id);
  }

  update(id: number, dto: UpdateUserDto) {
    return this.userService.update(id, dto);
  }

  remove(id: number) {
    return this.userService.remove(id);
  }

  import(dto: ImportUserDto) {
    return this.userService.import(dto);
  }

  updateProfile(userId: string, data: { dispname?: string; avatar?: string }) {
    return this.userService.updateProfile(userId, data);
  }
}
