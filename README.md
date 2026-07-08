# SpecNote Backend

OpenAPI 스펙을 팀 단위로 함께 보고, **엔드포인트별로 논의를 남길 수 있는** 협업형 API 명세 리뷰 도구의 백엔드 서버.

## 목표

- OpenAPI 스펙을 파싱·재구성하여 탐색 효율을 높인다.
- 엔드포인트별 댓글 스레드로 협업을 지원한다.
- 스펙 문서와 논의 기록을 한곳에 쌓아 검색 가능하게 문서화한다.

Swagger UI·Scalar 같은 단일 컬럼 렌더링 도구와 달리, **스펙 옆에 논의가 붙는** 구조가 핵심 차별점이다.

## 용도

- 소규모 개발팀(~10인)의 API 설계 리뷰 및 협업.
- 프로젝트 단위 멀티테넌시: 사용자는 여러 프로젝트에 속하고, 역할(Owner/Member)은 프로젝트마다 상대적으로 결정된다.
- 프론트엔드(React) 정적 빌드를 함께 서빙하는 단일 서버 구성.

## Tech Stack

- **Framework**: NestJS
- **ORM**: Prisma
- **DB**: PostgreSQL (Azure Database for PostgreSQL)
- **Auth**: JWT (Passport)
- **AI**: Azure AI Foundry (댓글 스레드 요약)
- **배포**: Azure App Service (백엔드 + 프론트 정적 파일 단일 서버)

## 구조

- API 경로는 `/api` prefix로 분리, 그 외 경로는 프론트엔드 `index.html` 반환.
- 도메인: `auth`, `users`, `projects`, `endpoints`, `comments`, `notifications`, `ai`, `common`.

## 실행

```bash
npm install
npx prisma migrate dev
npm run start:dev
```

기본 포트: `:3000`

## License

MIT © 2026 SpecNote Team
