# Lint 범위 조정 전략 (Auth 개선 집중)

## 1. 배경

- 전체 `next lint` 실행 시 미완성 Admin UI 코드에서 수백 건의 오류가 발생하여 CI가 막힘
- 현재 우선순위는 인증( auth ) 리팩토링 검증이므로, 관련 파일만 선별적으로 검사하는 전략이 필요

## 2. 단기 전략

### 2.1 Auth 전용 Lint 스크립트 추가

- `package.json` 에 다음 스크립트 추가 권장:
  ```json
  {
    "scripts": {
      "lint:auth": "next lint --dir lib --dir middleware.ts --dir app/api/photo-grids --dir app/actions/shared"
    }
  }
  ```
- CI 파이프라인에서 `npm run lint:auth` 를 실행해 인증 관련 변경만 빠르게 검증

### 2.2 필요 시 임시 `.eslintignore` 조정

- 기존 오류가 쌓인 경로를 일시적으로 제외할 수 있음 (예: `app/dashboard/admin/**`, `components/admin/**`)
- 단, 장기적으로는 해당 경로의 미완성 컴포넌트 정리가 필요하므로 임시 방편으로만 활용

## 3. 후속 액션

1. Auth 개선 작업 완료 후 `lint:auth` 스크립트로 CI 안정화
2. 별도 이슈에서 Admin UI 전반 리팩토링 및 lint 오류 제거 계획 수립
3. 모든 경로의 lint 통과가 가능해지면 `.eslintignore` 복원 및 `next lint` 전체 실행 재도입

## 4. 참고

- 인증 관련 주요 경로: `lib/**`, `middleware.ts`, `app/api/photo-grids/**`, `app/actions/shared/**`
- 필요 시 추가되는 인증 파일이 있으면 `lint:auth` 스크립트에 경로를 더해 관리
