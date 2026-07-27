# API 명세서

| 버전 | 일시                 | 근거                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ---- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| v0.1 | 2026.07.09 THU 11:13 | 백엔드 기능 정의서 v0.2 / Prisma Schema v0.3 / 개요 v0.3 / 유즈케이스 v0.4 / 기능요구사항 v0.6. `@ProjectScope`·`@ProjectRole` 3계층 가드 반영. 댓글 수정/삭제 라우트에서 본인의 댓글인지 확인하는 기능은 계층 3 + `assertAuthor` 이중으로 검사하는 것으로 반영.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| v0.2 | 2026.07.13 MON 11:10 | 공통 에러 표에 409 Conflict 추가, 멤버 초대/제거 Errors 명시(초대 404·409, 제거 404·409 비활성·409 Owner), 알림 읽음 처리 404 명시(리소스 은닉 — 없는 알림과 타인의 알림 동일 응답), SummaryInput은 서버 내부 타입이므로 createdAt을 Date로 정정, 댓글/대댓글 작성에 멘션 대상 검증 및 400 에러 명시(댓글 생성 전 검증 — 비트랜잭션 구조 유지), moveThread의 403(다른 프로젝트 엔드포인트)을 400으로 통합(리소스 은닉 원칙 일관성)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| v0.3 | 2026.07.16 THU 01:10 | 0-8 삭제된 프로젝트 404 케이스 추가, CommentView.endpointId non-null 정정                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| v0.4 | 2026.07.21 TUE 00:00 | CommentView에 isAiGenerated 추가. SummaryInput.createdAt Date → string. 댓글/대댓글/수정 Errors에 content 누락·공백 400 추가, 대댓글에 AI 요약 답글 불가 400 추가, 수정에 멘션 400 추가(content 수정 시 멘션 재동기화). summarizeThread 요약 표 시그니처 (endpointId, projectId)로 정정. GET /users/search에 AI 계정 제외 명시.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| v0.5 | 2026.07.27 MON       | **코드 실측 대조 반영.** `GET /api/users/me` 신설(구현 완료분 누락) — 토큰의 유저가 없는 경우도 404가 아니라 401로 통일. **댓글 이동을 엔드포인트 단위로 전환**(FR-12 v0.7) — `PATCH /api/comments/:id/move` → `PATCH /api/endpoints/:id/comments/move`, 절 위치도 comments → endpoints, `@ProjectScope('comment')` → `@ProjectScope('endpoint')`. 이동 단위가 스레드에서 엔드포인트 전량으로 바뀌면서 대댓글 단독 이동 400 조항 삭제. 댓글 수정/삭제 Errors에 **이미 삭제된 댓글 400** 추가. 0-2 인증 절에 `users/me` 흐름 추가. **멤버 목록 응답을 `MemberView[]`로 전환** — `Membership` 원형에 `userName`이 없어 프론트가 화면을 그릴 수 없었다. `{ user: PublicUser; role: ROLE }` 형태. 초대/제외 응답은 원형 유지(변경 후 재조회 원칙). **`UserRef` / `EndpointRef` 신설** — 멘션 두 필드와 `ReactionSummary.users`가 공유하는 경량 참조 타입. `ReactionSummary`에 **`users` 추가** — 리액션을 남긴 사람 목록. 개수만으로는 누가 확인 중이고 누가 처리했는지 알 수 없어 리뷰 도구로서 반쪽이었다. **AI 요약 Errors 명시** — 댓글 0건 400, AI 계정 미시드 500, Azure 호출 실패 500. 수집 대상에서 이전 AI 요약 댓글을 제외함을 기록. |

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

**인증 흐름** — 로그인 → 토큰 저장 → `GET /api/users/me`로 유저 정보 확보.
새로고침도 같은 경로를 탄다. 로그인 응답에 유저를 끼워넣지 않는 이유는, 그러면
로그인 경로와 새로고침 경로가 둘로 갈려 프론트가 같은 상태를 두 방식으로 만들게 되기 때문이다.
`users/me` 호출은 토큰 유효성 검증도 겸한다.

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

