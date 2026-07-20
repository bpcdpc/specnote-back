// ask-question.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class AskQuestionDto {
  @ApiProperty({ example: '엔드포인트 관련해서 뭐라고 논의됐어?' })
  @IsString()
  @IsNotEmpty()
  question: string;
}