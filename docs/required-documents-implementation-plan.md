# 필수서류제출 관리 시스템 구현 계획서

## 1. 개요

### 1.1 목적
시스템 관리자가 필수 제출 서류를 설정하고, 작업자/현장관리자가 서류를 제출하며, 관리자가 이를 검토/승인하는 완전한 워크플로우를 구현합니다.

### 1.2 범위
- 시스템 관리자: 필수서류 요구사항 정의 및 제출 현황 관리
- 작업자/현장관리자: 필수서류 제출 및 상태 확인
- 승인 워크플로우: 제출 → 검토 → 승인/반려 → 재제출

## 2. 현재 상태 분석

### 2.1 기구현 컴포넌트
| 구분 | 파일 경로 | 설명 | 상태 |
|------|----------|------|------|
| DB 테이블 | `document_requirements` | 필수서류 요구사항 정의 | ✅ 구현됨 |
| DB 테이블 | `user_document_submissions` | 사용자별 제출 상태 | ✅ 구현됨 |
| API | `/api/required-documents` | 필수서류 목록 조회 | ✅ 구현됨 |
| API | `/api/user-document-submissions` | 제출 상태 관리 | ✅ 구현됨 |
| 컴포넌트 | `RequiredDocumentTypesAdmin.tsx` | 관리 UI | ⚠️ 미통합 |
| 컴포넌트 | `documents-tab.tsx` | 필수서류 체크리스트 | ✅ 구현됨 |
| 페이지 | `/dashboard/admin/documents/required/` | 제출현황 관리 | ✅ 구현됨 |

### 2.2 미구현 기능
- 시스템 관리자 메뉴에 필수서류 설정 메뉴 없음
- 필수서류 요구사항 CRUD 화면 미통합
- 제출 상태별 필터링 및 재제출 기능
- 만료일 관리 및 알림

## 3. 구현 계획

### 3.1 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                    │
├─────────────────────────────────────────────────────────┤
│  Admin Dashboard          │    Worker/Manager Dashboard  │
│  ├─ 필수서류 설정         │    ├─ 문서함                │
│  │  └─ RequirementsCRUD   │    │  └─ 필수서류제출       │
│  └─ 제출현황 관리         │    │     ├─ 체크리스트      │
│     └─ SubmissionsReview  │    │     └─ 업로드           │
├─────────────────────────────────────────────────────────┤
│                    API Routes                            │
│  ├─ /api/admin/document-requirements (CRUD)             │
│  ├─ /api/required-documents (GET)                       │
│  └─ /api/user-document-submissions (GET/POST/PUT)      │
├─────────────────────────────────────────────────────────┤
│                    Supabase                              │
│  ├─ document_requirements (필수서류 정의)               │
│  ├─ user_document_submissions (제출 상태)              │
│  └─ documents (실제 파일)                               │
└─────────────────────────────────────────────────────────┘
```

### 3.2 구현 단계

#### Phase 1: 관리자 인터페이스 (Day 1)

##### 1.1 메뉴 추가
**파일**: `/components/admin/AdminDashboardLayout.tsx`

```typescript
// "도구" 카테고리에 추가
{
  id: 'document-requirements',
  label: '필수서류 설정',
  icon: Settings,
  href: '/dashboard/admin/document-requirements'
},
{
  id: 'document-submissions',
  label: '필수서류 제출현황',
  icon: FileCheck,
  href: '/dashboard/admin/documents/required'
}
```

##### 1.2 필수서류 설정 페이지
**신규 파일**: `/app/dashboard/admin/document-requirements/page.tsx`

```typescript
import RequiredDocumentTypesAdmin from '@/components/admin/documents/RequiredDocumentTypesAdmin'

export default async function DocumentRequirementsPage() {
  // 권한 체크
  // RequiredDocumentTypesAdmin 컴포넌트 렌더링
}
```

##### 1.3 API 엔드포인트
**신규 파일**: `/app/api/admin/document-requirements/route.ts`

주요 기능:
- GET: 필수서류 요구사항 목록 조회
- POST: 새 요구사항 추가
- PUT: 요구사항 수정
- DELETE: 요구사항 삭제

#### Phase 2: 사용자 인터페이스 개선 (Day 2)

##### 2.1 documents-tab.tsx 개선
**수정 파일**: `/components/dashboard/tabs/documents-tab.tsx`

추가 기능:
```typescript
// 제출 상태 타입 확장
type SubmissionStatus = 'not_submitted' | 'submitted' | 'approved' | 'rejected'

