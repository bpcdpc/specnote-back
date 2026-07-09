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
  snapshotId: number; // 정합성 비교용 최신 스냅샷 id
};
