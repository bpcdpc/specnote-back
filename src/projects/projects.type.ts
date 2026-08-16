import { ROLE } from '@prisma/client';
import { PublicUser } from '../common/types/auth.type';

// 멤버 목록 응답
// id, projectId, isDeleted, createdAt 이 프론트에서 쓰이지 않고, projectId 는 URL 이 이미 갖고 있다.
export type MemberView = {
  user: PublicUser;
  role: ROLE;
};

export type ProjectSummary = {
  id: number;
  title: string;
  description: string | null;
  version: string;
  oasVersion: string;
  role: ROLE;
  isDeleted: boolean;
};

// 프로젝트 내용중 앵커와 무관한 것들
// 이 응답은 프론트에서 30초 폴링 대상이 된다.
// title은 스펙 커밋으로 바뀌지만 앵커가 없는 설정화면에서 그려줘야 하기 때문에
// 이 응답에 실어줄 수 밖에 없다.
export type ProjectMeta = {
  id: number;
  role: ROLE;
  title: string;
  specJsonUrl: string;
  tryItBaseUrl: string | null;
  // 서버의 현재 최신 스냅샷. 배너 판정 전용(FR-10.6).
  latestSnapshotId: number;
};

// Spec.operations 원소
// 기존의 사이드바에서 쓰던 EndpointSummary와
// 엔드포인트 상세에서 쓰던 operationJson을 한 응답 타입으로 합친다.
export type SpecOperation = {
  id: number;
  path: string;
  method: string;
  summary: string | null;
  tags: string[];
  isDeleted: boolean;
  // 삭제되지 않은 엔드포인트는 요청받은 snapshot의 rawJson에서,
  // 삭제된 엔드포인트는 디비의 Endpoint 테이블에 저장된 마지막 값에서 꺼내 쓴다.
  operationJson: unknown;
};

// 한 스냅샷 요청의 전부.
// 이것 하나로 프론트 스펙 상세 화면의 전체를 제공한다.
export type Spec = {
  snapshotId: number; // 이 응답이 나온 snapshot 버전. ?snapshotId가 없거나 최신 이상이면 최신 버전으로 응답한다.
  title: string;
  version: string;
  oasVersion: string;
  description: string | null;
  components: unknown; // rawJson.components. $ref 는 프론트가 렌더 시 해석
  operations: SpecOperation[];
};

// 엔드포인트 변경된 diff 항목별 갯수 내역
export type EndpointDiff = {
  added: number;
  removed: number;
  updated: number;
  revived: number;
};

// 스펙 커밋한 결과
export type SpecCommitResult = { snapshotId: number; diff: EndpointDiff };
