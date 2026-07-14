import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { ProjectsService } from '../projects/projects.service';
import { EndpointDetail } from './endpoints.type';

@Injectable()
export class EndpointsService {
  constructor(
    private readonly prisma: PrismaService,
    // ProjectsService의 getLatestSnapshotVersion 을 쓰기 위해서 생성자에 넘겨준다.
    // 최신 snapshotId 를 받아오는 용도이다.
    private readonly projectsService: ProjectsService,
  ) {}

  // GET /endpoints/:id — 엔드포인트 상세
  async findEndpointDetail(
    userId: number,
    endpointId: number,
  ): Promise<EndpointDetail> {
    // TODO
    // 1. endpoint 조회 (projectId 포함, 없으면 NotFound)
    //    * 멤버십 검증은 가드(@ProjectScope('endpoint'))가 이미 수행
    // 2. projectsService.getLatestSnapshotVersion(projectId) 로 최신 snapshotId
    // 3. EndpointDetail 로 매핑 (operationJson 은 그대로 pass-through)
    const endpoint = await this.prisma.endpoint.findUnique({
      where:{id:endpointId},
    })
    if(!endpoint) throw new NotFoundException('엔드포인트 찾을 수 없음');
    const snapshotId = await this.projectsService.getLatestSnapshotVersion(
      endpoint.projectId);
    return {
      id: endpoint.id,
      path: endpoint.path,
      method: endpoint.method,
      operationId: endpoint.operationId,
      summary: endpoint.summary,
      tags:endpoint.tags,
      operationJson: endpoint.operationJson,
      isDeleted: endpoint.isDeleted,
      snapshotId,

    };
  }
}
