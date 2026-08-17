# 백엔드 폴더 구조

| 버전 | 일시                 | 변경 내용                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ---- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| v0.1 | 2026.07.05 SUN 14:36 | (1) 최초 작성 (2) 각 도메인과 스펙 파싱 부분 표현 (3) 인증: 로그인은 수동 검증(bcrypt), 토큰 검증은 Passport-JWT (4) 권한 : 멤버십, 역할 Guard                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| v0.2 | —                    | 유실. 어느 시점에 이 파일이 백엔드 WBS 문서로 잘못 덮어써져 v0.2의 기록이 사라졌다. WBS 내용은 별도 파일로 분리해 보존한다.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| v0.3 | 2026.08.15 SAT       | **현행 코드 기준 재작성.** (1) `endpoints/` 모듈 삭제 — 스펙 조회 재편(09 v0.8)으로 엔드포인트 단독 조회가 `GET /projects/:id/spec`에 흡수됐다. `Endpoint` 테이블과 도메인은 남는다(댓글 앵커, 삭제 대비 백업). (2) 타입 파일 반영 — 각 도메인의 응답 타입은 `*.type.ts`, 파싱 내부 타입은 `projects/utils/spec.type.ts`. (3) `common/filters/` 제거 — v0.1의 계획 항목이었으나 만들지 않았다. 에러 코드는 서비스에서 `HttpException` body에 직접 싣는다(`throwSpecError`). (4) `common/types/` 추가(`auth.type.ts` — `AuthUser`). (5) `prisma/seed.ts`, `migrations/` 반영. (6) 실물 대조 반영 — 각 도메인의 `*.type.ts`(comments, notifications 포함), Nest CLI 잔재 `entities/` 폴더, `utils/spec-tester.ts`, notifications의 `dto/`. |

