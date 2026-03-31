import { Controller, Post, Body, Get, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CompleteRegistrationDto } from './dto/complete-registration.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { generateTokenDto } from './dto/generate-token.dto';
import { InvitedUserDto } from './dto/invited-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@Req() req) {
    return this.authService.getMe(req.user.email);
  }

  @Post('check-email')
  checkEmail(@Body() body: { email: string }) {
    return this.authService.checkEmail(body.email);
  }

  @Post('complete-registration')
  async completeRegistration(@Body() dto: CompleteRegistrationDto) {
  return this.authService.completeRegistration(dto);
}
  @Post('generate-token')
  async generateToken(@Body() dto: generateTokenDto) {
  return this.authService.generateToken(dto);
}

@Post('invited-user')
async invitedUser(@Body() dto: InvitedUserDto) {
  return this.authService.invitedUser(dto);
}
}