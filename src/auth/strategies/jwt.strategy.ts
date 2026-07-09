import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { JwtPayload, AuthUser } from '../../common/types/auth.type';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET 미설정');

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  // Passport 가 서명 검증에 성공한 뒤 호출. 반환값이 req.user 가 됨.
  validate(payload: JwtPayload): AuthUser {
    if (typeof payload?.sub !== 'number') {
      throw new UnauthorizedException('잘못된 토큰 payload');
    }
    return { id: payload.sub, email: payload.email };
  }
}
