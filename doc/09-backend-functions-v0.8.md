# 백엔드 기능 정의서

| 버전 | 일시                 | 변경 내용                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ---- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| v0.1 | 2026.07.08 WED 09:08 | 컨트롤러 포함 상세본. 스펙 커밋 구조 확정 반영(applySpecCommit 공용 tx 헬퍼, createProject·commitSpec가 각자 트랜잭션 열고 호출, updateProject는 tryItBaseUrl만·커밋 없음, 스펙 URL 저장·refetch는 POST /spec-commits, 프로젝트 메타는 extractSpecInfo 유틸+라우트 인라인 write) + 엔드포인트 목록 경량화(findEndpoints·ProjectView.endpoints를 EndpointSummary[]로, operationJson은 상세에서만)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| v0.2 | 2026.07.09 THU 08:41 | 댓글 보기용 데이터 타입 정의 추가                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| v0.3 | 2026.07.13 MON 11:02 | 멤버 API 시그니처 축소(removeMember·findMembers에서 미사용 인자 제거 — 인가는 MembershipGuard가 처리), CommentView·NotificationView 시간 필드 Date → string(응답 직렬화 기준), SummaryInput은 서버 내부 타입이므로 Date 유지                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| v0.4 | 2026.07.16 THU 00:05 | 가드가 역참조한 projectId를 서비스가 재사용하도록 시그니처 정리. createComment·createReply·toggleReaction에 projectId 인자 추가(@CurrentProjectId 주입), findEndpointDetail·moveThread에서 미사용 userId/ownerId 제거(인가는 MembershipGuard 전담). @CurrentProjectId 커스텀 데코레이터 추가. moveThread 스레드 이동 실패 케이스 400 통일 반영(ForbiddenException → BadRequestException). updateProject·softDeleteProject 시그니처에서 미사용 userId 제거(코드 반영분 문서 동기화).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| v0.5 | 2026.07.21 TUE 00:00 | syncMemberMentions 시그니처에 senderId 추가(4인자, 알림 발신자), sync 계열 주석을 "검증된 id만 받음·전량 교체·신규분만 알림"으로 정정. summarizeThread 시그니처 (actorUserId, endpointId) → (endpointId, projectId). CommentView에 isAiGenerated 추가. SummaryInput.createdAt Date → string(다른 뷰 타입과 통일해 개발자 인식 편의). toggleReaction 서비스 시그니처 정의에 projectId 반영(v0.4 라우트표엔 있었으나 정의 줄 누락분). updateComment 주석 content만 → content 및 멘션 수정 가능. CreateNotificationDto에 senderId 추가(코드·10 명세 Notification 원형·syncMemberMentions senderId와 정합). users.service 반환타입 User → PublicUser 정정(정의 블록 누락분, password 제외 반영). findByEmail 주석에 AI 계정 제외 명시.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| v0.6 | 2026.07.27 MON       | **코드 실측 대조 반영.** `GET /api/users/me`(`findMe`) 신설 — 구현 완료분이 누락돼 있었다. `findMe`는 `findById`를 감싸 null이면 `UnauthorizedException`(401)을 던진다(조회와 throw 판단 분리, 컨트롤러는 순수 위임). **댓글 이동을 엔드포인트 단위로 전환**(FR-12 v0.7) — `moveThread(commentId, dto)` → `moveComments(endpointId, projectId, dto)`, 라우트 `PATCH /api/comments/:id/move` → `PATCH /api/endpoints/:id/comments/move`, 소속 컨트롤러도 comments → **endpoints**로 이동(`:id`가 endpointId라 `@ProjectScope('endpoint')`가 필요). 대댓글 단독 이동 개념이 사라져 관련 400 조항 삭제. `updateComment`/`softDeleteComment`에 **이미 삭제된 댓글 400** 추가. `updateComment`의 `projectId` 확보 경로(comment 행 self-lookup) 명시. AI 요약 답글 차단이 `normalizeReply` 내부임을 명시. **`findMembers` 반환을 `MemberView[]`로 전환** — Prisma `Membership` 원형에는 `userName`이 없어 프론트 멤버 칩과 멘션 후보를 그릴 수 없었다. `select`로 `role` + `user`만 뽑는다. `inviteMember`/`removeMember`/`getMembership`은 원형 유지. **`UserRef` / `EndpointRef` 경량 참조 타입 신설** — `CommentView`의 멘션 두 필드가 인라인 익명 타입이었는데 `ReactionSummary.users`가 같은 모양을 쓰게 되어 이름을 붙였다. `MemberMention`이 아닌 이유는 리액션을 남긴 사람이 멘션된 사람이 아니기 때문이다. `ReactionSummary`에 **`users` 추가**(리액션을 남긴 사람 목록) — findComments 의 reactions include 를 최상위·replies 양쪽에서 user 포함으로 바꾸고 summarizeReactions 가 적재한다. `MemberView` 정의 위치를 `projects/projects.type.ts`로 명시. findComments·summarizeReactions 서술 보강. **`ai-summary.service.ts`·`ai.service.ts` 절 보강** — 이전 AI 요약을 수집 대상에서 제외, 댓글 0건 400, AI 호출 실패는 받은 에러를 그대로 재던짐(400 변환 금지), `findAiUser` 부재는 500. — 필수 환경변수 3종과 생성자에서 던지는 동작(미설정 시 앱 부팅 실패), 모델 파라미터, 실패 시 500 명시. |
| v0.7 | 2026.08.13 THU       | **스냅샷 지정 조회 도입.** `findEndpointDetail(endpointId, projectId, requestedSnapshotId?)` — 요청 스냅샷이 최신보다 낮으면 `SpecSnapshot.rawJson`에서 operation을 꺼내 응답 전체를 그 버전으로 맞춘다(FR-10.6). `projectId`는 `@CurrentProjectId` 주입 — 가드가 검증한 값으로 스냅샷 조회를 스코프해야 타 프로젝트 스펙 열람이 막힌다. **`getSnapshotJson(projectId, snapshotId)` 신설**(projects 소유, endpoints가 주입해 사용), **`extractOperation(rawJson, path, method)` 신설**(spec-extractor). `EndpointDetail.snapshotId`를 "이 응답이 나온 스냅샷"으로 재정의하고 배너 판정용 최신값은 **`latestSnapshotId`로 분리**. 그 스냅샷에 없는 엔드포인트는 404 `NOT_IN_SNAPSHOT`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| v0.8 | 2026.08.15 SAT       | **스펙 조회를 스냅샷 단위 단일 응답으로 재편.** `findProject`를 **`findProjectMeta`**(설정, 권한, `latestSnapshotId` — 폴링 대상이라 커밋으로 바뀌는 필드 없음)와 **`findSpec(projectId, snapshotId?)`**(한 스냅샷의 전부 — info 메타, components, 전체 operation)로 분리. `findSpec`의 operations는 `Endpoint` 행을 순회하며 요청 스냅샷과 조인해 조립한다 — 산 것은 스냅샷에서, 삭제분은 행에 남은 마지막 생존 시점 백업에서. **`Endpoint` 스펙 사본(operationJson, operationId, summary, tags)의 의미 재정의** — "최신 캐시"가 아니라 **삭제 대비 백업**이다. 살아 있는 동안 매 커밋 덮어써지다 삭제되면 마지막 값으로 얼어붙고, 산 것을 조회할 때는 아무도 읽지 않는다. **endpoints 모듈 삭제**(`findEndpointDetail`, `EndpointDetail`, `extractOperation` 제거) — 상세 조회가 spec 응답에 흡수됐다. **`extractSnapshotContent`, `key()` 신설**(spec-extractor) — 조인 키를 한 함수로 통일해 만드는 쪽과 찾는 쪽이 갈리는 버그를 구조로 막는다. `createProject`/`updateProject` 반환을 `ProjectMeta`로, `updateProject(userId, ...)` 시그니처 변경(role 조회에 필요), `commitSpec`에서 미사용 `userId` 제거. `SpecSnapshot`에 `@@index([projectId, id])` — 메타 폴링이 `getLatestSnapshotVersion`을 상시 돌리므로 필요해졌다. compression 미들웨어 추가.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |

