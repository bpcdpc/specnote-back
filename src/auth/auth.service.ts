import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../common/prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  // 로그인 서비스
  async login(dto: LoginDto): Promise<{ access_token: string }> {
    // 이메일로 사용자 조회
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    // 사용자가 없을 경우
    if (!user) {
      throw new UnauthorizedException(`이메일 또는 비밀번호가 잘못되었습니다.`);
    }

    // 비밀번호가 틀렸을 경우
    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException(`이메일 또는 비밀번호가 잘못되었습니다.`);
    }

    // 토큰 발급에 쓰일 payload 생성
    const payload = { sub: user.id, email: user.email };

    // access_token 을 생성해서 반환
    return { access_token: this.jwtService.sign(payload) };
  }
}
