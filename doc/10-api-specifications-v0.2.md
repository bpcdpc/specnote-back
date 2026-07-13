# API 명세서

| 버전 | 일시                 | 근거                                                                                                                                                                                                                                                             |
| ---- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| v0.1 | 2026.07.09 THU 11:13 | 백엔드 기능 정의서 v0.2 / Prisma Schema v0.3 / 개요 v0.3 / 유즈케이스 v0.4 / 기능요구사항 v0.6. `@ProjectScope`·`@ProjectRole` 3계층 가드 반영. 댓글 수정/삭제 라우트에서 본인의 댓글인지 확인하는 기능은 계층 3 + `assertAuthor` 이중으로 검사하는 것으로 반영. |
| v0.2 | 2026.07.13 MON 11:10 | 공통 에러 표에 409 Conflict 추가, 멤버 초대/제거 Errors 명시(초대 404·409, 제거 404·409 비활성·409 Owner), 알림 읽음 처리 404 명시(리소스 은닉 — 없는 알림과 타인의 알림 동일 응답), SummaryInput은 서버 내부 타입이므로 createdAt을 Date로 정정                 |

> **표기 주의**
>
> - 라우트·입출력 타입·권한·응 뷰 타입은 기능 정의서 v0.2에 정의된 값.
> - HTTP 상태코드와 에러 응답 body 형식은 NestJS 기본 관례를 따름.
> - 요청/응답 body는 TypeScript 타입 표기. `?`는 optional, `| null`은 nullable.

---

## 0. 공통 규약

### 0-1. Base URL / Prefix

- 모든 라우트 `/api` prefix. 그 외 경로는 `index.html` 반환(React Router).

### 0-2. 인증

- 방식: JWT Bearer. `Authorization: Bearer <access_token>`
- 토큰은 `POST /api/auth/login`에서만 발급(가입 `POST /api/users`는 토큰 미발급).
- 프론트: localStorage에 15일 저장.

### 0-3. 가드의 구조

- 접근 통제 판단 기준은 "프로젝트 스코프 라우트인가" 하나이다.
- 라우트 또는 @ProjectScope(’리소스’)로부터 projectId아이디를 받아올 수 있어야 MembershipGuard를 적용할 수 있다.
- 실행 순서는 `JwtAuthGuard` → `MembershipGuard`(후자가 `req.user`에 의존).

| 계층 | 구성                                                           | 대상                                                                                            |
| ---- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| 0    | 가드 없음                                                      | 공개 라우트 : 가입, 로그인                                                                      |
| 1    | `JwtAuthGuard`                                                 | projectId 없는 인증 라우트 : 유저검색, 내 프로젝트 목록, 알림                                   |
| 2    | `JwtAuthGuard` + `MembershipGuard`                             | `:id`가 곧 projectId인 라우트. 예: `/api/projects/:id...`                                       |
| 3    | `JwtAuthGuard` + `MembershipGuard` + `@ProjectScope(resource)` | `:id`가 projectId가 아니라 역참조 필요한 라우트. 예: `/api/endpoints/...` , `/api/comments/...` |

- `@ProjectScope('endpoint')`: Endpoint 테이블에서 `:id`(endpoint Id)를 통해 projectId 역참조
- `@ProjectScope('comment')`: Comment 테이블에서 `:id`(comment Id)를 통해 projectId 역참조
- `@ProjectRole(OWNER)`: Owner 전용 라우트에 추가. `MembershipGuard`가 `Reflector`로 읽어 role 검증
- 권한 표기 약어(각 라우트에 사용):

| 표기     | 의미                                      | 계층 |
| -------- | ----------------------------------------- | ---- |
| `공개`   | 가드 없음                                 | 0    |
| `Auth`   | 로그인만 (`JwtAuthGuard`)                 | 1    |
| `Member` | 프로젝트 구성원(Owner/Member)             | 2    |
| `Owner`  | 프로젝트 Owner만 (`+@ProjectRole(OWNER)`) | 3    |

### 0-4. 상태코드 (NestJS 기본 관례를 따름)