---

## 0. 표기

- 함수명·DTO명·라우트는 신규 설계 제안값(팀 리뷰 대상).
- DTO는 NestJS CRUD 관례(`Create~Dto` / `Update~Dto`).

- enum(`ROLE`/`REACTION_TYPE`/`NOTIFICATION_TYPE`)은 `@prisma/client` 생성분 재사용.
- 라우트 전부 `/api` prefix. Owner 전용은 `[Owner]`. 인증 필요 라우트에 `JwtAuthGuard`, 프로젝트 스코프 라우트에 추가로 `MembershipGuard` 적용(개별 시그니처엔 생략).
- 가입은 `users`, 로그인은 `auth`가 담당하며 완전 분리(가입 시 토큰 미발급).
- JWT는 프론트에서 localStorage에 15일간 저장(기능요구사항 아닌 정의서 레벨 기재).

### 공통 타입

```tsx
enum ROLE {
  OWNER,
  MEMBER,
}
enum REACTION_TYPE {
  DONE,
  CHECKING,
  BEST,
  ACK,
}
enum NOTIFICATION_TYPE {
  INVITED,
  MENTIONED,
}

type AuthUser = { id: number; email: string };
// JwtStrategy.validate → req.user

type PublicUser = { id: number; userName: string; email: string };
```

---

## 1. `auth/` — 로그인·인증

### 컨트롤러 auth.controller.ts

| 라우트                 | 함수         | 입력       | 출력                                |
| ---------------------- | ------------ | ---------- | ----------------------------------- |
| `POST /api/auth/login` | `login(dto)` | `LoginDto` | `Promise<{ access_token: string }>` |

### 서비스 auth.service.ts

```tsx
login(dto: LoginDto): Promise<{ access_token: string }>
// email(@unique) 조회 → 없으면 UnauthorizedException
//   → bcrypt.compare 실패 시 UnauthorizedException
//   → payload { sub: user.id, email } 로 jwtService.sign
```

### strategies/jwt.strategy.ts

```tsx
validate(payload: JwtPayload): { id: number; email: string }
// req.user 주입, 전역 role 없음
```

### guards/jwt-auth.guard.ts

```tsx
class JwtAuthGuard extends AuthGuard('jwt') {}
// 인증(로그인)만 처리 → auth 소유
```

- DTO: `LoginDto`
- 타입: `JwtPayload = { sub: number; email: string }`

---

## 2. `users/` — 유저 C·R (가입 포함)

### 컨트롤러 users.controller.ts

| 라우트                         | 함수                 | 입력                | 출력                          |
| ------------------------------ | -------------------- | ------------------- | ----------------------------- |
| `POST /api/users`              | `createUser(dto)`    | `CreateUserDto`     | `Promise<PublicUser>`         |
| `GET /api/users/search?email=` | `findByEmail(email)` | `string` (완전일치) | `Promise<PublicUser \| null>` |
| `GET /api/users/me`            | `findMe(user)`       | `AuthUser`          | `Promise<PublicUser>`         |

### 서비스 users.service.ts

```tsx
createUser(dto: CreateUserDto): Promise<PublicUser>
// 가입: 이메일 중복 거부 + bcrypt 해시. 토큰 미발급 (password 제외 PublicUser 반환)

findByEmail(email: string): Promise<PublicUser | null>
// 초대용 완전일치. AI 계정(isAi=true)은 초대 대상 아니므로 제외 (검색되지 않음)

findById(id: number): Promise<PublicUser | null>
// 내부 전용 조회. 없으면 null. throw 판단은 호출부가 한다

findMe(id: number): Promise<PublicUser>
// findById 를 부르고 null 이면 UnauthorizedException(401)
// 토큰이 유효한데 그 유저가 없다는 것은 리소스 미발견이 아니라
// 그 토큰이 더 이상 누구도 식별하지 못한다는 뜻이다 → 404 가 아니라 401
```

- DTO: `CreateUserDto`
- **`findMe`가 `findById`를 감싸는 이유** — 조회와 throw 판단을 갈라 두면
  `findById` 는 "있으면 쓰고 없으면 넘어가는" 다른 호출부에서 그대로 재사용된다.
  컨트롤러는 순수 위임만 하고 예외를 던지지 않는다(이 코드베이스 전체 규약).
- 로그인 응답이 `{ access_token }`뿐이고 `JwtPayload`에 `userName`이 없어,
  프론트가 유저 이름을 얻을 경로가 이것뿐이다. 새로고침 시 토큰 유효성 검증도 겸한다.
- **`jwt.strategy.ts`의 `validate()`에서 유저 존재를 확인하지 않는다.** 그러면 모든 인증
  라우트에 DB 조회가 한 번씩 붙는다. 얻는 것은 삭제된 유저의 토큰 차단인데
  이 시스템에는 유저 삭제 기능이 없다. 값이 없어 채택하지 않는다.

---

## 3. `projects/` — 프로젝트·멤버십·스펙 커밋

### 컨트롤러 projects.controller.ts

