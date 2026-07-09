import { Injectable } from '@nestjs/common';
import { Comment, User } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { SummaryInput } from './comments.type';

@Injectable()
export class AiSummaryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {}

  // POST /endpoints/:id/ai-summary
  async summarizeThread(
    actorUserId: number,
    endpointId: number,
  ): Promise<Comment> {
    // TODO
    // 1. 해당 endpoint 의 미삭제 댓글 수집 → SummaryInput[] (없으면 BadRequest: 요약할 댓글 없음)
    // 2. aiService.generateSummary(inputs) → string (실패 시 BadRequest)
    // 3. findAiUser() 의 AI 계정 명의로 최상위 댓글 생성해서 반환
    throw new Error('not implemented');
  }

  // 시드된 전역 AI 계정 (User.isAi = true)
  private async findAiUser(): Promise<User> {
    // TODO: isAi=true 유저 조회 (없으면 시드 필요)
    throw new Error('not implemented');
  }
}
