import { Injectable } from '@nestjs/common';
import { Notification } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationView } from './notifications.type';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  // 타 서비스가 호출 (memberships 초대 / mentions 멘션). 라우트 없음.
  async createNotification(dto: CreateNotificationDto): Promise<Notification> {
    // TODO: Notification 생성 (type 별 nullable FK: invitedProjectId / mentionedCommentId)
    throw new Error('not implemented');
  }

  // GET /notifications — 내 알림 목록
  async findNotifications(userId: number): Promise<NotificationView[]> {
    // TODO
    // 1. recipientId=userId 알림 조회 (최신순)
    // 2. INVITED   → invitedProjectId 그대로, projectId/endpointId 는 null
    //    MENTIONED → mentionedCommentId 로 Comment 조인해 projectId·endpointId 파생
    // 3. NotificationView[] 로 매핑
    throw new Error('not implemented');
  }

  // PATCH /notifications/:id/read — 읽음 처리
  async markAsRead(
    userId: number,
    notificationId: number,
  ): Promise<Notification> {
    // TODO: 본인(recipientId) 알림인지 확인 → isRead=true → 갱신된 Notification 반환
    throw new Error('not implemented');
  }
}