| 거부 단계                                                  | 코드  | 근거                                                                                               |
| ---------------------------------------------------------- | ----- | -------------------------------------------------------------------------------------------------- |
| 비구성원 접근 · 프로젝트 소프트 삭제됨 (`MembershipGuard`) | `404` | 리소스 존재 은닉. 비멤버·미존재·삭제된 프로젝트를 동일 404로 뭉갬 (id 순차정수·URL 기반 노출 방지) |
| 구성원이지만 Owner 아님 (`@ProjectRole`)                   | `403` | 존재는 이미 앎, 권한만 부족                                                                        |
| 작성자 아닌데 댓글 수정/삭제 (`assertAuthor`)              | `403` | 같은 구성원이라 댓글 존재 이미 앎, 은닉 불필요                                                     |

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
- 비고: AI 계정(`isAi=true`)은 초대 대상이 아니므로 검색에서 제외 (일치해도 `null` 반환)

### `GET /api/users/me` — 내 정보 조회

- 권한: `Auth` (계층 1)
- 처리: `req.user.id`로 조회
- Response `200`: `PublicUser`
- Errors:
  - `401` 토큰 없음 또는 만료
  - `401` 토큰의 유저가 존재하지 않음 (`유효하지 않은 토큰입니다.`)
- 비고:
  - 로그인 응답이 `{ access_token }`뿐이고 `JwtPayload`에 `userName`이 없어
    프론트가 유저 이름을 얻을 경로가 이것뿐이다. 새로고침 시 토큰 유효성 검증도 겸한다
  - **두 실패를 모두 401로 모은다.** 토큰이 가리키는 유저가 없다는 것은 리소스
    미발견이 아니라 그 토큰이 더 이상 누구도 식별하지 못한다는 뜻이다.
    프론트에는 이미 "401이면 토큰 버리고 로그인으로" 경로가 있으므로,
    404로 나누면 같은 결과를 내는 분기를 하나 더 만들게 된다

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

// 멤버 목록 응답
type MemberView = {
  user: PublicUser;
  role: ROLE;
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
- Response `200`: `MemberView[]` (`isDeleted=false`만)
- 비고:
  - **`Membership` 원형이 아니라 `MemberView`다.** 프론트가 쓰는 것은 이름과 역할뿐이고,
    `projectId`는 URL이 이미 갖고 있다. 근거는 `09-backend-functions` 3절
  - 소비처는 둘이다. 설정 화면의 멤버 칩(`role`로 Owner 뱃지와 제외 버튼을 가름)과
    댓글 멤버 멘션 후보(`user`만 뽑아 씀)
  - **초대/제외 응답은 `Membership` 원형 그대로다.** 변경 후 이 목록을 재조회하므로
    응답에 이름이 필요 없다

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

### `PATCH /api/endpoints/:id/comments/move` — 엔드포인트 댓글 일괄 이동 `[Owner]`

- 권한: `Owner` (계층 3 : `@ProjectScope('endpoint')` + `@ProjectRole(OWNER)`)
- Path: `id` = **이동할 댓글들이 붙어 있는 엔드포인트 id**
- Request: `MoveCommentDto` — `{ targetEndpointId: number }`
- 처리: 해당 엔드포인트의 댓글 **전량**을 대상 엔드포인트로 옮긴다.
  최상위와 대댓글을 가리지 않는다(FR-12)
- Response `200`: 없음(void)
- Errors:
  - `400` 대상 엔드포인트가 없음/삭제됨/다른 프로젝트 소속 (셋을 400 하나로 통일 — 리소스 은닉)
- 비고:
  - **이동 단위는 스레드가 아니라 엔드포인트다.** v0.4까지의
    `PATCH /api/comments/:id/move`(스레드 단위)를 대체한다. 논의는 엔드포인트에 매인
    것이라 스레드만 옮기면 남은 댓글과 맥락이 끊긴다
  - 그래서 `:id`가 endpointId이고, 라우트도 `CommentsController`가 아니라
    **`EndpointsController`** 가 받는다(`@ProjectScope('endpoint')`가 필요하므로).
    구현은 `comments.service.ts`의 `moveComments`가 그대로 갖는다
  - 대댓글 단독 이동 개념이 사라져 관련 400 조항도 없어졌다
  - 옮길 댓글이 0건이어도 에러가 아니다
  - 단일 `updateMany`라 트랜잭션으로 묶지 않는다

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
  users: UserRef[];
};
// users 는 타입별 집계다. 한 리액션을 여러 명이 눌렀으면 이름이 여러 개 들어간다.
// 리액션 팝오버가 "누가 남겼는지"를 보여주는 데 쓴다.
// count 와 users.length 는 항상 같다(칩이 count 를 읽어 중복을 남긴다).

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
  endpointId: number;
  parentId: number | null;
  content: string;
  isDeleted: boolean;
  author: PublicUser;
  isAiGenerated: boolean; // 작성자가 전역 AI 계정이면 true
  createdAt: string;
  updatedAt: string;
  reactions: ReactionSummary[];
  memberMentions: UserRef[];
  endpointMentions: EndpointRef[];
};