| 상황                        | 코드                        |
| --------------------------- | --------------------------- |
| `POST` 성공                 | `201 Created`               |
| `GET` / `PATCH` 성공        | `200 OK`                    |
| `DELETE` (void 반환)        | `200 OK` (또는 `204`)       |
| 인증 실패                   | `401 Unauthorized`          |
| 권한 없음(가드 거부)        | `403` 또는 `404` (0-8 참고) |
| 검증 실패 / 잘못된 요청     | `400 Bad Request`           |
| 리소스 없음                 | `404 Not Found`             |
| 리소스 상태와 충돌하는 요청 | `409 Conflict`              |

### 0-5. 에러 응답 body (NestJS HttpException 기본형 + 에러 코드)

```tsx
{ statusCode: number; code?: string; message: string | string[]; error: string }
```

> 스펙 로딩 실패 3종(`INVALID_SPEC` / `UNSUPPORTED_VERSION` / `SPEC_LOAD_ERROR`)은 code에 담김. 프론트에서 더 세부적인 에러원인이 필요할 때 사용하며, 필수는 아니다.

### 0-6. 전역 타입

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

type PublicUser = { id: number; userName: string; email: string };
```

### 0-7. 소프트 삭제 응답 규칙

- 모든 삭제는 소프트 삭제(`isDeleted = true`)이며, 로우는 DB에 남는다.
- 응답 형태는 **삭제 후 화면이 그 리소스에 머무느냐**로 갈린다.
  - 화면이 리소스에 머무름 → 갱신된(마스킹 포함) 로우 반환 (프론트가 재조회 없이 상태 갱신)
  - 화면을 이탈함 → `void`
- 적용 결과:
  - `DELETE /api/comments/:id` → 마스킹된 `Comment` 반환 (자리 유지·내용만 "삭제된 댓글입니다")
  - `DELETE /api/projects/:id/members/:userId` → `Membership` 반환 (멤버 목록에서 즉시 갱신)
  - `DELETE /api/projects/:id` → `void` (삭제 후 목록으로 이탈)

### 0-8. 권한 위반 상태코드

접근 통제 실패는 어느 단계에서 걸리느냐로 코드가 갈린다.

| 거부 단계                                                  | 코드  | 근거                                                                |
| ---------------------------------------------------------- | ----- | ------------------------------------------------------------------- |
| 비구성원이 프로젝트/스코프 리소스 접근 (`MembershipGuard`) | `404` | 리소스 존재 은닉 (id 순차정수·URL 기반이라 남의 프로젝트 노출 방지) |
| 구성원이지만 Owner 아님 (`@ProjectRole`)                   | `403` | 존재는 이미 앎, 권한만 부족                                         |
| 작성자 아닌데 댓글 수정/삭제 (`assertAuthor`)              | `403` | 같은 구성원이라 댓글 존재 이미 앎, 은닉 불필요                      |

- 함의: `MembershipGuard`는 거부 시 `NotFoundException`(404)을 던진다 (리소스의 존재 여부를 숨기기 위해 403 보다는 404로 한다.)

---

## 1. auth — 로그인·인증

### `POST /api/auth/login` — 로그인

- 권한: `공개`
- Request: `LoginDto` : `{ email: string; password: string }`
- Response `200`: `{ access_token: string }`
- Errors: `401` 이메일 미존재 또는 비밀번호 불일치

---

## 2. users — 유저 조회/가입

### `POST /api/users` — 회원가입

- 권한: `공개` 토큰 미발급
- Request: `CreateUserDto` : `{ userName: string; email: string; password: string }`
- Response `201`: `PublicUser`
- Errors: `400` 이메일 중복

### `GET /api/users/search?email=` — 이메일 완전일치 조회(초대용)

- 권한: `Auth`
- Query: `email: string` (완전일치)
- Response `200`: `PublicUser | null`

---

## 3. projects — 프로젝트·멤버십·스펙 커밋

### 3-1. 응답 타입

```tsx
type ProjectSummary = {
  id: number;
  title: string;
  description: string | null;
  version: string;
  oasVersion: string;
  role: ROLE;
  isDeleted: boolean;
};

// 사이드바 경량 목록 (operationJson 제외)
type EndpointSummary = {
  id: number;
  path: string;
  method: string;
  summary: string | null;
  tags: string[];
  isDeleted: boolean;
};

// 프로젝트 진입 응답
type ProjectView = {
  project: ProjectSummary;
  tryItBaseUrl: string | null;
  components: unknown; // components JSON, 프론트가 캐싱·파싱
  snapshotId: number; // 프론트 캐시 기준 스냅샷 id
  endpoints: EndpointSummary[]; // 삭제 포함 전체 경량 목록
};

