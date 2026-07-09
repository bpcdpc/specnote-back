import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsUrl } from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({ example: 'http://localhost:3002/docs-json' }) // mock server 주소
  @IsUrl({ require_tld: false }) // localhost, 내부 IP 도 허용 (로컬 데모용)
  specJsonUrl: string;

  @ApiProperty({ required: false, example: 'http://localhost:3002' }) // mock server 주소
  @IsOptional()
  @IsUrl({ require_tld: false }) // localhost, 내부 IP 도 허용 (로컬 데모용)
  tryItBaseUrl?: string;
}
