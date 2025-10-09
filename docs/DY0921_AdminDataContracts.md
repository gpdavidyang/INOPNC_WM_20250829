# DY0921 관리자 데이터 계약 개요

관리자 영역에서 다룰 핵심 도메인별로 Supabase 테이블 · 뷰 · Route Handler를 매핑한다. Phase 1~2 개발 시 데이터 소스를 명확히 하고 RLS/권한 체크를 용이하게 하기 위함이다.

## 1. 도메인 매핑 표

| 도메인            | 주요 테이블/뷰                                                                                            | 관련 서버 액션 / API                                                                            | 주 사용 레이아웃        | 메모                                                                         |
| ----------------- | --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ----------------------- | ---------------------------------------------------------------------------- |
| 사용자 관리       | `profiles`, `site_assignments`, `user_documents`, `daily_reports`                                         | `app/actions/admin/users.ts`, `/api/admin/users`, `/api/admin/assignment/user-assignments`      | 사용자 목록, 상세, 배정 | site_assignments join 시 `sites` inner join 필요. RLS: 관리자 role 검사 필수 |
| 조직/파트너       | `organizations`, `partner_companies`, `profiles`                                                          | `/api/admin/organizations`, `/api/admin/assignment/partner-site-mappings`                       | 조직 개요, 파트너 상세  | 조직 ↔ 사용자 연결: `profiles.organization_id`                              |
| 현장 관리         | `sites`, `site_assignments`, `daily_reports`, `documents`                                                 | `app/actions/admin/sites.ts`, `/api/admin/sites/**`                                             | 현장 목록/탭            | 작업일지/문서 탭과 데이터 공유. RLS: site-manager도 접근 가능 여부 정의      |
| 작업일지          | `daily_reports`, `work_logs`, `photo_grids`, `markup_documents`                                           | `app/actions/admin/daily-reports.ts`, `/api/admin/daily-reports/**`                             | 일지 승인, 사진/문서 탭 | 보고서 승인/첨부물 업로드/다운로드 경로 정비 필요                            |
| 문서/필수 서류    | `unified_document_system`, `document_access_logs`, `required_document_types`, `user_document_submissions` | `app/actions/admin/documents.ts`, `/api/admin/documents/**`, `/api/admin/document-requirements` | 문서함, 필수서류 현황   | Storage 접근은 `/api/admin/documents/upload` 등 라우트 사용                  |
| 빠른 작업         | (삭제됨)                                                                                                  | (삭제됨)                                                                                        | (섹션 제거됨)           | 2025-10-09 기준, UI/API/테이블 제거                                          |
| 배정 관리         | `site_assignments`, `partner_site_mappings`, `profiles`, `sites`                                          | `/api/admin/assignment/**`                                                                      | 통합 배정 대시보드      | 최근 활동 로그는 `/api/admin/assignment/dashboard/activity`                  |
| 자재 관리         | `material_inventory`, `material_transactions`, `materials`                                                | `/api/admin/materials`, `/app/actions/admin/materials.ts`                                       | 자재 현황(계획)         | 모바일 자재 서비스와 계약 맞춤 필요                                          |
| 급여 관리         | `salary_statements`, `worker_salary_settings`, `work_records`, `site_assignments`                         | `/api/admin/salary/**`, `app/actions/admin/worker-salary-settings.ts`                           | 급여 대시보드/설정      | Edge Function/뷰 활용 여부 확인 필요                                         |
| 알림/커뮤니케이션 | `notifications`, `notification_templates`, `notification_logs`                                            | `/api/admin/notifications/**`, `app/actions/admin/email-notifications.ts`                       | 알림 센터 (Phase 2)     | Push vs Email 분리 고려                                                      |
| 시스템/백업       | `system_status_logs`, `backup_jobs` (미정)                                                                | `/api/admin/system/status`, `/api/admin/backup`                                                 | 시스템 상태, 백업       | 현 상태는 Stub → 실제 지표 테이블 합의 필요                                  |
| 분석              | 집계 뷰 (`analytics_*`), `daily_reports`, `material_transactions`                                         | `/api/admin/analytics/**`, `app/actions/admin/production.ts`, `.../shipments.ts`                | 분석 대시보드           | Stub 제거 후 Supabase view 또는 Edge Function 제공 필요                      |

## 2. 권한 & RLS 체크리스트

1. 모든 `/api/admin/**` Route Handler는 `requireApiAuth()` → `auth.role`(`admin`/`system_admin`) 검증.
2. 서버 액션(`withAdminAuth`) 내부에서도 `profiles.role` 확인 후 쿼리 실행.
3. RLS 정책 확인 필요 도메인: `unified_document_system`, `material_inventory`, `salary_*`, `notifications`.
4. 사용자/현장 데이터는 비관리자 접근 허용 여부를 결정(예: site_manager RLS 예외).

## 3. 데이터 조인 패턴

- 사용자 상세: `profiles` + `organizations` left join + `site_assignments` inner join + 문서/일지 통계.
- 현장 탭: `sites` + `site_assignments` + `unified_document_system`/`photo_grids`/`daily_reports`.
- 문서함: `unified_document_system` + `document_access_logs` (뷰 또는 시간순 정렬) + Storage 경로.
- 급여: `salary_statements` → `work_records`(근무시간) → `worker_salary_settings`(기본급/수당).

## 4. API/액션 개선 TODO

- `/api/admin/documents` 계열: Storage 파일 처리 공통 모듈화 (`lib/utils/storage.ts` 예정).
- `/api/admin/assignment/dashboard/*`: 통계/활동 API가 단일 transaction 내에서 작동하도록 Refactor.
- `/api/admin/system/status`: Stub → 실제 모니터링 소스(예: Edge Functions fetch, 외부 API)로 교체.
- `/api/admin/analytics/dashboard`: Stub fallback 제거 후 View 기반 응답 (기간 필터 파라미터 정의).

## 5. 문서화 & 테스트

- 각 도메인별로 README 또는 ADR 생성하여 테이블-API-UI 매핑을 기록.
- Playwright/E2E에서 API 스텁 대비 실제 Supabase 데이터를 사용하는 smoke 테스트 마련.
- QA용 Seed 스크립트(예: `scripts/seed-admin-fixtures.ts`) 작성 고려.

이 표를 기반으로 Phase 1 이후 도메인별 구현 시 필요한 데이터 소스를 명확히 확인하고, 서버 액션/Route Handler/클라이언트 컴포넌트간 책임을 분리한다.
