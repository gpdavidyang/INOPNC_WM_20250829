# Frontend V2 개발 백엔드 연동 명세서

## 📋 목차

1. [프로젝트 개요](#1-프로젝트-개요)
2. [Frontend V1 현재 백엔드 구조](#2-frontend-v1-현재-백엔드-구조)
3. [Frontend V2 기능별 백엔드 요구사항](#3-frontend-v2-기능별-백엔드-요구사항)
4. [백엔드 API 상세 명세](#4-백엔드-api-상세-명세)
5. [데이터베이스 스키마](#5-데이터베이스-스키마)
6. [우선순위별 개발 로드맵](#6-우선순위별-개발-로드맵)
7. [기술 스택 권장사항](#7-기술-스택-권장사항)
8. [마이그레이션 가이드](#8-마이그레이션-가이드)

---

## 1. 프로젝트 개요

### 1.1 Frontend V1 (현재 운영중)

- **프레임워크**: Next.js 14 (App Router)
- **백엔드**: Supabase (PostgreSQL + Auth + Storage + Realtime)
- **인증**: Supabase Auth + RLS (Row Level Security)
- **파일 스토리지**: Supabase Storage
- **실시간 기능**: Supabase Realtime

### 1.2 Frontend V2 (개발 예정)

- **프레임워크**: React + Vite (Monorepo 구조)
- **백엔드**: 미구현 (Mock 데이터 사용중)
- **앱 구조**: 5개 독립 앱 (Main, Money, Site, Worklog, Doc)
- **상태관리**: 각 앱별 LocalStorage 사용
- **포트**: Main(3007), Money(3004), Site(3003), Worklog(3005), Doc(3006)

### 1.3 V2 아키텍처 특이사항

- **멀티 앱 구조**: 5개 독립적인 Vite 서버
- **도메인 간 통신**: Cross-origin 인증 토큰 공유 필요
- **오프라인 지원**: LocalStorage 기반 오프라인 우선 설계
- **실시간 동기화**: 앱 간 데이터 실시간 sync 필요

---

## 2. Frontend V1 현재 백엔드 구조

### 2.1 사용 중인 Supabase 서비스

#### 인증 시스템

```typescript
// Supabase Auth 사용
- 회원가입/로그인
- 소셜 로그인 (Google, Kakao)
- MFA (Multi-Factor Authentication)
- 세션 관리
- 비밀번호 재설정
```

#### 데이터베이스 (PostgreSQL)

```sql
-- 주요 테이블
- users (사용자)
- profiles (사용자 프로필)
- organizations (조직)
- sites (현장 정보)
- daily_reports (작업일지)
- documents (문서)
- salary_records (급여 기록)
- notifications (알림)
```

#### 스토리지 (Supabase Storage)

```typescript
// 파일 저장 경로
- documents/ (문서 파일)
- photos/ (사진 파일)
- drawings/ (도면 파일)
- profiles/ (프로필 이미지)
```

#### API Routes (Next.js)

```typescript
// 주요 API 엔드포인트
/app/api/
├── auth/ (인증 관련)
├── sites/ (현장 관리)
├── daily-reports/ (작업일지)
├── documents/ (문서 관리)
├── salary/ (급여 관리)
├── notifications/ (알림)
└── admin/ (관리자 기능)
```

---

## 3. Frontend V2 기능별 백엔드 요구사항

### 3.1 Main 앱 (포트: 3007) - 작업일지 작성

#### 현재 V1 백엔드 사용

```typescript
// V1에서 사용하는 API
- GET /api/sites (현장 목록)
- POST /api/daily-reports (작업일지 생성)
- PUT /api/daily-reports/[id] (작업일지 수정)
- POST /api/upload/photos (사진 업로드)
- POST /api/upload/drawings (도면 업로드)
```

#### V2에서 필요한 백엔드

```typescript
// 기존 기능 유지
- 현장 정보 조회 API
- 작업일지 CRUD API
- 파일 업로드/다운로드 API
- 도면 마킹 저장 API

// 추가 구현 필요
- 자동 저장 API (LocalStorage → DB)
- 승인 워크플로우 API
- 본사 요청사항 API
- 알림 연동 API
```

### 3.2 Money 앱 (포트: 3004) - 출력현황/급여현황

#### 현재 V1 백엔드 사용

```typescript
// V1에서 사용하는 API
- GET /api/work-entries (작업 내역)
- GET /api/salary/current-month (이번 달 급여)
- GET /api/salary/history (급여 내역)
- POST /api/salary/calculate (급여 계산)
```

#### V2에서 필요한 백엔드

```typescript
// 기존 기능 유지
- 작업 내역 조회 API
- 급여 계산 API
- 급여명세서 조회 API

// 추가 구현 필요
- 급여 승인 프로세스 API
- 급여 지급 처리 API
- 급여 스냅샷 API
- Excel 내보내기 API
```

### 3.3 Site 앱 (포트: 3003) - 현장 정보 관리

#### 현재 V1 백엔드 사용

```typescript
// V1에서 사용하는 API
- GET /api/sites (현장 목록)
- GET /api/sites/[id] (현장 상세)
- POST /api/sites (현장 생성)
- PUT /api/sites/[id] (현장 수정)
- DELETE /api/sites/[id] (현장 삭제)
```

#### V2에서 필요한 백엔드

```typescript
// 기존 기능 유지
- 현장 CRUD API
- 현장 검색 API
- 현장별 문서 조회 API

// 추가 구현 필요
- 현장별 작업자 배정 API
- 현장별 관리자 배정 API
- 현장별 권한 관리 API
- 현장 통계 API
```

### 3.4 Worklog 앱 (포트: 3005) - 작업일지 관리

#### 현재 V1 백엔드 사용

```typescript
// V1에서 사용하는 API
- GET /api/daily-reports (작업일지 목록)
- GET /api/daily-reports/[id] (작업일지 상세)
- PUT /api/daily-reports/[id] (수정)
- DELETE /api/daily-reports/[id] (삭제)
```

#### V2에서 필요한 백엔드

```typescript
// 기존 기능 유지
- 작업일지 CRUD API
- 작업일지 상태 관리 API

// 추가 구현 필요
- 승인/반려 처리 API
- 일괄 승인 API
- 작업일지 PDF 생성 API
- 작업일지 리마인더 API
```

### 3.5 Doc 앱 (포트: 3006) - 문서 관리

#### 현재 V1 백엔드 사용

```typescript
// V1에서 사용하는 API
- GET /api/documents (문서 목록)
- POST /api/documents (문서 업로드)
- GET /api/documents/[id]/file (파일 다운로드)
- DELETE /api/documents/[id] (문서 삭제)
```

#### V2에서 필요한 백엔드

```typescript
// 기존 기능 유지
- 문서 CRUD API
- 파일 업로드/다운로드 API

// 추가 구현 필요
- 문서 권한 관리 API
- 문서 버전 관리 API
- 문서 카테고리 API
- 펀치 관리 API
```

---

## 4. 백엔드 API 상세 명세

### 4.1 인증 API

```typescript
// POST /api/auth/login
{
  email: string;
  password: string;
}

// POST /api/auth/signup
{
  email: string;
  password: string;
  name: string;
  organizationId?: string;
}

// GET /api/auth/me
// 현재 사용자 정보 조회

// POST /api/auth/logout
// 로그아웃

// POST /api/auth/refresh
// 토큰 갱신

// POST /api/auth/verify-sso
// V2 멀티 앱 SSO 토큰 검증
{
  token: string; // 다른 앱에서 전달받은 토큰
  appId: string; // 요청 앱 ID
}

// GET /api/auth/sso-token
// V2 앱 간 토큰 발급
// Response: { ssoToken: string, expiresAt: Date }
```

### 4.2 실시간 동기화 API

```typescript
// WebSocket: /ws/sync
// 앱 간 실시간 데이터 동기화

interface SyncMessage {
  type: 'site_update' | 'report_created' | 'report_updated' | 'user_status';
  appId: string;
  data: any;
  timestamp: Date;
}

// POST /api/sync/broadcast
// 다른 앱에 변경사항 브로드캐스트
{
  targetApps: string[]; // 수신 앱 목록
  message: SyncMessage;
}

// GET /api/sync/updates
// 마지막 동기화 이후 변경사항 조회
// Query: ?since=timestamp&appId=string
```

### 4.3 오프라인 동기화 API

```typescript
// POST /api/sync/offline/queue
// 오프라인 중 변경사항 큐에 추가
{
  appId: string;
  operations: OfflineOperation[];
}

// POST /api/sync/offline/process
// 오프라인 큐 처리
{
  queueId: string;
}

// GET /api/sync/offline/status
// 동기화 상태 조회
interface SyncStatus {
  pendingCount: number;
  lastSyncAt: Date;
  conflicts: SyncConflict[];
}

interface OfflineOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  resource: string;
  data: any;
  timestamp: Date;
}
```

### 4.4 현장 관리 API

```typescript
// GET /api/sites
// Query: ?search=검색어&status=상태&organizationId=조직ID
interface SiteListResponse {
  sites: Site[]
  total: number
  page: number
}

// GET /api/sites/:id
interface SiteDetail {
  id: string
  name: string
  address: string
  status: 'ing' | 'wait' | 'done'
  manager: User
  workers: User[]
  documents: Document[]
  stats: {
    totalReports: number
    completedReports: number
    pendingReports: number
  }
}

// POST /api/sites
interface CreateSiteRequest {
  name: string
  address: string
  startDate: Date
  endDate?: Date
  managerId: string
  workerIds: string[]
}

// PUT /api/sites/:id
interface UpdateSiteRequest {
  name?: string
  address?: string
  status?: SiteStatus
  managerId?: string
  workerIds?: string[]
}

// DELETE /api/sites/:id
// 현장 삭제
```

### 4.5 작업일지 API

```typescript
// GET /api/daily-reports
// Query: ?siteId=현장ID&date=날짜&status=상태
interface DailyReportListResponse {
  reports: DailyReport[]
  total: number
}

// GET /api/daily-reports/:id
interface DailyReportDetail {
  id: string
  siteId: string
  workDate: Date
  status: 'draft' | 'pending' | 'approved' | 'rejected'
  manpower: ManpowerEntry[]
  materials: MaterialEntry[]
  photos: PhotoEntry[]
  drawings: DrawingEntry[]
  createdBy: User
  createdAt: Date
  updatedAt: Date
}

// POST /api/daily-reports
interface CreateDailyReportRequest {
  siteId: string
  workDate: Date
  manpower: ManpowerEntry[]
  materials: MaterialEntry[]
  photos: PhotoEntry[]
  drawings: DrawingEntry[]
}

// PUT /api/daily-reports/:id
interface UpdateDailyReportRequest {
  // CreateDailyReportRequest와 동일
}

// POST /api/daily-reports/:id/submit
// 승인 요청

// POST /api/daily-reports/:id/approve
interface ApproveRequest {
  comment?: string
}

// POST /api/daily-reports/:id/reject
interface RejectRequest {
  reason: string
  comment?: string
}

// POST /api/daily-reports/draft
interface SaveDraftRequest {
  siteId: string
  workDate: Date
  data: Partial<DailyReport>
}
```

### 4.6 파일 관리 API

```typescript
// POST /api/upload/photos
interface UploadPhotoRequest {
  file: File
  siteId?: string
  reportId?: string
  category?: string
}

// POST /api/upload/drawings
interface UploadDrawingRequest {
  file: File
  siteId?: string
  reportId?: string
  markupData?: string
}

// GET /api/files/:id/download
// 파일 다운로드

// DELETE /api/files/:id
// 파일 삭제

// POST /api/drawings/:id/markup
interface SaveMarkupRequest {
  markupData: string // JSON string
}
```

### 4.7 급여 관리 API

```typescript
// GET /api/salary/current-month
interface CurrentMonthSalary {
  userId: string
  month: string
  baseSalary: number
  overtimePay: number
  bonus: number
  deductions: number
  netPay: number
  workDays: number
  workHours: number
}

// GET /api/salary/history
// Query: ?year=2024&userId=사용자ID
interface SalaryHistoryResponse {
  salaries: SalaryRecord[]
  total: number
}

// POST /api/salary/calculate
interface CalculateSalaryRequest {
  userId: string
  month: string
  workDays: WorkDay[]
}

// GET /api/salary/payslip/:id
interface PayslipDetail {
  id: string
  userId: string
  month: string
  earnings: EarningsBreakdown
  deductions: DeductionsBreakdown
  netPay: number
  paymentDate?: Date
  status: 'pending' | 'approved' | 'paid'
}

// POST /api/salary/request-payment
interface RequestPaymentRequest {
  salaryIds: string[]
  approverId: string
}
```

### 4.8 문서 관리 API

```typescript
// GET /api/documents
// Query: ?category=카테고리&siteId=현장ID&type=타입
interface DocumentListResponse {
  documents: Document[]
  total: number
}

// POST /api/documents
interface UploadDocumentRequest {
  file: File
  title: string
  category: string
  siteId?: string
  type: 'my-docs' | 'company-docs' | 'drawing' | 'photo' | 'punch'
  isRequired?: boolean
}

// GET /api/documents/:id
interface DocumentDetail {
  id: string
  title: string
  category: string
  type: string
  fileUrl: string
  uploadedBy: User
  uploadedAt: Date
  siteId?: string
  permissions: DocumentPermission[]
  versions: DocumentVersion[]
}

// PUT /api/documents/:id
interface UpdateDocumentRequest {
  title?: string
  category?: string
  permissions?: DocumentPermission[]
}

// DELETE /api/documents/:id
// 문서 삭제

// GET /api/documents/categories
interface CategoryListResponse {
  categories: DocumentCategory[]
}

// POST /api/punch
interface CreatePunchRequest {
  siteId: string
  location: string
  issue: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  assigneeId?: string
  dueDate?: Date
  beforePhoto?: File
  afterPhoto?: File
}

// PUT /api/punch/:id/status
interface UpdatePunchStatusRequest {
  status: 'open' | 'in-progress' | 'resolved' | 'closed'
  comment?: string
}
```

---

## 5. 데이터베이스 스키마

### 5.1 사용자 및 인증

```sql
-- users 테이블
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(20) DEFAULT 'worker',
  organization_id UUID REFERENCES organizations(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- profiles 테이블 (추가 정보)
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id),
  avatar_url VARCHAR(500),
  department VARCHAR(100),
  position VARCHAR(100),
  employee_id VARCHAR(50),
  hire_date DATE,
  birth_date DATE,
  address TEXT,
  emergency_contact VARCHAR(100),
  emergency_phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- organizations 테이블
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  business_number VARCHAR(50),
  address TEXT,
  phone VARCHAR(20),
  email VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 5.2 현장 관리

```sql
-- sites 테이블
CREATE TABLE sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  address TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  status VARCHAR(20) DEFAULT 'wait',
  organization_id UUID REFERENCES organizations(id),
  manager_id UUID REFERENCES users(id),
  start_date DATE,
  end_date DATE,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  is_pinned BOOLEAN DEFAULT false
);

-- site_workers 테이블 (현장별 작업자)
CREATE TABLE site_workers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  worker_id UUID REFERENCES users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP DEFAULT NOW(),
  assigned_by UUID REFERENCES users(id),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(site_id, worker_id)
);

-- site_documents 테이블 (현장별 문서)
CREATE TABLE site_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  added_at TIMESTAMP DEFAULT NOW(),
  added_by UUID REFERENCES users(id)
);
```

### 5.3 작업일지

```sql
-- daily_reports 테이블
CREATE TABLE daily_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES sites(id),
  work_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'draft',
  created_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP,
  reject_reason TEXT,
  weather VARCHAR(50),
  temperature INTEGER,
  special_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(site_id, work_date, created_by)
);

-- daily_report_manpower 테이블
CREATE TABLE daily_report_manpower (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES daily_reports(id) ON DELETE CASCADE,
  worker_name VARCHAR(100) NOT NULL,
  work_hours DECIMAL(4,2) NOT NULL,
  work_type VARCHAR(50),
  hourly_rate DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT NOW()
);

-- daily_report_materials 테이블
CREATE TABLE daily_report_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES daily_reports(id) ON DELETE CASCADE,
  material_name VARCHAR(200) NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit VARCHAR(20) NOT NULL,
  unit_price DECIMAL(10,2),
  total_price DECIMAL(12,2),
  created_at TIMESTAMP DEFAULT NOW()
);

-- daily_report_photos 테이블
CREATE TABLE daily_report_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES daily_reports(id) ON DELETE CASCADE,
  file_id UUID REFERENCES files(id) ON DELETE CASCADE,
  description TEXT,
  member VARCHAR(50),
  process VARCHAR(50),
  location VARCHAR(200),
  taken_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- daily_report_drawings 테이블
CREATE TABLE daily_report_drawings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES daily_reports(id) ON DELETE CASCADE,
  file_id UUID REFERENCES files(id) ON DELETE CASCADE,
  markup_data JSONB,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 5.4 급여 관리

```sql
-- work_entries 테이블
CREATE TABLE work_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  site_id UUID REFERENCES sites(id),
  work_date DATE NOT NULL,
  check_in_time TIMESTAMP,
  check_out_time TIMESTAMP,
  work_hours DECIMAL(4,2),
  overtime_hours DECIMAL(4,2),
  hourly_rate DECIMAL(10,2),
  daily_wage DECIMAL(10,2),
  status VARCHAR(20) DEFAULT 'pending',
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, work_date)
);

-- salary_records 테이블
CREATE TABLE salary_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  month DATE NOT NULL, -- 월의 첫 날
  base_salary DECIMAL(12,2) NOT NULL,
  overtime_pay DECIMAL(12,2) DEFAULT 0,
  bonus DECIMAL(12,2) DEFAULT 0,
  tax DECIMAL(12,2) DEFAULT 0,
  pension DECIMAL(12,2) DEFAULT 0,
  health_insurance DECIMAL(12,2) DEFAULT 0,
  other_deductions DECIMAL(12,2) DEFAULT 0,
  total_deductions DECIMAL(12,2) DEFAULT 0,
  net_pay DECIMAL(12,2) NOT NULL,
  work_days INTEGER NOT NULL,
  total_hours DECIMAL(6,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  payment_date DATE,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, month)
);

-- salary_settings 테이블
CREATE TABLE salary_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) UNIQUE,
  daily_rate DECIMAL(10,2),
  hourly_rate DECIMAL(10,2),
  overtime_multiplier DECIMAL(3,2) DEFAULT 1.5,
  tax_rate DECIMAL(5,4) DEFAULT 0.033,
  pension_rate DECIMAL(5,4) DEFAULT 0.045,
  health_insurance_rate DECIMAL(5,4) DEFAULT 0.03495,
  effective_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 5.5 문서 관리

```sql
-- documents 테이블
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(500) NOT NULL,
  category VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL,
  file_id UUID REFERENCES files(id),
  site_id UUID REFERENCES sites(id),
  uploaded_by UUID REFERENCES users(id),
  is_required BOOLEAN DEFAULT false,
  required_by DATE,
  description TEXT,
  tags TEXT[],
  version INTEGER DEFAULT 1,
  parent_id UUID REFERENCES documents(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- document_categories 테이블
CREATE TABLE document_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL,
  organization_id UUID REFERENCES organizations(id),
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- document_permissions 테이블
CREATE TABLE document_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  permission VARCHAR(20) NOT NULL, -- read, write, delete, share
  granted_by UUID REFERENCES users(id),
  granted_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  UNIQUE(document_id, user_id)
);

-- punch_items 테이블
CREATE TABLE punch_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES sites(id),
  location VARCHAR(200) NOT NULL,
  issue TEXT NOT NULL,
  priority VARCHAR(20) DEFAULT 'medium',
  status VARCHAR(20) DEFAULT 'open',
  assignee_id UUID REFERENCES users(id),
  reporter_id UUID REFERENCES users(id),
  before_photo_id UUID REFERENCES files(id),
  after_photo_id UUID REFERENCES files(id),
  due_date DATE,
  resolved_at TIMESTAMP,
  resolution_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 5.6 파일 관리

```sql
-- files 테이블
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(500) NOT NULL,
  original_name VARCHAR(500) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  size_bytes BIGINT NOT NULL,
  storage_path VARCHAR(1000) NOT NULL,
  public_url VARCHAR(1000),
  uploaded_by UUID REFERENCES users(id),
  is_public BOOLEAN DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 5.7 알림

```sql
-- notifications 테이블
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  related_id UUID, -- 관련된 리소스 ID
  related_type VARCHAR(50), -- daily_report, document, salary 등
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 5.8 인덱스

```sql
-- 성능 최적화를 위한 인덱스
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_organization ON users(organization_id);
CREATE INDEX idx_sites_organization ON sites(organization_id);
CREATE INDEX idx_sites_status ON sites(status);
CREATE INDEX idx_daily_reports_site_date ON daily_reports(site_id, work_date);
CREATE INDEX idx_daily_reports_status ON daily_reports(status);
CREATE INDEX idx_work_entries_user_date ON work_entries(user_id, work_date);
CREATE INDEX idx_salary_records_user_month ON salary_records(user_id, month);
CREATE INDEX idx_documents_site_type ON documents(site_id, type);
CREATE INDEX idx_documents_category ON documents(category);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX idx_punch_items_site_status ON punch_items(site_id, status);
```

---

## 6. 우선순위별 개발 로드맵

### Phase 1: 기본 인프라 (1-2주)

#### 1.1 백엔드 서버 설정

- [ ] Express.js 또는 Next.js API Routes 설정
- [ ] TypeScript 환경 구성
- [ ] 데이터베이스 연결 (Supabase 또는 PostgreSQL)
- [ ] CORS 및 미들웨어 설정

#### 1.2 인증 시스템

- [ ] JWT 기반 인증 구현
- [ ] 로그인/회원가입 API
- [ ] 세션 관리 미들웨어
- [ ] 권한 검증 미들웨어

#### 1.3 파일 스토리지

- [ ] Supabase Storage 또는 AWS S3 연동
- [ ] 파일 업로드/다운로드 API
- [ ] 이미지 리사이징 기능
- [ ] 파일 접근 권한 관리

### Phase 2: 핵심 기능 (2-3주)

#### 2.1 현장 관리

- [ ] 현장 CRUD API
- [ ] 현장 검색 및 필터링
- [ ] 현장별 작업자 배정
- [ ] 현장 통계 API

#### 2.2 작업일지 기본 기능

- [ ] 작업일지 CRUD API
- [ ] 작업일지 임시 저장
- [ ] 사진/도면 업로드 연동
- [ ] 작업일지 목록 조회

#### 2.3 사용자 관리

- [ ] 사용자 프로필 API
- [ ] 조직별 사용자 조회
- [ ] 사용자 권한 관리

### Phase 3: 고급 기능 (3-4주)

#### 3.1 승인 워크플로우

- [ ] 작업일지 승인/반려 API
- [ ] 일괄 승인 기능
- [ ] 승인 히스토리 관리
- [ ] 알림 시스템 연동

#### 3.2 급여 시스템

- [ ] 작업 내역 저장 API
- [ ] 급여 자동 계산
- [ ] 급여명세서 생성
- [ ] 급여 승인 프로세스

#### 3.3 문서 관리

- [ ] 문서 CRUD API
- [ ] 문서 권한 관리
- [ ] 펀치 관리 시스템
- [ ] 문서 버전 관리

### Phase 4: 부가 기능 (2-3주)

#### 4.1 알림 시스템

- [ ] 실시간 알림 (WebSocket)
- [ ] 푸시 알림 연동
- [ ] 알림 템플릿 관리
- [ ] 알림 설정

#### 4.2 리포트 및 내보내기

- [ ] PDF 생성 기능
- [ ] Excel 내보내기
- [ ] 통계 대시보드 API
- [ ] 차트 데이터 제공

#### 4.3 모니터링 및 로깅

- [ ] API 로깅 시스템
- [ ] 에러 모니터링
- [ ] 성능 모니터링
- [ ] 사용자 활동 로그

---

## 7. 기술 스택 권장사항

### 7.1 백엔드 프레임워크

#### 옵션 1: Next.js API Routes (V1과 호환)

```typescript
// 장점
- V1과 동일한 구조
- Supabase 통합 용이
- Full-stack TypeScript

// 단점
- V2의 멀티 앱 구조와 부조화
```

#### 옵션 2: Express.js + TypeScript (권장)

```typescript
// 장점
- 독립적인 백엔드 서버
- V2의 멀티 앱 구조와 적합
- 유연한 아키텍처

// 설정 예시
npm install express cors helmet morgan
npm install -D @types/node @types/express typescript ts-node
```

#### 옵션 3: NestJS (엔터프라이즈급)

```typescript
// 장점
- 구조화된 아키텍처
- 의존성 주입
- 모듈화된 구조

// 단점
- 학습 곡선이 높음
```

### 7.2 데이터베이스

#### Supabase (권장)

```typescript
// 장점
- V1 데이터 마이그레이션 용이
- Auth, Storage, Realtime 내장
- RLS 지원

// 설정
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(url, key)
```

#### PostgreSQL + Prisma

```typescript
// 장점
- 타입 안전성
- 자동 생성된 클라이언트
- 마이그레이션 관리

// 설정 예시
npm install prisma @prisma/client
npx prisma init
```

### 7.3 파일 스토리지

#### Supabase Storage (권장)

- V1과 호환성
- 자동 CDN
- 간편한 API

#### AWS S3

- 확장성
- 다양한 기능
- 업계 표준

### 7.4 인증

#### Supabase Auth (권장)

- 기존 데이터 호환
- RLS 지원
- 소셜 로그인 내장

#### JWT + bcrypt

- 완전한 제어권
- 경량화
- 커스터마이징 용이

---

## 8. 마이그레이션 가이드

### 8.1 데이터 마이그레이션

#### 1. Supabase 데이터 백업

```sql
-- V1 데이터베이스 백업
pg_dump [V1_DATABASE_URL] > v1_backup.sql
```

#### 2. 스키마 동기화

```typescript
// 마이그레이션 스크립트 예시
async function migrateV1ToV2() {
  // 1. 사용자 데이터 마이그레이션
  const users = await v1Db.query('SELECT * FROM users')
  await v2Db.users.insertMany(users)

  // 2. 현장 데이터 마이그레이션
  const sites = await v1Db.query('SELECT * FROM sites')
  await v2Db.sites.insertMany(sites)

  // 3. 작업일지 마이그레이션
  const reports = await v1Db.query('SELECT * FROM daily_reports')
  await v2Db.dailyReports.insertMany(reports)
}
```

#### 3. 파일 스토리지 마이그레이션

```typescript
// Supabase Storage 파일 복사
async function migrateFiles() {
  const files = await supabaseV1.storage.list('documents')
  for (const file of files) {
    const { data } = await supabaseV1.storage.download('documents', file.name)
    await supabaseV2.storage.upload('documents', file.name, data)
  }
}
```

### 8.2 점진적 전환 전략

#### 1. API 호환성 레이어

```typescript
// V1 API를 V2로 프록시
app.use(
  '/api/v1',
  proxy({
    target: 'http://localhost:3000',
    changeOrigin: true,
  })
)

app.use('/api/v2', v2Routes)
```

#### 2. 기능 플래그

```typescript
// 점진적 기능 활성화
app.get('/api/daily-reports', async (req, res) => {
  if (featureFlags.useV2Backend) {
    return await v2DailyReportsHandler(req, res)
  } else {
    return await v1DailyReportsHandler(req, res)
  }
})
```

#### 3. A/B 테스트

```typescript
// 사용자별 백엔드 분리
const backend = getUserBackend(userId)
if (backend === 'v2') {
  return await v2Handler(req, res)
}
```

### 8.3 롤백 계획

#### 1. 데이터 동기화

```typescript
// 양방향 데이터 동기화
async function syncData() {
  // V1 → V2
  const v1Changes = await getV1Changes(since)
  await applyToV2(v1Changes)

  // V2 → V1
  const v2Changes = await getV2Changes(since)
  await applyToV1(v2Changes)
}
```

#### 2. 트래픽 라우팅

```nginx
# Nginx 설정 예시
upstream v1_backend {
  server localhost:3000;
}

upstream v2_backend {
  server localhost:4000;
}

server {
  location /api/ {
    proxy_pass http://v2_backend;

    # 롤백 시 주석 해제
    # proxy_pass http://v1_backend;
  }
}
```

---

## 9. V2 멀티 앱 아키텍처 특별 고려사항

### 9.1 Cross-Origin 인증 토큰 공유

V2는 5개의 독립적인 앱(포트 3003-3007)으로 구성되어 있어, 도메인 간 인증 토큰 공유 메커니즘이 필수적입니다.

#### 구현 방안

##### 1. 중앙 인증 서버 방식 (권장)

```typescript
// 메인 앱(3007)에서 로그인 후 다른 앱으로 토큰 전달
// 1. 로그인 성공 후 SSO 토큰 발급
const response = await fetch('http://localhost:4000/api/auth/sso-token', {
  method: 'POST',
  headers: { Authorization: `Bearer ${jwtToken}` },
})
const { ssoToken } = await response.json()

// 2. 다른 앱으로 토큰 전달 (postMessage 사용)
otherAppWindow.postMessage(
  {
    type: 'SSO_TOKEN',
    token: ssoToken,
    source: 'main-app',
  },
  'http://localhost:3003'
)

// 3. 수신 앱에서 토큰 검증
window.addEventListener('message', async event => {
  if (event.data.type === 'SSO_TOKEN') {
    const response = await fetch('/api/auth/verify-sso', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: event.data.token,
        appId: 'site-app',
      }),
    })
    const { jwtToken } = await response.json()
    localStorage.setItem('token', jwtToken)
  }
})
```

##### 2. 공유 쿠키 도메인 방식

```typescript
// 백엔드에서 쿠키 도메인 설정
app.use(
  session({
    name: 'inopnc-session',
    secret: process.env.SESSION_SECRET,
    cookie: {
      domain: 'localhost', // 모든 서브도메인에서 공유
      secure: false, // 개발 환경
      httpOnly: true,
      sameSite: 'lax',
    },
  })
)
```

### 9.2 실시간 데이터 동기화

여러 앱에서 동시에 작업할 경우 데이터 일관성을 유지하기 위한 실시간 동기화가 필요합니다.

#### WebSocket 기반 동기화

```typescript
// 백엔드 WebSocket 서버
import { WebSocketServer } from 'ws'

const wss = new WebSocketServer({ port: 8080 })

// 앱별 WebSocket 연결 관리
const appConnections = new Map<string, WebSocket[]>()

wss.on('connection', (ws, request) => {
  const appId = request.headers['x-app-id']

  if (!appConnections.has(appId)) {
    appConnections.set(appId, [])
  }
  appConnections.get(appId).push(ws)

  ws.on('message', data => {
    const message = JSON.parse(data)

    // 다른 앱에 브로드캐스트
    appConnections.forEach((connections, id) => {
      if (id !== appId) {
        connections.forEach(conn => {
          conn.send(
            JSON.stringify({
              ...message,
              sourceApp: appId,
            })
          )
        })
      }
    })
  })
})
```

#### 프론트엔드 동기화 훅

```typescript
// useRealtimeSync.ts
import { useEffect, useRef } from 'react'

export function useRealtimeSync(appId: string) {
  const ws = useRef<WebSocket>()

  useEffect(() => {
    ws.current = new WebSocket(`ws://localhost:8080?appId=${appId}`)

    ws.current.onmessage = event => {
      const message = JSON.parse(event.data)

      switch (message.type) {
        case 'site_update':
          // 현장 정보 업데이트
          updateSiteInCache(message.data)
          break
        case 'report_created':
          // 새 작업일지 알림
          showNotification('새 작업일지가 작성되었습니다')
          break
      }
    }

    return () => {
      ws.current?.close()
    }
  }, [appId])
}
```

### 9.3 오프라인 우선 설계

V2는 LocalStorage를 적극적으로 사용하므로, 오프라인 상태에서도 작업이 가능하도록 설계해야 합니다.

#### 오프라인 큐 관리

```typescript
// offlineQueue.ts
class OfflineQueue {
  private queue: OfflineOperation[] = []