| 라우트                                               | 함수                           | 입력                                        | 출력                        |
| ---------------------------------------------------- | ------------------------------ | ------------------------------------------- | --------------------------- |
| `POST /api/projects`                                 | `createProject(user, dto)`     | `AuthUser`, `CreateProjectDto`              | `Promise<ProjectMeta>`      |
| `GET /api/projects`                                  | `findMyProjects(user)`         | `AuthUser`                                  | `Promise<ProjectSummary[]>` |
| `GET /api/projects/:id`                              | `findProjectMeta(user, id)`    | `AuthUser`, `number`                        | `Promise<ProjectMeta>`      |
| `GET /api/projects/:id/spec`                         | `findSpec(id, snapshotId?)`    | `number`, `number?`                         | `Promise<Spec>`             |
| `PATCH /api/projects/:id` `[Owner]`                  | `updateProject(user, id, dto)` | `AuthUser`, `number`, `UpdateProjectDto`    | `Promise<ProjectMeta>`      |
| `DELETE /api/projects/:id` `[Owner]`                 | `softDeleteProject(id)`        | `number`                                    | `Promise<void>`             |
| `POST /api/projects/:id/spec-commits` `[Owner]`      | `commitSpec(id, dto)`          | `number`, `CommitSpecDto`                   | `Promise<SpecCommitResult>` |
| `POST /api/projects/:id/members` `[Owner]`           | `inviteMember(user, id, dto)`  | `AuthUser`, `number`, `CreateMembershipDto` | `Promise<Membership>`       |
| `DELETE /api/projects/:id/members/:userId` `[Owner]` | `removeMember(id, userId)`     | `number`, `number`                          | `Promise<Membership>`       |
| `GET /api/projects/:id/members`                      | `findMembers(id)`              | `number`                                    | `Promise<Membership[]>`     |

> `findSpec`의 `snapshotId`는 `@Query('snapshotId', new ParseIntPipe({ optional: true }))`.
> Swagger 플러그인이 메서드 파라미터의 optional을 못 읽으므로 `@ApiQuery({ required: false })`를 명시한다.

### 서비스 projects.service.ts

```tsx
createProject(ownerId: number, dto: CreateProjectDto): Promise<ProjectMeta>
// [트랜잭션 밖]
//   1. loadSpec(dto.specJsonUrl)
//          → 실패(!ok)시 code별 BadRequestException throw
//          → 성공 시 rawJson, oas
//   2. extractEndpoints(rawJson)   → extracted
//   3. extractSpecInfo(rawJson)    → 메타(title/description/version)
// [트랜잭션]
//   4. 프로젝트 생성 (메타를 인라인으로 대입)
//   5. Owner 멤버십 생성
//   6. applySpecCommit(tx, projectId, extracted, rawJson)
// 반환은 findProjectMeta 재사용 — 프론트는 생성 응답에서 이동용 id만 읽는다.
// 진입 화면이 meta와 spec을 각자 받아오므로 스펙 전체를 돌려줄 이유가 없다.

commitSpec(projectId: number, dto: CommitSpecDto): Promise<SpecCommitResult>
// userId를 받지 않는다 — 인가는 가드 전담이고 작성자 기록도 없다(v0.8).
// POST /spec-commits 라우트.
// specJsonUrl 변경 여부와 상관없이 사용자가 "Spec Update" 버튼을 누르면 실행되는 라우트입니다.
// 전체 프로젝트에서 앞으로 이 행위를 "spec update", 또는 "스펙 업데이트" 라고 부른다.
// [트랜잭션 밖]
//   1. url = dto.specJsonUrl ?? project.specJsonUrl
//   2. loadSpec(url)
//          → 실패(!ok)시 code별 BadRequestException throw
//          → 성공 시 rawJson, oas
//   3. extractEndpoints(rawJson)   → extracted
//   4. extractSpecInfo(rawJson)    → 메타
// [트랜잭션]
//   5. 프로젝트 메타 update (메타를 인라인으로 대입)
//   6. applySpecCommit(tx, projectId, extracted, rawJson)

findMyProjects(userId: number): Promise<ProjectSummary[]>

findProjectMeta(userId: number, projectId: number): Promise<ProjectMeta>
// 스펙 버전과 무관한 것만 담는다(설정, 권한, latestSnapshotId).
// 프론트가 30초 폴링해 배너를 판정하므로 가볍게 유지한다.
// userId는 role 조회용 — 가드가 멤버십은 검증했지만 응답에 role이 필요하다.

findSpec(projectId: number, requestedSnapshotId?: number): Promise<Spec>
// 한 스냅샷의 전부. 없거나 최신 이상이면 최신으로 클램프.
// getSnapshotJson → extractSnapshotContent → Endpoint 행 순회 조인:
//   - 스냅샷에 있음        → 산 것. 내용은 스냅샷, id는 행. isDeleted: false
//   - 없고 행이 isDeleted  → 삭제분. 행에 남은 마지막 생존 시점 값(백업)
//   - 없고 행이 살아 있음   → 그 버전에 아직 없던 것. 목록에서 제외
// 조인 키는 key() 하나를 거친다 — 만드는 쪽과 찾는 쪽이 다른 형태로
// 조립하면 전부 miss가 되므로.

updateProject(userId: number, projectId: number, dto: UpdateProjectDto): Promise<ProjectMeta>
// Owner만 권한을 가짐. tryItBaseUrl 수정할 때에 타는 라우트. 커밋 없음.
// 반환은 findProjectMeta 재사용 — role 하드코딩을 없애고 응답 조립처를 한 곳으로.

softDeleteProject(projectId: number): Promise<void>
// 소프트 딜리트 : isDeleted = true

private applySpecCommit(tx: Prisma.TransactionClient, projectId: number, extracted: ExtractedEndpoint[], rawJson: Prisma.InputJsonValue): Promise<SpecCommitResult>
// 스냅샷 append (createSnapshot) + 엔드포인트 upsert (syncEndpoints)
// createProject, commitSpec에서 공용으로 사용하는 tx 헬퍼 (트랜잭션 열지 않음)
// { snapshotId, diff }를 SpecCommitResult에 담아서 반환

private createSnapshot(tx: Prisma.TransactionClient, projectId: number, rawJson: Prisma.InputJsonValue): Promise<number>
// 생성한 스냅샷의 id만 반환(호출부 applySpecCommit이 snapshotId만 사용)

private syncEndpoints(tx: Prisma.TransactionClient, projectId: number, extracted: ExtractedEndpoint[]): Promise<EndpointDiff>
// upsert + 소프트 삭제 + 간략한 카운트 정도만 담긴 diff 반환

getLatestSnapshotVersion(projectId: number): Promise<number>
// 최신 SpecSnapshot.id. projects 소유 확정(스냅샷 도메인). endpoints는 projectsService 주입으로 사용

getSnapshotJson(projectId: number, snapshotId: number): Promise<unknown>
// 특정 SpecSnapshot.rawJson. 없으면 null. findSpec 전용(v0.8).
// where 에 projectId 를 함께 건다 — 가드는 URL 의 :id(프로젝트)만 검증하고
// 쿼리 파라미터는 지키지 못하므로, id 단독 조회를 두면 임의의 snapshotId 로
// 타 프로젝트 스펙 전문을 읽는 경로가 열린다.
// 클라이언트가 보낸 값이 틀릴 수 있는 자리라 던지지 않고 null 을 낸다
// (getLatestSnapshotVersion 은 스냅샷 부재가 불변식 위반이라 방어적으로 던진다).
```

