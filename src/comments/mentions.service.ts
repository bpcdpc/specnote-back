import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NOTIFICATION_TYPE } from '@prisma/client';

// createComment/createReply 내부에서 호출 (라우트 없음, DTO 없음)
@Injectable()
export class MentionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationsService,
  ) {}

  // 같은 프로젝트 멤버 한정 멘션 저장 + MENTIONED 알림
  async syncMemberMentions(
    senderId: number,
    commentId: number,
    projectId: number,
    mentionedUserIds: number[],
  ): Promise<void> {
    // 기존 멘션 조회 (알림 diff 용)
    const existing = await this.prisma.memberMention.findMany({
      where: { commentId },
      select: { mentionedUserId: true },
    });
    //기존 멘션 user
    const before = new Set(existing.map((m) => m.mentionedUserId));
    //신규 추가분
    const added = mentionedUserIds.filter((id) => !before.has(id));

    // (delete + create 원자성 보장)
    await this.prisma.$transaction([
      this.prisma.memberMention.deleteMany({ where: { commentId }}),
      this.prisma.memberMention.createMany({
        data: mentionedUserIds.map((mentionedUserId) => ({
          commentId,
          mentionedUserId,
          projectId,
        }))
      }),
    ]);

    // 신규 추가분에만 알림 
    await Promise.all (
      added.map((recipientId) =>
        this.notificationService.createNotification({
          recipientId, 
          type: NOTIFICATION_TYPE.MENTIONED,
          senderId,  
          mentionedCommentId: commentId
        }),
      ),
    );

  }

  // 같은 프로젝트 엔드포인트 한정 멘션 저장
  async syncEndpointMentions(
    commentId: number,
    projectId: number,
    mentionedEndpointIds: number[],
  ): Promise<void> {
    // (delete + create 원자성 보장)
    await this.prisma.$transaction([
      this.prisma.endpointMention.deleteMany({ where: { commentId }}),
      this.prisma.endpointMention.createMany({
        data: mentionedEndpointIds.map((endpointId) => ({
          commentId,
          endpointId,
          projectId,
        }))
      })
    ]);
  }

}
