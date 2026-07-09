import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsUrl } from 'class-validator';

// tryItBaseUrl 만 수정. title/description/version/oasVersion 은 스펙 리로드로만 갱신.
export class UpdateProjectDto {
  @ApiProperty({ required: false, example: 'http://localhost:3002' }) // mock server 주소
  @IsOptional()
  @IsUrl({ require_tld: false })
  tryItBaseUrl?: string;
}