```
specnote-back/
├── prisma/
│ ├── schema.prisma
│ ├── migrations/ # migrate deploy 가 순서대로 실행하는 SQL 기록
│ └── seed.ts # AI 계정 시드
├── src/
│ ├── main.ts # ValidationPipe, /api prefix, Swagger, CORS, compression
│ ├── app.module.ts
│ │
│ ├── auth/ # 로그인(bcrypt.compare → jwtService.sign)
│ │ ├── auth.controller.ts
│ │ ├── auth.service.ts
│ │ ├── auth.module.ts
│ │ ├── strategies/
│ │ │ └── jwt.strategy.ts # 토큰 검증 + payload를 req.user에 주입
│ │ ├── guards/
│ │ │ └── jwt-auth.guard.ts # AuthGuard('jwt')
│ │ └── dto/
│ │   └── login.dto.ts
│ │
│ ├── users/ # 유저 C.R (가입, 초대용 이메일 검색, users/me)
│ │ ├── users.controller.ts
│ │ ├── users.service.ts
│ │ ├── users.module.ts
│ │ └── dto/
│ │   └── create-user.dto.ts
│ │
│ ├── projects/ # 프로젝트 + 멤버십 + 스펙 커밋 + 스펙 조회
│ │ ├── projects.controller.ts
│ │ ├── projects.service.ts # 프로젝트 C.R.U.D(소프트) + findProjectMeta/findSpec
│ │ │ # + applySpecCommit(스냅샷 append, 엔드포인트 upsert)
│ │ ├── memberships.service.ts # 멤버십 C.R.D(소프트)
│ │ ├── projects.module.ts
│ │ ├── projects.type.ts # 응답 타입 (ProjectMeta, Spec, SpecOperation, ...)
│ │ ├── dto/
│ │ │ ├── create-project.dto.ts
│ │ │ ├── update-project.dto.ts
│ │ │ ├── commit-spec.dto.ts
│ │ │ └── create-membership.dto.ts
│ │ └── utils/
│ │   ├── spec-loader.ts # spec fetch, validate, oas 버전 확정후 스냅샷용 json 반환
│ │   ├── spec-extractor.ts # 쓰기: info·endpoints 추출 / 읽기: extractSnapshotContent, key()
│ │   ├── spec-tester.ts # 스펙 파싱 로컬 확인용
│ │   └── spec.type.ts # 파싱 내부 타입 (SpecResult, SnapshotContent, ...)
│ │
│ ├── comments/ # 댓글/대댓글 + 리액션 + 멘션 + AI 요약
│ │ ├── comments.controller.ts # /endpoints/:id/comments 계열 라우트도 여기 소속
│ │ ├── comments.service.ts # 댓글 C.R.U.D(소프트), 엔드포인트 단위 이동(moveComments)
│ │ ├── reactions.service.ts # 리액션 토글
│ │ ├── mentions.service.ts # 멤버/엔드포인트 멘션 동기화
│ │ ├── ai-summary.service.ts # 스레드 AI 요약
│ │ ├── comments.module.ts
│ │ ├── comments.type.ts # 응답 타입 (CommentView, CommentTree, ...)
│ │ └── dto/
│ │   ├── create-comment.dto.ts
│ │   ├── update-comment.dto.ts
│ │   ├── create-reaction.dto.ts
│ │   └── move-comment.dto.ts
│ │
│ ├── ai/ # AI 기능
│ │ ├── ai.service.ts # 외부 AI 클라이언트 호출
│ │ └── ai.module.ts # export만 하고 진입 지점은 comments의 controller
│ │
│ ├── notifications/ # 초대/멘션 알림 (생성은 내부 함수, 라우트는 조회·읽음뿐)
│ │ ├── notifications.controller.ts
│ │ ├── notifications.service.ts
│ │ ├── notifications.module.ts
│ │ ├── notifications.type.ts # NotificationView
│ │ └── dto/
│ │   └── create-notification.dto.ts # 내부 함수(createNotification)용
│ │
│ └── common/ # 공유 요소
│ ├── guards/
│ │ └── membership.guard.ts # 멤버십 검증 + @ProjectScope 역참조 + @ProjectRole 검증
│ ├── decorators/
│ │ ├── current-user.decorator.ts
│ │ ├── current-project-id.decorator.ts
│ │ ├── project-scope.decorator.ts
│ │ └── project-role.decorator.ts
│ ├── types/
│ │ └── auth.type.ts # AuthUser (req.user 형태)
│ └── prisma/ # PrismaService, PrismaModule
```

> 각 도메인의 `entities/` 폴더는 Nest CLI 스캐폴딩 잔재로, 사용하지 않는다
> (모델 타입은 Prisma가 생성). 트리에서 생략했다.

## v0.1과 달라진 지점

**`endpoints/` 모듈이 없다.** 엔드포인트 단독 조회(`GET /endpoints/:id`)가 스냅샷 단위
단일 응답(`GET /projects/:id/spec`)에 흡수되면서 모듈의 존재 이유가 사라졌다(09 v0.8).
`/api/endpoints/:id/...` URL은 댓글 계열 라우트가 계속 쓴다 — 그 라우트들은
`comments.controller.ts` 소속이고, endpointId → projectId 역참조는
`membership.guard.ts`(`@ProjectScope('endpoint')`) 소관이라 모듈 삭제와 무관하다.

**`common/filters/`를 만들지 않았다.** v0.1의 계획 항목이었으나, 스펙 로딩 에러 코드
(`INVALID_SPEC` 등)는 서비스가 `BadRequestException` body에 직접 실어 해결했다
(`throwSpecError` — 09 참고). 전역 필터가 필요한 시점이 오지 않았다.

**타입 파일이 자리를 잡았다.** API 응답에 등장하는 타입은 각 도메인의 `*.type.ts`,
응답으로 나가지 않는 파싱 내부 타입은 `projects/utils/spec.type.ts`로 가른다.
경계의 근거는 09의 spec-extractor 절 참고.
