# DY0921 Admin Dashboard Remediation Plan

## 1. 목적 & 범위
- 시스템 관리자(Admin) 영역의 잔여 플레이스홀더 화면을 기능 화면으로 복원하고, 레거시 컴포넌트를 최신 인증/데이터 구조에 맞춰 재도입한다.
- `components/admin/legacy/**`에 남아 있는 기존 UI 자산을 평가하여 재사용/대체 여부를 결정하고, 새로운 App Router 구조에서 일관된 접근 제어와 UI 패턴을 확립한다.
- Supabase 기반 데이터 API, RLS 정책, 세션 헬퍼(`lib/supabase/session.ts`)와 정합성을 확보한다.

## 2. 현재 구현 현황 요약
| 구분 | 상태 | 비고 |
| --- | --- | --- |
| 대시보드(Home) | ✅ 신규 UI + Supabase 통계 API 연동 (`getDashboardStats`, `quick_actions`) | 시스템 상태/백업 카드 등 일부 수치는 하드코딩 |
| 통합 배정 | ✅ `AssignmentDashboard`가 `/api/admin/assignment/*` 호출 | 그래프/필터 부재 |
| 조직 관리 | ✅ `OrganizationsOverview`가 `/api/admin/organizations` 호출 | CRUD/상세 화면 미구현 |
| 감사 로그 | ✅ `AuditLogSystem`이 최신 로그 fetch | 필터/다운로드 미구현 |
| 분석 대시보드 | ⚠️ Stub(ADMIN_ANALYTICS_STUB) fallback, 실데이터 불안정 | 메트릭 API 확립 필요 |
| 그 외 메뉴 (사용자, 현장, 문서, 급여, 알림, 커뮤니케이션, 도구 등) | ❌ `AdminPlaceholder`만 노출 | 레거시 UI 대비 기능 부재 |
| 레이아웃/접근 제어 | ✅ `AdminDashboardLayout`, `requireAdminProfile`, `getAuthForClient` | 모바일/접근성 미검증 |

## 3. 갭 분석 (플레이스홀더 도메인)
1. **사용자/조직/파트너 관리**
   - 리스트/상세/배정/권한 변경 화면 부재.
   - 레거시 `UserManagement.tsx`, `PartnerListWrapper.tsx` 등 존재하나 기존 auth API와 결합.
2. **현장 & 작업일지 관리**
   - 현장 목록, 상세, 문서/사진, 근로자 배치 등 주요 워크플로우 미노출.
   - 레거시 `SiteManagement.tsx`, `DailyReports` 관련 구성 요소 사용 가능성.
3. **문서/필수서류/사진대지/Markup**
   - Unified Document System UI 없음. 레거시 다수 (`DocumentManagement`, `PhotoGridReportsManagement`, `MarkupManagement`).
4. **급여 관리**
   - 테이블/통계/설정 UI 없음. 레거시 `SalaryManagement.tsx` 및 하위 컴포넌트 존재.
5. **알림 & 커뮤니케이션**
   - Notification center, Messaging tool 부재. 레거시 `notifications` 폴더 삭제됨.
6. **시스템/도구 탭**
   - 백업/시스템 상태 카드 정적. 서버/스토리지/백업 API 필요.

## 4. 추진 로드맵 제안
### Phase 0 (준비)
- 레거시 컴포넌트 감사: 사용 가능한 모듈 vs 폐기 대상 분류 (표 작성).
- 공통 리소스 확정: Table, Filter, Drawer, Form 컴포넌트 등 재사용 라이브러리 정의.
- 데이터 계약 정리: 주요 도메인 API 스펙 / Supabase 테이블 ↔ 페이지 매핑 문서화.

### Phase 1 (핵심 워크플로우 복구)
1. **사용자·조직 관리**
   - `AdminPlaceholder` 대체 → 목록 + 상세 Drawer.
   - 배정/역할 변경 액션 App Router 서버액션 정비.
2. **현장 관리 & 작업일지**
   - 현장 리스트, 현장 상세(문서/사진/근로자 탭) 복원.
   - 작업일지 리뷰/승인 화면 구현.