type SpecCommitResult = { snapshotId: number; diff: EndpointDiff };
type EndpointDiff = {
  added: number;
  removed: number;
  updated: number;
  revived: number;
};

// Prisma에서 정의한 Membership 모델
// 이해를 위해 적어 둡니다. 프리즈마 문법으로 데이터 추가할 때 자동으로 형추론됩니다.
// type Membership = {
//   id: number; projectId: number; userId: number;
//   role: ROLE; isDeleted: boolean; createdAt: string;
// };
```

### `POST /api/projects` — 프로젝트 생성

- 권한: `Auth` (프로젝트가 아직 없어 멤버십 검증은 못하고, 로그인 여부만 검증. 생성자 = Owner)
- Request: `CreateProjectDto` : `{ specJsonUrl: string; tryItBaseUrl?: string }`
- 처리: `specJsonUrl` fetch, 검증 → 메타(title/description/version/oasVersion) 자동 추출 → Owner 멤버십 + 첫 스냅샷·엔드포인트 생성
- Response `201`: `ProjectView`
- Errors: `400`
  - 스펙 로딩 실패할 경우에는 `INVALID_SPEC | UNSUPPORTED_VERSION | SPEC_LOAD_ERROR`

### `GET /api/projects` — 내 프로젝트 목록

- 권한: `Auth` (계층 1 — 단일 projectId 없음, 서비스가 멤버쉽테이블에서 필터링함.)
- Response `200`: `ProjectSummary[]`

### `GET /api/projects/:id` — 프로젝트 진입

- 권한: `Member` (계층 2)
- Response `200`: `ProjectView`

### `PATCH /api/projects/:id` — 프로젝트 수정 `[Owner]`

- 권한: `Owner` (계층 2 + `@ProjectRole(OWNER)`)
- Request: `UpdateProjectDto` — `{ tryItBaseUrl?: string }` (tryItBaseUrl만 수정, 스펙 커밋 없음)
- Response `200`: `ProjectSummary`
- 참고: title/description/version/oasVersion은 스펙 리로드로만 갱신, 직접 수정 불가

### `DELETE /api/projects/:id` — 프로젝트 삭제 `[Owner]`

- 권한: `Owner` (계층 2 + `@ProjectRole(OWNER)`)
- 처리: 소프트 삭제(`isDeleted = true`)
- Response `200`: 없음(void)

### `POST /api/projects/:id/spec-commits` — 스펙 업데이트 `[Owner]`

- 권한: `Owner` (계층 2 + `@ProjectRole(OWNER)`)
- Request: `CommitSpecDto` — `{ specJsonUrl?: string }` (값 있으면 해당 URL, 없으면 기존 `project.specJsonUrl` refetch)
- 처리: fetch·검증 → 메타 갱신 → 새 스냅샷 append + 엔드포인트 upsert(사라진 것 소프트삭제 / 동일 path+method 재등장 시 기존 행 부활)
- Response `201`: `SpecCommitResult` `{ snapshotId, diff }`
- Errors: `400`
  - 스펙 로딩 실패할 경우에는 `INVALID_SPEC | UNSUPPORTED_VERSION | SPEC_LOAD_ERROR`

### `POST /api/projects/:id/members` — 멤버 초대 `[Owner]`

- 권한: `Owner` (계층 2 + `@ProjectRole(OWNER)`)
- Request: `CreateMembershipDto` — `{ email: string }`
- 처리: 신규 멤버십 생성 또는 소프트삭제 멤버 부활 + `INVITED` 알림 생성
- Response `201`: `Membership`
- Errors:
  - `404` — 해당 이메일의 사용자 없음
  - `409` — 이미 활성 멤버

### `DELETE /api/projects/:id/members/:userId` — 멤버 제거 `[Owner]`

- 권한: `Owner` (계층 2 + `@ProjectRole(OWNER)`)
- Path: `userId: number`
- 처리: 소프트 삭제(`isDeleted = true`)
- Response `200`: `Membership`
- Errors:
  - `404` — 제거 대상이 해당 프로젝트 멤버 아님
  - `409` — 제거 대상이 이미 비활성 멤버
  - `409` — 제거 대상이 Owner (Owner는 프로젝트당 1명이므로 제거 불가)

### `GET /api/projects/:id/members` — 멤버 목록

- 권한: `Member` (계층 2)
- Response `200`: `Membership[]`

---

## 4. endpoints — 엔드포인트 상세

### 4-1. 응답 타입

```tsx
type EndpointDetail = {
  id: number;
  path: string;
  method: string;
  operationId: string | null;
  summary: string | null;
  tags: string[];
  operationJson: unknown; // operation JSON, 프론트가 파싱
  isDeleted: boolean;
  snapshotId: number; // 정합성 비교용 최신 스냅샷 id
};
```

### `GET /api/endpoints/:id` — 엔드포인트 상세

- 권한: `Member` (계층 3 : `@ProjectScope('endpoint')`)
- Response `200`: `EndpointDetail`
- 참고: 응답 `snapshotId` ≠ 프론트 캐시 `snapshotId`면 프론트가 "스펙 업데이트됨" 배너 표시 후 사용자가 직접 새로고침하기를 유도

---

## 5. comments — 댓글·대댓글·리액션·멘션·AI요약

### 5-1. 응답 타입

```tsx
// Prisma에서 정의한 원형 Comment 모델
// 이해를 위해 적어 둡니다. 프리즈마 문법으로 데이터 추가할 때 자동으로 형추론됩니다.
// type Reaction = {
//   id: number; commentId: number; userId: number;
//   type: REACTION_TYPE; projectId: number; createdAt: string;
// };

