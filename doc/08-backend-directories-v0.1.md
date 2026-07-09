# 백엔드 폴더 구조

| 버전 | 일시 | 변경 내용 |
| --- | --- | --- |
| v0.1 | 2026.07.05 SUN 14:36 | (1) 최초 작성 (2) 각 도메인과 스펙 파싱 부분 표현 (3) 인증: 로그인은 수동 검증(bcrypt), 토큰 검증은 Passport-JWT (4) 권한 : 멤버십, 역할 Guard  |

```markdown
specnote-back/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   │
│   ├── auth/                         # 로그인(bcrypt.compare → jwtService.sign)
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.module.ts
│   │   ├── strategies/
│   │   │   └── jwt.strategy.ts       # 토큰 검증 + payload를 req.user에 주입
│   │   ├── guards/
│   │   │   └── jwt-auth.guard.ts     # AuthGuard('jwt')
│   │   └── dto/
│   │
│   ├── users/                        # 유저 C.R (초대용 이메일 검색 등)
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   ├── users.module.ts
│   │   └── dto/
│   │
│   ├── projects/                     # 프로젝트 + 멤버십 + 커밋시 엔드포인트 C.D(소프트), 스냅샷 C
│   │   ├── projects.controller.ts
│   │   ├── projects.service.ts       # 프로젝트 C.R.U.D(소프트)
│   │   ├── memberships.service.ts    # 멤버십 C.R.D(소프트)
│   │   ├── projects.module.ts
│   │   ├── dto/
│   │   └── utils/
│   │       ├── spec-loader.ts        # spec fetch, validate, oas 버전 확정후 스냅샷용 json 반환
│   │       └── spec-extractor.ts     # spec으로부터 info, endpoints 추출
│   │
│   ├── endpoints/                    # 엔드포인트 R (조회만 있어서 dto 필요없음)
│   │   ├── endpoints.controller.ts
│   │   ├── endpoints.service.ts
│   │   └── endpoints.module.ts
│   │
│   ├── comments/                     # 댓글/대댓글 + 리액션 + 멘션 + AI 요약
│   │   ├── comments.controller.ts 
│   │   ├── comments.service.ts       # 댓글 C.R.U.D(소프트), 엔드포인트 이동 기능
│   │   ├── reactions.service.ts      # 리액션
│   │   ├── mentions.service.ts       # 멤버/엔드포인트 멘션
│   │   ├── ai-summary.service.ts     # AI 요약
│   │   ├── comments.module.ts
│   │   └── dto/
│   │
│   ├── ai/                           # AI 기능
│   │   ├── ai.service.ts             # 외부 AI 클라이언트 호출
│   │   └── ai.module.ts              # export만 하고 진입 지점은 comments의 controller
│   │
│   ├── notifications/                # 초대/멘션 알림
│   │   ├── notifications.controller.ts
│   │   ├── notifications.service.ts
│   │   ├── notifications.module.ts
│   │   └── dto/
│   │
│   └── common/                       # 공유 요소
│       ├── guards/                   # 멤버십 검증 Guard (프로젝트 스코프)
│       ├── decorators/
│       ├── filters/                  # 에러 코드 추가 필터 등
│       └── prisma/                   # PrismaService, PrismaModule
```