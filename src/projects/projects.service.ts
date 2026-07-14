import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { CommitSpecDto } from './dto/commit-spec.dto';
import { loadSpec } from './utils/spec-loader';
import { extractSpecInfo, extractEndpoints } from './utils/spec-extractor';
import { ExtractedEndpoint, SpecResult } from './utils/spec.type';
import {
  EndpointDiff,
  ProjectSummary,
  ProjectView,
  SpecCommitResult,
} from './projects.type';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  // POST /projects — 프로젝트 생성 + 최초 스펙 커밋
  async createProject(
    ownerId: number,
    dto: CreateProjectDto,
  ): Promise<ProjectView> {
    // [트랜잭션 밖] 네트워크 fetch·검증·추출
    const loaded = await loadSpec(dto.specJsonUrl);
    if (!loaded.ok) this.throwSpecError(loaded);

    const extracted = extractEndpoints(loaded.spec);
    const info = extractSpecInfo(loaded.spec);
    const rawJson = loaded.spec as unknown as Prisma.InputJsonValue;

    // [트랜잭션] 프로젝트 + Owner 멤버십 + 스냅샷/엔드포인트
    const projectId = await this.prisma.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: {
          specJsonUrl: dto.specJsonUrl,
          tryItBaseUrl: dto.tryItBaseUrl ?? null,
          title: info.title,
          description: info.description ?? null,
          version: info.version,
          oasVersion: loaded.oas,
          memberships: { create: { userId: ownerId, role: 'OWNER' } },
        },
        select: { id: true },
      });

      await this.applySpecCommit(tx, project.id, extracted, rawJson);
      return project.id;
    });

    // 커밋된 상태를 ProjectView 로 반환 (findProject 재사용)
    return this.findProject(ownerId, projectId);
  }

  // GET /projects — 내가 멤버인 프로젝트 목록
  async findMyProjects(userId: number): Promise<ProjectSummary[]> {
    // membership(isDeleted=false) 로 내 프로젝트만 조회 → role 포함해 ProjectSummary[] 매핑
    const memberships = await this.prisma.membership.findMany({
      where:{
        userId,
        isDeleted: false,
        project:  { isDeleted: false}
      },
      include: {
        project: true, 
      },
    });

    return memberships.map((membership)=>({
      id: membership.project.id,
      title: membership.project.title,
      description: membership.project.description,
      version: membership.project.version,
      oasVersion: membership.project.oasVersion,
      role: membership.role,
      isDeleted: membership.project.isDeleted,
    }))
  }

  // GET /projects/:id — 프로젝트 진입
  async findProject(userId: number, projectId: number): Promise<ProjectView> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) throw new NotFoundException('프로젝트 없음');

    // role 취득 (가드가 멤버십은 이미 검증했지만, 뷰에 role 이 필요)
    const membership = await this.prisma.membership.findUnique({
      where: { projectId_userId: { projectId, userId } },
      select: { role: true },
    });
    if (!membership) throw new NotFoundException('프로젝트 없음');

    // 엔드포인트 경량 목록 (삭제 포함)
    const endpoints = await this.prisma.endpoint.findMany({
      where: { projectId },
      select: {
        id: true,
        path: true,
        method: true,
        summary: true,
        tags: true,
        isDeleted: true,
      },
      orderBy: { id: 'asc' },
    });

    // 최신 스냅샷에서 components + snapshotId
    const snapshot = await this.prisma.specSnapshot.findFirst({
      where: { projectId },
      orderBy: { id: 'desc' },
      select: { id: true, rawJson: true },
    });
    const components =
      (snapshot?.rawJson as { components?: unknown } | null)?.components ??
      null;

    return {
      project: {
        id: project.id,
        title: project.title,
        description: project.description,
        version: project.version,
        oasVersion: project.oasVersion,
        role: membership.role,
        isDeleted: project.isDeleted,
      },
      tryItBaseUrl: project.tryItBaseUrl,
      components,
      snapshotId: snapshot?.id ?? 0,
      endpoints,
    };
  }

  // PATCH /projects/:id — tryItBaseUrl 만 수정 (커밋 없음)
  async updateProject(
    userId: number,
    projectId: number,
    dto: UpdateProjectDto,
  ): Promise<ProjectSummary> {
    // tryItBaseUrl update → ProjectSummary 반환 (role 은 멤버십에서)
    // 프로젝트 조회  
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        memberships: {
          where: { id: userId}
        }
      }
    });
    // 프로젝트 체크 
    if (!project) throw new NotFoundException('프로젝트 정보가 없습니다.');
    if (project.isDeleted) throw new NotFoundException('삭제된 프로젝트 입니다.');

    // // 프로젝트 onwer 맴버십 체크 
    // if (!project.memberships) throw new NotFoundException('프로젝트 맵버십 정보가 없습니다.');
    // if (project.memberships[0].role !== ROLE.OWNER) throw new NotFoundException('맴버십 OWNER가 아닙니다.');

    // tryItBaseUrl update 
    const ps = await this.prisma.project.update({
      where: { id: projectId },
      data: { tryItBaseUrl: dto.tryItBaseUrl }
    });

    return {
      id: ps.id,
      title: ps.title,
      description: ps.description,
      version: ps.version,
      oasVersion: ps.oasVersion,
      role: project.memberships[0].role,
      isDeleted: ps.isDeleted
    }

  }

  // DELETE /projects/:id — 소프트 삭제
  async softDeleteProject(userId: number, projectId: number): Promise<void> {
    // 프로젝트 조회  
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        memberships: {
          where: { id: userId}
        }
      }
    });
    // 프로젝트 체크 
    if (!project) throw new NotFoundException('프로젝트 정보가 없습니다.');
    if (project.isDeleted) throw new NotFoundException('이미 삭제된 프로젝트 입니다.');

    // // 프로젝트 onwer 맴버십 체크 
    // if (!project.memberships) throw new NotFoundException('프로젝트 맵버십 정보가 없습니다.');
    // if (project.memberships[0].role !== ROLE.OWNER) throw new NotFoundException('맴버십 OWNER가 아닙니다.');

    // isDeleted = true
    await this.prisma.project.update({
      where: { id: projectId },
      data: { isDeleted: true}
    });

    //todo: shk-20260714 리턴값 없이 진행?
  }

  // POST /projects/:id/spec-commits — 스펙 업데이트
  async commitSpec(
    userId: number,
    projectId: number,
    dto: CommitSpecDto,
  ): Promise<SpecCommitResult> {
    // 기존 URL 확보 (dto 에 없으면 등록된 URL 을 재fetch)
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { specJsonUrl: true },
    });
    if (!project) throw new NotFoundException('프로젝트 없음');

    const url = dto.specJsonUrl ?? project.specJsonUrl;

    // [트랜잭션 밖] fetch·검증·추출
    const loaded = await loadSpec(url);
    if (!loaded.ok) this.throwSpecError(loaded);

    const extracted = extractEndpoints(loaded.spec);
    const info = extractSpecInfo(loaded.spec);
    const rawJson = loaded.spec as unknown as Prisma.InputJsonValue;

    // [트랜잭션] 메타 갱신(리로드 시에만, FR-1.9) + 스냅샷 append + 엔드포인트 diff
    return this.prisma.$transaction(async (tx) => {
      await tx.project.update({
        where: { id: projectId },
        data: {
          specJsonUrl: url,
          title: info.title,
          description: info.description ?? null,
          version: info.version,
          oasVersion: loaded.oas,
        },
      });
      return this.applySpecCommit(tx, projectId, extracted, rawJson);
    });
  }

  // 최신 스냅샷 id (프론트 버전 정합성용)
  async getLatestSnapshotVersion(projectId: number): Promise<number> {
    // TODO: 해당 projectId 의 가장 최근 SpecSnapshot.id
    throw new Error('not implemented');
  }

  // ── 공유 tx 헬퍼 (createProject / commitSpec 공용, 트랜잭션 열지 않음) ──

  private async applySpecCommit(
    tx: Prisma.TransactionClient,
    projectId: number,
    extracted: ExtractedEndpoint[],
    rawJson: Prisma.InputJsonValue,
  ): Promise<SpecCommitResult> {
    const snapshotId = await this.createSnapshot(tx, projectId, rawJson);
    const diff = await this.syncEndpoints(tx, projectId, extracted);
    return { snapshotId, diff };
  }

  // 스냅샷 append-only. id 만 반환.
  private async createSnapshot(
    tx: Prisma.TransactionClient,
    projectId: number,
    rawJson: Prisma.InputJsonValue,
  ): Promise<number> {
    const snap = await tx.specSnapshot.create({
      data: { projectId, rawJson },
      select: { id: true },
    });
    return snap.id;
  }

  // 엔드포인트 동기화: upsert(부활 포함) + 사라진 것 소프트삭제. 동일성 = (projectId, path, method)
  private async syncEndpoints(
    tx: Prisma.TransactionClient,
    projectId: number,
    extracted: ExtractedEndpoint[],
  ): Promise<EndpointDiff> {
    const seen = new Set(extracted.map((e) => this.key(e.path, e.method)));

    // 기존 전체(삭제 포함) — diff 카운트와 사라진 것 판정에 사용
    const existing = await tx.endpoint.findMany({
      where: { projectId },
      select: { id: true, path: true, method: true, isDeleted: true },
    });
    const existingMap = new Map(
      existing.map((e) => [this.key(e.path, e.method), e]),
    );

    let added = 0;
    let updated = 0;
    let revived = 0;

    // upsert (신규 / 갱신 / 부활)
    for (const ep of extracted) {
      const prev = existingMap.get(this.key(ep.path, ep.method));
      if (!prev) added++;
      else if (prev.isDeleted) revived++;
      else updated++;

      await tx.endpoint.upsert({
        where: {
          projectId_path_method: {
            projectId,
            path: ep.path,
            method: ep.method,
          },
        },
        create: {
          projectId,
          path: ep.path,
          method: ep.method,
          operationId: ep.operationId ?? null,
          summary: ep.summary ?? null,
          tags: ep.tags,
          operationJson: ep.operationJson,
          isDeleted: false,
        },
        update: {
          operationId: ep.operationId ?? null,
          summary: ep.summary ?? null,
          tags: ep.tags,
          operationJson: ep.operationJson,
          isDeleted: false, // 부활 시 되살림
        },
      });
    }

    // 이번 스펙에 없는 현존 엔드포인트 → 소프트 삭제
    const staleIds = existing
      .filter((e) => !e.isDeleted && !seen.has(this.key(e.path, e.method)))
      .map((e) => e.id);
    let removed = 0;
    if (staleIds.length > 0) {
      await tx.endpoint.updateMany({
        where: { id: { in: staleIds } },
        data: { isDeleted: true },
      });
      removed = staleIds.length;
    }

    return { added, removed, updated, revived };
  }

  private key(path: string, method: string): string {
    return `${method} ${path}`;
  }

  // SpecResult 실패를 HTTP 에러로 (code 를 실어 프론트/필터에서 분기)
  private throwSpecError(r: Extract<SpecResult, { ok: false }>): never {
    switch (r.code) {
      case 'INVALID_SPEC':
        throw new BadRequestException({ code: r.code, errors: r.errors });
      case 'UNSUPPORTED_VERSION':
        throw new BadRequestException({ code: r.code, version: r.version });
      case 'SPEC_LOAD_ERROR':
        throw new BadRequestException({ code: r.code, error: r.error });
    }
  }
}