### 서비스 memberships.service.ts

```tsx
inviteMember(ownerId: number, projectId: number, dto: CreateMembershipDto): Promise<Membership>
// 신규 멤버쉽 생성 또는 isDeleted 멤버 부활 + INVITED 알림 생성
// [OWNER] 권한
// 반환값에 쓰인 Membership type 은 프리즈마에서 정의된 모델을 그대로 써도된다.
// 아래 메소드 들도 마찬가지.

removeMember(projectId: number, targetUserId: number): Promise<Membership>
// isDeleted = true
// [OWNER] 권한

findMembers(projectId: number): Promise<MemberView[]>
// isDeleted=false 인 멤버십만 반환. 제외된 멤버는 목록에 오지 않는다.
// select 로 role + user 만 뽑아 Prisma 결과가 곧 MemberView 가 되게 한다(매핑 코드 불필요).
// include 를 쓰면 Membership 전체가 딸려와 프론트가 안 쓰는 필드가 남는다.
// 프로젝트에 포함된 멤버 검색 (설정 화면 멤버 칩, 댓글 멤버멘션 후보)

getMembership(userId: number, projectId: number): Promise<Membership | null>  // 가드가 이 메소드를 호출해, 그 반환값으로 접근 권한을 검증
```

**`findMembers`만 `MemberView`를 쓴다.**

- `inviteMember` / `removeMember` — `Membership` 원형 유지. 프론트는 변경 후 목록을
  재조회하므로 응답에 이름이 필요 없다(mutation 후 재조회 원칙).
- `getMembership` — 가드가 `role`과 `isDeleted`를 보므로 원형이 맞다.

**`MemberView`가 `Membership & { user: PublicUser }`가 아닌 이유** — 그 교집합은 6필드 중
4개(`id`, `projectId`, `userId`, `isDeleted`, `createdAt`)가 프론트에서 쓰이지 않는다.
`projectId`는 URL(`/projects/:projectId/settings`)이 이미 갖고 있어 응답에 또 담으면
같은 값의 출처가 둘이 된다. `userId`는 `user.id`와 중복이고, `isDeleted`는 쿼리가
이미 걸러 항상 `false`다. `CommentView` / `NotificationView`와 같은 판단이다 —
Prisma 원형이 화면과 안 맞으면 뷰 타입을 따로 만든다.

### utils/spec-loader.ts

```tsx
loadSpec(url: string): Promise<SpecResult>
// fetch → validate → OAS버전 확정, $ref 보존
```

### utils/spec-extractor.ts

```tsx
extractSpecInfo(rawJson: SpecDocument): SpecInfo
// info.* + openapi → 프로젝트 필드(FR-1.9)

extractEndpoints(rawJson: SpecDocument): ExtractedEndpoint[]
// endpoint 목록 추출

extractSnapshotContent(rawJson: unknown): SnapshotContent | null
// 스냅샷 rawJson 에서 Spec 조립 재료(info, components, 전체 operation Map)를
// 한 번에 꺼낸다. extractEndpoints 와 달리 SpecDocument 를 받지 않는다 —
// 거기는 validate 를 통과해 메모리에 올라온 spec 을 받지만,
// 여기는 디비에서 읽은 값이라 구조가 보장되지 않는다.
// 검증 통과분만 저장되므로 형태는 맞겠지만
// 그것은 저장할 때 지킨 규칙이지 읽어온 값의 타입이 보장되는 것이 아니다.
// isObject 로 한 단계씩 좁혀간다.

key(path: string, method: string): string
// Endpoint 동일성 키. 만드는 쪽(extractSnapshotContent)과 찾는 쪽
// (findSpec, syncEndpoints)이 서로 다른 형태로 조립하면 조인이 전부
// miss 가 되므로, 반드시 이 함수를 거친다.
```

- DTO: `CreateProjectDto`, `UpdateProjectDto`, `CommitSpecDto`, `CreateMembershipDto`

---

## 4. `endpoints/` — 모듈 없음 (v0.8에서 삭제)

엔드포인트 단독 조회가 spec 응답에 흡수되면서 이 모듈의 존재 이유가 사라졌다.
`findEndpointDetail`, `EndpointDetail`, `extractOperation`, 모듈 네 파일 전부 삭제.

**`Endpoint` 테이블과 도메인은 남는다** — 댓글 앵커(버전을 관통하는 id)와
삭제 대비 백업이 역할이다. `syncEndpoints`(projects 소유)가 계속 관리한다.
스펙 사본(operationJson, operationId, summary, tags)은 살아 있는 동안
매 커밋 덮어써지다가, 삭제되면 마지막 생존 시점 값으로 얼어붙는다.
산 것을 조회할 때는 아무도 이 사본을 읽지 않는다 — 산 것의 유일한 출처는
`SpecSnapshot.rawJson`이다. 그래서 한 엔드포인트의 출처가 상태(생존/삭제)로
유일하게 정해지고, 한 응답 안에서 버전이 갈릴 경로가 없다.

`/api/endpoints/:id/...` 경로는 댓글 계열 라우트(5장)가 계속 쓴다 —
`@ProjectScope('endpoint')` 역참조는 가드(common) 소관이라 이 변경과 무관하다.

---

## 5. `comments/` — 댓글·대댓글·리액션·멘션·AI요약

### 컨트롤러 comments.controller.ts

