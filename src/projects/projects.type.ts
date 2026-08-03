import { ROLE } from '@prisma/client';
import { PublicUser } from '../common/types/auth.type';

export type ProjectSummary = {
  id: number;
  title: string;
  description: string | null;
  version: string;
  oasVersion: string;
  role: ROLE;
  isDeleted: boolean;
};

// 사이드바 경량 목록 (operationJson 제외)
export type EndpointSummary = {
  id: number;
  path: string;
  method: string;
  summary: string | null;
  tags: string[];
  isDeleted: boolean;
};

// 멤버 목록 응답
// id, projectId, isDeleted, createdAt 이 프론트에서 쓰이지 않고, projectId 는 URL 이 이미 갖고 있다.
export type MemberView = {
  user: PublicUser;
  role: ROLE;
};

// 프로젝트 진입 응답
export type ProjectView = {
  project: ProjectSummary;
  specJsonUrl: string;
  tryItBaseUrl: string | null;
  components: unknown; // components JSON, 프론트가 캐싱·파싱
  snapshotId: number; // 프론트 캐시 기준 스냅샷 id
  endpoints: EndpointSummary[]; // 삭제 포함 전체 경량 목록
};

export type EndpointDiff = {
  added: number;
  removed: number;
  updated: number;
  revived: number;
};

export type SpecCommitResult = { snapshotId: number; diff: EndpointDiff };

// 프로젝트 댓글 검색용 응답 
export type ProjectCommentView = {
  id: number;
  endpointId: number;
  projectId: number;
  keyword: string;
  beforeText: string;
  afterText: string;
  memberMentions: { userId: number; userName: string }[];
  endpointMentions: { endpointId: number; path: string; method: string }[];
};