// 상태별 UI 표시
const getStatusBadge = (status: SubmissionStatus) => {
  switch(status) {
    case 'approved': return { color: 'green', icon: CheckCircle, text: '승인됨' }
    case 'submitted': return { color: 'yellow', icon: Clock, text: '검토중' }
    case 'rejected': return { color: 'red', icon: XCircle, text: '반려됨' }
    default: return { color: 'gray', icon: AlertCircle, text: '미제출' }
  }
}

// 반려 사유 표시
// 재제출 버튼
// 만료일 경고
```

##### 2.2 필수서류 전용 라우트
대시보드 탭에서 필수서류만 표시하는 뷰 활성화:
- URL: `/dashboard#documents-required`
- Prop: `showOnlyRequiredDocs={true}`

#### Phase 3: 승인 워크플로우 (Day 3)

##### 3.1 제출현황 관리 개선
**수정 파일**: `/components/admin/documents/RealRequiredDocumentsManagement.tsx`

개선 사항:
```typescript
// 일괄 처리 기능
const [selectedSubmissions, setSelectedSubmissions] = useState<string[]>([])

const handleBulkApprove = async () => {
  // 선택된 제출 건들 일괄 승인
}

const handleBulkReject = async (reason: string) => {
  // 선택된 제출 건들 일괄 반려
}

// 필터링 옵션
const filters = {
  status: ['all', 'submitted', 'approved', 'rejected'],
  role: ['worker', 'site_manager'],
  dateRange: ['today', 'week', 'month', 'all']
}
```

##### 3.2 알림 시스템 연동
제출/승인/반려 시 알림 발송:
```typescript
// API에서 알림 생성
await createNotification({
  user_id: submission.user_id,
  title: '필수서류 검토 완료',
  message: status === 'approved' 
    ? '제출하신 서류가 승인되었습니다.'
    : `제출하신 서류가 반려되었습니다. 사유: ${rejection_reason}`,
  type: 'document_review'
})
```

#### Phase 4: 통합 테스트 (Day 3.5)

##### 4.1 테스트 시나리오
1. **관리자 플로우**
   - 필수서류 요구사항 생성
   - 역할별 적용 설정
   - 제출 현황 확인
   - 승인/반려 처리

2. **사용자 플로우**
   - 필수서류 목록 확인
   - 파일 업로드
   - 제출 상태 확인
   - 반려 시 재제출

3. **권한 테스트**
   - system_admin: 모든 기능 접근
   - admin: 제출현황만 접근
   - worker/site_manager: 제출만 가능

## 4. 데이터베이스 스키마

### 4.1 document_requirements 테이블
```sql
CREATE TABLE document_requirements (
  id TEXT PRIMARY KEY,
  requirement_name TEXT NOT NULL,
  document_type TEXT NOT NULL,
  description TEXT,
  is_mandatory BOOLEAN DEFAULT true,
  applicable_roles TEXT[], -- ['worker', 'site_manager']
  file_format_allowed TEXT[],
  max_file_size_mb INTEGER,
  expiry_days INTEGER, -- 만료일 (일 단위)
  instructions TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  updated_by UUID
);
```

### 4.2 user_document_submissions 테이블
```sql
CREATE TABLE user_document_submissions (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  requirement_id TEXT NOT NULL,
  document_id UUID,
  submission_status TEXT NOT NULL, -- 'not_submitted', 'submitted', 'approved', 'rejected'
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  reviewed_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, requirement_id)
);
```

## 5. UI/UX 디자인

### 5.1 관리자 화면

#### 필수서류 설정
```
┌────────────────────────────────────────────────┐
│ 필수서류 설정                         [+ 추가]  │
├────────────────────────────────────────────────┤
│ ┌──┬──────────┬──────┬──────┬──────┬────────┐ │
│ │  │ 서류명   │ 유형 │ 역할 │ 필수 │ 작업   │ │
│ ├──┼──────────┼──────┼──────┼──────┼────────┤ │
│ │□ │ 신분증   │ 개인 │ 전체 │  ✓   │ 수정 삭제│ │
│ │□ │ 통장사본 │ 금융 │ 전체 │  ✓   │ 수정 삭제│ │
│ │□ │ 자격증   │ 자격 │ 작업자│  ✓   │ 수정 삭제│ │
│ └──┴──────────┴──────┴──────┴──────┴────────┘ │
└────────────────────────────────────────────────┘
```

