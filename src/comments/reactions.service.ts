import { Injectable } from '@nestjs/common';
import { Reaction } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateReactionDto } from './dto/create-reaction.dto';

@Injectable()
export class ReactionsService {
  constructor(private readonly prisma: PrismaService) {}

  // POST /comments/:id/reactions — 토글
  // projectId 는 @CurrentProjectId 주입값 (가드가 comment 스코프를 통해 projectId 역참조해둠)
  // comment 자체가 존재하는지, 멤버십이 맞는지는 가드가 이미 검증했으므로, 여기서 다시 조회하지 않음.
  async toggleReaction(
    userId: number,
    commentId: number,
    projectId: number,
    dto: CreateReactionDto,
  ): Promise<Reaction | null> {
    const existing = await this.prisma.reaction.findFirst({
      where: { commentId, userId, type: dto.type },
    });
    if (existing) {
      await this.prisma.reaction.delete({ where: { id: existing.id } });
      return null;
    }
    return this.prisma.reaction.create({
      data: { commentId, userId, type: dto.type, projectId },
    });
  }
}
