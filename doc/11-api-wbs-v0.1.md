# 백엔드 WBS (10일 · 2명)

담당: **희경**, **혜빈**

| 버전 | 일시                 | 근거                 |
| ---- | -------------------- | -------------------- |
| v0.1 | 2026.07.10 FRI 02:32 | 백엔드 WBS 초기 작성 |

## 의존성 순서 (이 순서대로 작업해야 안 깨지고 진행됩니다.)

1. **기반 내부 함수 먼저** — `createNotification`, `getMembership`, `getLatestSnapshotVersion`
   (초대·멘션·엔드포인트 상세가 이걸 호출하기 때문에 먼저 만들어 놓습니다.)
2. **단순 조회/CRUD** — projects 조회, members, notifications, reaction, endpoint 상세
3. **댓글 코어** — `findComments`(트리, 좀 어려울 것 같습니다.) → `createComment` → `createReply` → 수정/삭제
4. **고급** — `moveThread`(트랜잭션), `generateSummary`(외부연동), `summarizeThread`(findAiUser 값을 조합해 createComment 합니다.)

> `findAiUser` + AI 계정 시드는 사전 준비 완료 (WBS 범위 밖)

## 라우트 담당표

| 라우트 / 함수                                               | 담당       | 마감      |
| ----------------------------------------------------------- | ---------- | --------- |
| `createNotification` (내부)                                 | 희경, 혜빈 | 7/10 (금) |
| `getMembership` (내부)                                      | 희경, 혜빈 | 7/10 (금) |
| `getLatestSnapshotVersion` (내부)                           | 희경, 혜빈 | 7/10 (금) |
| `GET /projects` (findMyProjects)                            | 희경, 혜빈 | 7/13 (월) |
| `PATCH /projects/:id` (updateProject)                       | 희경, 혜빈 | 7/13 (월) |
| `DELETE /projects/:id` (softDeleteProject)                  | 희경, 혜빈 | 7/13 (월) |
| `POST /projects/:id/members` (inviteMember)                 | 혜빈       | 7/15 (수) |
| `DELETE /projects/:id/members/:userId` (removeMember)       | 혜빈       | 7/15 (수) |
| `GET /projects/:id/members` (findMembers)                   | 혜빈       | 7/15 (수) |
| `GET /endpoints/:id` (findEndpointDetail)                   | 혜빈       | 7/16 (목) |
| `POST /comments/:id/reactions` (toggleReaction)             | 혜빈       | 7/16 (목) |
| `GET /notifications` (findNotifications)                    | 혜빈       | 7/16 (목) |
| `PATCH /notifications/:id/read` (markAsRead)                | 혜빈       | 7/16 (목) |
| `ai.generateSummary` (Azure 호출)                           | 혜빈       | 7/20 (월) |
| `POST /endpoints/:id/ai-summary` (summarizeThread)          | 혜빈       | 7/23 (목) |
| `GET /endpoints/:id/comments` (findComments)                | 희경       | 7/15 (수) |
| `syncMemberMentions` / `syncEndpointMentions` (내부)        | 희경       | 7/16 (목) |
| `POST /endpoints/:id/comments` (createComment)              | 희경       | 7/17 (금) |
| `POST /comments/:id/replies` (createReply + normalizeReply) | 희경       | 7/20 (월) |
| `PATCH /comments/:id` (updateComment + assertAuthor)        | 희경       | 7/21 (화) |
| `DELETE /comments/:id` (softDeleteComment)                  | 희경       | 7/21 (화) |
| `PATCH /comments/:id/move` (moveThread)                     | 희경       | 7/22 (수) |

## 트랙별 흐름

**혜빈 — Prisma CRUD + AI 외부연동**

- 7/10 : 내부 함수 3개 → 7/13 : projects 조회·수정 → 7/15 : members → 7/16 : endpoint·reaction·notifications
- 7/17 - 7/20 : `ai.generateSummary` (Azure 호출) → 7/22 - 7/23 : `summarizeThread` → 7/24 테스트

**희경 — 트리·트랜잭션·멘션**

- 7/10 - 7/15 : `findComments`(트리 조립) → 7/16 : mentions → 7/17 : `createComment` → 7/20 : `createReply`
- 7/21 : 수정/삭제(assertAuthor) → 7/22 : moveThread → 7/23 - 7/24 : 테스트

## 분담 원칙

- **혜빈**: 단일 테이블 조회·수정 + AI 외부연동
- **희경**: 여러 조인·트랜잭션·2뎁스 정규화
