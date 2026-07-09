import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';

export class MoveCommentDto {
  @ApiProperty({ example: 12, description: '이동할 대상 엔드포인트 id' })
  @IsInt()
  targetEndpointId: number;
}
