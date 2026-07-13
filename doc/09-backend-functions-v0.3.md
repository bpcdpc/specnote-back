# 백엔드 기능 정의서 v0.2

| 버전 | 일시                 | 변경 내용                                                                                                                                                                                                                                                                                                                                                                                        |
| ---- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| v0.1 | 2026.07.08 WED 09:08 | 컨트롤러 포함 상세본. 스펙 커밋 구조 확정 반영(applySpecCommit 공용 tx 헬퍼, createProject·commitSpec가 각자 트랜잭션 열고 호출, updateProject는 tryItBaseUrl만·커밋 없음, 스펙 URL 저장·refetch는 POST /spec-commits, 프로젝트 메타는 extractSpecInfo 유틸+라우트 인라인 write) + 엔드포인트 목록 경량화(findEndpoints·ProjectView.endpoints를 EndpointSummary[]로, operationJson은 상세에서만) |
| v0.2 | 2026.07.09 THU 08:41 | 댓글 보기용 데이터 타입 정의 추가                                                                                                                                                                                                                                                                                                                                                                |
| v0.3 | 2026.07.13 MON 11:02 | 멤버 API 시그니처 축소(removeMember·findMembers에서 미사용 인자 제거 — 인가는 MembershipGuard가 처리), CommentView·NotificationView 시간 필드 Date → string(응답 직렬화 기준), SummaryInput은 서버 내부 타입이므로 Date 유지                                                                                                                                                                     |

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

### 서비스 users.service.ts

```tsx
createUser(dto: CreateUserDto): Promise<User>
// 가입: 이메일 중복 거부 + bcrypt 해시. 토큰 미발급

findByEmail(email: string): Promise<User | null>
// 초대용 완전일치

findById(id: number): Promise<User | null>
```

- DTO: `CreateUserDto`

---

## 3. `projects/` — 프로젝트·멤버십·스펙 커밋

### 컨트롤러 projects.controller.ts

| 라우트                                               | 함수                           | 입력                                        | 출력                        |
| ---------------------------------------------------- | ------------------------------ | ------------------------------------------- | --------------------------- |
| `POST /api/projects`                                 | `createProject(user, dto)`     | `AuthUser`, `CreateProjectDto`              | `Promise<ProjectView>`      |
| `GET /api/projects`                                  | `findMyProjects(user)`         | `AuthUser`                                  | `Promise<ProjectSummary[]>` |
| `GET /api/projects/:id`                              | `findProject(user, id)`        | `AuthUser`, `number`                        | `Promise<ProjectView>`      |
| `PATCH /api/projects/:id` `[Owner]`                  | `updateProject(user, id, dto)` | `AuthUser`, `number`, `UpdateProjectDto`    | `Promise<ProjectSummary>`   |
| `DELETE /api/projects/:id` `[Owner]`                 | `softDeleteProject(user, id)`  | `AuthUser`, `number`                        | `Promise<void>`             |
| `POST /api/projects/:id/spec-commits` `[Owner]`      | `commitSpec(user, id, dto)`    | `AuthUser`, `number`, `CommitSpecDto`       | `Promise<SpecCommitResult>` |
| `POST /api/projects/:id/members` `[Owner]`           | `inviteMember(user, id, dto)`  | `AuthUser`, `number`, `CreateMembershipDto` | `Promise<Membership>`       |
| `DELETE /api/projects/:id/members/:userId` `[Owner]` | `removeMember(id, userId)`     | `number`, `number`                          | `Promise<Membership>`       |
| `GET /api/projects/:id/members`                      | `findMembers(id)`              | `number`                                    | `Promise<Membership[]>`     |

### 서비스 projects.service.ts

