# 문서함 관리 시스템

## 개요

INOPNC 작업 관리 시스템의 문서함 관리는 역할 기반 접근 제어(RBAC)를 통해 사용자 유형별로 차별화된 문서 접근 권한을 제공하는 시스템입니다. 각 사용자는 자신의 역할에 따라 특정 문서함에만 접근할 수 있으며, 데이터베이스 수준의 Row Level Security(RLS)와 애플리케이션 수준의 권한 검증을 통해 이중 보안을 구현합니다.

## 사용자 역할 및 권한

### 1. 작업자 (Worker) / 현장관리자 (Site Manager)
- **접근 가능 문서함**:
  - ✅ 공유문서함 (모든 문서)
  - ✅ 도면마킹문서함 (모든 문서)
  - ✅ 필수제출서류함 (본인이 업로드한 문서만)
  - ✅ 사진대지문서함 (모든 문서)
  - ❌ 기성청구문서함 (접근 불가)

### 2. 파트너사 관리자 (Customer Manager)
- **접근 가능 문서함**:
  - ✅ 공유문서함 (자사 파트너사 문서만)
  - ✅ 도면마킹문서함 (자사 파트너사 문서만)
  - ✅ 기성청구문서함 (자사 파트너사 문서만)
  - ✅ 사진대지문서함 (자사 파트너사 문서만)
  - ❌ 필수제출서류함 (접근 불가)

### 3. 시스템 관리자 (Admin / System Admin)
- **접근 가능 문서함**:
  - ✅ 모든 문서함 (전체 접근 권한)

## 기술 아키텍처

### 1. 데이터베이스 구조

#### 주요 테이블
- `unified_document_system`: 통합 문서 관리 테이블
- `markup_documents`: 도면마킹 문서
- `photo_grid_reports`: 사진대지 보고서
- `partner_companies`: 파트너사 정보
- `profiles`: 사용자 프로필 및 역할 정보

#### 스키마 개선사항
```sql
-- markup_documents에 파트너사 연결
ALTER TABLE markup_documents 
ADD COLUMN partner_company_id uuid REFERENCES partner_companies(id);

-- photo_grid_reports에 파트너사 및 현장 연결
ALTER TABLE photo_grid_reports 
ADD COLUMN partner_company_id uuid REFERENCES partner_companies(id),
ADD COLUMN site_id uuid REFERENCES sites(id);
```

### 2. Row Level Security (RLS) 정책

#### 통합 문서 시스템 RLS
```sql
CREATE POLICY "unified_document_access_policy" ON unified_document_system
FOR ALL USING (
  -- 관리자 전체 접근
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'system_admin'))
  OR
  -- 공유문서함: 작업자는 모든 문서, 파트너사는 자사 문서만
  (category_type = 'shared' AND (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('worker', 'site_manager'))
    OR
    (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'customer_manager' AND partner_company_id = partner_company_id))
  ))
  -- 기타 카테고리별 접근 제어 로직
);
```

#### 도면마킹 문서 RLS
```sql
CREATE POLICY "markup_documents_access_policy" ON markup_documents
FOR ALL USING (
  -- 관리자 전체 접근
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'system_admin'))
  OR
  -- 작업자/현장관리자: 모든 문서 접근
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('worker', 'site_manager'))
  OR
  -- 파트너사: 자사 문서만 접근
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'customer_manager' AND p.partner_company_id = markup_documents.partner_company_id)
);
```

### 3. API 라우트 보안

#### 권한 검증 미들웨어
```typescript
// 카테고리별 접근 권한 체크
if (categoryType === 'required' && profile.role === 'customer_manager') {
  return NextResponse.json({ error: '필수서류함에 접근할 권한이 없습니다' }, { status: 403 })
}

if (categoryType === 'invoice' && ['worker', 'site_manager'].includes(profile.role)) {
  return NextResponse.json({ error: '기성청구함에 접근할 권한이 없습니다' }, { status: 403 })
}
```

### 4. 프론트엔드 권한 제어

