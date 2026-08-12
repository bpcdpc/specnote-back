// GET /api/endpoints/:id 응답
export type EndpointDetail = {
  id: number;
  path: string;
  method: string;
  operationId: string | null;
  summary: string | null;
  tags: string[];
  operationJson: unknown; // operation JSON, 프론트가 파싱 (서버 pass-through)
  isDeleted: boolean;
  // 이 응답이 만들어진 스냅샷
  // ?snapshotId 가 없거나 최신 이상이면 최신 것을 주고 그 값이 여기 담긴다.
  snapshotId: number;
  // 서버의 현재 최신 스냅샷. 배너 판정 전용(FR-10.6).
  latestSnapshotId: number;
};