| 라우트                                             | 함수                                              | 입력                                                | 출력                        |
| -------------------------------------------------- | ------------------------------------------------- | --------------------------------------------------- | --------------------------- |
| `GET /api/endpoints/:id/comments`                  | `findComments(user, endpointId)`                  | `AuthUser`, `number`                                | `Promise<CommentTree[]>`    |
| `POST /api/endpoints/:id/comments`                 | `createComment(user, endpointId, projectId, dto)` | `AuthUser`, `number`, `number`, `CreateCommentDto`  | `Promise<Comment>`          |
| `POST /api/comments/:id/replies`                   | `createReply(user, parentId, projectId, dto)`     | `AuthUser`, `number`, `number`, `CreateCommentDto`  | `Promise<Comment>`          |
| `PATCH /api/comments/:id`                          | `updateComment(user, id, dto)`                    | `AuthUser`, `number`, `UpdateCommentDto`            | `Promise<Comment>`          |
| `DELETE /api/comments/:id`                         | `softDeleteComment(user, id)`                     | `AuthUser`, `number`                                | `Promise<Comment>`          |
| `POST /api/comments/:id/reactions`                 | `toggleReaction(user, commentId, projectId, dto)` | `AuthUser`, `number`, `number`, `CreateReactionDto` | `Promise<Reaction \| null>` |
| `POST /api/endpoints/:id/ai-summary`               | `summarizeThread(endpointId, projectId)`          | `number`, `number`                                  | `Promise<Comment>`          |
| `PATCH /api/endpoints/:id/comments/move` `[Owner]` | `moveComments(endpointId, projectId, dto)`        | `number`, `number`, `MoveCommentDto`                | `Promise<void>`             |

> `MoveCommentDto`는 `comments/dto/`에 있다. `:id`가 endpointId라 `@ProjectScope('endpoint')`를 쓴다 — `findComments`/`createComment`/`summarizeThread`와 같다.

### 서비스 comments.service.ts

```tsx
createComment(userId, endpointId, projectId, dto: CreateCommentDto): Promise<Comment>
// 1뎁스 커멘트 생성 : parentId = null
// 멘션 기능은 1)syncMemberMentions, syncEndpointMentions에서 담당하며
// 2)입력한 댓글 내용을 날릴 위험성 때문에 트랜잭션으로 묶지 않는다.

createReply(userId, parentId, projectId, dto: CreateCommentDto): Promise<Comment>
// 2뎁스 커멘트 생성
// normalizeReply() 먼저 실행하여, parentId를 뎁스에 맞게 정규화하며,
// 해당 부모 commnet의 endpointId도 받아옴.
// 멘션 기능은 1)syncMemberMentions, syncEndpointMentions에서 담당하며
// 2)입력한 댓글 내용을 날릴 위험성 때문에 트랜잭션으로 묶지 않는다.

updateComment(userId, commentId, dto: UpdateCommentDto): Promise<Comment>
// [작성자 본인] 권한
// content 및 멘션 수정 가능 (content 변경 시 멘션도 재동기화 — resolveMentions + sync 계열 호출)
// 1. comment 조회 → 없으면 404, 이미 isDeleted 면 400
// 2. assertAuthor → 3. resolveMentions → 4. content update → 5. sync 계열
// projectId 는 주입받지 않는다 — 1의 comment 행에서 함께 확보한다(self-lookup).
// Comment 가 projectId 를 직접 갖고 있어 추가 조인이 필요 없다.

softDeleteComment(userId, commentId): Promise<Comment>
// [작성자 본인] 권한
// comment 조회 → 없으면 404, 이미 isDeleted 면 400 → assertAuthor → isDeleted = true
// 반환 직전 content 를 DELETED_COMMENT_TEXT 로 갈아끼워 마스킹한다(0-7).
// DB 의 content 는 건드리지 않는다 — 응답 객체만 바꾼다.

findComments(userId, endpointId): Promise<CommentTree[]>
// 전체 댓글 목록 반환 (삭제 포함 — 자리를 지킨다, FR-5.3)
// 삭제된 댓글은 원문을 "삭제된 글입니다"등의 문구로 마스킹하여 프론트에다가 전달해 줌
// 최상위만 조회하고 replies 를 중첩 include 한다. 양쪽 다 createdAt asc.
// **reactions 는 user.userName 을 함께 include 한다** — ReactionSummary.users 를 채운다.
//   reactions: { include: { user: { select: { userName: true } } } }
//   최상위와 replies 두 군데 모두 바꿔야 한다. 한쪽만 고치면 그쪽 react.user 가
//   undefined 라 summarizeReactions 에서 터진다.
//   user 에서 id 는 안 가져온다 — Reaction 이 FK 로 userId 를 이미 갖고 있다.
//   가져오면 react.userId 와 react.user.id 가 같은 값으로 둘이 되어 헷갈린다.

private summarizeReactions(currUserId, reactions): ReactionSummary[]
// 타입별로 묶어 count 누적, 본인 여부 판정, users 배열에 { userId, userName } 적재
// 인자 타입은 인라인이다 — (Reaction & { user: { userName: string } })[]
//   선언 한 곳에서만 쓰이고 호출부는 구조분해라 이름을 붙일 값이 없다.
//   userId 는 react.userId(Reaction FK), userName 은 react.user.userName 에서 온다.
//   Prisma 조회 모양(입력)과 응답 뷰 모양(출력)이 갈리는 경계가 이 함수다 —
//   UserRef 를 입력 타입으로 쓰려 하면 변환할 대상이 사라진다.

moveComments(endpointId, projectId, dto: MoveCommentDto): Promise<void>
// [Owner] 권한.
// 이동 단위는 스레드가 아니라 엔드포인트다 — 그 엔드포인트의 댓글 전량이 함께 옮겨진다(FR-12).
//  1. targetEndpoint 조회 — 아래 셋 모두 BadRequest(400) 로 통일
//     - 없음 / isDeleted / projectId 불일치(다른 프로젝트 소속)
//     400 하나로 뭉개는 이유: 404 로 구분하면 endpointId 열거가 가능 → 리소스 은닉
//  2. updateMany({ where: { endpointId, projectId } }) 로 일괄 갱신
//     최상위와 대댓글을 가리지 않는다. parentId 판정이 불필요해졌다.
// 단일 updateMany 라 트랜잭션으로 묶지 않는다.
// 옮길 댓글이 0건이어도 에러가 아니다(updateMany 가 count 0 을 반환할 뿐).

private assertAuthor(comment: Comment, userId: number): void
// update, softDelete 공용
// 이미 호출부에서 조회한 Comment 객체를 통째로 전달받아 이 함수 내부에서 글쓴이 Id를 추출해서 userId와 비교한다.

private normalizeReply(parentId: number): Promise<ReplyParent>
// parentId 정규화: 넘어온 parentId가 이미 대댓글이면 최상위 parentId로 덮어쓴다.(FR-6.2)
// 정규화된 parentId의 endpointId를 함께 반환
// 1. parent 조회 (parent 관계와 user.isAi 를 함께 include)
// 2. 없으면 404
// 3. 승격 후에도 top.parentId != null 이면 2뎁스 불변식 위반 → 500 (방어적 단정)
// 4. **AI 요약 답글 차단은 여기서 한다** — top.user.isAi 면 400 (FR-13.5)
//    createReply 본문이 아니라 이 함수인 이유: 승격된 실제 최상위를 봐야 하기 때문이다.
//    사용자가 대댓글에 답글을 달아도 승격 후 부모가 AI 면 막혀야 한다.
```

