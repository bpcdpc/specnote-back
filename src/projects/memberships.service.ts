import { Injectable } from '@nestjs/common';
import { Membership } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateMembershipDto } from './dto/create-membership.dto';

@Injectable()
export class MembershipsService {
  constructor(private readonly prisma: PrismaService) {}

  // POST /projects/:id/members — 초대
  async inviteMember(
    ownerId: number,
    projectId: number,
    dto: CreateMembershipDto,
  ): Promise<Membership> {
    // TODO
    // 1. dto.email 로 유저 조회 (없으면 초대 대상 없음 처리)
    // 2. membership upsert: 있으면 isDeleted=false 부활, 없으면 role=MEMBER 로 생성
    // 3. INVITED 알림 생성
    throw new Error('not implemented');
  }

  // DELETE /projects/:id/members/:userId — 제거(소프트)
  async removeMember(
    ownerId: number,
    projectId: number,
    targetUserId: number,
  ): Promise<Membership> {
    // TODO: isDeleted = true → 갱신된 Membership 반환
    throw new Error('not implemented');
  }

  // GET /projects/:id/members — 멤버 목록
  async findMembers(userId: number, projectId: number): Promise<Membership[]> {
    // TODO: 해당 프로젝트의 isDeleted=false 멤버십 목록
    throw new Error('not implemented');
  }

  // 멤버십 단건 조회 (없으면 null). 접근 검증 등에 사용.
  async getMembership(
    userId: number,
    projectId: number,
  ): Promise<Membership | null> {
    // TODO: findUnique projectId_userId
    throw new Error('not implemented');
  }
}
