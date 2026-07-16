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
    userId: number,
    commentId: number,
    projectId: number,
    mentionedUserIds: number[],
  ): Promise<void> {
    // 프로젝트 멤버인 userId 만 필터 → MemberMention 생성 → 각 대상에게 MENTIONED 알림
    // this.notificationService.createNotification({type: MENTIONED, ...}) 이런식으로 호출하심 됩니다.
    const data = mentionedUserIds.map((userId) => ({
      commentId: commentId,  
      projectId: projectId,
      mentionedUserId: userId, 
    }));

    // 멤버 멘션 저장
    await this.prisma.memberMention.createMany({
      data: data,
      skipDuplicates: true, 
    });

    //초대 알림 생성
    await mentionedUserIds.map((notiId) => {
      this.notificationService.createNotification({
        recipientId: notiId, 
        type: NOTIFICATION_TYPE.MENTIONED,
        senderId: userId,  
        mentionedCommentId: commentId
      })
    })
  
  }


  // 같은 프로젝트 엔드포인트 한정 멘션 저장
  async syncEndpointMentions(
    commentId: number,
    projectId: number,
    mentionedEndpointIds: number[],
  ): Promise<void> {
    // 프로젝트 소속 endpointId 만 필터 → EndpointMention 생성
    // this.notificationService.createNotification({type: INVITED, ...}) 이런식으로 호출하심 됩니다.
    const data = mentionedEndpointIds.map((endpointId) => ({
      commentId: commentId,  
      projectId: projectId,
      endpointId: endpointId, 
    }));

    // endpoint 멘션 저장
    await this.prisma.endpointMention.createMany({
      data: data,
      skipDuplicates: true, 
    });
  }
}
