# 도면 마킹 도구 시스템 개선 사항

## 변경 일자: 2025-01-02

## 주요 변경사항

### 1. 문서함 통합
- **이전**: 내문서함/공유문서함으로 분리된 저장 체계
- **현재**: "도면마킹문서함"으로 통합된 단일 저장소
- **영향**: 모든 사용자가 동일한 문서함에서 문서를 관리

### 2. 역할별 접근 권한
- 작업자: 본인이 생성한 문서만 조회/편집 가능
- 현장관리자: 본인이 생성한 문서 + 같은 현장의 문서 조회 가능
- 시스템관리자: 모든 문서 조회/관리 가능

### 3. 수정된 파일 목록

#### 컴포넌트
- `/components/markup/dialogs/save-dialog.tsx` - location 필드 제거
- `/components/markup/dialogs/open-dialog.tsx` - 문서함 선택 UI 제거
- `/components/markup/list/markup-document-list.tsx` - 내/공유 필터 제거
- `/components/markup/hooks/use-file-manager.ts` - location 파라미터 제거
- `/components/markup/markup-editor.tsx` - 저장 함수 시그니처 변경
- `/components/admin/tools/AdminMarkupTool.tsx` - location 표시 제거

#### API
- `/app/api/markup-documents/route.ts` - location 필터링 로직 제거

#### 타입 정의
- `/types/index.ts` - MarkupDocument 인터페이스에서 location 필드 제거

#### 데이터베이스
- `/supabase/migrations/20250102_remove_location_field.sql` - 마이그레이션 스크립트

## 사용자 경험 개선사항

### 1. 단순화된 저장 프로세스
- 저장 시 위치 선택 불필요
- 모든 문서가 통합 문서함에 자동 저장

### 2. 일관된 인터페이스
- 모든 역할(작업자, 현장관리자, 관리자)에서 동일한 UI 제공
- 역할별 필터링은 백엔드에서 자동 처리

### 3. 향상된 검색 및 필터링
- 현장별 필터링 기능 유지
- 작성자 기반 자동 필터링
- 통합 검색 기능

## 마이그레이션 가이드

### 데이터베이스 마이그레이션
```bash
# Supabase CLI를 통한 마이그레이션 실행
supabase migration up
```

### 기존 데이터 처리
- 기존 location 필드는 자동으로 제거됨
- 모든 문서가 통합 문서함으로 이동
- 권한 정책은 자동으로 업데이트됨

## 테스트 체크리스트

- [ ] 새 문서 저장 기능 테스트
- [ ] 기존 문서 열기 기능 테스트
- [ ] 문서 목록 조회 테스트
- [ ] 역할별 권한 테스트
  - [ ] 작업자: 본인 문서만 조회
  - [ ] 현장관리자: 현장 문서 조회
  - [ ] 관리자: 전체 문서 조회
- [ ] 검색 기능 테스트
- [ ] 현장 필터링 테스트

## 롤백 계획

필요시 다음 스크립트로 롤백 가능:
```sql
-- 롤백 스크립트 (필요시)
ALTER TABLE markup_documents 
ADD COLUMN location VARCHAR(20) DEFAULT 'personal';

-- 기존 정책 복원
-- (기존 정책 백업 필요)
```

## 문의사항
시스템 관련 문의는 시스템 관리자에게 연락하세요.