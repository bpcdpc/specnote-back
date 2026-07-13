# 네이밍 컨벤션

| 버전 | 일시                 | 변경 내용                                                                                                                  |
| ---- | -------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| v0.1 | 2026.07.05 SUN 10:41 | 최초 작성                                                                                                                  |
| v0.2 | 2026.07.13 MON 10:39 | NestJS 구성요소 접미사 표로 통합(`.type.ts` 별도 항목 흡수, `.guard.ts`·`.decorator.ts`·`.strategy.ts` 추가), 요약 표 반영 |

---

## 1. 함수명

- camelCase, 동사로 시작
  - 예: `fetchSpec`, `validateSpec`, `resolveRef`, `parseFromUrl`
- boolean 반환 함수는 `is` / `has` / `can` 접두사
  - 예: `isValid`, `hasError`, `canEdit`

## 2. 변수명

- camelCase, 명사
  - 예: `rawJson`, `specSnapshot`, `endpointList`
- boolean 변수는 `is` / `has` 접두사
  - 예: `isDeleted`
- 고정 상수만 UPPER_SNAKE_CASE
  - 예: `DEFAULT_TITLE`, `MAX_RETRY`

## 3. 타입 · 인터페이스 · 클래스명

- PascalCase, 명사
- 클래스: `SpecParser`, `EndpointService`
- 인터페이스 / 타입: `ParsedSpec`, `SpecSnapshot`

## 4. enum

- 이름과 값 모두 UPPER_SNAKE_CASE, 명사
- 예: `REACTION_TYPE { DONE, CHECKING, BEST, ACK }`, `ROLE {OWNER, MEMBER}`

## 5. 파일명

### 5-1. NestJS 구성요소

- kebab-case + 점 구분 `<도메인|이름>.<역할>.ts`
- `nest g` 자동 생성 규칙과 동일

| 역할           | 접미사           | 예시                        |
| -------------- | ---------------- | --------------------------- |
| 컨트롤러       | `.controller.ts` | `users.controller.ts`       |
| 서비스         | `.service.ts`    | `projects.service.ts`       |
| 모듈           | `.module.ts`     | `endpoints.module.ts`       |
| DTO            | `.dto.ts`        | `create-user.dto.ts`        |
| 타입 정의      | `.type.ts`       | `spec.type.ts`              |
| 가드           | `.guard.ts`      | `membership.guard.ts`       |
| 데코레이터     | `.decorator.ts`  | `project-role.decorator.ts` |
| 전략(Passport) | `.strategy.ts`   | `jwt.strategy.ts`           |

### 5-2. 순수 유틸 / 헬퍼

- kebab-case, 명사
- 파일은 명사로 식별하고, 동사는 내부 함수명이 담당
  - `ref-resolver.ts` (파일) 안에 `resolveRef()` (함수)
- 예: `openapi-utils.ts`, `ref-resolver.ts`, `spec-validator.ts`

## 6. 폴더명

- kebab-case, 명사
- 기본적으로는 복수형, `auth` 처럼 셀 수 없는 명사나 관행적인 폴더명은 단수 유지
- 예: `src/users/`, `src/endpoints/`, `src/auth/` , `src/common/`

## 7. 배치 규칙 (유틸, 데코레이터, 가드 등)

- 여러 엔티티가 공유하는 요소 → common 폴더 하위 `src/common/decorators/` , `src/common/utils/`
- 특정 도메인 전용 요소 → 해당 도메인 폴더 내부 `src/users/utils/`

---

## 요약 표

| 대상                   | 규칙                            | 예시                       |
| ---------------------- | ------------------------------- | -------------------------- |
| 함수                   | camelCase, 동사로 시작          | `fetchSpec`, `isValid`     |
| 변수                   | camelCase, 명사                 | `rawJson`, `isDeleted`     |
| 상수                   | UPPER_SNAKE_CASE, 명사          | `MAX_RETRY`                |
| 클래스/타입/인터페이스 | PascalCase, 명사                | `SpecParser`, `ParsedSpec` |
| enum (이름·값)         | UPPER_SNAKE_CASE, 명사          | `REACTION_TYPE { DONE }`   |
| 파일 (Nest 구성요소)   | `<도메인\|이름>.<역할>.ts`      | `project.service.ts`       |
| 파일 (순수 유틸)       | kebab-case, 명사                | `spec-resolver.ts`         |
| 폴더                   | kebab-case, 명사, 기본은 복수형 | `endpoints/`               |
