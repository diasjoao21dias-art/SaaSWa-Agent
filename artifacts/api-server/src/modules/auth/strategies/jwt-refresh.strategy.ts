import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import type { RefreshTokenPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.refreshSecret'),
      passReqToCallback: true,
    });
  }

  validate(req: Request, payload: RefreshTokenPayload): RefreshTokenPayload & { rawToken: string } {
    const rawToken = req.body?.refreshToken as string | undefined;
    if (!rawToken) {
      throw new UnauthorizedException('Refresh token not provided.');
    }
    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid token type.');
    }
    return { ...payload, rawToken };
  }
}
