import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({ example: '이 응답 스키마 확인 부탁해요' })
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsNotEmpty({ message: '내용을 입력하세요.' })
  content: string;

  @ApiProperty({ required: false, type: [Number], example: [1, 2] })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  mentionedUserIds?: number[];

  @ApiProperty({ required: false, type: [Number], example: [10] })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  mentionedEndpointIds?: number[];
}
