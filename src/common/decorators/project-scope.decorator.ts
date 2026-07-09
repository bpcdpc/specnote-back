import { SetMetadata } from '@nestjs/common';

// :id 가 어느 테이블의 id 인지 지정 → 그 행에서 projectId 를 역참조.
// 이 데코레이터가 없으면 MembershipGuard 는 :id 를 곧 projectId 로 해석함
// (즉 /api/projects/:id/... 형태의 Tier 2 라우트).
// endpoint / comment 모두 projectId 컬럼을 직접 보유하므로 단일 조회로 끝남.
export type ProjectScopeResource = 'endpoint' | 'comment';

export const PROJECT_SCOPE_KEY = 'projectScope';

export const ProjectScope = (source: ProjectScopeResource) =>
  SetMetadata(PROJECT_SCOPE_KEY, source);
