import { Injectable, NotFoundException } from '@nestjs/common';
import { Notification } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationView } from './notifications.type';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  // 타 서비스가 호출 (memberships 초대 / mentions 멘션). 라우트 없음.
  async createNotification(dto: CreateNotificationDto): Promise<Notification> {
    // Notification 생성 (type 별 nullable FK: invitedProjectId / mentionedCommentId)
    const notification = await this.prisma.notification.create({
      data: {
        recipientId: dto.recipientId,
        type: dto.type,
        senderId: dto.senderId,
        invitedProjectId: dto.invitedProjectId ?? null,
        mentionedCommentId: dto.mentionedCommentId ?? null,
      },
    });
    return notification;
  }

  // GET /notifications — 내 알림 목록
  async findNotifications(userId: number): Promise<NotificationView[]> {
    // 1. recipientId=userId 알림 조회 (최신순)
    // 2. INVITED   → invitedProjectId 그대로, projectId/endpointId 는 null
    //    MENTIONED → mentionedCommentId 로 Comment 조인해 projectId·endpointId 파생
    // 3. NotificationView[] 로 매핑
    const notifications = await this.prisma.notification.findMany({
      where: { recipientId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        mentionedComment: {
          select: {
            projectId: true,
            endpointId: true,
          },
        },
      },
    });

    const notificationViews: NotificationView[] = notifications.map((noti) => ({
      id: noti.id,
      type: noti.type,
      isRead: noti.isRead,
      createdAt: noti.createdAt.toISOString(),
      invitedProjectId: noti.invitedProjectId,
      mentionedCommentId: noti.mentionedCommentId,
      projectId: noti.mentionedComment?.projectId ?? null,
      endpointId: noti.mentionedComment?.endpointId ?? null,
    }));

    return notificationViews;
  }

  // PATCH /notifications/:id/read — 읽음 처리
  async markAsRead(
    userId: number,
    notificationId: number,
  ): Promise<Notification> {
    // 본인(recipientId) 알림인지 확인 → isRead=true → 갱신된 Notification 반환
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException('알림이 존재하지 않습니다.');
    }

    if (notification.recipientId !== userId) {
      throw new NotFoundException('알림이 존재하지 않습니다.');
    }

    const updatedNotification = await this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    return updatedNotification;
  }
}
