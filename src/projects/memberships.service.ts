import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Membership, NOTIFICATION_TYPE, ROLE } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateMembershipDto } from './dto/create-membership.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class MembershipsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationsService,
  ) {}

  // POST /projects/:id/members — 초대
  async inviteMember(
    ownerId: number,
    projectId: number,
    dto: CreateMembershipDto,
  ): Promise<Membership> {
    // 1. dto.email 로 유저 조회 (없으면 초대 대상 없음 처리)
    // 2. membership upsert: 있으면 isDeleted=false 부활, 없으면 role=MEMBER 로 생성
    // 3. INVITED 알림 생성: this.notificationService.createNotification({ type: INVITED, ... }) 이런식으로 호출
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) {
      throw new NotFoundException('사용자 이메일이 없습니다.');
    }

    //멥버십 체크
    const membershipCheck = await this.getMembership(user.id, projectId);

    if (membershipCheck && membershipCheck.isDeleted === false) {
      throw new ConflictException('이미 멤버로 존재합니다.');
    }
    //멤버십 저장
    const membership = await this.prisma.membership.upsert({
      where: {
        projectId_userId: {
          projectId,
          userId: user.id,
        },
      },
      update: {
        isDeleted: false,
      },
      create: {
        projectId,
        userId: user.id,
        role: ROLE.MEMBER,
      },
    });

    //초대 알림 생성
    await this.notificationService.createNotification({
      recipientId: user.id,
      type: NOTIFICATION_TYPE.INVITED,
      senderId: ownerId,
      invitedProjectId: projectId,
    });

    return membership;
  }

  // DELETE /projects/:id/members/:userId — 제거(소프트)
  async removeMember(
    projectId: number,
    targetUserId: number,
  ): Promise<Membership> {
    // isDeleted = true → 갱신된 Membership 반환
    const membershipCheck = await this.getMembership(targetUserId, projectId);
    if (!membershipCheck) {
      throw new NotFoundException('존재하지 않는 멤버입니다.');
    }
    if (membershipCheck.isDeleted) {
      throw new ConflictException('비활성된 멤버입니다.');
    }
    if (membershipCheck.role === ROLE.OWNER) {
      throw new ConflictException('OWNER 멤버는 삭제 불가 합니다.');
    }

    const membership = await this.prisma.membership.update({
      where: {
        projectId_userId: {
          projectId,
          userId: targetUserId,
        },
      },
      data: {
        isDeleted: true,
      },
    });
    return membership;
  }

  // GET /projects/:id/members — 멤버 목록
  async findMembers(projectId: number): Promise<Membership[]> {
    // 해당 프로젝트의 isDeleted=false 멤버십 목록
    const memberships = await this.prisma.membership.findMany({
      where: {
        projectId,
        isDeleted: false,
      },
    });
    return memberships;
  }

  // 멤버십 단건 조회 (없으면 null). 접근 검증 등에 사용.
  async getMembership(
    userId: number,
    projectId: number,
  ): Promise<Membership | null> {
    const membership = await this.prisma.membership.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    });
    if (!membership) return null;
    return membership;
  }
}