#### 제출현황 관리
```
┌────────────────────────────────────────────────┐
│ 필수서류 제출현황                               │
├────────────────────────────────────────────────┤
│ [역할: 전체▼] [상태: 검토중▼] [기간: 이번주▼]  │
├────────────────────────────────────────────────┤
│ ┌──┬────────┬──────┬──────┬──────┬──────────┐ │
│ │□ │ 사용자 │ 서류 │ 제출일│ 상태 │ 작업     │ │
│ ├──┼────────┼──────┼──────┼──────┼──────────┤ │
│ │□ │ 김작업 │ 신분증│ 12/29 │ ⏳  │ 승인 반려 │ │
│ │□ │ 이현장 │ 통장 │ 12/28 │ ⏳  │ 승인 반려 │ │
│ └──┴────────┴──────┴──────┴──────┴──────────┘ │
│ [선택항목 일괄승인] [선택항목 일괄반려]         │
└────────────────────────────────────────────────┘
```

### 5.2 사용자 화면

#### 필수서류 체크리스트
```
┌────────────────────────────────────────────────┐
│ 필수 제출 서류 (3/5 완료)                       │
├────────────────────────────────────────────────┤
│ ✅ 신분증                           [승인됨]    │
│ ⏳ 통장사본                         [검토중]    │
│ ❌ 자격증                  [반려됨] [재제출]    │
│    └ 반려사유: 유효기간이 만료되었습니다        │
│ ⚠️ 건강검진서              [미제출] [업로드]    │
│ ⚠️ 안전교육이수증          [미제출] [업로드]    │
└────────────────────────────────────────────────┘
```

## 6. API 명세

### 6.1 필수서류 요구사항 관리

#### GET /api/admin/document-requirements
```typescript
// Response
{
  success: boolean
  data: DocumentRequirement[]
}
```

#### POST /api/admin/document-requirements
```typescript
// Request
{
  requirement_name: string
  document_type: string
  description?: string
  is_mandatory: boolean
  applicable_roles: string[]
  file_format_allowed?: string[]
  max_file_size_mb?: number
  expiry_days?: number
  instructions?: string
}
```

### 6.2 제출 상태 관리

#### GET /api/user-document-submissions
```typescript
// Response
{
  success: boolean
  data: {
    requirement: DocumentRequirement
    submission: UserDocumentSubmission | null
    document: Document | null
  }[]
}
```

#### PUT /api/user-document-submissions
```typescript
// Request (승인/반려)
{
  submission_id: string
  status: 'approved' | 'rejected'
  rejection_reason?: string
}
```

## 7. 구현 일정

| 단계 | 작업 내용 | 예상 시간 | 담당 |
|------|-----------|-----------|------|
| Phase 1 | 관리자 인터페이스 | 1일 | - |
| Phase 2 | 사용자 인터페이스 | 1일 | - |
| Phase 3 | 승인 워크플로우 | 1일 | - |
| Phase 4 | 통합 테스트 | 0.5일 | - |
| **합계** | | **3.5일** | |

## 8. 리스크 및 대응 방안

| 리스크 | 영향도 | 대응 방안 |
|--------|--------|-----------|
| 기존 documents-tab.tsx와의 충돌 | 중 | prop 기반 조건부 렌더링으로 격리 |
| 대용량 파일 업로드 | 중 | 파일 크기 제한 및 진행률 표시 |
| 동시 승인/반려 충돌 | 낮 | 낙관적 잠금 또는 트랜잭션 처리 |

## 9. 성공 지표

- ✅ 관리자가 필수서류 요구사항을 CRUD 가능
- ✅ 작업자가 필수서류 제출 상태를 실시간 확인
- ✅ 승인/반려 워크플로우 자동화
- ✅ 만료/미제출 서류 자동 알림
- ✅ 역할별 접근 권한 제어

## 10. 참고 사항

- 기존 컴포넌트 최대한 재활용
- 모바일 반응형 디자인 고려
- 다국어 지원 준비 (한국어 우선)
- 성능 최적화 (페이지네이션, 레이지 로딩)