type ReactionSummary = {
  type: REACTION_TYPE;
  count: number;
  reactedByMe: boolean;
};

// Prisma에서 정의한 원형 Comment 모델
// 이해를 위해 적어 둡니다. 프리즈마 문법으로 데이터 추가할 때 자동으로 형추론됩니다.
// type Comment = {
//  id: number; endpointId: number; userId: number;
//  content: string; isDeleted: boolean; parentId: number | null;
//  projectId: number; createdAt: string; updatedAt: string;
//};

// 조회 뷰(findComments 전용). 삭제 댓글의 content는 서버에서 마스킹
type CommentView = {
  id: number;
  endpointId: number | null;
  parentId: number | null;
  content: string;
  isDeleted: boolean;
  author: PublicUser;
  createdAt: string;
  updatedAt: string;
  reactions: ReactionSummary[];
  memberMentions: { userId: number; userName: string }[];
  endpointMentions: { endpointId: number; path: string; method: string }[];
};

// 댓글 + 대댓글 한 세트 (2뎁스 고정)
type CommentTree = CommentView & { replies: CommentView[] };

// AI가 요약해야 하는 대상을 모을 때 쓰는 타입.
// 아래 타입을 배열로 만들어서 넘기면 됩니다.
// 서버 내부 타입 (HTTP 응답 아님). generateSummary() 입력용. 그래서 createdAt 타입을 Date로 유지
type SummaryInput = { author: string; content: string; createdAt: Date };
```

### `GET /api/endpoints/:id/comments` — 댓글 목록

- 권한: `Member` (계층 3 : `@ProjectScope('endpoint')`)
- Response `200`: `CommentTree[]` (삭제 댓글 원문은 "삭제된 댓글입니다" 등으로 마스킹)
- 참고: 단건 조회 API 없음 — 전량 로드로 해결. 페이지네이션 없음

### `POST /api/endpoints/:id/comments` — 최상위 댓글 작성

- 권한: `Member` (계층 3 : `@ProjectScope('endpoint')`)
- Request: `CreateCommentDto` — `{ content: string; mentionedUserIds?: number[]; mentionedEndpointIds?: number[] }`
- 처리: `parentId = null` 댓글 생성 + 멘션 동기화(비트랜잭션) + `MENTIONED` 알림
- Response `201`: `Comment`

### `POST /api/comments/:id/replies` — 대댓글 작성

- 권한: `Member` (계층 3 : `@ProjectScope('comment')`)
- Request: `CreateCommentDto` (createComment와 동일)
- 처리: `normalizeReply()`로 parentId를 최상위로 정규화(2뎁스 고정) + 부모 endpointId 상속
- Response `201`: `Comment`

### `PATCH /api/comments/:id` — 댓글 수정

- 권한: `Member` (계층 3 : `@ProjectScope('comment')`) + 서비스에서 작성자 본인 검증 (`assertAuthor`)
- Request: `UpdateCommentDto` (`CreateCommentDto`와 같은데, 형식상 분리)
- Response `200`: `Comment`
- Errors: `404` 구성원 아님(가드) / `403` 작성자 아님(assertAuthor) — 0-8 참고

### `DELETE /api/comments/:id` — 댓글 삭제

- 권한: `Member` (계층 3 : `@ProjectScope('comment')`) + 서비스에서 작성자 본인 검증(`assertAuthor`)
- 처리: 소프트 삭제(`isDeleted = true`)
- Response `200`: 마스킹된 `Comment` (0-7 참고)
- Errors: `404` 구성원 아님(가드) / `403` 작성자 아님(assertAuthor) — 0-8 참고

### `PATCH /api/comments/:id/move` — 스레드 이동 `[Owner]`

- 권한: `Owner` (계층 3 : `@ProjectScope('comment')` + `@ProjectRole(OWNER)`)
- Request: `MoveCommentDto` — `{ targetEndpointId: number }`
- 처리: 최상위 스레드만 이동(대댓글 단독 이동 불가), 최상위+대댓글 endpointId 일괄 갱신(트랜잭션)
- Response `200`: 없음(void)
- Errors:
  - `400` 대상 엔드포인트 없음/삭제됨, 또는 대댓글 이동 시도
  - `403` 대상 엔드포인트가 다른 프로젝트 소속

### `POST /api/comments/:id/reactions` — 리액션 토글

- 권한: `Member` (계층 3 : `@ProjectScope('comment')`)
- Request: `CreateReactionDto` — `{ type: REACTION_TYPE }`
- 처리: 동일 `(commentId, userId, type)` 존재 시 제거, 없으면 생성
- Response `201`: `Reaction | null` (제거 시 null)

### `POST /api/endpoints/:id/ai-summary` — 스레드 AI 요약

- 권한: `Member` (계층 3 : `@ProjectScope('endpoint')`)
- 처리: 미삭제 댓글 수집 → `SummaryInput[]` → AI 요약 생성 → 전역 AI 계정 명의 최상위 댓글 등록
- Response `201`: `Comment` (AI가 작성한 댓글)
- Errors: `400` 요약할 댓글 없음 / AI 생성 실패

---

## 6. notifications — 초대·멘션 알림

### 6-1. 응답 타입

```tsx
// 조회 뷰: 프론트 클릭 시 이동/하이라이트용 파생필드 포함
type NotificationView = {
  id: number;
  type: NOTIFICATION_TYPE;
  isRead: boolean;
  createdAt: string;
  invitedProjectId: number | null; // INVITED
  mentionedCommentId: number | null; // MENTIONED
  projectId: number | null; // MENTIONED: mentionedCommentId 조인 파생
  endpointId: number | null; // MENTIONED: mentionedCommentId 조인 파생
};