// 댓글 + 대댓글 한 세트 (2뎁스 고정)
type CommentTree = CommentView & { replies: CommentView[] };

// AI가 요약해야 하는 대상을 모을 때 쓰는 타입.
// 아래 타입을 배열로 만들어서 넘기면 됩니다.
type SummaryInput = { author: string; content: string; createdAt: string };
```

### `GET /api/endpoints/:id/comments` — 댓글 목록

- 권한: `Member` (계층 3 : `@ProjectScope('endpoint')`)
- Response `200`: `CommentTree[]` (삭제 댓글 원문은 "삭제된 댓글입니다" 등으로 마스킹)
- 참고: 단건 조회 API 없음 — 전량 로드로 해결. 페이지네이션 없음

### `POST /api/endpoints/:id/comments` — 최상위 댓글 작성

- 권한: `Member` (계층 3 : `@ProjectScope('endpoint')`)
- Request: `CreateCommentDto` — `{ content: string; mentionedUserIds?: number[]; mentionedEndpointIds?: number[] }`
- 처리: 멘션 대상 검증 → `parentId = null` 댓글 생성 + 멘션 동기화(비트랜잭션) + `MENTIONED` 알림
- Response `201`: `Comment`
- Errors:
  - `400` content 누락 또는 공백 (trim 후 빈 문자열)
  - `400` 멘션 대상 사용자가 해당 프로젝트 멤버 아님 (리소스 은닉)
  - `400` 멘션 대상 엔드포인트가 없음/삭제됨/다른 프로젝트 소속 (리소스 은닉)

### `POST /api/comments/:id/replies` — 대댓글 작성

- 권한: `Member` (계층 3 : `@ProjectScope('comment')`)
- Request: `CreateCommentDto` (createComment와 동일)
- 처리: 멘션 대상 검증 → `normalizeReply()`로 parentId를 최상위로 정규화(2뎁스 고정) + 부모 endpointId 상속
- Response `201`: `Comment`
- Errors:
  - `400` content 누락 또는 공백 (trim 후 빈 문자열)
  - `400` AI 요약 댓글에는 답글을 달 수 없음 (부모가 전역 AI 계정)
  - `400` 멘션 대상 사용자가 해당 프로젝트 멤버 아님 (리소스 은닉)
  - `400` 멘션 대상 엔드포인트가 없음/삭제됨/다른 프로젝트 소속 (리소스 은닉)

### `PATCH /api/comments/:id` — 댓글 수정

- 권한: `Member` (계층 3 : `@ProjectScope('comment')`) + 서비스에서 작성자 본인 검증 (`assertAuthor`)
- Request: `UpdateCommentDto` (`CreateCommentDto`와 같은데, 형식상 분리)
- 처리: 작성자 본인 검증 → content 수정 + 멘션 재동기화(content 변경 시 멘션도 바뀌므로 전량 교체, 신규 추가분에만 알림)
- Response `200`: `Comment`
- Errors:
  - `400` content 누락 또는 공백 (trim 후 빈 문자열)
  - `400` 멘션 대상 사용자가 해당 프로젝트 멤버 아님 (리소스 은닉)
  - `400` 멘션 대상 엔드포인트가 없음/삭제됨/다른 프로젝트 소속 (리소스 은닉)
  - `400` 이미 삭제된 댓글 (`이미 삭제된 댓글입니다.`)
  - `404` 해당 id의 댓글 없음
  - `404` 구성원 아님(가드) / `403` 작성자 아님(assertAuthor) — 0-8 참고

### `DELETE /api/comments/:id` — 댓글 삭제

- 권한: `Member` (계층 3 : `@ProjectScope('comment')`) + 서비스에서 작성자 본인 검증(`assertAuthor`)
- 처리: 소프트 삭제(`isDeleted = true`). 응답 객체의 `content`만 마스킹 문구로 갈아끼우며
  DB의 `content`는 원문 그대로 남는다
- Response `200`: 마스킹된 `Comment` (0-7 참고)
- Errors:
  - `400` 이미 삭제된 댓글 (`이미 삭제된 댓글입니다.`)
  - `404` 해당 id의 댓글 없음
  - `404` 구성원 아님(가드) / `403` 작성자 아님(assertAuthor) — 0-8 참고

### `POST /api/comments/:id/reactions` — 리액션 토글

- 권한: `Member` (계층 3 : `@ProjectScope('comment')`)
- Request: `CreateReactionDto` — `{ type: REACTION_TYPE }`
- 처리: 동일 `(commentId, userId, type)` 존재 시 제거, 없으면 생성
- Response `201`: `Reaction | null` (제거 시 null)

### `POST /api/endpoints/:id/ai-summary` — 스레드 AI 요약

- 권한: `Member` (계층 3 : `@ProjectScope('endpoint')`)
- 처리: 댓글 수집 → `SummaryInput[]` → AI 요약 생성 → 전역 AI 계정 명의 최상위 댓글 등록
- Response `201`: `Comment` (AI가 작성한 댓글)
- Errors:
  - `400` 요약할 댓글이 없음 (`요약할 댓글이 없습니다.`)
  - `500` AI 계정 미시드 (서버 구성 문제)
  - `500` Azure AI Foundry 호출 실패 또는 빈 응답
- 비고:
  - **수집 대상에서 두 가지를 뺀다** — 삭제된 댓글, 그리고 **이전 AI 요약 댓글**.
    후자를 안 빼면 요약의 요약이 되어 재요약할수록 원문에서 멀어진다
  - AI 호출 실패는 500을 그대로 내보낸다. 400으로 바꾸지 않는다 —
    Azure 장애나 타임아웃은 서버 사정이고 사용자가 고칠 것이 없다
  - 매번 새 댓글이 쌓인다. 기존 요약을 갱신하지 않는다(UC-14)
  - 삭제된 엔드포인트에서도 동작한다(FR-11.2)
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
| GET    | `/api/users/me`                     | findMe             | —                     | —              | —           | Auth                        | 1        | —             | —            |
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
| PATCH  | `/api/endpoints/:id/comments/move`  | moveComments       | `MoveCommentDto`      | `id`           | —           | Owner                       | 3        | `endpoint`    | `OWNER`      |
| GET    | `/api/endpoints/:id/comments`       | findComments       | —                     | `id`           | —           | Member                      | 3        | `endpoint`    | —            |
| POST   | `/api/endpoints/:id/comments`       | createComment      | `CreateCommentDto`    | `id`           | —           | Member                      | 3        | `endpoint`    | —            |
| POST   | `/api/endpoints/:id/ai-summary`     | summarizeThread    | —                     | `id`           | —           | Member                      | 3        | `endpoint`    | —            |
| POST   | `/api/comments/:id/replies`         | createReply        | `CreateCommentDto`    | `id`           | —           | Member                      | 3        | `comment`     | —            |
| POST   | `/api/comments/:id/reactions`       | toggleReaction     | `CreateReactionDto`   | `id`           | —           | Member                      | 3        | `comment`     | —            |
| PATCH  | `/api/comments/:id`                 | updateComment      | `UpdateCommentDto`    | `id`           | —           | Member + 본인(assertAuthor) | 3        | `comment`     | —            |
| DELETE | `/api/comments/:id`                 | softDeleteComment  | —                     | `id`           | —           | Member + 본인(assertAuthor) | 3        | `comment`     | —            |
| GET    | `/api/notifications`                | findNotifications  | —                     | —              | —           | Auth                        | 1        | —             | —            |
| PATCH  | `/api/notifications/:id/read`       | markAsRead         | —                     | `id`           | —           | Auth                        | 1        | —             | —            |

- 인증 헤더: 공개 라우트(계층 0)를 제외한 모든 라우트는 `Authorization: Bearer <token>` 필요(0-2). 라우트별로 반복 표기하지 않음.
- AuthUser: 컨트롤러 시그니처의 `user`는 JWT에서 서버가 주입(`@CurrentUser`)하는 값 — 클라이언트 입력이 아니므로 표에서 제외.
- `UpdateCommentDto`는 `CreateCommentDto`와 동형(별칭).
- `assertAuthor`는 `updateComment`/`softDeleteComment`에서만 호출되는데, 가드(`@ProjectScope` 역참조)와 `assertAuthor`가 각각 댓글을 조회해 조회가 2번으로 중복되지만, 가드 일관성을 우선해 중복을 유지한다.
