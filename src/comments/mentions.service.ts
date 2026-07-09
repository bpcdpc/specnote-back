import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

// createComment/createReply 내부에서 호출 (라우트 없음, DTO 없음)
@Injectable()
export class MentionsService {
  constructor(private readonly prisma: PrismaService) {}

  // 같은 프로젝트 멤버 한정 멘션 저장 + MENTIONED 알림
  async syncMemberMentions(
    commentId: number,
    projectId: number,
    mentionedUserIds: number[],
  ): Promise<void> {
    // TODO: 프로젝트 멤버인 userId 만 필터 → MemberMention 생성 → 각 대상에게 MENTIONED 알림
    throw new Error('not implemented');
  }

  // 같은 프로젝트 엔드포인트 한정 멘션 저장
  async syncEndpointMentions(
    commentId: number,
    projectId: number,
    mentionedEndpointIds: number[],
  ): Promise<void> {
    // TODO: 프로젝트 소속 endpointId 만 필터 → EndpointMention 생성
    throw new Error('not implemented');
  }
}
