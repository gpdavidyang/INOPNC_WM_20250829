# Supabase Migration Guide

## 현재 상황

데이터베이스에 두 가지 버전의 스키마가 혼재:
- Simple Project Management Schema (현재 적용됨)
- Construction Worklog Schema (목표 스키마)

## 마이그레이션 전략

### 1. 안전한 점진적 마이그레이션 (권장)

이 방법은 기존 데이터를 보존하면서 스키마를 업데이트합니다.

```bash
# 1단계: 기존 프로필 데이터에 누락된 컬럼 추가
supabase db push --file supabase/migrations/100_safe_schema_update.sql

# 2단계: 나머지 건설 현장 관리 테이블 추가
supabase db push --file supabase/migrations/101_complete_construction_schema.sql
```

#### 장점:
- ✅ 기존 5명의 사용자 데이터 보존
- ✅ 다운타임 없음
- ✅ 점진적 적용 가능
- ✅ 롤백 가능

#### 수행 내용:
1. profiles 테이블에 누락된 컬럼 추가 (organization_id, site_id, phone, status 등)
2. 기본 조직/현장 생성 및 기존 사용자 연결
3. 외래 키 제약 조건 추가
4. 트리거 함수 수정
5. 나머지 테이블 생성 (daily_reports, work_logs, materials 등)
6. RLS 정책 적용

### 2. 클린 슬레이트 접근법 (데이터 손실 주의)

모든 데이터를 삭제하고 처음부터 다시 시작:

```bash
# 주의: 모든 데이터가 삭제됩니다!
# 1단계: 모든 기존 테이블 삭제
supabase db push --file supabase/migrations/000_drop_all_existing_tables.sql

# 2단계: Construction Worklog 스키마 적용
supabase db push --file supabase/migrations/001_construction_worklog_schema.sql

# 3단계: 나머지 마이그레이션 순차 적용
supabase db push --file supabase/migrations/002_fix_profiles_rls.sql
supabase db push --file supabase/migrations/003_add_login_count_trigger.sql
# ... 나머지 마이그레이션들
```

#### 장점:
- ✅ 깨끗한 스키마 구조
- ✅ 의존성 문제 없음

#### 단점:
- ❌ 모든 기존 데이터 손실
- ❌ 사용자 재등록 필요

## 프로덕션 환경 권장사항

### 1. 백업 우선
```bash
# 데이터베이스 백업
supabase db dump -f backup_$(date +%Y%m%d_%H%M%S).sql
```

### 2. 스테이징 환경 테스트
- 별도의 Supabase 프로젝트에서 마이그레이션 테스트
- 모든 기능 검증 후 프로덕션 적용

### 3. 단계별 적용
```bash
# 1. 백업
supabase db dump -f production_backup.sql

# 2. 안전한 스키마 업데이트 적용
supabase db push --file supabase/migrations/100_safe_schema_update.sql

# 3. 데이터 검증
# - 기존 사용자 로그인 테스트
# - 프로필 데이터 확인

# 4. 나머지 스키마 적용
supabase db push --file supabase/migrations/101_complete_construction_schema.sql

# 5. 전체 기능 테스트
```

### 4. 모니터링
- 마이그레이션 후 에러 로그 모니터링
- 사용자 피드백 수집
- 성능 메트릭 확인

## 롤백 계획

문제 발생 시:
```bash
# 백업에서 복원
psql -h [DATABASE_URL] -f production_backup.sql
```

## 마이그레이션 체크리스트

- [ ] 프로덕션 데이터 백업
- [ ] 스테이징 환경에서 테스트
- [ ] 마이그레이션 스크립트 실행
- [ ] 기존 사용자 로그인 테스트
- [ ] 새 사용자 등록 테스트
- [ ] API 엔드포인트 테스트
- [ ] RLS 정책 검증
- [ ] 성능 테스트
- [ ] 모니터링 설정

## 주의사항

1. **organization_id/site_id 누락 문제**
   - 100_safe_schema_update.sql이 자동으로 기본값 할당
   - 나중에 관리자가 적절한 조직/현장으로 재할당 필요

2. **트리거 의존성**
   - handle_new_user() 함수가 새 컬럼 참조
   - 마이그레이션이 순서대로 실행되어야 함

3. **RLS 정책**
   - 새 테이블에 대한 RLS 정책 검토 필요
   - 조직/현장 기반 접근 제어 구현됨

## 문의사항

마이그레이션 중 문제 발생 시:
1. 에러 메시지 전체 캡처
2. 실행한 명령어 기록
3. 현재 데이터베이스 상태 확인 (테이블, 컬럼 목록)