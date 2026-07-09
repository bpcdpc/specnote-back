import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { CommitSpecDto } from './dto/commit-spec.dto';
import { ExtractedEndpoint } from './utils/spec.type';
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
    // TODO
    // 1. [tx 밖] loadSpec(dto.specJsonUrl) → 실패(!ok)면 code별 BadRequestException
    // 2. [tx 밖] extractSpecInfo(spec) / extractEndpoints(spec)
    // 3. [tx] project 생성(메타 title/description/version/oasVersion 인라인 대입) + Owner 멤버십 생성
    // 4. [tx] applySpecCommit(tx, project.id, extracted, rawJson)
    // 5. 생성 결과를 ProjectView 로 반환 (findProject 재사용해도 됨)
    throw new Error('not implemented');
  }

  // GET /projects — 내가 멤버인 프로젝트 목록
  async findMyProjects(userId: number): Promise<ProjectSummary[]> {
    // TODO: membership(isDeleted=false) 로 내 프로젝트만 조회 → role 포함해 ProjectSummary[] 매핑
    throw new Error('not implemented');
  }

  // GET /projects/:id — 프로젝트 진입
  async findProject(userId: number, projectId: number): Promise<ProjectView> {
    // TODO: project 메타 + endpoints(EndpointSummary[], 삭제 포함) + 최신 스냅샷의 components/snapshotId
    throw new Error('not implemented');
  }

  // PATCH /projects/:id — tryItBaseUrl 만 수정 (커밋 없음)
  async updateProject(
    userId: number,
    projectId: number,
    dto: UpdateProjectDto,
  ): Promise<ProjectSummary> {
    // TODO: tryItBaseUrl update → ProjectSummary 반환 (role 은 멤버십에서)
    throw new Error('not implemented');
  }

  // DELETE /projects/:id — 소프트 삭제
  async softDeleteProject(userId: number, projectId: number): Promise<void> {
    // TODO: isDeleted = true
    throw new Error('not implemented');
  }

  // POST /projects/:id/spec-commits — 스펙 업데이트
  async commitSpec(
    userId: number,
    projectId: number,
    dto: CommitSpecDto,
  ): Promise<SpecCommitResult> {
    // TODO
    // 1. url = dto.specJsonUrl ?? project.specJsonUrl
    // 2. [tx 밖] loadSpec(url) → 실패면 BadRequestException / extract
    // 3. [tx] 메타 update + applySpecCommit(tx, projectId, extracted, rawJson)
    throw new Error('not implemented');
  }

  // 최신 스냅샷 id (프론트 버전 정합성용)
  async getLatestSnapshotVersion(projectId: number): Promise<number> {
    // TODO: 해당 projectId 의 가장 최근 SpecSnapshot.id
    throw new Error('not implemented');
  }

  // ── 아래 3개는 스펙 커밋 핵심 로직 (난이도 높음, 리드가 담당 권장) ──
  // createProject / commitSpec 에서만 호출하는 공유 tx 헬퍼. 여기서 트랜잭션을 열지 않음.

  private async applySpecCommit(
    tx: Prisma.TransactionClient,
    projectId: number,
    extracted: ExtractedEndpoint[],
    rawJson: Prisma.InputJsonValue,
  ): Promise<SpecCommitResult> {
    // TODO: createSnapshot + syncEndpoints → { snapshotId, diff } 반환
    throw new Error('not implemented');
  }

  private async createSnapshot(
    tx: Prisma.TransactionClient,
    projectId: number,
    rawJson: Prisma.InputJsonValue,
  ): Promise<number> {
    // TODO: SpecSnapshot append(덮어쓰지 않음) → id 반환
    throw new Error('not implemented');
  }

  private async syncEndpoints(
    tx: Prisma.TransactionClient,
    projectId: number,
    extracted: ExtractedEndpoint[],
  ): Promise<EndpointDiff> {
    // TODO: upsert(부활 포함, isDeleted=false) + 사라진 것 소프트삭제 → diff 카운트 반환
    // 동일성 기준 = (projectId, path, method)
    throw new Error('not implemented');
  }
}
