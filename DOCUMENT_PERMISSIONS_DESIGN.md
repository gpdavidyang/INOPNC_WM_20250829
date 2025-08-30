# 문서 권한 시스템 설계

## 문서함별 권한 구조

### 1. 공유문서함 (shared_documents)
- **권한**: 현장별로 보기/다운로드/공유
- **접근자**: 현장 관련 모든 사용자 + Admin
- **범위**: site_id 기준으로 권한 제어

### 2. 도면마킹문서함 (markup_documents) 
- **권한**: 현장별로 보기/다운로드/공유
- **접근자**: 현장 관련 모든 사용자 + Admin
- **범위**: site_id 기준으로 권한 제어

### 3. 필수제출서류함 (required_documents)
- **권한**: 작업자 ↔ 현장관리자 ↔ 본사관리자
- **접근자**: worker, site_manager, admin
- **범위**: 역할 기반 권한 제어

### 4. 기성청구문서함 (invoice_documents)
- **권한**: 파트너사(Customer) ↔ 본사관리자
- **접근자**: customer, admin
- **범위**: 고객사별 권한 제어

## 데이터베이스 스키마

### document_categories 테이블
```sql
CREATE TABLE document_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'shared', 'markup', 'required', 'invoice'
  description TEXT,
  permission_model VARCHAR(50) NOT NULL, -- 'site_based', 'role_based', 'customer_based'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### document_permissions 테이블
```sql
CREATE TABLE document_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES unified_documents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  customer_company_id UUID REFERENCES customer_companies(id) ON DELETE CASCADE,
  permission_type VARCHAR(20) NOT NULL, -- 'view', 'download', 'share', 'edit'
  granted_by UUID REFERENCES profiles(id),
  granted_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### document_access_rules 테이블
```sql
CREATE TABLE document_access_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_type VARCHAR(50) NOT NULL, -- 'shared', 'markup', 'required', 'invoice'
  role VARCHAR(50) NOT NULL, -- 'admin', 'site_manager', 'worker', 'customer'
  site_access BOOLEAN DEFAULT FALSE, -- 현장별 접근 권한
  customer_access BOOLEAN DEFAULT FALSE, -- 고객사별 접근 권한
  global_access BOOLEAN DEFAULT FALSE, -- 전체 접근 권한
  can_view BOOLEAN DEFAULT TRUE,
  can_download BOOLEAN DEFAULT FALSE,
  can_share BOOLEAN DEFAULT FALSE,
  can_edit BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(category_type, role)
);
```

## 권한 매트릭스

| 문서함 | Admin | Site Manager | Worker | Customer |
|--------|--------|--------------|--------|----------|
| **공유문서함** | 전체 접근 | 담당 현장만 | 배정 현장만 | 계약 현장만 |
| **도면마킹문서함** | 전체 접근 | 담당 현장만 | 배정 현장만 | 계약 현장만 |
| **필수제출서류함** | 전체 접근 | 담당 현장만 | 본인 제출분만 | 접근 불가 |
| **기성청구문서함** | 전체 접근 | 접근 불가 | 접근 불가 | 본인 계약분만 |

## API 엔드포인트 설계

### GET /api/documents/permissions/{documentId}
문서의 권한 정보 조회

### POST /api/documents/permissions
문서 권한 부여

### GET /api/documents/accessible
사용자가 접근 가능한 문서 목록

### GET /api/admin/documents/integrated
Admin용 모든 문서함 통합 조회