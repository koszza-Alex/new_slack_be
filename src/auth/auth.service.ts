import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompleteRegistrationDto } from './dto/complete-registration.dto';
import { JwtService } from '@nestjs/jwt';
import { generateTokenDto } from './dto/generate-token.dto';
import { InvitedUserDto } from './dto/invited-user.dto';

import { User } from '../user/entities/user.entity'; 
import { Workspace } from 'src/workspace/entities/workspace.entity';
import { log } from 'console';
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Workspace)
    private workspaceRepo: Repository<Workspace>,
    private jwtService: JwtService, 
  ) {}

  async checkEmail(email: string) {
    
      const user = await this.userRepo.findOne({
        where: { email },
        relations: ['workspaces', 'workspaces.members'], // important
      });
    
      //  EXISTING USER
      if (user) {
        return {
          isNewUser: false,
          message: 'This is a registered user.',
          workspaces: user.workspaces.map((ws) => ({
            id: ws.id,
            name: ws.name,
            members:ws.members?.length
          })),
        };
      }
    
      // ❌ NEW USER → create user
      const newUser = this.userRepo.create({
        email,
        lastLogin: new Date(),
      });
    
      await this.userRepo.save(newUser);
    
      return {
        isNewUser: true,
        message: 'This is a new user.',
        workspaces: [],
      };
    }


    async completeRegistration(dto: CompleteRegistrationDto) {
      const { email, dispname, workspaceName } = dto;
      console.log(email, dispname, workspaceName);
      
      
      // 1. Find user
      const user = await this.userRepo.findOne({
        where: { email },
        relations: ['workspaces'],
      });
    
      if (!user) {
        throw new Error('User not found');
      }
    
      // 2. Update display name
      user.dispname = dispname;
    
      // 3. Create workspace
      const workspace = this.workspaceRepo.create({
        name: workspaceName,
        creator: user,
        members:[user]
      });
    
      const savedWorkspace = await this.workspaceRepo.save(workspace);
    
      // 4. Add user to workspace (ManyToMany)
      user.workspaces = user.workspaces
        ? [...user.workspaces, savedWorkspace]
        : [savedWorkspace];
    
      // 5. Save user
      await this.userRepo.save(user);
    
      // 6. Generate JWT
      const payload = {
        email: user.email,
        workspaceName: savedWorkspace.name,
      };
    
      const token = await this.jwtService.sign(payload, {
        secret: process.env.JWT_SECRET,
        expiresIn: '24h',
      });
  
      return {
        message: 'Registration successful',
        token,
        workspace: savedWorkspace,
      };
     
    }

    async generateToken(dto: generateTokenDto) {
      const { email, workspaceName } = dto;
      console.log(email, workspaceName);

      // Verify the user actually exists before issuing a token
      const user = await this.userRepo.findOne({ where: { email } });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      const payload = {
        email: user.email,
        workspaceName,
      };

      const token = await this.jwtService.sign(payload, {
        secret: process.env.JWT_SECRET,
        expiresIn: '24h',
      });

      return { token };
    }

    async getMe(email: string) {
      const user = await this.userRepo.findOne({
        where: { email },
        relations: ['workspaces'],
      });

      if (!user) {
        throw new UnauthorizedException('User not found — please sign in again');
      }

      return user;
    }

    async invitedUser(dto: InvitedUserDto) {
      const { email, workspaceName } = dto;

      if(!email) return {message: "input email!"}
    
      // 1. Find workspace
      const workspace = await this.workspaceRepo.findOne({
        where: { name: workspaceName },
        relations: ['members'],
      });
    
      if (!workspace) {
        throw new Error('Workspace not found');
      }
    
      // 2. Find user
      let user = await this.userRepo.findOne({
        where: { email },
        relations: ['workspaces'],
      });
    
      // 3. If user does not exist → create
      if (!user) {
        user = await this.userRepo.save(
          this.userRepo.create({ email, dispname:"User" }),
        );
      }
    
      // 4. Check if already in workspace
      const isMember = workspace.members?.some(
        (member) => member.email === email,
      );
    
      if (isMember) {
        return {
          message: 'User already exists in this workspace',
        };
      }
    
      // 5. Add user to workspace (IMPORTANT)
      workspace.members = [...(workspace.members || []), user];
      
    
      await this.workspaceRepo.save(workspace);
    
      return {
        message: 'User invited successfully',
      };
    }
  }

  