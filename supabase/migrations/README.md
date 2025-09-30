# Supabase Migrations

## 최신 업데이트 (2025-08-07)

### RLS 무한 재귀 문제 해결

**중요**: 301, 302 마이그레이션이 profiles 테이블의 무한 재귀 문제를 해결했습니다.

#### 핵심 변경사항

1. **301_simple_rls_policies.sql** - 초기 단순화된 RLS 정책
2. **302_fix_infinite_recursion_rls.sql** - 무한 재귀 방지 패치 (필수!)

#### 권한 구조

- 🔧 **system_admin**: 모든 데이터 무제한 접근
- 👔 **admin/site_manager**: 배정된 현장 데이터만 접근
- 👷 **worker**: 본인 및 같은 현장 팀 데이터만 접근

## 실행 순서

### 초기 설정 (001-006)

1. **001_construction_worklog_schema.sql** - 기본 스키마
2. **002_fix_profiles_rls.sql** - profiles 테이블 RLS 정책
3. **005_create_profile_trigger.sql** - 프로필 자동 생성 트리거
4. **006_fix_profile_creation.sql** - 기존 사용자 프로필 생성

### RLS 정책 수정 (300+)

1. **301_simple_rls_policies.sql** - RLS 단순화
2. **302_fix_infinite_recursion_rls.sql** - 무한 재귀 수정 (필수!)

## 실행 방법

1. Supabase Dashboard 접속
2. SQL Editor 탭 클릭
3. 각 파일의 내용을 복사하여 실행
4. 실행 후 `test-profile-creation.sql`로 결과 확인

### 배정/공수 정합성 복구(2025-09-30)

아래 파일을 순서대로 실행하세요(각 파일은 멱등적입니다):

1. `954_fix_site_assignments_integrity.sql`

- `site_assignments.is_active` 기본값/NOT NULL 보정, 날짜 보정, 활성 중복 방지 유니크 인덱스 생성

2. `955_backfill_site_assignments_from_work_records.sql`

- `work_records` 활동 기반으로 누락된 배정 백필(역할 컬럼 존재 시 기본값 사용)

3. `956_backfill_site_assignments_from_daily_reports.sql`

- `daily_reports.created_by` 기반 관리자급 사용자 배정 백필(역할 컬럼 존재 시 site_manager 기본값)

4. `957_align_work_records_user_id.sql`

- `work_records.user_id`를 `profile_id`로 백필, 조회 인덱스 추가

5. `958_create_site_assignment_gaps_view.sql`

- 최근 180일 활동이 있으나 활성 배정이 없는 사용자-현장 목록 뷰 생성(모니터링 용)

검증 쿼리 예시:

- `SELECT * FROM site_assignment_gaps LIMIT 50;`
- `SELECT COUNT(*) FROM site_assignments WHERE is_active IS NULL;` -- 기대값: 0
- `SELECT site_id, user_id, COUNT(*) FROM site_assignments WHERE is_active = true GROUP BY 1,2 HAVING COUNT(*)>1;` -- 기대값: 0

## 테스트

`test-profile-creation.sql` 파일을 실행하여:

- 현재 사용자와 프로필 매핑 상태 확인
- 트리거와 함수가 제대로 생성되었는지 확인

## 문제 해결

### "infinite recursion detected in policy" 오류

**원인**: profiles 테이블 RLS 정책이 자기 자신을 참조하여 순환 참조 발생
**해결**: 302_fix_infinite_recursion_rls.sql 적용

```sql
-- EXISTS 패턴 사용
EXISTS (
  SELECT 1 FROM profiles p
  WHERE p.id = auth.uid()
  AND p.role = 'system_admin'
  LIMIT 1
)
```

### 프로필이 생성되지 않는 경우

1. Supabase Dashboard에서 auth.users 테이블 확인
2. public.profiles 테이블 확인
3. Database Logs에서 에러 메시지 확인
4. 302 마이그레이션이 적용되었는지 확인

### 데이터 접근이 안 되는 경우

1. 사용자의 role 확인 (profiles 테이블)
2. site_assignments 테이블에서 현장 배정 확인
3. RLS 정책이 올바르게 적용되었는지 확인
