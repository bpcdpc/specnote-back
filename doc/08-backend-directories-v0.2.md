# 백엔드 WBS (10일 · 2명)

담당: **희경**, **혜빈**

| 버전 | 일시                 | 근거                                                                                                                                                                                                                                                                                             |
| ---- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| v0.1 | 2026.07.10 FRI 02:32 | 백엔드 WBS 초기 작성                                                                                                                                                                                                                                                                             |
| v0.2 | 2026.07.13 MON 11:33 | 라우트 담당표에 상태 컬럼 추가(⬜ 미착수 / 🔄 리뷰 중 / ✅ 머지됨), projects 조회·수정 마감 7/13 → 7/14 정정                                                                                                                                                                                     |
| v0.3 | 2026.07.27 MON       | **전 항목 완료 반영.** `GET /users/me` (findMe) 행 추가 — WBS 작성 이후에 필요성이 드러나 뒤늦게 배정된 라우트. 댓글 이동을 `PATCH /comments/:id/move` (moveThread) → `PATCH /endpoints/:id/comments/move` (moveComments)로 정정하고 의존성 순서의 "트랜잭션" 표기 삭제(단일 updateMany로 바뀜). |

## 의존성 순서 (이 순서대로 작업해야 안 깨지고 진행됩니다.)

1. **기반 내부 함수 먼저** — `createNotification`, `getMembership`, `getLatestSnapshotVersion`
   (초대·멘션·엔드포인트 상세가 이걸 호출하기 때문에 먼저 만들어 놓습니다.)
2. **단순 조회/CRUD** — projects 조회, members, notifications, reaction, endpoint 상세
3. **댓글 코어** — `findComments`(트리, 좀 어려울 것 같습니다.) → `createComment` → `createReply` → 수정/삭제
4. **고급** — `moveComments`, `generateSummary`(외부연동), `summarizeThread`(findAiUser 값을 조합해 createComment 합니다.)

> `findAiUser` + AI 계정 시드는 사전 준비 완료 (WBS 범위 밖)

## 라우트 담당표

범례: ⬜ 미착수 · 🔄 리뷰 중 · ✅ 머지됨

| 라우트 / 함수                                               | 담당       | 마감      | 상태      |
| ----------------------------------------------------------- | ---------- | --------- | --------- |
| `createNotification` (내부)                                 | 희경, 혜빈 | 7/10 (금) | ✅ 머지됨 |
| `getMembership` (내부)                                      | 희경, 혜빈 | 7/10 (금) | ✅ 머지됨 |
| `getLatestSnapshotVersion` (내부)                           | 희경, 혜빈 | 7/10 (금) | ✅ 머지됨 |
| `GET /projects` (findMyProjects)                            | 희경, 혜빈 | 7/14 (화) | ✅ 머지됨 |
| `PATCH /projects/:id` (updateProject)                       | 희경, 혜빈 | 7/14 (화) | ✅ 머지됨 |
| `DELETE /projects/:id` (softDeleteProject)                  | 희경, 혜빈 | 7/14 (화) | ✅ 머지됨 |
| `POST /projects/:id/members` (inviteMember)                 | 혜빈       | 7/15 (수) | ✅ 머지됨 |
| `DELETE /projects/:id/members/:userId` (removeMember)       | 혜빈       | 7/15 (수) | ✅ 머지됨 |
| `GET /projects/:id/members` (findMembers)                   | 혜빈       | 7/15 (수) | ✅ 머지됨 |
| `GET /users/me` (findMe)                                    | 혜빈       | 7/25 (금) | ✅ 머지됨 |
| `GET /endpoints/:id` (findEndpointDetail)                   | 혜빈       | 7/16 (목) | ✅ 머지됨 |
| `POST /comments/:id/reactions` (toggleReaction)             | 혜빈       | 7/16 (목) | ✅ 머지됨 |
| `GET /notifications` (findNotifications)                    | 혜빈       | 7/16 (목) | ✅ 머지됨 |
| `PATCH /notifications/:id/read` (markAsRead)                | 혜빈       | 7/16 (목) | ✅ 머지됨 |
| `ai.generateSummary` (Azure 호출)                           | 혜빈       | 7/20 (월) | ✅ 머지됨 |
| `POST /endpoints/:id/ai-summary` (summarizeThread)          | 혜빈       | 7/23 (목) | ✅ 머지됨 |
| `GET /endpoints/:id/comments` (findComments)                | 희경       | 7/15 (수) | ✅ 머지됨 |
| `syncMemberMentions` / `syncEndpointMentions` (내부)        | 희경       | 7/16 (목) | ✅ 머지됨 |
| `POST /endpoints/:id/comments` (createComment)              | 희경       | 7/17 (금) | ✅ 머지됨 |
| `POST /comments/:id/replies` (createReply + normalizeReply) | 희경       | 7/20 (월) | ✅ 머지됨 |
| `PATCH /comments/:id` (updateComment + assertAuthor)        | 희경       | 7/21 (화) | ✅ 머지됨 |
| `DELETE /comments/:id` (softDeleteComment)                  | 희경       | 7/21 (화) | ✅ 머지됨 |
| `PATCH /endpoints/:id/comments/move` (moveComments)         | 희경       | 7/22 (수) | ✅ 머지됨 |

