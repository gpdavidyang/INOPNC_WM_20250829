# DY0921 관리자 레거시 자산 감사 결과

본 문서는 `components/admin/legacy/` 이하에 남아 있는 레거시 관리자 UI 자산을 범주별로 탐색한 뒤, 재사용 여부와 리팩터링 난이도를 기록한 것이다. 재활용 가능한 컴포넌트를 우선적으로 파악해 Phase 1~2 개발 범위를 좁히는 목적이다.

## 1. 요약 표
| 카테고리 | 주요 컴포넌트/폴더 | 현재 기능 범위 | 상태 진단 | 권장 액션 |
| --- | --- | --- | --- | --- |
| 사용자/조직 | `UserManagement.tsx`, `users/`, `organizations/` | 사용자 리스트·필터, 조직 상세/편집, 배정 모달 | Supabase v1 헬퍼 사용, Auth 직접 호출 | 구조 유지하며 `getSessionUser` 기반으로 리팩터링 후 재도입 |
| 현장 관리 | `SiteManagement.tsx`, `sites/`, `SiteWorkersModal.tsx` | 현장 목록·세부 탭, 근로자 배치, 문서 탭 | 다중 탭 구조, `createClient` 직접 호출 | 탭/모달 그대로 포팅, 데이터 fetch 를 서버 액션으로 이관 |
| 작업일지 | `daily-reports/`, `worker-calendar-client.tsx` | 일지 리스트, 감독자 검토, 일정 뷰 | Realtime 구독 등 복잡도 높음 | 우선순위 높음. 핵심 흐름만 선별 후 신규 구조 재구성 |
| 문서/필수서류 | `DocumentManagement.tsx`, `documents/`, `SiteDocumentManagement.tsx` | Unified Document System 뷰, 업로드 모달 | Supabase Storage 직접 사용, 미들웨어 의존 | Storage 호출부를 서버 액션/Route Handler 로 감싸서 재활용 |
| 급여 | `SalaryManagement.tsx`, `salary/`, `WorkerSalarySettings.tsx` | 급여 통계·리포트, 설정 | 데이터 집계 RPC 의존, UI 방대 | 2단계에서 핵심 카드 위주 추출, Edge Function 검토 |
| 자재/툴 | `materials/`, `tools/`, `MarkupManagement.tsx` | 자재 현황, 사진대지/도면마킹 도구, 파일 업로드 | 도면마킹은 Canvas 의존, 모바일과 공유 코드 | 신규 설계 검토 후 재사용 여부 판단 (고난이도) |
| 알림/커뮤니케이션 | `notifications/`, `EmailNotifications.tsx`, `communication/` | 알림 목록, 발송 기록, 템플릿 | Supabase Function 호출, 상태 저장 로직 과도 | RLS / 메시징 정책 정비 후 최소 기능만 복구 |
| 시스템/통합 | `SystemManagement.tsx`, `integrated/`, `SystemManagement.tsx` | 시스템 헬스, 통합 검색 | Stub 데이터 다수 | 신규 Analytics/모니터링 API 준비 후 다시 설계 |

## 2. 상세 진단
### 2.1 사용자 & 조직
- `UserManagement.tsx`, `UserDetailModal.tsx`, `UserSiteAssignmentModal.tsx` 등이 사용자 CRUD, 현장 배정, 필수 서류 상태까지 모두 제공.
- 대부분 `supabase.auth.getSession()`/`createClient()` 패턴을 사용하므로 `lib/supabase/session.ts` 헬퍼로 대체 필요.
- 테이블/필터/모달 구조가 이미 잘 나누어져 있어 Phase 1에서 가장 먼저 재활용하기 적합.

### 2.2 현장 & 작업일지
- `SiteManagement.tsx`는 다섯 개 이상의 탭(개요, 문서, 근로자, 사진 등)을 포함하고, 각 탭에서 하위 컴포넌트를 호출.
- `daily-reports/` 폴더에는 감독자 승인, 일정 캘린더(`WorkerCalendar.tsx`) 등 복잡한 UI가 포함되어 있음. 실데이터와 연동 시 `supabase.from('daily_reports')` 다중 호출을 수행하므로 서버액션화가 필요.
- 복잡도를 감안해 우선 핵심 탭(현장 개요, 배정, 문서)부터 포팅한 뒤 나머지는 Phase 2로 미루는 전략을 권장.

### 2.3 문서/필수 서류/사진대지
- `DocumentManagement.tsx`, `PhotoGridReportsManagement.tsx`, `SiteDocumentManagement.tsx` 등이 Unified Document System의 UI를 담당.
- Storage 업로드/다운로드를 직접 처리하므로 `app/api` Route Handler로 공통화하고, client component에서는 session 헬퍼만 호출하도록 분리 필요.
- 사진대지/마크업 도구는 모바일과 공통 기능이 많으므로 중복 제거 관점에서 설계 재검토 필요.

### 2.4 급여 & 자재
- 급여(`salary/`)는 월별/근로자별 집계, 페이슬립 PDF 미리보기 등 고난도 UI가 이미 완성돼 있으나, RPC/스토어드 프로시저 사용 여부 확인이 필요.
- 자재(`materials/`)는 박스형 카드 + 상세 모달 조합. 현존 모바일 자재 모듈(`modules/mobile/components/work-log/*`)과 데이터 계약을 맞출 필요가 있음.

### 2.5 알림/커뮤니케이션/시스템
- 알림 관리(`notifications/`)와 이메일 발송(`EmailNotifications.tsx`)은 Supabase 함수/Edge Function 의존. 우선순위는 낮으나 RLS/권한 재정비 후 재도입 가능.
- 시스템 관리(`system/`)와 통합 뷰(`integrated/`)는 Stub 데이터 위주라, 실제 모니터링 API 정비 뒤 신규 UI를 만드는 편이 효율적.

## 3. 재사용 우선순위
1. **우선 포팅**: 사용자, 현장(일부), 문서 목록. → Phase 1 핵심 워크플로우.
2. **부분 재활용**: 작업일지, 급여, 자재. → 데이터 계약 정비 후 단계별 이식.
3. **재설계 필요**: 알림, 통신, 시스템, 일부 툴. → Phase 2~3에서 신구 혼합 검토.

## 4. 리팩터링 체크리스트
- `supabase.auth.getSession()` → `getCurrentSession` / `getSessionUser` 헬퍼로 교체.
- API 호출부를 `app/actions/**` 또는 `app/api/**`로 분리하여 Client Component에는 fetch만 남긴다.
- 레거시 레이아웃(`AdminPageLayout.tsx`)을 신규 `AdminDashboardLayout` 표준과 비교하여 스타일 격차를 점검한다.
- 모든 업로드/다운로드 경로는 `/app/api` Route Handler로 통일(직접 Storage 접근 금지).

## 5. 후속 작업
- Phase 0 완료 후, 상기 권장 액션을 바탕으로 각 도메인별 티켓을 생성한다.
- 컴포넌트별 난이도/리소스 추정을 위해 추가 코드 리딩이 필요한 경우, 섹션별로 스프레드시트 정리를 제안.
