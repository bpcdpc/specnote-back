import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class SearchCommentDto {

  @ApiProperty({ example: '로그인' }) 
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsNotEmpty({ message: '검색어를 입력하세요.' })
  keyword: string;

  @ApiProperty({ required: false, type: [Number], example: [1, 2] })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  userIds?: number[];

  @ApiProperty({ required: false, type: [Number], example: [10] })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  endpointIds?: number[];
}