## 트랙별 흐름

**혜빈 — Prisma CRUD + AI 외부연동**

- 7/10 : 내부 함수 3개 → 7/14 : projects 조회·수정 → 7/15 : members → 7/16 : endpoint·reaction·notifications
- 7/17 - 7/20 : `ai.generateSummary` (Azure 호출) → 7/22 - 7/23 : `summarizeThread` → 7/24 테스트

**희경 — 트리·트랜잭션·멘션**

- 7/10 - 7/15 : `findComments`(트리 조립) → 7/16 : mentions → 7/17 : `createComment` → 7/20 : `createReply`
- 7/21 : 수정/삭제(assertAuthor) → 7/22 : moveComments → 7/23 - 7/24 : 테스트

## 분담 원칙

- **혜빈**: 단일 테이블 조회·수정 + AI 외부연동
- **희경**: 여러 조인·트랜잭션·2뎁스 정규화

## 완료 (2026.07.27)

**전 라우트 머지 완료.** 프론트 배관(9단계)이 실 데이터로 붙을 수 있는 상태다.

WBS 작성 시점 이후에 바뀐 것 두 가지를 기록해 둔다.

**1. `GET /users/me` (findMe) — 뒤늦게 추가**

WBS에 없던 라우트다. 프론트 11단계에서 "새로고침 후 유저 이름을 얻을 경로가 없다"는
문제가 드러나 배정했다. 로그인 응답이 `{ access_token }`뿐이고 `JwtPayload`에
`userName`이 없어서다. 토큰 유효성 검증도 겸한다.

**2. 댓글 이동 — 스레드 단위에서 엔드포인트 단위로**

`PATCH /comments/:id/move` (moveThread) → `PATCH /endpoints/:id/comments/move` (moveComments).
논의는 엔드포인트에 매인 것이라 스레드 하나만 옮기면 남은 댓글과 맥락이 끊긴다(FR-12 v0.7).

- `:id`가 endpointId로 바뀌어 `@ProjectScope('endpoint')`가 필요해졌고,
  그래서 라우트를 `EndpointsController`가 받는다. 구현은 `comments.service.ts`에 남는다.
- `parentId` 판정이 사라져 대댓글 단독 이동 400 조항도 없어졌다.
- 단일 `updateMany`가 되어 **트랜잭션이 불필요**해졌다. WBS의 "고급 — 트랜잭션" 분류는
  이 항목에 더 이상 맞지 않는다.

## 후속 (WBS 범위 밖)

- **AI 검색/질문 기능** — `askAboutThread`, `searchComments`, `findRelevantCommentIds`.
  프로젝트 스코프 기능으로 재설계하기로 하고 범위에서 뺐다. UC부터 다시 써야 하는 작업이라
  별도 회차로 다룬다.
- **로그아웃** — 백엔드 메서드가 없다. 기능정의서와 API 명세서에만 반영 예정이며
  아직 시그니처가 정해지지 않았다.
