import { SetMetadata } from '@nestjs/common';
import { ROLE } from '@prisma/client';

// 해당 라우트가 요구하는 프로젝트 역할. 없으면 역할 무관(멤버면 통과).
// 현재는 OWNER 전용 라우트에만 @ProjectRole(ROLE.OWNER) 로 사용.
// MembershipGuard 가 @UseGuards 로 걸려 있어야만 효과가 있음(단독으로는 무의미).
export const PROJECT_ROLE_KEY = 'projectRole';

export const ProjectRole = (role: ROLE) => SetMetadata(PROJECT_ROLE_KEY, role);
