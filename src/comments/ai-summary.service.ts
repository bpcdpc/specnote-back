import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
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
    endpointId: number,
    projectId: number,
  ): Promise<Comment> {
    // 1. findAiUser() 로 AI 계정 확보 (없으면 500)
    // 2. 해당 endpoint 의 댓글 수집 — 삭제분과 이전 AI 요약을 뺀다.
    //    이전 요약을 넣으면 요약의 요약이 되어 회차마다 원문에서 멀어진다.
    //    0건이면 400
    // 3. aiService.generateSummary(inputs) → string. 실패는 로깅만 하고 그대로 재던진다
    //    (Azure 장애나 타임아웃은 서버 사정이라 400 으로 바꾸지 않는다)
    // 4. AI 계정 명의로 최상위 댓글 생성해서 반환
    const aiUser = await this.findAiUser();
    const comments = await this.prisma.comment.findMany({
      where: {
        endpointId,
        isDeleted: false,
        userId: { not: aiUser.id },
      },
      orderBy: { createdAt: 'asc' },
      include: {
        user: {
          select: { userName: true },
        },
      },
    });
    if (comments.length === 0) {
      throw new BadRequestException('요약할 댓글이 없습니다.');
    }
    const inputs: SummaryInput[] = comments.map((comment) => ({
      author: comment.user.userName,
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
    }));

    let summaryText: string;
    try {
      summaryText = await this.aiService.generateSummary(inputs);
    } catch (error) {
      console.error('AI 요약 생성 에러:', error);
      throw error;
    }

    const summaryContent = await this.prisma.comment.create({
      data: {
        endpointId,
        projectId: projectId,
        userId: aiUser.id,
        content: summaryText,
        parentId: null,
      },
    });
    return summaryContent;
  }

  // 시드된 전역 AI 계정 (User.isAi = true)
  private async findAiUser(): Promise<User> {
    const ai = await this.prisma.user.findFirst({
      where: { isAi: true },
    });
    if (!ai) {
      // 시드 안 돌린 환경 방지 — 명확한 메시지로 안내
      throw new InternalServerErrorException(
        'AI 계정이 없습니다. npx prisma db seed 를 먼저 실행하세요.',
      );
    }
    return ai;
  }
}