// markAsRead 반환: Prisma 원형
type Notification = {
  id: number;
  recipientId: number;
  type: NOTIFICATION_TYPE;
  isRead: boolean;
  mentionedCommentId: number | null;
  invitedProjectId: number | null;
  senderId: number;
  createdAt: string;
};
```

### `GET /api/notifications` — 내 알림 목록

- 권한: `Auth` (계층 1 : recipientId 본인 스코프, projectId 없음)
- Response `200`: `NotificationView[]`
- 참고: 클릭 이동 UX — MENTIONED는 `/projects/:projectId/endpoints/:endpointId?comment=:commentId`, INVITED는 프로젝트로만 이동

### `PATCH /api/notifications/:id/read` — 읽음 처리

- 권한: `Auth` (계층 1)
- Response `200`: `Notification`
- Errors: `404` 알림 없음 또는 타인의 알림 (리소스 은닉 — 두 경우 동일 응답)

> 알림 생성 API 없음. 초대·멘션 처리 시 서버 내부(`createNotification`)에서 생성.

---

## 부록. 라우트 · 입력 통합 요약

| Method | Path                                | 함수               | Body (DTO)            | Path param     | Query param | 권한                        | 가드계층 | @ProjectScope | @ProjectRole |
| ------ | ----------------------------------- | ------------------ | --------------------- | -------------- | ----------- | --------------------------- | -------- | ------------- | ------------ |
| POST   | `/api/auth/login`                   | login              | `LoginDto`            | —              | —           | 공개                        | 0        | —             | —            |
| POST   | `/api/users`                        | createUser         | `CreateUserDto`       | —              | —           | 공개                        | 0        | —             | —            |
| GET    | `/api/users/search`                 | findByEmail        | —                     | —              | `email`     | Auth                        | 1        | —             | —            |
| POST   | `/api/projects`                     | createProject      | `CreateProjectDto`    | —              | —           | Auth                        | 1        | —             | —            |
| GET    | `/api/projects`                     | findMyProjects     | —                     | —              | —           | Auth                        | 1        | —             | —            |
| GET    | `/api/projects/:id`                 | findProject        | —                     | `id`           | —           | Member                      | 2        | —             | —            |
| PATCH  | `/api/projects/:id`                 | updateProject      | `UpdateProjectDto`    | `id`           | —           | Owner                       | 2        | —             | `OWNER`      |
| DELETE | `/api/projects/:id`                 | softDeleteProject  | —                     | `id`           | —           | Owner                       | 2        | —             | `OWNER`      |
| POST   | `/api/projects/:id/spec-commits`    | commitSpec         | `CommitSpecDto`       | `id`           | —           | Owner                       | 2        | —             | `OWNER`      |
| POST   | `/api/projects/:id/members`         | inviteMember       | `CreateMembershipDto` | `id`           | —           | Owner                       | 2        | —             | `OWNER`      |
| DELETE | `/api/projects/:id/members/:userId` | removeMember       | —                     | `id`, `userId` | —           | Owner                       | 2        | —             | `OWNER`      |
| GET    | `/api/projects/:id/members`         | findMembers        | —                     | `id`           | —           | Member                      | 2        | —             | —            |
| GET    | `/api/endpoints/:id`                | findEndpointDetail | —                     | `id`           | —           | Member                      | 3        | `endpoint`    | —            |
| GET    | `/api/endpoints/:id/comments`       | findComments       | —                     | `id`           | —           | Member                      | 3        | `endpoint`    | —            |
| POST   | `/api/endpoints/:id/comments`       | createComment      | `CreateCommentDto`    | `id`           | —           | Member                      | 3        | `endpoint`    | —            |
| POST   | `/api/endpoints/:id/ai-summary`     | summarizeThread    | —                     | `id`           | —           | Member                      | 3        | `endpoint`    | —            |
| POST   | `/api/comments/:id/replies`         | createReply        | `CreateCommentDto`    | `id`           | —           | Member                      | 3        | `comment`     | —            |
| POST   | `/api/comments/:id/reactions`       | toggleReaction     | `CreateReactionDto`   | `id`           | —           | Member                      | 3        | `comment`     | —            |
| PATCH  | `/api/comments/:id/move`            | moveThread         | `MoveCommentDto`      | `id`           | —           | Owner                       | 3        | `comment`     | `OWNER`      |
| PATCH  | `/api/comments/:id`                 | updateComment      | `UpdateCommentDto`    | `id`           | —           | Member + 본인(assertAuthor) | 3        | `comment`     | —            |
| DELETE | `/api/comments/:id`                 | softDeleteComment  | —                     | `id`           | —           | Member + 본인(assertAuthor) | 3        | `comment`     | —            |
| GET    | `/api/notifications`                | findNotifications  | —                     | —              | —           | Auth                        | 1        | —             | —            |
| PATCH  | `/api/notifications/:id/read`       | markAsRead         | —                     | `id`           | —           | Auth                        | 1        | —             | —            |

- 인증 헤더: 공개 라우트(계층 0)를 제외한 모든 라우트는 `Authorization: Bearer <token>` 필요(0-2). 라우트별로 반복 표기하지 않음.
- AuthUser: 컨트롤러 시그니처의 `user`는 JWT에서 서버가 주입(`@CurrentUser`)하는 값 — 클라이언트 입력이 아니므로 표에서 제외.
- `UpdateCommentDto`는 `CreateCommentDto`와 동형(별칭).
- `assertAuthor`는 `updateComment`/`softDeleteComment`에서만 호출되는데, 가드(`@ProjectScope` 역참조)와 `assertAuthor`가 각각 댓글을 조회해 조회가 2번으로 중복되지만, 가드 일관성을 우선해 중복을 유지한다.