### 서비스 reactions.service.ts

```tsx
toggleReaction(userId, commentId, projectId, dto: CreateReactionDto): Promise<Reaction | null>
// @@unique 존재 시 제거, 없으면 생성
// projectId 는 @CurrentProjectId 주입값 (Reaction.projectId 비정규화 컬럼에 저장)
```

### 서비스 mentions.service.ts (내부 호출, DTO 없음)

```tsx
syncMemberMentions(senderId, commentId, projectId, mentionedUserIds: number[]): Promise<void>
// 호출부에서 검증된 id 만 받음. 기존 멘션 전량 교체, 신규 추가분에만 MENTIONED 알림
// senderId 는 알림 발신자(누가 멘션했는지)

syncEndpointMentions(commentId, projectId, mentionedEndpointIds: number[]): Promise<void>
// 호출부에서 검증된 id 만 받음. 기존 멘션 전량 교체 (엔드포인트 멘션은 알림 없음 → senderId 불필요)
```

### 서비스 ai-summary.service.ts (DTO 없음)

```tsx
summarizeThread(endpointId, projectId): Promise<Comment>
// 1. findAiUser() 로 AI 계정 확보
// 2. 해당 endpoint 의 댓글 수집 — 시간순(asc), author 는 user.userName 조인
//    제외 조건 둘: isDeleted, 그리고 **AI 계정이 쓴 댓글**
//    0건이면 400 ('요약할 댓글이 없습니다.')
// 3. SummaryInput[] 조립 — createdAt 은 toISOString() (string)
// 4. aiService.generateSummary(inputs) 호출.
//    실패하면 로깅만 하고 **받은 에러를 그대로 재던진다**(코드 변환 금지)
// 5. AI 계정 명의로 최상위 댓글(parentId = null) 생성해서 반환
// 트랜잭션으로 묶지 않는다 — 실패해도 요약 댓글이 안 생길 뿐 남는 게 없다

private findAiUser(): Promise<User>
// 시드된 전역 AI 계정(User.isAi = true). 없으면 500
```

**이전 AI 요약을 입력에서 뺀다** (`userId: { not: aiUser.id }`)

같은 스레드를 두 번 요약하면 첫 요약이 댓글로 남아 있다. 그대로 넣으면 요약의 요약이
되어 회차가 쌓일수록 원문에서 멀어진다. AI 요약은 매번 **원본 댓글만** 보고 새로 만든다.

**AI 호출 실패는 코드를 바꾸지 않는다**

`ai.service`가 던진 `InternalServerErrorException`(500)을 그대로 통과시킨다.
400으로 덮으면 세 가지가 어긋난다.

- 의미가 뒤집힌다. 400은 "요청이 잘못됐다"인데 Azure 장애나 타임아웃은 서버 사정이고
  사용자가 고칠 것이 없다.
- 프론트에 재시도 신호가 안 간다. 400을 받으면 입력을 고치라고 안내하게 되는데
  실제로는 다시 누르면 되는 경우가 많다.
- 0-4 상태코드 규약("검증 실패 / 잘못된 요청 → 400")과 충돌한다.

`fetch` 자체가 실패해 `HttpException`이 아닌 예외가 올라오는 경우도 그대로 던진다.
NestJS 기본 필터가 500으로 변환한다.

**`findAiUser` 없음은 500이다**

시드되지 않은 환경은 서버 구성 문제이지 요청의 문제가 아니다. `createProject` 가 항상
스냅샷을 만들어 `getLatestSnapshotVersion` 의 부재를 방어적 단정으로 처리한 것과 같은
판단이다. 메시지에 `npx prisma db seed` 안내를 남겨 팀원이 바로 고칠 수 있게 한다.

- DTO: `CreateCommentDto`, `UpdateCommentDto`, `MoveCommentDto`, `CreateReactionDto`

---

## 6. `ai/` — 외부 AI 클라이언트 (DTO 없음)

### 서비스 ai.service.ts

```tsx
generateSummary(thread: SummaryInput[]): Promise<string>
// SummaryInput[] → 프롬프트 문자열 조립 → Azure AI Foundry chat/completions 호출
// → 응답에서 요약 문자열만 뽑아 trim 후 반환

private buildPrompt(thread: SummaryInput[]): string
// `[createdAt] author: content` 를 줄바꿈으로 이어붙인다.
// createdAt 이 string 이라 그대로 끼워 넣는다(SummaryInput 정의 참고).
```

**필수 환경변수** — 셋 중 하나라도 없으면 **생성자가 던진다.**

| 변수                       | 용도                 |
| -------------------------- | -------------------- |
| `AZURE_AI_ENDPOINT`        | 리소스 엔드포인트    |
| `AZURE_AI_API_KEY`         | `api-key` 헤더 값    |
| `AZURE_AI_DEPLOYMENT_NAME` | 요청 body 의 `model` |

- **배포 시 주의**: 생성자에서 던지므로 환경변수가 없으면 AI 기능만이 아니라
  **애플리케이션 자체가 부팅에 실패한다.** Azure App Service 구성에 세 값을
  반드시 넣어야 한다. 부분 실패가 아니라 전면 실패라 배포 체크리스트 항목이다.
- 호출 실패(`!response.ok`)와 빈 응답은 각각 `InternalServerErrorException`(500).
  즉 AI 요약 실패는 프론트에 500 으로 나간다. 사용자에게 보일 문구는 프론트가 정한다.

**모델 파라미터**

```
max_completion_tokens: 300
temperature: 0.3
```

요약이 길어지면 댓글 패널에서 스크롤을 많이 먹으므로 300 으로 묶었다.
시스템 프롬프트도 3문장 이내를 요구한다. `temperature` 를 낮게 둔 것은
요약이 매번 달라지면 같은 스레드를 두 번 요약했을 때 비교가 안 되기 때문이다.

---

## 7. `notifications/` — 초대·멘션 알림

### 컨트롤러 notifications.controller.ts

| 라우트                              | 함수                      | 입력                 | 출력                          |
| ----------------------------------- | ------------------------- | -------------------- | ----------------------------- |
| `GET /api/notifications`            | `findNotifications(user)` | `AuthUser`           | `Promise<NotificationView[]>` |
| `PATCH /api/notifications/:id/read` | `markAsRead(user, id)`    | `AuthUser`, `number` | `Promise<Notification>`       |

### 서비스 notifications.service.ts

