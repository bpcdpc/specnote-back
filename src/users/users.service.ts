import { ConflictException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { type PublicUser } from '../common/types/auth.type';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  // 회원가입 (토큰 미발급. 로그인은 따로 해야 합니다.)
  async createUser(createUserDto: CreateUserDto): Promise<PublicUser> {
    // 1. 이메일 중복 검사
    const exists = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (exists) {
      throw new ConflictException(
        `${createUserDto.email}는 이미 사용중인 이메일입니다.`,
      );
    }

    // 2. 비밀번호 해싱
    const hashed = await bcrypt.hash(createUserDto.password, 10);

    // 3. user 생성 (비밀번호 제외하고 반환)
    const user = await this.prisma.user.create({
      data: { ...createUserDto, password: hashed },
      select: { id: true, userName: true, email: true },
    });

    return user;
  }

  // 초대용 이메일 완전일치 검색
  // AI 계정은 검색 대상에서 제외
  findByEmail(email: string): Promise<PublicUser | null> {
    return this.prisma.user.findFirst({
      where: { email, isAi: false },
      select: { id: true, userName: true, email: true },
    });
  }

  // id 조회
  findById(id: number): Promise<PublicUser | null> {
    return this.prisma.user.findUnique({
      where: { id },
      select: { id: true, userName: true, email: true },
    });
  }
}
