import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { ProjectsService } from '../projects/projects.service';
import { EndpointDetail } from './endpoints.type';
import { extractOperation } from '../projects/utils/spec-extractor';

@Injectable()
export class EndpointsService {
  constructor(
    private readonly prisma: PrismaService,
    // ProjectsService의 getLatestSnapshotVersion 을 쓰기 위해서 생성자에 넘겨준다.
    // 최신 snapshotId 를 받아오는 용도이다.
    private readonly projectsService: ProjectsService,
  ) {}

  // GET /endpoints/:id — 엔드포인트 상세
  // requestedSnapshotId가 latest보다 낮으면 요청된 스냅샷을 기준으로 응답한다. (FR-10.6)
  // 멤버십 검증은 가드(@ProjectScope('endpoint'))가 이미 수행
  async findEndpointDetail(
    endpointId: number,
    projectId: number,
    requestedSnapshotId?: number,
  ): Promise<EndpointDetail> {
    const endpoint = await this.prisma.endpoint.findUnique({
      where: { id: endpointId },
    });

    if (!endpoint)
      throw new NotFoundException('엔드포인트를 찾을 수 없습니다.');

    const latestSnapshotId =
      await this.projectsService.getLatestSnapshotVersion(projectId);

    const base = {
      id: endpoint.id,
      path: endpoint.path,
      method: endpoint.method,
      latestSnapshotId,
    };

    // 요청에 스냅샷 아이디가 없거나 최신보다 앞선 상태이면, 엔드포인트의 최신 내용을 보내준다.
    if (
      requestedSnapshotId === undefined ||
      requestedSnapshotId >= latestSnapshotId
    ) {
      return {
        ...base,
        operationId: endpoint.operationId,
        summary: endpoint.summary,
        tags: endpoint.tags,
        operationJson: endpoint.operationJson,
        isDeleted: endpoint.isDeleted,
        snapshotId: latestSnapshotId,
      };
    }

    // 요청받은 snapshotId의 rawJson 을 가져온다.
    const rawJson = await this.projectsService.getSnapshotJson(
      projectId,
      requestedSnapshotId,
    );

    // 요청받은 endpoint의 operation을 추출한다.
    const operation = extractOperation(rawJson, endpoint.path, endpoint.method);

    // 해당 snapshotId에 없는 endpoint일 경우, (새로 생긴 것) 프론트에 없는 endpoint임을 알린다.
    if (!operation) {
      throw new NotFoundException({
        code: 'NOT_IN_SNAPSHOT',
        message: '이 버전의 스펙에는 없는 엔드포인트입니다.',
      });
    }

    // 응답을 만들어 보낸다.
    const { operationId, summary, tags } = operation as {
      operationId?: string;
      summary?: string;
      tags?: string[];
    };

    return {
      ...base,
      operationId: operationId ?? null,
      summary: summary ?? null,
      tags: tags ?? [],
      operationJson: operation,
      // operation 이 존재한다는 것 자체가 삭제되지 않았다는 것을 증명한다.
      isDeleted: false,
      snapshotId: requestedSnapshotId,
    };
  }
}
