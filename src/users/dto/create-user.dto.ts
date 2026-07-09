import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '홍길동' })
  @IsString()
  @MinLength(1)
  userName: string;

  @ApiProperty({ example: 'password1234', description: '비밀번호 (최소 8자)' })
  @IsString()
  @MinLength(8)
  password: string;
}
