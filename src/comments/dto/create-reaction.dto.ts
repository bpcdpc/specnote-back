import { ApiProperty } from '@nestjs/swagger';
import { REACTION_TYPE } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class CreateReactionDto {
  @ApiProperty({ enum: REACTION_TYPE, example: REACTION_TYPE.DONE })
  @IsEnum(REACTION_TYPE)
  type: REACTION_TYPE;
}