  constructor() {
    // 온라인 상태 변화 감지
    window.addEventListener('online', this.processQueue)
    window.addEventListener('offline', this.pauseSync)
  }

  add(operation: OfflineOperation) {
    this.queue.push(operation)
    this.saveToLocalStorage()
  }

  async processQueue() {
    if (!navigator.onLine) return

    while (this.queue.length > 0) {
      const operation = this.queue[0]

      try {
        await this.syncOperation(operation)
        this.queue.shift()
      } catch (error) {
        console.error('Sync failed:', error)
        break // 실패 시 중단
      }
    }

    this.saveToLocalStorage()
  }

  private async syncOperation(operation: OfflineOperation) {
    const response = await fetch(`/api/sync/offline/${operation.type}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${getToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(operation),
    })

    if (!response.ok) {
      throw new Error('Sync failed')
    }
  }

  private saveToLocalStorage() {
    localStorage.setItem('offlineQueue', JSON.stringify(this.queue))
  }
}

export const offlineQueue = new OfflineQueue()
```

#### 충돌 해결 전략

```typescript
// conflictResolution.ts
export async function resolveConflicts(
  localData: any,
  serverData: any
): Promise<ResolutionStrategy> {
  // 1. 타임스탬프 비교
  if (localData.updatedAt > serverData.updatedAt) {
    return 'use_local'
  }

  // 2. 사용자 선택
  const userChoice = await showConflictDialog({
    local: localData,
    server: serverData,
  })

  return userChoice
}
```

### 9.4 데이터 격리 전략

V1의 RLS(Row Level Security)를 V2의 멀티 앱 구조에서 구현하는 방법입니다.

#### API 레벨 권한 검증

```typescript
// authMiddleware.ts
export function requirePermission(resource: string, action: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.replace('Bearer ', '')
    const user = await verifyToken(token)

    // 사용자 권한 확인
    const hasPermission = await checkUserPermission(user, resource, action)

    if (!hasPermission) {
      return res.status(403).json({
        error: 'INSUFFICIENT_PERMISSIONS',
        message: '이 작업을 수행할 권한이 없습니다.',
      })
    }

    // 데이터 필터링
    req.user = user
    req.dataFilter = createDataFilter(user)

    next()
  }
}

// 데이터 필터링 미들웨어
function createDataFilter(user: User) {
  return {
    // 조직별 데이터 필터링
    organizationId: user.organizationId,

    // 현장별 접근 권한
    siteIds: user.accessibleSites,

    // 역할별 데이터 제한
    role: user.role,
  }
}
```

---

## 10. 개발 가이드

### 10.1 API 설계 원칙

1. **RESTful 설계**
   - HTTP 메서드 올바른 사용
   - 자원 기반 URL 설계
   - 일관된 응답 형식

2. **에러 핸들링**

```typescript
// 표준 에러 응답
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "입력값이 유효하지 않습니다.",
    "details": {
      "field": "email",
      "reason": "required"
    }
  }
}
```

3. **페이지네이션**

```typescript
// 표준 페이지네이션 응답
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### 9.2 보안 가이드

1. **인증**
   - JWT 토큰 만료 시간 설정 (15분)
   - 리프레시 토큰 구현 (7일)
   - 안전한 토큰 저장

2. **권한**
   - 역할 기반 접근 제어 (RBAC)
   - 리소스 레벨 권한 검증
   - API별 권한 미들웨어

3. **데이터 보호**
   - 민감정보 암호화
   - SQL 인젝션 방지
   - XSS 방지

### 9.3 테스트 전략

1. **단위 테스트**

```typescript
// Jest 테스트 예시
describe('Daily Reports API', () => {
  test('should create daily report', async () => {
    const response = await request(app)
      .post('/api/daily-reports')
      .set('Authorization', `Bearer ${token}`)
      .send(reportData)

    expect(response.status).toBe(201)
    expect(response.body.data).toMatchObject(reportData)
  })
})
```

2. **통합 테스트**
   - API 엔드포인트 테스트
   - 데이터베이스 연동 테스트
   - 파일 업로드 테스트

3. **E2E 테스트**
   - Playwright 또는 Cypress
   - 사용자 시나리오 테스트
   - 크로스 브라우저 테스트

---

## 10. 모니터링 및 운영

### 10.1 로깅

```typescript
// Winston 로깅 예시
import winston from 'winston'

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
})
```

### 10.2 메트릭

```typescript
// Prometheus 메트릭 예시
const promClient = require('prom-client')

const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
})
```

### 10.3 헬스 체크

```typescript
// 헬스 체크 엔드포인트
app.get('/health', async (req, res) => {
  const health = {
    uptime: process.uptime(),
    database: await checkDatabase(),
    storage: await checkStorage(),
    timestamp: Date.now(),
  }

  res.status(health.database ? 200 : 503).json(health)
})
```

---

## 결론

Frontend V2의 성공적인 개발을 위해서는 다음 사항이 중요합니다:

1. **점진적 접근**: Phase별로 나누어 안정적으로 개발
2. **데이터 호환성**: V1 데이터와의 호환성 유지
3. **테스트**: 충분한 테스트 코드 작성
4. **문서화**: API 명세서 항상 최신 상태 유지
5. **모니터링**: 운영 환경 모니터링 시스템 구축

이 명세서를 참고하여 V1의 안정적인 기반 위에 V2의 현대적인 아키텍처를 구축하시기 바랍니다.

---

_문서 버전: 1.0_  
_최종 업데이트: 2025년 12월 29일_  
_작성자: 개발팀_