```tsx
createProject(ownerId: number, dto: CreateProjectDto): Promise<ProjectView>
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

commitSpec(userId: number, projectId: number, dto: CommitSpecDto): Promise<SpecCommitResult>
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

findProject(userId: number, projectId: number): Promise<ProjectView>
// 메타 + 엔드포인트 목록 전체 + 프론트엔드에서 캐시할 정보: components, snapshotId

updateProject(userId: number, projectId: number, dto: UpdateProjectDto): Promise<ProjectSummary>
// Owner만 권한을 가짐. tryItBaseUrl 수정할 때에 타는 라우트. 커밋 없음

softDeleteProject(userId: number, projectId: number): Promise<void>
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

findMembers(projectId: number): Promise<Membership[]>
// 프로젝트에 포함된 멤버 검색 (댓글에서 멤버멘션 걸 때 등)

getMembership(userId: number, projectId: number): Promise<Membership | null>  // 가드가 이 메소드를 호출해, 그 반환값으로 접근 권한을 검증
```

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
```

- DTO: `CreateProjectDto`, `UpdateProjectDto`, `CommitSpecDto`, `CreateMembershipDto`

---

## 4. `endpoints/` — 엔드포인트 R (DTO 없음)

### 컨트롤러 endpoints.controller.ts

| 라우트                   | 함수                           | 입력                 | 출력                      |
| ------------------------ | ------------------------------ | -------------------- | ------------------------- |
| `GET /api/endpoints/:id` | `findEndpointDetail(user, id)` | `AuthUser`, `number` | `Promise<EndpointDetail>` |

### 서비스 endpoints.service.ts

```tsx
findEndpointDetail(userId: number, endpointId: number): Promise<EndpointDetail>
// 정합성을 검사하기 위한 최신 snapshotId를 포함해야 함
// snapshotId는 projects의 getLatestSnapshotVersion(projectsService 주입)으로 취득
```

---

## 5. `comments/` — 댓글·대댓글·리액션·멘션·AI요약

### 컨트롤러 comments.controller.ts

| 라우트                                   | 함수                                   | 입력                                      | 출력                        |
| ---------------------------------------- | -------------------------------------- | ----------------------------------------- | --------------------------- |
| `GET /api/endpoints/:id/comments`        | `findComments(user, endpointId)`       | `AuthUser`, `number`                      | `Promise<CommentTree[]>`    |
| `POST /api/endpoints/:id/comments`       | `createComment(user, endpointId, dto)` | `AuthUser`, `number`, `CreateCommentDto`  | `Promise<Comment>`          |
| `POST /api/comments/:id/replies`         | `createReply(user, parentId, dto)`     | `AuthUser`, `number`, `CreateCommentDto`  | `Promise<Comment>`          |
| `PATCH /api/comments/:id`                | `updateComment(user, id, dto)`         | `AuthUser`, `number`, `UpdateCommentDto`  | `Promise<Comment>`          |
| `DELETE /api/comments/:id`               | `softDeleteComment(user, id)`          | `AuthUser`, `number`                      | `Promise<Comment>`          |
| `PATCH /api/comments/:id/move` `[Owner]` | `moveThread(user, id, dto)`            | `AuthUser`, `number`, `MoveCommentDto`    | `Promise<void>`             |
| `POST /api/comments/:id/reactions`       | `toggleReaction(user, id, dto)`        | `AuthUser`, `number`, `CreateReactionDto` | `Promise<Reaction \| null>` |
| `POST /api/endpoints/:id/ai-summary`     | `summarizeThread(user, endpointId)`    | `AuthUser`, `number`                      | `Promise<Comment>`          |

### 서비스 comments.service.ts

```tsx
createComment(userId, endpointId, dto: CreateCommentDto): Promise<Comment>
// 1뎁스 커멘트 생성 : parentId = null
// 멘션 기능은 1)syncMemberMentions, syncEndpointMentions에서 담당하며
// 2)입력한 댓글 내용을 날릴 위험성 때문에 트랜잭션으로 묶지 않는다.

createReply(userId, parentId, dto: CreateCommentDto): Promise<Comment>
// 2뎁스 커멘트 생성
// normalizeReply() 먼저 실행하여, parentId를 뎁스에 맞게 정규화하며,
// 해당 부모 commnet의 endpointId도 받아옴.
// 멘션 기능은 1)syncMemberMentions, syncEndpointMentions에서 담당하며
// 2)입력한 댓글 내용을 날릴 위험성 때문에 트랜잭션으로 묶지 않는다.

updateComment(userId, commentId, dto: UpdateCommentDto): Promise<Comment>
// [작성자 본인] 권한
// content만 수정 가능

softDeleteComment(userId, commentId): Promise<Comment>
// [작성자 본인] 권한
// isDeleted = true만 수행.

findComments(userId, endpointId): Promise<CommentTree[]>
// 전체 댓글 목록 반환
// 삭제된 댓글은 원문을 "삭제된 댓글입니다"등의 문구로 마스킹하여 프론트에다가 전달해 줌

moveThread(ownerId, commentId, dto: MoveCommentDto): Promise<void>
// [Owner] 권한
// [트랜잭션 밖 — 선검증]
//  1. comment 조회 (projectId 확보)
//  - parentId != null 이면 거부: 최상위 스레드만 이동 대상 (대댓글 단독 이동 불가)
//  2. dto.targetEndpointId를 받아서 실제 targetEndpoint 조회
//  - 없거나 isDeleted → BadRequestException
//  - targetEndpoint.projectId !== comment.projectId → ForbiddenException (중요)
// [트랜잭션]
//   3. 최상위 + 대댓글 endpointId 를 targetEndpointId 로 일괄 갱신 (부분 갱신 방지)

private assertAuthor(comment: Comment, userId: number): void
// update, softDelete 공용
// 이미 호출부에서 조회한 Comment 객체를 통째로 전달받아 이 함수 내부에서 글쓴이 Id를 추출해서 userId와 비교한다.

