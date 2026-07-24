import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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
    // TODO
    // 1. 해당 endpoint 의 미삭제 댓글 수집 → SummaryInput[] (없으면 BadRequest: 요약할 댓글 없음)
    // 2. aiService.generateSummary(inputs) → string (실패 시 BadRequest)
    // 3. findAiUser() 의 AI 계정 명의로 최상위 댓글 생성해서 반환
    const aiUser = await this.findAiUser();
    const comments = await this.prisma.comment.findMany({
      where:{
        endpointId,
        isDeleted:false,
        userId:{not:aiUser.id}
      },
      orderBy:{createdAt:'asc'},
      include:{
        user:{
          select:{ userName:true},
        }
      }
    })
    if(comments.length===0){
      throw new BadRequestException('요약할 댓글이 없습니다.');
    }
    const inputs: SummaryInput[] = comments.map((comment)=>({
      author: comment.user.userName,
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
    }));

    let summaryText: string;
    try{
      summaryText = await this.aiService.generateSummary(inputs);
    }
    catch(error)
    {
      console.error('AI 요약 생성 에러:', error);
      throw new BadRequestException('요약 생성에 실패했습니다.');
    }

    const summaryContent = await this.prisma.comment.create({
      data:{
        endpointId,
        projectId: projectId,
        userId: aiUser.id,
        content:summaryText,
        parentId:null
      }
    })
    return summaryContent;
  }

  // 시드된 전역 AI 계정 (User.isAi = true)
  private async findAiUser(): Promise<User> {
    const ai = await this.prisma.user.findFirst({
      where: { isAi: true },
    });
    if (!ai) {
      // 시드 안 돌린 환경 방지 — 명확한 메시지로 안내
      throw new NotFoundException(
        'AI 계정이 없습니다. npx prisma db seed 를 먼저 실행하세요.',
      );
    }
    return ai;
  }

}
