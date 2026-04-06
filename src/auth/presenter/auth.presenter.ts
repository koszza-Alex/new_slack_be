import { Injectable } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { CompleteRegistrationDto } from '../dto/complete-registration.dto';
import { generateTokenDto } from '../dto/generate-token.dto';
import { InvitedUserDto } from '../dto/invited-user.dto';

/**
 * Auth Presenter — mediates between AuthController and AuthService.
 * All business orchestration lives here; the controller is a pure view.
 */
@Injectable()
export class AuthPresenter {
    constructor(private readonly authService: AuthService) {}

    checkEmail(email: string) {
        return this.authService.checkEmail(email);
    }

    completeRegistration(dto: CompleteRegistrationDto) {
        return this.authService.completeRegistration(dto);
    }

    generateToken(dto: generateTokenDto) {
        return this.authService.generateToken(dto);
    }

    invitedUser(dto: InvitedUserDto) {
        return this.authService.invitedUser(dto);
    }

    getMe(email: string) {
        return this.authService.getMe(email);
    }
}
