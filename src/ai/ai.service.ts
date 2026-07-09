import { Injectable } from '@nestjs/common';
import { SummaryInput } from '../comments/comments.type';

@Injectable()
export class AiService {
  // 외부 AI(Azure AI Foundry) 호출로 댓글 스레드 요약 문자열 생성
  async generateSummary(thread: SummaryInput[]): Promise<string> {
    // TODO: Azure AI Foundry 클라이언트 호출 → 요약 string 반환 (SDK 세부는 구현 시점)
    throw new Error('not implemented');
  }
}
