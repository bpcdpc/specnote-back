// common/decorators/current-project-id.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// MembershipGuard 가 req.projectId 에 실어둔 값을 꺼낸다.
// (@ProjectScope 로 역참조된 projectId — 스코프 라우트 전용)
export const CurrentProjectId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): number => {
    const req = ctx.switchToHttp().getRequest();
    return req.projectId;
  },
);