```tsx
createNotification(dto: CreateNotificationDto): Promise<Notification>
// 타 서비스가 호출(초대/멘션)

findNotifications(userId: number): Promise<NotificationView[]>
// 라우팅 파생필드 채워 반환: INVITED는 invitedProjectId,
// MENTIONED는 mentionedCommentId 조인으로 projectId·endpointId 파생

markAsRead(userId: number, notificationId: number): Promise<Notification>
```

- DTO: `CreateNotificationDto`

---

## 8. `common/` — 공유 요소

### guards/

```tsx
class MembershipGuard implements CanActivate {
  // 프로젝트 스코프 접근 통제(공용 단일 가드)
  canActivate(context: ExecutionContext): Promise<boolean>;
  // userId(JWT) + projectId 확보 → getMembership → 없거나 isDeleted면 거부
  // projectId 확보 분기: (1) project 라우트는 :id가 곧 projectId (2) 그 외는 @ProjectScope(자원)로
  //   지정된 테이블에서 :id로 projectId 역참조 (3) 목록/생성 라우트는 가드 미적용
  // @ProjectRole(OWNER) 있으면 role 확인
  // @ProjectRole(OWNER) 있으면 role 확인
  // 확보한 projectId를 req.projectId에 실어 스코프 라우트 서비스가 재사용(@CurrentProjectId로 취득)
}
```

### decorators/

```tsx
CurrentUser(): ParameterDecorator
// req.user(AuthUser) 주입

CurrentProjectId(): ParameterDecorator
// req.projectId(number) 주입

ProjectRole(role: ROLE): MethodDecorator
// 라우트 요구 역할 메타데이터 (MembershipGuard가 Reflector로 읽어 role 검증)

ProjectScope(resource: ProjectScopeResource ): MethodDecorator
// 자원 타입 메타데이터. MembershipGuard가 읽어 어느 테이블에서 :id로 projectId를 역참조할지 결정
// SetMetadata 래퍼. common/decorators/project-scope.decorator.ts
```

### prisma/

```tsx
class PrismaService extends PrismaClient implements OnModuleInit {
  onModuleInit(): Promise<void>; // $connect
}
```

---

## 기타 타입 (반환·유틸)

```tsx
type SpecDocument = OpenAPIV3.Document | OpenAPIV3_1.Document;
// openapi-types. loadSpec 검증 통과 후 신뢰 가능

type SpecResult =
  | { ok: true; spec: SpecDocument; oas: string } // oas = 원본 버전 문자열("3.0.3")
  | { ok: false; code: 'INVALID_SPEC'; errors: string }
  | { ok: false; code: 'UNSUPPORTED_VERSION'; version: string }
  | { ok: false; code: 'SPEC_LOAD_ERROR'; error: string };

type SpecInfo = { title: string; description?: string; version: string };
// oasVersion은 loadSpec의 oas가 담당

type ExtractedEndpoint = {
  path: string;
  method: string;
  operationId?: string;
  summary?: string;
  tags: string[];
  operationJson: Prisma.InputJsonValue;
};

type EndpointDiff = {
  added: number;
  removed: number;
  updated: number;
  revived: number;
};
// 커밋 diff (일회성 반영, 저장 안 함) — 항목별 카운트만

type SpecCommitResult = { snapshotId: number; diff: EndpointDiff };

type ProjectSummary = {
  id: number;
  title: string;
  description: string | null;
  version: string;
  oasVersion: string;
  role: ROLE;
  isDeleted: boolean;
};

// 멤버 목록 응답 (GET /api/projects/:id/members) — projects/projects.type.ts
type MemberView = {
  user: PublicUser;
  role: ROLE;
};
// Prisma Membership 원형을 주지 않는다. 근거는 3절 memberships.service 참고.

// GET /api/projects/:id 응답 — 스펙 버전과 무관한 것만.
// 30초 폴링 대상이라, 커밋으로 바뀌는 필드가 실리면 앵커에 고정된 스펙 화면과 어긋난다
type ProjectMeta = {
  id: number;
  role: ROLE;
  specJsonUrl: string;
  tryItBaseUrl: string | null;
  latestSnapshotId: number; // 서버의 현재 최신 스냅샷. 배너 판정 전용(FR-10.6)
};

// Prisma에서 정의한 Membership 모델
// 이해를 위해 적어 둡니다. 프리즈마 문법으로 데이터 추가할 때 자동으로 형추론됩니다.
// type Membership = {
//   id: number; projectId: number; userId: number;
//   role: ROLE; isDeleted: boolean; createdAt: string;
// };

// Spec.operations 원소. id 는 Endpoint.id — 댓글 앵커, 라우팅에 쓴다
type SpecOperation = {
  id: number;
  path: string;
  method: string;
  summary: string | null;
  tags: string[];
  isDeleted: boolean;
  // 살아 있는 엔드포인트는 요청 스냅샷의 rawJson 에서,
  // 삭제된 엔드포인트는 Endpoint 행에 남은 마지막 생존 시점 값에서 온다
  operationJson: unknown;
};

// GET /api/projects/:id/spec 응답 — 한 스냅샷의 전부.
// 이 응답 하나가 화면의 스펙 내용 전체를 공급하므로, 필드 간 버전이 어긋날 수 없다
type Spec = {
  snapshotId: number; // 이 응답이 나온 스냅샷. ?snapshotId 가 없거나 최신 이상이면 최신
  title: string;
  version: string;
  oasVersion: string;
  description: string | null;
  components: unknown; // components JSON. 서버는 전달만 하고, 프론트가 캐싱 + 파싱
  operations: SpecOperation[];
};

// 파싱 내부 타입(utils/spec.type.ts) — 응답으로 나가지 않아 Map 을 쓸 수 있다
type SnapshotOperation = {
  path: string;
  method: string;
  summary: string | null;
  tags: string[];
  operationJson: Record<string, unknown>;
};
type SnapshotContent = {
  info: { title: string; version: string; description: string | null };
  oasVersion: string;
  components: unknown;
  operations: Map<string, SnapshotOperation>; // key(path, method) 를 키로 하는 Map
};

// Prisma에서 정의한 원형 Comment 모델
// 이해를 위해 적어 둡니다. 프리즈마 문법으로 데이터 추가할 때 자동으로 형추론됩니다.
// type Comment = {
//  id: number; endpointId: number; userId: number;
//  content: string; isDeleted: boolean; parentId: number | null;
//  projectId: number; createdAt: string; updatedAt: string;
//};

// 부모 댓글의 아이디를 1depth 아이디인지 정규화하고, 부모의 엔드포인트 아이디를 함께 반환하는 타입
type ReplyParent = { parentId: number; endpointId: number };

// Prisma에서 정의한 원형 Comment 모델
// 이해를 위해 적어 둡니다. 프리즈마 문법으로 데이터 추가할 때 자동으로 형추론됩니다.
// type Reaction = {
//   id: number; commentId: number; userId: number;
//   type: REACTION_TYPE; projectId: number; createdAt: string;
// };

// 리액션 정보 넘겨주는 타입
// 경량 참조 타입 — 이름만 필요한 자리에 쓴다
type UserRef = { userId: number; userName: string };
type EndpointRef = { endpointId: number; path: string; method: string };
// PublicUser 와 갈리는 지점: PublicUser 는 { id, userName, email } 로 '신원'이고,
// UserRef 는 표시용 참조다. 키 이름부터 id vs userId 로 다르다.
//
// 이름을 MemberMention 으로 두지 않은 이유 — ReactionSummary.users 가 같은 모양을
// 쓰는데, 리액션을 남긴 사람은 멘션된 사람이 아니다. 모양이 같다는 이유로 멘션 이름을
// 재사용하면, 나중에 멘션 쪽에만 필드가 붙을 때 리액션까지 끌려간다.

type ReactionSummary = {
  type: REACTION_TYPE;
  count: number;
  reactedByMe: boolean;
  users: UserRef[]; // 그 리액션을 남긴 사람들
};
// users 는 타입별 집계라 여러 명이 들어간다. DONE 을 3명이 눌렀으면 이름 3개.
// 화면은 리액션 팝오버 하단의 "누가 남겼는지" 구획에 쓴다 — 개수만 보이면
// 리뷰 도구로서 반쪽이다. 누가 확인 중이고 누가 처리했다고 했는지가 핵심 정보다.
// count 와 users.length 가 항상 같아 중복이지만, 칩이 count 를 읽으므로 남긴다.

// 조회 뷰 타입(findComments). write 계열은 Comment(Prisma 원형) 반환
type CommentView = {
  id: number;
  endpointId: number;
  parentId: number | null;
  content: string; // 삭제 시 서버에서 마스킹 : "삭제된 글입니다."
  isDeleted: boolean;
  author: PublicUser;
  isAiGenerated: boolean; // 작성자가 전역 AI 계정이면 true
  createdAt: string; // 프론트에 내려줄 값이라 string으로 처리합니다.
  updatedAt: string; // 프론트에 내려줄 값이라 string으로 처리합니다.
  reactions: ReactionSummary[];
  memberMentions: UserRef[];
  endpointMentions: EndpointRef[];
};

// 댓글 + 대댓글 한 세트 (2뎁스 고정)
type CommentTree = CommentView & { replies: CommentView[] };

// AI가 요약해야 하는 대상을 모을 때 쓰는 타입.
// 아래 타입을 배열로 만들어서 넘기면 됩니다.
type SummaryInput = { author: string; content: string; createdAt: string };

// 알림 조회 뷰: 프론트에서 클릭 시 해당 댓글로 이동/하일라이트 될 때 쓸 파생필드 포함
type NotificationView = {
  id: number;
  type: NOTIFICATION_TYPE;
  isRead: boolean;
  createdAt: string; // 프론트에 내려줄 값이므로 문자열로 줘야 합니다.
  invitedProjectId: number | null; // INVITED
  mentionedCommentId: number | null; // MENTIONED
  projectId: number | null; // MENTIONED: mentionedCommentId 조인 파생
  endpointId: number | null; // MENTIONED: mentionedCommentId 조인 파생
};

type ProjectScopeResource = 'endpoint' | 'comment';
// 'endpoint' → Endpoint 테이블에서 :id(또는 :endpointId) → projectId 역참조
// 'comment'  → Comment 테이블에서 :id(또는 :parentId)   → projectId 역참조
```

