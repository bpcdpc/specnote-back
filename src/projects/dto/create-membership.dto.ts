import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class CreateMembershipDto {
  @ApiProperty({ example: 'invited@company.com' })
  @IsEmail()
  email: string;
}
