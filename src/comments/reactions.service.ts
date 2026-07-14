import { Injectable, NotFoundException } from '@nestjs/common';
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
    const comment = await this.prisma.comment.findUnique({
      where:{
        id: commentId,
        select:{projectId:true}
      },
    });
    if(!comment){
      throw new NotFoundException('댓글을 찾을 수 없습니다.');
    }
    const existing = await this.prisma.reaction.findFirst({
      where :{
        commentId,
        userId,
        type:dto.type,
      },
    });
    if(existing){
      await this.prisma.reaction.delete({
        where:{id:existing.id},
      });
      return null;
    }
    const reaction = await this.prisma.reaction.create({
      data:{
        commentId,
        userId,
        type:dto.type,
        projectId:comment.projectId,
      },
    });
    return reaction;
  }
}