## DTO 정의

```tsx
type LoginDto = { email: string; password: string };

type CreateUserDto = { userName: string; email: string; password: string };

type CreateProjectDto = { specJsonUrl: string; tryItBaseUrl?: string };

type UpdateProjectDto = { tryItBaseUrl?: string };
// tryItBaseUrl 수정만

type CommitSpecDto = { specJsonUrl?: string };
// 기입된 URL로 무조건 fetch
// 값이 없으면 기존 디비에 있는 project.specJsonUrl로 fetch

type CreateMembershipDto = { email: string };

type CreateCommentDto = {
  content: string;
  mentionedUserIds?: number[];
  mentionedEndpointIds?: number[];
};

type UpdateCommentDto = CreateCommentDto;

type MoveCommentDto = { targetEndpointId: number };

type CreateReactionDto = { type: REACTION_TYPE };

type CreateNotificationDto = {
  recipientId: number;
  type: NOTIFICATION_TYPE;
  senderId: number; // 알림을 발생시킨 사람 (누가 멘션/초대했는지)
  mentionedCommentId?: number;
  invitedProjectId?: number;
};
```

---

## 확정 (참고)

- `MembershipGuard` 자원별 projectId 역참조 — 단일 가드 + `@ProjectScope(자원)` 메타데이터 방식. project 라우트는 :id 직접, 그 외는 지정 테이블 역참조, 프로젝트 목록생성은 가드 미적용.
- `createSnapshot` 반환 — id만(`Promise<number>`). 호출부가 snapshotId만 사용.
- 댓글 반영 방식 — 작성/수정/삭제 후 프론트는 TanStack Query 로 mutation → invalidate → `findComments` refetch 과정을 거친다. write 계열 반환은 `Comment` 유지, 조회는 `CommentTree[]`.
- 단건/단일 Comment 조회 API 없음 — 소비처 없음, `findComments` 전량 로드로 해결.
- 스펙 버전 보관 — 옛 버전의 유일한 출처는 append-only인 `SpecSnapshot.rawJson`이다. `Endpoint` 행의 스펙 사본은 삭제 대비 백업으로, 산 것을 조회할 때는 읽지 않는다. 서버 캐시는 두지 않는다 — 100개 엔드포인트 규모에서 스냅샷 파싱이 수 ms라 불필요하고, 필요해지면 snapshotId 키 LRU로 순수 최적화로 얹는다(append-only라 무효화 불요).
- 멘션 알림 클릭 UX — `/projects/:projectId/endpoints/:endpointId?comment=:commentId`로 이동, 해당 댓글 하이라이트+스크롤(초대 알림은 프로젝트로만 이동). 페이지네이션 없음. 대댓글 기본 펼침, 사용자가 접어둔 경우에만 최상위 부모 펼침. 백엔드에 댓글 조회용 별도 API 불필요(프론트에서 상태 제어).

[백엔드 기능 정의서 v0.1](https://app.notion.com/p/v0-1-396efb1b668b80389ddeed3142dd2b38?pvs=21)
