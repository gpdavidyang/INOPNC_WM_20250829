# Ultra Simple Auth 보안 개선 작업 계획

## 1. 배경 및 목표
- 최근 Ultra Simple Auth 리팩토링 이후 인증 경로 전반에서 치명적 취약점 다수 발견
- Supabase 세션 보안을 복구하고 UI 트랙 기반의 접근 제한이 실제 API 층에서도 동작하도록 보장
- 파트너 조직 제한 로직을 일관되게 적용하고, Edge 런타임 호환성을 확보하여 배포 안정성 확보

## 2. 주요 문제 요약
1. `lib/supabase/server.ts`에서 `httpOnly: false`로 설정된 인증 쿠키 → 토큰 탈취 위험
2. `middleware.ts`에서 Edge 미지원 API(`cookies()`) 사용 → 예외 후 인증 우회 발생
3. API/서버 액션이 제거된 `getAuthenticatedUser()`를 호출 → 런타임 오류 및 권한 체크 무력화
4. 새 `requireApiAuth()`/`canAccessData()` 미사용 → 조직 제한 미적용

## 3. 작업 스트림
### Workstream A – Supabase 쿠키 보안 복구
- [ ] `lib/supabase/server.ts` 쿠키 설정을 `httpOnly: true`, `secure`, `sameSite` 기본값 중심으로 재구성
- [ ] UI 트랙 등 클라이언트 힌트가 필요하면 비민감 별도 쿠키로 분리
- [ ] 변경 후 서버/클라이언트 세션 동기화 경로 회귀 테스트

### Workstream B – Edge 호환 미들웨어 재작성
- [ ] Edge 환경에서 동작하는 Supabase 클라이언트 유틸리티 추가 (`createEdgeClient` 등)
- [ ] `middleware.ts`에서 request 기반 쿠키 읽기로 인증 확인, 실패 시 401 리다이렉트
- [ ] 예외 처리 시 `NextResponse.next()` 반환 금지, 명시적 오류 처리 또는 로그인 경로 리다이렉트
- [ ] 캐시 무효화·보안 헤더 로직 유지 여부 검토 및 최소화

### Workstream C – API 가드 전환 및 조직 제한 적용
- [ ] 모든 API Route / Server Action에서 `getAuthenticatedUser()` 호출 제거
- [ ] `requireApiAuth()` 도입 후 반환값 기반으로 조직 제한(`canAccessData`) 검증
- [ ] 파트너 조직 전용 필터가 필요한 쿼리에서 `restrictedOrgId`로 WHERE 조건 확인
- [ ] 추가 보안 로그 또는 감사 이벤트 필요 시 `logAuthEvent` 재사용

### Workstream D – 검증 및 배포 전략
- [ ] 통합 테스트: 로그인, 역할별 UI 리다이렉트, 파트너 데이터 접근 제한
- [ ] `/docs/ultra-simple-auth-testing-strategy.md` 체크리스트 재사용 및 보완
- [ ] E2E(Playwright) 또는 Postman 컬렉션으로 API 가드 회귀 테스트
- [ ] 스테이징 배포 후 24시간 모니터링, Supabase 로그·Sentry 알림 확인

## 4. 세부 일정(가안)
| Day | 작업 내용 |
| --- | --- |
| D1 | Workstream A 구현 및 단위 테스트 |
| D2 | Workstream B 미들웨어 개편, 로컬 통합 테스트 |
| D3 | Workstream C API 가드 적용, 조직 제한 검증 |
| D4 | 테스트 플랜 실행, 리그레션 보완 |
| D5 | 스테이징 배포 및 모니터링, 프로덕션 릴리즈 결정 |

## 5. 리스크 및 대응
- 쿠키 정책 변경으로 인한 클라이언트 사이드 기능 영향 → QA 단계에서 모바일/데스크톱 동시 검증
- Edge 미들웨어에서의 Supabase 제약 → 필요 시 `middleware.ts`를 Node로 제한하거나 RLS로 보완
- API 가드 리팩토링 범위가 넓음 → 기능별 점진 적용 후 배포, 플래그 기반 롤아웃 고려

## 6. 성공 지표
- 로그인/로그아웃 플로우에서 토큰 노출 없음 (`document.cookie`로 접근 불가)
- 인증 실패 시 미들웨어가 즉시 로그인 페이지로 리다이렉트
- 파트너 계정이 타 조직 데이터 조회 시 403 반환
- `docs/ultra-simple-auth-testing-strategy.md` 필수 시나리오 100% 통과

