import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateComment1Dto {
  @ApiProperty({ example: '이 응답 스키마 확인 부탁해요' })
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsNotEmpty({ message: '내용을 입력하세요.' })
  content: string;

  @ApiProperty({ required: false, type: [Number], example: [3, 4] })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map((v) => Number(v.trim()));
    }
    return value;
  })
  @IsArray()
  @IsInt({ each: true })
  mentionedUserIds?: number[];

  @ApiProperty({ required: false, type: [Number], example: [10] })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map((v) => Number(v.trim()));
    }
    return value;
  })
  @IsArray()
  @IsInt({ each: true })
  mentionedEndpointIds?: number[];

  @ApiPropertyOptional({
    type: 'array',
    items: { type: 'string', format: 'binary' },
    description: '첨부 이미지 (최대 5장)',
  })
  @IsOptional()
  images?: any;
}
