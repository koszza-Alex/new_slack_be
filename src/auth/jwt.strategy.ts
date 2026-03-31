import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET, // move to env later
    });
  }

  async validate(payload: any) {
    // This gets attached to request.user
    return {
      email: payload.email,
      dispname: payload.dispname,
      workspaceName: payload.workspaceName,
    };
  }
}