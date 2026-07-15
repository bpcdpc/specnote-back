import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Membership, ROLE } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthUser } from '../types/auth.type';
import {
  PROJECT_SCOPE_KEY,
  ProjectScopeResource,
} from '../decorators/project-scope.decorator';
import { PROJECT_ROLE_KEY } from '../decorators/project-role.decorator';

// 프로젝트 스코프 접근 제어. 반드시 JwtAuthGuard 뒤에 배치할 것.
//   @UseGuards(JwtAuthGuard, MembershipGuard)
// 이유: req.user 를 JwtAuthGuard 가 먼저 채워야 여기서 userId 를 읽을 수 있음.
//
// 전체 과정
//   1) resolveProjectId  : 이 요청이 어느 projectId 를 대상으로 하는지 확정
//   2) checkMembership   : 그 프로젝트의 (삭제되지 않은) 멤버인지
//   3) checkRole         : @ProjectRole 이 있으면 역할까지 검증
@Injectable()
export class MembershipGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const user: AuthUser | undefined = req.user;
    if (!user) {
      // JwtAuthGuard 가 앞에 없거나 통과 못 한 경우
      throw new UnauthorizedException('인증이 필요합니다.');
    }

    const projectId = await this.resolveProjectId(context, req);
    const membership = await this.checkMembership(projectId, user.id);
    this.checkRole(context, membership);

    // 다른 로직에서 재사용 가능하도록 실어둠(선택적 사용)
    // req.membership = membership;
    req.projectId = projectId;
    return true;
  }

  // 1) :id가 projectId 인 경우
  private async resolveProjectId(
    context: ExecutionContext,
    req: any,
  ): Promise<number> {
    const id = Number(req.params?.id);
    if (!Number.isInteger(id) || id <= 0) {
      throw new BadRequestException('유효하지 않은 id입니다.');
    }

    const source = this.reflector.getAllAndOverride<
      ProjectScopeResource | undefined
    >(PROJECT_SCOPE_KEY, [context.getHandler(), context.getClass()]);

    // @ProjectScope 없음 → :id 가 곧 projectId (/api/projects/:id/...)
    if (!source) return id;

    // @ProjectScope 있음 → 해당 테이블에서 projectId 역참조
    // endpoint / comment 둘 다 projectId 를 직접 보유 → 단일 조회
    // (없을 때도 404 로 통일해 존재 은닉 — 아래 checkMembership 과 같은 정책)
    switch (source) {
      case 'endpoint': {
        const row = await this.prisma.endpoint.findUnique({
          where: { id },
          select: { projectId: true },
        });
        if (!row) throw new NotFoundException('엔드포인트를 찾을 수 없습니다.');
        return row.projectId;
      }
      case 'comment': {
        const row = await this.prisma.comment.findUnique({
          where: { id },
          select: { projectId: true },
        });
        if (!row) throw new NotFoundException('댓글을 찾을 수 없습니다.');
        return row.projectId;
      }
      default: {
        // union 이 늘어났는데 처리를 빠뜨린 경우를 컴파일/런타임에서 잡음
        const _exhaustive: never = source;
        throw new Error(`처리되지 않은 ProjectScope: ${_exhaustive}`);
      }
    }
  }

  // 2) 멤버십 확인 (없거나 소프트 삭제면 거부).
  //    명세 0-8: 비멤버에게는 403 이 아니라 404 — 리소스 존재 자체를 은닉
  //    (id 가 순차 정수라 403 을 주면 "존재하지만 권한 없음"이 노출됨)
  private async checkMembership(
    projectId: number,
    userId: number,
  ): Promise<Membership> {
    const membership = await this.prisma.membership.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });
    if (!membership || membership.isDeleted) {
      throw new NotFoundException('멤버쉽이 존재하지 않거나 제거되었습니다.');
    }
    return membership;
  }

  // 3) 역할 검증 (@ProjectRole 없으면 스킵).
  //    명세 0-8: 구성원이지만 Owner 아님 → 403 (존재는 이미 알므로 은닉 불필요)
  private checkRole(context: ExecutionContext, membership: Membership): void {
    const required = this.reflector.getAllAndOverride<ROLE | undefined>(
      PROJECT_ROLE_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required) return;
    if (membership.role !== required) {
      throw new ForbiddenException(`${required} 권한이 필요합니다.`);
    }
  }
}