#### 권한 유틸리티 함수
```typescript
// /lib/document-permissions.ts
export const getAccessibleDocumentCategories = (role: UserRole): DocumentCategory[] => {
  switch (role) {
    case 'admin':
    case 'system_admin':
      return ['shared', 'markup', 'required', 'invoice', 'photo_grid']
    case 'worker':
    case 'site_manager':
      return ['shared', 'markup', 'required', 'photo_grid']
    case 'customer_manager':
      return ['shared', 'markup', 'invoice', 'photo_grid']
    default:
      return []
  }
}
```

#### 라우트 가드
```typescript
// 페이지 수준 권한 검증
if (!canAccessDocumentCategory(profile.role as any, 'photo_grid')) {
  redirect('/dashboard')
}
```

## 구현된 컴포넌트

### 1. 문서 네비게이션
- **파일**: `/components/admin/documents/DocumentNavigation.tsx`
- **기능**: 사용자 역할에 따른 문서함 메뉴 동적 생성
- **특징**: 접근 불가능한 문서함은 비활성화 표시

### 2. 사용자 인증 훅
- **파일**: `/hooks/useUser.ts`
- **기능**: 사용자 세션 및 프로필 정보 관리
- **반환값**: `user`, `profile`, `loading`, `error`, `signOut`

### 3. 통합 문서 관리
- **파일**: `/components/admin/documents/UnifiedDocumentManagement.tsx`
- **기능**: 역할별 문서 목록 필터링 및 표시

## 보안 특징

### 1. 다중 레이어 보안
- **데이터베이스 수준**: RLS 정책으로 데이터 접근 제한
- **API 수준**: 라우트 핸들러에서 권한 검증
- **UI 수준**: 컴포넌트 렌더링 시 권한 확인

### 2. 자동 권한 필터링
- 로그인한 사용자의 역할에 따라 자동으로 문서 목록 필터링
- 권한이 없는 문서는 API 응답에서 제외
- UI에서는 접근 불가능한 메뉴 항목 비활성화

### 3. 파트너사별 데이터 격리
- 파트너사 사용자는 자사 관련 문서만 접근 가능
- 데이터베이스 JOIN을 통한 자동 필터링
- 업로더 프로필 기반 권한 상속

## 파일 구조

```
/app/dashboard/admin/documents/
├── page.tsx                    # 메인 문서 관리 페이지
├── photo-grid/page.tsx         # 사진대지 문서함
├── markup/page.tsx             # 도면마킹 문서함
├── invoice/page.tsx            # 기성청구 문서함
└── required/page.tsx           # 필수제출서류함

/components/admin/documents/
├── DocumentNavigation.tsx      # 문서함 네비게이션
├── UnifiedDocumentManagement.tsx
├── PhotoGridDocumentsManagement.tsx
├── MarkupDocumentsManagement.tsx
├── InvoiceDocumentsManagement.tsx
└── RequiredDocumentsManagement.tsx

/lib/
├── document-permissions.ts     # 권한 유틸리티
├── supabase/
│   ├── client.ts
│   └── server.ts

/hooks/
└── useUser.ts                  # 사용자 인증 훅
```

## 데이터베이스 마이그레이션

### 1. 파트너사 연결 스키마 추가
- **마이그레이션**: `add_partner_company_to_documents`
- **목적**: 문서와 파트너사 간의 관계 설정

### 2. RLS 정책 구현
- **마이그레이션**: `implement_document_rls_policies`
- **목적**: 역할 기반 데이터 접근 제한

## 테스트 및 검증

### 1. 권한 테스트 항목
- [ ] 작업자 로그인 시 기성청구함 접근 불가 확인
- [ ] 파트너사 로그인 시 필수서류함 접근 불가 확인
- [ ] 파트너사별 데이터 격리 확인
- [ ] 관리자 전체 접근 권한 확인

### 2. 데이터 무결성 검증
- [ ] RLS 정책 적용 확인
- [ ] API 라우트 권한 검증 확인
- [ ] UI 메뉴 동적 생성 확인

## 향후 개선 사항

### 1. 세분화된 권한 제어
- 현장별 접근 권한 제한
- 문서 유형별 세부 권한 설정
- 임시 권한 부여 기능

### 2. 감사 로그
- 문서 접근 이력 기록
- 권한 변경 이력 추적
- 보안 이벤트 모니터링

### 3. 성능 최적화
- 권한 캐싱 시스템
- 데이터베이스 인덱스 최적화
- API 응답 시간 개선