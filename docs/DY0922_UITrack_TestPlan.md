# Ultra Simple Auth – UI Track Cookie & Verification Scenarios

## 1. 목적
- Workstream A의 "UI 트랙을 비민감 쿠키로 분리" 구현 검증
- Workstream D에서 미진했던 성능·호환성·E2E 확인 항목 보완
- 인증 경로에서 `ui-track` 쿠키가 일관되게 설정·정리되는지 확인

## 2. 테스트 범위
- 인증 로그인/로그아웃(Server Action, Middleware, Edge) 플로우
- 비민감 `ui-track` 쿠키의 생성·갱신·삭제 시점
- Jest 기반 회귀(성능, 미들웨어 쿠키 동작)
- Playwright 기반 E2E 로그인 검증

## 3. 환경 준비
1. 의존성 설치: `npm install`
2. 환경 변수 설정: `.env.local` (Supabase URL, 키 등) 준비
3. 테스트 사용자:
   - 모바일 매니저 계정 (예: `manager@inopnc.com` / `password123`)
4. 로컬 서버 포트 충돌 여부 확인: `lsof -nP -iTCP:3000 -sTCP:LISTEN`

## 4. 사전 점검 체크리스트
- [ ] `lib/auth/constants.ts`의 쿠키 상수(`UI_TRACK_COOKIE_NAME`, `UI_TRACK_COOKIE_MAX_AGE`) 존재
- [ ] `app/auth/actions.ts`, `middleware.ts`, `app/api/auth/logout/route.ts`에서 새 쿠키 처리 확인
- [ ] 샌드박스를 사용하는 경우 Playwright `webServer`가 포트 3000에 바인딩 가능

## 5. 자동화 테스트 시나리오

| 구분 | 명령어 | 기대 결과 | 비고 |
| --- | --- | --- | --- |
| Jest | `npm test -- --runTestsByPath __tests__/auth/auth-performance.test.ts` | `Ultra Simple Auth performance and compatibility` 스위트가 25ms 이하 응답, 파트너 제한, 기본 트랙 fallback 검증 | 성능/호환성 확인 |
| Jest | `npm test -- --runTestsByPath __tests__/middleware/ui-track-cookie.test.ts` | 미들웨어가 `ui-track` 쿠키를 설정/삭제하는 2개 케이스 통과 | Edge 미들웨어 동작 |
| Playwright | `PLAYWRIGHT_SKIP_WEB_SERVER=1 npx playwright test --project="chromium" e2e/auth/login.spec.ts` (서버 선행 실행) | 로그인 후 `ui-track` 쿠키가 `/mobile` 값을 갖고 httpOnly=false로 남는지 확인 | 전체 브라우저군 실행은 `npx playwright test` |

## 6. 수동 검증 시나리오
1. **로그인 후 쿠키 확인**
   - `npm run dev -- --hostname 127.0.0.1 --port 3000`
   - 브라우저에서 `/auth/login` 접속 → 매니저 계정 로그인
   - 개발자 도구 Application 탭에서 `ui-track=/mobile` 쿠키 존재, `HttpOnly=false`, `SameSite=Lax`, `Path=/` 확인
2. **로그아웃 후 쿠키 삭제**
   - `/auth/logout` 호출 또는 UI 로그아웃 수행
   - `ui-track`, `user-role`, `sb-*` 쿠키가 삭제되었는지 확인
3. **미들웨어 리다이렉트 경로 확인**
   - 인증된 상태에서 `/auth/login` 접속
   - 즉시 `/mobile` 혹은 `/dashboard/admin` 등 `uiTrack` 경로로 리다이렉트 및 응답 헤더 `X-UI-Track` 체크

## 7. 문제 해결 가이드
- Playwright 실행 시 `listen EPERM 127.0.0.1:3000` 발생 → 포트 선점 프로세스 종료 또는 `PLAYWRIGHT_SKIP_WEB_SERVER=1` 환경 변수 설정 후 별도 서버 실행
- Supabase 인증 실패 시 `.env.local`의 키 재검증 및 `npm run dev` 재시작

## 8. 결과 기록 양식 (예시)
| 날짜 | 실행자 | 테스트 | 결과 | 이슈/메모 |
| --- | --- | --- | --- | --- |
| 2025-09-22 | 담당자 | Jest (performance) | Pass | 응답 6ms |
| 2025-09-22 | 담당자 | Playwright (chromium) | Pass | `ui-track`=/mobile, httpOnly=false |

