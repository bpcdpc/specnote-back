import { Module } from '@nestjs/common';
import { AiService } from './ai.service';

// 진입점(라우트)은 comments 쪽에 있고, ai 는 서비스만 export.
@Module({
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
