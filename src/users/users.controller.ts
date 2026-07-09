import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService, PublicUser } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // POST /api/users — 회원가입 (인증 불필요, 계층 0)
  @ApiOperation({ summary: '회원 가입' })
  @Post()
  createUser(@Body() dto: CreateUserDto): Promise<PublicUser> {
    return this.usersService.createUser(dto);
  }

  // GET /api/users/search?email= — 초대용 이메일 검색 (로그인 사용자만, 계층 1)
  @ApiOperation({ summary: '이메일로 회원 검색' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('search')
  findByEmail(@Query('email') email: string): Promise<PublicUser | null> {
    return this.usersService.findByEmail(email);
  }
}
