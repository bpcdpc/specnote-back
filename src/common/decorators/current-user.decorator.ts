import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthUser } from '../types/auth.type';

// 핸들러에서 req.user 를 바로 꺼내 쓰기 위한 편의 데코레이터.
// 예: create(@CurrentUser() user: AuthUser) { ... user.userId ... }
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    return ctx.switchToHttp().getRequest().user;
  },
);