3. **문서/필수서류**
   - Unified Document 목록, 필수서류 제출 현황 대시보드 추가.
   - 다운로드/업로드 시 세션 헬퍼 사용 (`getSessionUserId`).

### Phase 2 (운영 도구 & 고도화)
- 급여/급여 통계, 자재 관리, 사진대지, 마크업 도구 UI 복원.
- Notification/Communication 센터 재도입 + Push/Email 발송 기록 뷰어.
- Analytics, System 상태 모듈을 실데이터 기반으로 교체.

### Phase 3 (UX 통합 & 거버넌스)
- 디자인 시스템 정비 및 다크모드/터치모드 대응 검증.
- 접근성(A11y) & 국제화(I18n) 체크.
- 감사 로그/백업/시스템 지표에 대한 모니터링 + Alerting 연동.

## 5. 세부 워크스트림
1. **UI 복원 및 마이그레이션**
   - 레거시 컴포넌트 리팩터링: `use client`/`use server` 경계 정리, supabase auth 호출 제거.
   - 새로운 구조(`app/dashboard/admin/**`)와 맞는 Sub-layout/탭 전환 도입.
2. **데이터 & API 정합성 확보**
   - 레거시에서 사용한 RPC/뷰를 목록화하고, `/app/actions` 혹은 `/app/api`에 신버전 추가.
   - 세션 헬퍼(`getCurrentSession`, `getSessionUser`) 기반으로 모든 작성/로그 기록 동작 통일.
3. **권한/보안 강화**
   - `requireAdminProfile` + `withAdminAuth`를 도메인별 액션에 적용.
   - RLS 정책 검토: 관리자 뷰에서 필요한 권한이 열려 있는지 확인, 테스트 케이스 추가.
4. **테스트 전략**
   - Playwright 시나리오 작성 (최소: 로그인 → 관리자 메뉴 접근 → CRUD).
   - Vitest/Jest 단위 테스트: QuickActions, Assignment 등 API 응답 Mocking.
5. **운영 도구**
   - 백업/시스템 상태: Supabase 혹은 외부 모니터링 API 연동 계획 수립.
   - Analytics: Stub 제거, Supabase `analytics_*` 뷰/Edge Function 실시간 데이터 연동.

## 6. 단계별 출력물 & 체크리스트
| Phase | 핵심 산출물 | 검증 포인트 |
| --- | --- | --- |
| 0 | 레거시 자산 매핑 문서, UI 컴포넌트 가이드 | 활용/폐기 목록 승인 |
| 1 | 사용자/현장/문서 실 서비스 화면, 서버액션 API | 기본 CRUD E2E 테스트, RLS Pass |
| 2 | 급여·자재·사진대지·알림 도구 | DRT(일일 리그레션) 플로우, 성능/로딩 지표 |
| 3 | 디자인 시스템 합본, 모니터링 대시보드 | 접근성 체크리스트, 운영 알림 통합 |

## 7. 리스크 & 대응
- **레거시 코드 호환성**: Supabase v2 API, app router 규약과 충돌 가능 ⇒ 마이그레이션 가이드 작성 후 단계적 리팩터링.
- **데이터 스키마 의존성**: Unified Document 등 테이블 구조 미확정 시 일정 지연 ⇒ 백엔드/DB 팀과 스키마 Freeze 합의 필요.
- **리소스 병목**: UX/디자인, QA 투입 부족 시 완성도 저하 ⇒ Phase별 리뷰 게이트 설정.
- **권한 모델 변경**: Ultra Simple Auth 도입 중이므로, 관리자 화면 복원 시 권한 로직이 중복되지 않도록 철저한 코드 리뷰 필요.

## 8. 다음 단계 제안
1. 주간 Kick-off 미팅에서 상기 로드맵/워크스트림 검토 후 승인.
2. Phase 0 착수: 레거시 컴포넌트 감사 및 문서 작성 (1주 이내).
3. Phase 1 우선순위 선정 (예: 사용자/현장/문서) 및 개발 티켓 발행.
4. Supabase RLS/Edge Function과 연동되는 테스트 환경 세팅.
5. 관리자 화면 공통 디자인 토큰/컴포넌트 정의서 작성.
