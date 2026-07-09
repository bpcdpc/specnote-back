import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsUrl } from 'class-validator';

// 값 있으면 해당 URL로 교체, 없으면 기존 project.specJsonUrl refetch
export class CommitSpecDto {
  @ApiProperty({ required: false, example: 'http://localhost:3002/docs-json' }) // mock server 주소
  @IsOptional()
  @IsUrl({ require_tld: false }) // localhost, 내부 IP 도 허용 (로컬 데모용)
  specJsonUrl?: string;
}