private normalizeReply(parentId: number): Promise<ReplyParent>
// parentId 정규화: 넘어온 parentId가 이미 대댓글이면 최상위 parentId로 덮어쓴다.(FR-6.2)
// 정규화된 parentId의 endpointId를 함께 반환
```

### 서비스 reactions.service.ts

```tsx
toggleReaction(userId, commentId, dto: CreateReactionDto): Promise<Reaction | null>
// @@unique 존재 시 제거, 없으면 생성
```

### 서비스 mentions.service.ts (내부 호출, DTO 없음)

```tsx
syncMemberMentions(commentId, projectId, mentionedUserIds: number[]): Promise<void>
// 같은 프로젝트의 멤버 한정 + MENTIONED 알림

syncEndpointMentions(commentId, projectId, mentionedEndpointIds: number[]): Promise<void>
// 같은 프로젝트의 엔드포인트 한정
```

### 서비스 ai-summary.service.ts (DTO 없음)

```tsx
summarizeThread(actorUserId, endpointId): Promise<Comment>
// 미삭제 댓글 수집해서 SummaryInput[] 으로 만들어서
//   → ai.service의 generateSummary에 전달.
//   → 반환받은 string과 findAiUser() 로 찾은 ai 계정을 조합해서 새 댓글 등록

private findAiUser(): Promise<User>
// 시드된 전역 AI 계정(User.isAi = true)
```

- DTO: `CreateCommentDto`, `UpdateCommentDto`, `MoveCommentDto`, `CreateReactionDto`

---

## 6. `ai/` — 외부 AI 클라이언트 (DTO 없음)

### 서비스 ai.service.ts

```tsx
generateSummary(thread: SummaryInput[]): Promise<string>
```

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
}
```

### decorators/

```tsx
CurrentUser(): ParameterDecorator
// req.user(AuthUser) 주입

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

// 프로젝트 진입 응답
type ProjectView = {
  project: ProjectSummary; // 메타
  tryItBaseUrl: string | null;
  components: unknown; // components JSON. 서버는 전달만 하고, 프론트가 캐싱 + 파싱
  snapshotId: number; // 프론트엔드 캐시 기준이 되는 snapshotId
  endpoints: EndpointSummary[]; // 사이드바용 경량 목록, 삭제 포함 전체 목록
};

// Prisma에서 정의한 Membership 모델
// 이해를 위해 적어 둡니다. 프리즈마 문법으로 데이터 추가할 때 자동으로 형추론됩니다.
// type Membership = {
//   id: number; projectId: number; userId: number;
//   role: ROLE; isDeleted: boolean; createdAt: string;
// };

// 사이드바 목록용 경량(operationJson 제외)
type EndpointSummary = {
  id: number;
  path: string;
  method: string;
  summary: string | null;
  tags: string[];
  isDeleted: boolean;
};

// 상세 응답: 실제 사용하는 필드만 명시
// 내부 필드 projectId 등 제외.
// operationJson은 출력용 JsonValue
type EndpointDetail = {
  id: number;
  path: string;
  method: string;
  operationId: string | null;
  summary: string | null;
  tags: string[];
  operationJson: unknown; // operation JSON. 서버는 전달만 하고, 프론트가 파싱
  isDeleted: boolean;
  snapshotId: number; // 정합성 비교용 최신 스냅샷 id
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
type ReactionSummary = {
  type: REACTION_TYPE;
  count: number;
  reactedByMe: boolean;
};

// 조회 뷰 타입(findComments). write 계열은 Comment(Prisma 원형) 반환
type CommentView = {
  id: number;
  endpointId: number | null;
  parentId: number | null;
  content: string; // 삭제 시 서버에서 마스킹 : "삭제된 내용입니다."
  isDeleted: boolean;
  author: PublicUser;
  createdAt: string; // 프론트에 내려줄 값이라 string으로 처리합니다.
  updatedAt: string; // 프론트에 내려줄 값이라 string으로 처리합니다.
  reactions: ReactionSummary[];
  memberMentions: { userId: number; userName: string }[];
  endpointMentions: { endpointId: number; path: string; method: string }[];
};

// 댓글 + 대댓글 한 세트 (2뎁스 고정)
type CommentTree = CommentView & { replies: CommentView[] };

// AI가 요약해야 하는 대상을 모을 때 쓰는 타입.
// 아래 타입을 배열로 만들어서 넘기면 됩니다.
// 서버 내부 타입 (HTTP 응답 아님). generateSummary() 입력용이므로 createAt 의 타입을 Date로 유지.
type SummaryInput = { author: string; content: string; createdAt: Date };

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
- 멘션 알림 클릭 UX — `/projects/:projectId/endpoints/:endpointId?comment=:commentId`로 이동, 해당 댓글 하이라이트+스크롤(초대 알림은 프로젝트로만 이동). 페이지네이션 없음. 대댓글 기본 펼침, 사용자가 접어둔 경우에만 최상위 부모 펼침. 백엔드에 댓글 조회용 별도 API 불필요(프론트에서 상태 제어).

[백엔드 기능 정의서 v0.1](https://app.notion.com/p/v0-1-396efb1b668b80389ddeed3142dd2b38?pvs=21)
