# 깃 브랜치 전략 (GitHub Flow)

| 버전 | 일시 | 변경 내용 |
| --- | --- | --- |
| v0.1 | 2026.07.08 WED 14:00 | 최초 작성 |

---

## 1. 전략 개요

SpecNote는 GitHub Flow를 사용한다.

- 장수 브랜치는 `main` **하나뿐**이다.
- 모든 작업은 `main`에서 짧은 브랜치를 따서 → 작업 → PR → 리뷰 → `main`에 머지 → 브랜치 삭제.
- 이 사이클을 반복한다.

---

## 2. 원칙

1. `main`은 항상 배포 가능한 상태를 유지한다. 깨진 코드를 직접 푸시하지 않는다.
2. `main`에 직접 push 금지. 모든 변경은 PR을 통해 들어온다.
3. 브랜치는 **작게, 짧게** 가져간다. 하나의 브랜치 = 하나의 작업 단위.
4. 머지된 브랜치는 **바로 삭제**한다.

---

## 3. 브랜치 네이밍

`<타입>/<간단한-설명>` 형식, kebab-case.

| 타입 | 용도 | 예시 |
| --- | --- | --- |
| `feat` | 기능 추가 | `feat/auth-login` |
| `fix` | 버그 수정 | `fix/comment-depth` |
| `refactor` | 리팩터링 | `refactor/prisma-module` |
| `docs` | 문서 | `docs/branch-strategy` |
| `chore` | 설정·빌드 등 | `chore/tsconfig-paths` |

---

## 4. 작업 흐름

```bash
# 1. main 최신화
git checkout main
git pull origin main

# 2. 브랜치 생성
git checkout -b feat/auth-login

# 3. 작업 + 커밋
git add .
git commit -m "feat: 로그인 API 구현"

# 4. 원격 푸시
git push -u origin feat/auth-login

# 5. GitHub에서 PR 생성 → 리뷰 → 머지 → 브랜치 삭제
```

머지 후 로컬 정리:

```bash
git checkout main
git pull origin main
git branch -d feat/auth-login
```

---

## 5. 커밋 메시지

Conventional Commits 형식으로 커밋한다.

```
<타입>: <내용>

feat: 엔드포인트 소프트 삭제 로직 추가
fix: 대댓글 depth 정규화 오류 수정
docs: 브랜치 전략 문서 작성
```

---

## 6. PR 규칙

- 제목은 무엇을 했는지 한 줄로.
- 본문에 변경 요약과 리뷰 포인트를 적는다.
- 팀장 리뷰 후 머지(관행적으로 진행하며, ruleset으로 강제하지는 않는다).
- 머지 방식은 Squash and merge를 기본으로 한다(히스토리 정리).
- 충돌은 브랜치 소유자가 `main`을 리베이스/머지해서 해결한 뒤 다시 올린다.

---

## 7. 주의

- 브랜치를 오래 방치하면 `main`과 벌어져 충돌이 커진다. **하루 이틀 단위**로 끊어서 머지한다.
- 여러 사람이 같은 파일(예: `schema.prisma`)을 건드릴 때는 사전에 조율한다.
- `main`이 깨지면 최우선으로 고친다.