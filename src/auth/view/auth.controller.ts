import { Controller, Post, Body, Get, UseGuards, Req } from '@nestjs/common';
import { AuthPresenter } from '../presenter/auth.presenter';
import { CompleteRegistrationDto } from '../dto/complete-registration.dto';
import { JwtAuthGuard } from '../jwt-auth.guard';
import { generateTokenDto } from '../dto/generate-token.dto';
import { InvitedUserDto } from '../dto/invited-user.dto';

/**
 * Auth View — HTTP interface only. No business logic.
 * Delegates everything to AuthPresenter.
 */
@Controller('auth')
export class AuthController {
    constructor(private readonly presenter: AuthPresenter) {}

    @Get('me')
    @UseGuards(JwtAuthGuard)
    getMe(@Req() req: any) {
        return this.presenter.getMe(req.user.email);
    }

    @Post('check-email')
    checkEmail(@Body() body: { email: string }) {
        return this.presenter.checkEmail(body.email);
    }

    @Post('complete-registration')
    completeRegistration(@Body() dto: CompleteRegistrationDto) {
        return this.presenter.completeRegistration(dto);
    }

    @Post('generate-token')
    generateToken(@Body() dto: generateTokenDto) {
        return this.presenter.generateToken(dto);
    }

    @Post('invited-user')
    invitedUser(@Body() dto: InvitedUserDto) {
        return this.presenter.invitedUser(dto);
    }
}
