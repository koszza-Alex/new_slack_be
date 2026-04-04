import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { ImportUserDto } from './dto/import-user.dto';
import { hash } from 'bcrypt';
import { UserGateway } from './user.gateway';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private readonly userGateway: UserGateway, // ✅ ADD THIS
  ) {}

  async create(createUserDto: CreateUserDto) {
    const existingUser = await this.findOneByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException('User already exists');
    }
    return this.userRepository.save(createUserDto);
  }

  findAll() {
    return this.userRepository.find();
  }

  async countAll(): Promise<{ count: number }> {
    const count = await this.userRepository.count();
    return { count };
  }

  findOne(id: string) {
    return this.userRepository.findOneBy({ id });
  }

  findOneByEmail(email: string) {
    return this.userRepository.findOneBy({ email });
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return this.userRepository.update(id, updateUserDto);
  }

  remove(id: number) {
    return this.userRepository.delete(id);
  }

  async import(importUserDto: ImportUserDto) {
    return this.userRepository.save(
      await Promise.all(
        importUserDto.map(async (user) => ({
          ...user,
          password: await hash('12345678', 10),
        })),
      ),
    );
  }

  // ================================================
  async updateProfile(userId: string, data: any) {
    console.log("data====<>",data);
    const user = await this.findOne(userId);
    console.log("userservice====<>",user?.avatar);
    
    if (!user) {
      throw new Error('User not found');
    }

    user.dispname = data.dispname ?? user.dispname;
    user.avatar = data.avatar ?? user.avatar;

    const saved = await this.userRepository.save(user);

    // ✅ THIS IS THE MISSING PART
    this.userGateway.emitProfileUpdated({
      userId: saved.id,
      dispname: saved.dispname,
      avatar: saved.avatar,
    });

    return {
      dispname: saved.dispname,
      avatar: saved.avatar,
    };
  }
}
