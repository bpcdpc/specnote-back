import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ROLE } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { CommitSpecDto } from './dto/commit-spec.dto';
import { loadSpec } from './utils/spec-loader';
import {
  extractSpecInfo,
  extractEndpoints,
  extractSnapshotContent,
  key,
} from './utils/spec-extractor';
import { ExtractedEndpoint, SpecResult } from './utils/spec.type';
import {
  EndpointDiff,
  ProjectMeta,
  ProjectSummary,
  Spec,
  SpecCommitResult,
  SpecOperation,
} from './projects.type';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  // POST /projects — 프로젝트 생성 + 최초 스펙 커밋
  async createProject(
    ownerId: number,
    dto: CreateProjectDto,
  ): Promise<ProjectMeta> {
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
          memberships: { create: { userId: ownerId, role: ROLE.OWNER } },
        },
        select: { id: true },
      });

      await this.applySpecCommit(tx, project.id, extracted, rawJson);
      return project.id;
    });

    // 커밋된 상태를 ProjectMeta 로 반환
    return this.findProjectMeta(ownerId, projectId);
  }

  // GET /projects — 내가 멤버인 프로젝트 목록
  async findMyProjects(userId: number): Promise<ProjectSummary[]> {
    // membership(isDeleted=false) 로 내 프로젝트만 조회 → role 포함해 ProjectSummary[] 매핑
    const memberships = await this.prisma.membership.findMany({
      where: {
        userId,
        isDeleted: false,
        project: { isDeleted: false },
      },
      include: {
        project: true,
      },
    });

    return memberships.map((member) => ({
      id: member.project.id,
      title: member.project.title,
      description: member.project.description,
      version: member.project.version,
      oasVersion: member.project.oasVersion,
      role: member.role,
      isDeleted: member.project.isDeleted,
    }));
  }

  // GET /projects/:id - 프로젝트 메타
  // 앵커가 있는 화면은 이 응답으로 그리지 않는다.
  // title은 설정화면의 브레드크럼에서 써야해서 예외적으로 포함시켰다.
  // 30초 폴링 대상이 되므로 가벼워야 한다.
  async findProjectMeta(
    userId: number,
    projectId: number,
  ): Promise<ProjectMeta> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) throw new NotFoundException('프로젝트가 없습니다.');

    // role 취득. 가드가 멤버쉽은 이미 검증했지만, 프론트 화면에서 role 이 필요
    const membership = await this.prisma.membership.findUnique({
      where: { projectId_userId: { projectId, userId } },
      select: { role: true },
    });
    if (!membership) throw new NotFoundException('프로젝트가 없습니다.');

    const latestSnapshotId = await this.getLatestSnapshotVersion(projectId);

    return {
      id: project.id,
      role: membership.role,
      title: project.title,
      specJsonUrl: project.specJsonUrl,
      tryItBaseUrl: project.tryItBaseUrl,
      latestSnapshotId,
    };
  }

  // GET /projects/:id/spec - 한 스냅샷의 스펙 전체
  // requestedSnapshotId 가 없거나 최신버전 이상이면 최신 버전으로 준다.
  async findSpec(
    projectId: number,
    requestedSnapshotId?: number,
  ): Promise<Spec> {
    const latest = await this.getLatestSnapshotVersion(projectId);

    const snapshotId =
      requestedSnapshotId === undefined || requestedSnapshotId >= latest
        ? latest
        : requestedSnapshotId;

    const snapshot = await this.getSnapshot(projectId, snapshotId);

    // 가드에서 이미 projectId를 검증했고, snapshotId도 정리되었으므로
    // 스냅샷이 널일 경우는 존재하지 않는 이전 스냅샷 id를 보낸 경우 뿐이다.
    if (!snapshot) throw new NotFoundException('해당 버전의 스펙이 없습니다.');

    const content = extractSnapshotContent(snapshot.rawJson);

    // 검증이 통과된 스펙만 디비에 저장되므로 실패할 일을 없겠지만
    // 방어적으로 검사한다.
    if (!content) throw new NotFoundException('스펙을 읽을 수 없습니다');

    // 디비의 Endpoint 테이블을 순회하며 스냅샷과 조인한다.
    // - 스냅샷에 있는 경우 : 삭제되지 않음
    // - 스냅샷에 없는 경우 : isDeleted 이면서 요청 스냅샷보다 먼저 생성된 경우에만 목록에 존재해야 하고,
    //                    DB row 에서 마지막 저장된 값을 가져와야 함
    //                  : 그렇지 않으면 목록 자체에서 제거되어야 한다.
    const rows = await this.prisma.endpoint.findMany({
      where: { projectId },
      orderBy: { id: 'asc' },
    });

    const operations: SpecOperation[] = [];
    for (const row of rows) {
      const op = content.operations.get(key(row.path, row.method));
      if (op) {
        operations.push({
          id: row.id,
          path: op.path,
          method: op.method,
          summary: op.summary,
          tags: op.tags,
          isDeleted: false,
          operationJson: op.operationJson,
        });
      } else if (row.isDeleted && row.createdAt <= snapshot.createdAt) {
        // 삭제된 엔드포인트는 요청 스냅샷보다 먼저 존재했었던 것들만 넣는다.
        // 생성 시점을 비교해서 이후에 생성된 엔드포인트들은 목록에서 제외한다.
        // Endpoint.createdAt 값은 최초 생성 시점으로 고정되기 때문에 위와 같이 비교할 수 있다.
        operations.push({
          id: row.id,
          path: row.path,
          method: row.method,
          summary: row.summary,
          tags: row.tags,
          isDeleted: true,
          operationJson: row.operationJson,
        });
      }
    }

    return {
      snapshotId,
      title: content.info.title,
      version: content.info.version,
      oasVersion: content.oasVersion,
      description: content.info.description,
      components: content.components,
      operations,
    };
  }

  // PATCH /projects/:id — tryItBaseUrl 만 수정 (커밋 없음)
  async updateProject(
    userId: number,
    projectId: number,
    dto: UpdateProjectDto,
  ): Promise<ProjectMeta> {
    // 프로젝트 조회
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) throw new NotFoundException('프로젝트 정보가 없습니다.');
    if (project.isDeleted)
      throw new BadRequestException('삭제된 프로젝트 입니다.');

    await this.prisma.project.update({
      where: { id: projectId },
      data: { tryItBaseUrl: dto.tryItBaseUrl },
    });

    return this.findProjectMeta(userId, projectId);
  }

  // DELETE /projects/:id — 소프트 삭제
  async softDeleteProject(projectId: number): Promise<void> {
    // 프로젝트 조회
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    // 프로젝트 체크
    if (!project) throw new NotFoundException('프로젝트 정보가 없습니다.');
    if (project.isDeleted)
      throw new BadRequestException('이미 삭제된 프로젝트 입니다.');

    // isDeleted = true
    await this.prisma.project.update({
      where: { id: projectId },
      data: { isDeleted: true },
    });
  }

  // POST /projects/:id/spec-commits — 스펙 업데이트
  async commitSpec(
    projectId: number,
    dto: CommitSpecDto,
  ): Promise<SpecCommitResult> {
    // 기존 URL 확보 (dto 에 없으면 등록된 URL 을 재fetch)
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { specJsonUrl: true },
    });
    if (!project) throw new NotFoundException('프로젝트가 없습니다.');

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
    const snapshot = await this.prisma.specSnapshot.findFirst({
      where: { projectId },
      orderBy: { id: 'desc' },
      select: { id: true },
    });
    if (!snapshot) throw new NotFoundException('프로젝트 스냅샷이 없습니다.');
    return snapshot.id;
  }

  // 특정 스냅샷의 원본 json과 생성 시점
  private async getSnapshot(projectId: number, snapshotId: number) {
    return this.prisma.specSnapshot.findFirst({
      where: { id: snapshotId, projectId },
      select: { rawJson: true, createdAt: true },
    });
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
    const seen = new Set(extracted.map((e) => key(e.path, e.method)));

    // 기존 전체(삭제 포함) — diff 카운트와 사라진 것 판정에 사용
    const existing = await tx.endpoint.findMany({
      where: { projectId },
      select: { id: true, path: true, method: true, isDeleted: true },
    });
    const existingMap = new Map(
      existing.map((e) => [key(e.path, e.method), e]),
    );

    let added = 0;
    let updated = 0;
    let revived = 0;

    // upsert (신규 / 갱신 / 부활)
    for (const ep of extracted) {
      const prev = existingMap.get(key(ep.path, ep.method));
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
      .filter((e) => !e.isDeleted && !seen.has(key(e.path, e.method)))
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
