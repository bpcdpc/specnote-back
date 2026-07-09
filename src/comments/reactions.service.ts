import { Injectable } from '@nestjs/common';
import { Reaction } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateReactionDto } from './dto/create-reaction.dto';

@Injectable()
export class ReactionsService {
  constructor(private readonly prisma: PrismaService) {}

  // POST /comments/:id/reactions — 토글
  async toggleReaction(
    userId: number,
    commentId: number,
    dto: CreateReactionDto,
  ): Promise<Reaction | null> {
    // TODO: (commentId, userId, type) 존재 시 delete 후 null, 없으면 create 후 반환
    throw new Error('not implemented');
  }
}
