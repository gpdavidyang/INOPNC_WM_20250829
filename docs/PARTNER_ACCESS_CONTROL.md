# 파트너사 접근 제어 시스템 문서

## 📋 목차
1. [개요](#개요)
2. [시스템 아키텍처](#시스템-아키텍처)
3. [데이터베이스 설계](#데이터베이스-설계)
4. [RLS (Row Level Security) 정책](#rls-row-level-security-정책)
5. [역할별 접근 권한](#역할별-접근-권한)
6. [파트너 전용 기능](#파트너-전용-기능)
7. [구현 세부사항](#구현-세부사항)
8. [API 및 서비스](#api-및-서비스)
9. [테스트 및 검증](#테스트-및-검증)
10. [유지보수 가이드](#유지보수-가이드)

---

## 개요

### 시스템 목적
건설 현장 관리 시스템에서 파트너사(협력업체)의 데이터 접근을 제어하고 격리하는 시스템입니다.

### 핵심 원칙
- **오직 `customer_manager` 역할만** 파트너사 기반 데이터 필터링 적용
- **다른 모든 역할**은 소속 제한 없이 권한 기반 접근
- **명확한 코드 분리**로 유지보수성 향상

### 주요 특징
- 단순화된 RLS 정책
- 파트너 전용 라우트 (`/partner/*`)
- 중앙화된 데이터 접근 서비스
- 자동 라우팅 및 권한 체크

---

## 시스템 아키텍처

### 디렉토리 구조
```
/app/
├── partner/                    # 파트너 전용 페이지
│   ├── dashboard/             # 파트너 대시보드
│   ├── sites/                 # 참여 현장 관리
│   ├── workers/               # 소속 직원 관리
│   ├── daily-reports/         # 작업일지
│   └── layout.tsx             # 파트너 레이아웃
│
├── dashboard/                  # 내부 사용자 페이지
│   ├── admin/                 # 관리자
│   ├── worker/                # 작업자
│   └── site-manager/          # 현장관리자
│
/components/
├── partner/                    # 파트너 전용 컴포넌트
│   └── PartnerDashboardLayout.tsx
│
/services/
└── data-access.service.ts     # 데이터 접근 서비스
```

### 기술 스택
- **Frontend**: Next.js 14.2.3 (App Router)
- **Backend**: Supabase (PostgreSQL + RLS)
- **Authentication**: Supabase Auth
- **Language**: TypeScript
- **Styling**: Tailwind CSS

---

## 데이터베이스 설계

### profiles 테이블 수정
```sql
ALTER TABLE profiles 
ADD COLUMN partner_company_id UUID REFERENCES partner_companies(id);

-- customer_manager는 반드시 partner_company_id를 가져야 함
ALTER TABLE profiles 
ADD CONSTRAINT chk_customer_manager_partner_company 
CHECK (
  (role != 'customer_manager') OR 
  (role = 'customer_manager' AND partner_company_id IS NOT NULL)
);
```

### 헬퍼 함수
```sql
-- 사용자의 partner_company_id 반환
CREATE FUNCTION public.get_user_partner_company_id()
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT partner_company_id 
  FROM public.profiles 
  WHERE id = auth.uid()
$$;

-- 파트너 사용자 여부 확인
CREATE FUNCTION public.is_partner_user()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'customer_manager'
    AND partner_company_id IS NOT NULL
  )
$$;

-- 사용자 역할 반환
CREATE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;

-- 관리자 여부 확인
CREATE FUNCTION public.is_admin_user()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'system_admin')
  )
$$;
```

---

## RLS (Row Level Security) 정책

### 단순화 원칙
1. **customer_manager만 필터링**: partner_company_id 기반
2. **다른 역할은 단순 권한 체크**: 소속 제한 없음
3. **관리자는 전체 접근**: admin, system_admin

### 주요 테이블 정책

#### sites 테이블
```sql
CREATE POLICY "sites_select_simplified" ON sites
FOR SELECT USING (
  -- 관리자는 모든 현장
  public.is_admin_user()
  OR
  -- customer_manager는 파트너 현장만
  (public.is_partner_user() AND id IN (
    SELECT site_id FROM site_partners 
    WHERE partner_company_id = public.get_user_partner_company_id()
  ))
  OR
  -- 다른 역할은 모든 현장
  (public.get_user_role() IN ('worker', 'site_manager'))
);
```

#### daily_reports 테이블
```sql
CREATE POLICY "daily_reports_select_simplified" ON daily_reports
FOR SELECT USING (
  -- 관리자는 모든 보고서
  public.is_admin_user()
  OR
  -- customer_manager는 파트너 현장 보고서만
  (public.is_partner_user() AND site_id IN (
    SELECT site_id FROM site_partners 
    WHERE partner_company_id = public.get_user_partner_company_id()
  ))
  OR
  -- 작업자는 자신의 보고서와 배정된 현장
  (public.is_worker() AND (
    created_by = auth.uid() 
    OR 
    site_id IN (SELECT site_id FROM site_assignments WHERE user_id = auth.uid())
  ))
  OR
  -- 현장관리자는 배정된 현장
  (public.is_site_manager() AND 
    site_id IN (SELECT site_id FROM site_assignments WHERE user_id = auth.uid())
  )
);
```

---

## 역할별 접근 권한

### 역할 정의

| 역할 | 설명 | 데이터 접근 범위 | 특별 제한 |
|------|------|-----------------|----------|
| **admin** | 본사 관리자 | 전체 시스템 | 없음 |
| **system_admin** | 시스템 관리자 | 전체 시스템 | 없음 |
| **customer_manager** | 파트너사 관리자 | **자사 데이터만** | partner_company_id 필수 |
| **site_manager** | 현장 관리자 | 배정된 현장 | 소속 변경 자유 |
| **worker** | 작업자 | 배정된 현장 | 소속 변경 자유 |

### 접근 제어 매트릭스

| 리소스 | admin | customer_manager | site_manager | worker |
|--------|-------|------------------|--------------|--------|
| 모든 현장 | ✅ | ❌ (자사만) | ✅ | ✅ |
| 모든 작업자 | ✅ | ❌ (자사만) | ✅ | ✅ |
| 작업일지 | ✅ | ❌ (자사만) | 배정 현장 | 본인/배정 현장 |
| 파트너사 정보 | ✅ | ❌ (자사만) | ✅ | ✅ |

---

## 파트너 전용 기능

### 1. 파트너 대시보드 (`/partner/dashboard`)

#### 주요 기능
- 참여 현장 통계
- 소속 직원 현황
- 최근 작업일지
- 실시간 현장 상태

#### 컴포넌트
```typescript
// app/partner/dashboard/page.tsx
- 파트너사 정보 조회
- 현장 통계 계산
- 작업자 현황 집계
- 최근 활동 로그
```

### 2. 참여 현장 관리 (`/partner/sites`)

#### 기능
- 참여 현장 목록
- 현장별 상태 및 진행률
- 작업인원 및 일지 통계
- 현장 관리자 정보

#### 필터링
- 현장명/주소 검색
- 진행 상태 필터 (진행중/완료)
- 계약 상태별 분류

### 3. 소속 직원 관리 (`/partner/workers`)

#### 기능
- 소속 직원 목록 (작업자/현장관리자)
- 출근 현황 및 통계
- 현재 배치 현장 정보
- 30일 출근 기록

#### 필터링
- 이름/이메일/전화번호 검색
- 역할별 필터 (현장관리자/작업자)
- 배치 상태 필터 (배치/대기)

---

## 구현 세부사항

### 1. 미들웨어 라우팅
```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isPartnerPath = pathname.startsWith('/partner');
  
  // customer_manager 자동 리디렉션
  if (profile.role === 'customer_manager' && !isPartnerPath && pathname === '/dashboard') {
    return NextResponse.redirect(new URL('/partner/dashboard', request.url))
  }
  
  // 파트너 경로 보호
  if (isPartnerPath && userRole !== 'customer_manager') {
    if (userRole === 'admin' || userRole === 'system_admin') {
      return NextResponse.redirect(new URL('/dashboard/admin', request.url))
    } else {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }
}
```

### 2. 가입 승인 프로세스
```typescript
// components/admin/ApprovalModal.tsx
- customer_manager 선택 시 partner_company_id 필수
- 파트너사 선택 드롭다운
- 작업자/현장관리자는 선택사항

// app/auth/actions.ts - approveSignupRequest
if (role === 'customer_manager' && organizationId) {
  profileData.partner_company_id = organizationId
  // organization_id는 설정하지 않음
} else {
  // 다른 역할은 organization_id 선택사항
  profileData.organization_id = organizationId
  profileData.site_id = siteId
}
```

### 3. 파트너 레이아웃
```typescript
// app/partner/layout.tsx
export default async function PartnerLayout({ children }) {
  // 인증 확인
  const { data: { user } } = await supabase.auth.getUser()
  
  // customer_manager 역할 검증
  if (profile.role !== 'customer_manager') {
    redirect('/dashboard')
  }
  
  // partner_company_id 검증
  if (!profile.partner_company_id) {
    redirect('/dashboard')
  }
  
  return <PartnerDashboardLayout>{children}</PartnerDashboardLayout>
}
```

---

## API 및 서비스

### DataAccessService
```typescript
// services/data-access.service.ts
export class DataAccessService {
  async getSites() {
    // customer_manager: 파트너 현장만
    if (this.profile.role === 'customer_manager' && this.profile.partner_company_id) {
      return this.supabase
        .from('site_partners')
        .select('*, sites!inner(*)')
        .eq('partner_company_id', this.profile.partner_company_id)
    }
    
    // 다른 역할: 모든 현장
    return this.supabase.from('sites').select('*')
  }
  
  async getWorkers() {
    // customer_manager: 자사 직원만
    if (this.profile.role === 'customer_manager' && this.profile.partner_company_id) {
      return query.eq('partner_company_id', this.profile.partner_company_id)
    }
    
    // 다른 역할: 모든 직원
    return query
  }
}
```

### API 엔드포인트
```
/api/partner/           # 파트너 전용 API
  /sites                # 참여 현장
  /workers              # 소속 직원
  /reports              # 작업일지
  /documents            # 문서

/api/internal/          # 내부 사용자 API
/api/admin/            # 관리자 API
```

---

## 테스트 및 검증

### 테스트 계정

| 역할 | 이메일 | 비밀번호 | 소속 |
|------|--------|----------|------|
| customer_manager | customer@inopnc.com | (임시) | 대한건설(주) |
| admin | admin@inopnc.com | admin123 | 본사 |
| worker | worker1@inopnc.com | (임시) | - |

### 테스트 시나리오

#### 1. 파트너사 관리자 접근 테스트
```typescript
// customer_manager로 로그인
1. /dashboard 접근 → /partner/dashboard로 자동 리디렉션
2. /partner/sites → 대한건설 참여 현장만 표시
3. /partner/workers → 대한건설 소속 직원만 표시
4. /dashboard/admin 접근 시도 → /partner/dashboard로 리디렉션
```

#### 2. RLS 정책 검증
```sql
-- customer_manager가 볼 수 있는 현장
SELECT * FROM sites 
WHERE id IN (
  SELECT site_id FROM site_partners 
  WHERE partner_company_id = '236c7746-56ac-4fbc-8387-40ffebed329d'
);
-- 결과: 포스코 광양제철소, 강남 A현장
```

#### 3. 데이터 격리 검증
```typescript
// DataAccessService 테스트
const service = await createDataAccessService(customerManagerId)
const sites = await service.getSites()
// 모든 사이트가 partner_company_id와 일치하는지 검증
expect(sites.every(s => s.partner_company_id === partnerId)).toBe(true)
```

---

## 유지보수 가이드

### 1. 새 파트너사 추가
```sql
-- 1. partner_companies에 추가
INSERT INTO partner_companies (company_name, business_number, status)
VALUES ('새파트너사', '123-45-67890', 'active');

-- 2. customer_manager 사용자 생성 시 partner_company_id 설정
UPDATE profiles 
SET partner_company_id = '새파트너사_ID'
WHERE id = '사용자_ID' AND role = 'customer_manager';
```

### 2. RLS 정책 수정
```sql
-- 정책 수정 시 원칙
1. customer_manager만 partner_company_id 필터링
2. 다른 역할은 단순 권한 체크
3. 헬퍼 함수 활용으로 중복 제거
```

### 3. 디버깅
```sql
-- 사용자 접근 권한 확인
SELECT 
  p.email,
  p.role,
  p.partner_company_id,
  pc.company_name,
  CASE 
    WHEN p.role = 'customer_manager' THEN 'Partner-filtered'
    WHEN p.role IN ('admin', 'system_admin') THEN 'Full access'
    ELSE 'Role-based access'
  END as access_level
FROM profiles p
LEFT JOIN partner_companies pc ON p.partner_company_id = pc.id
WHERE p.id = 'USER_ID';

-- 파트너가 접근 가능한 데이터 확인
SELECT * FROM partner_accessible_sites; -- View 활용
```

### 4. 모니터링
```sql
-- RLS 접근 모니터링 뷰
CREATE VIEW rls_access_monitor AS
SELECT 
  p.id as user_id,
  p.email,
  p.role,
  p.partner_company_id,
  pc.company_name as partner_company_name,
  CASE 
    WHEN p.role = 'customer_manager' THEN 'Partner-filtered'
    WHEN p.role IN ('admin', 'system_admin') THEN 'Full access'
    ELSE 'Role-based access'
  END as access_level
FROM profiles p
LEFT JOIN partner_companies pc ON p.partner_company_id = pc.id;
```

---

## 마이그레이션 이력

### 2025-01-10: 초기 구현
- `20250110_add_partner_company_access_control.sql`
  - partner_company_id 필드 추가
  - 헬퍼 함수 생성
  - 기본 RLS 정책

### 2025-01-10: RLS 전면 단순화
- `20250110_simplify_all_rls_policies.sql`
  - 모든 테이블 RLS 단순화
  - customer_manager만 필터링
  - 성능 최적화 인덱스

---

## 성능 최적화

### 인덱스
```sql
-- 파트너 필터링 성능 향상
CREATE INDEX idx_site_partners_partner_company 
ON site_partners(partner_company_id);

CREATE INDEX idx_profiles_partner_company 
ON profiles(partner_company_id) 
WHERE partner_company_id IS NOT NULL;

CREATE INDEX idx_profiles_role 
ON profiles(role);
```

### 쿼리 최적화
- partner_accessible_sites 뷰 활용
- 헬퍼 함수로 중복 쿼리 제거
- 필요한 경우만 JOIN 수행

---

## 보안 고려사항

### 1. 데이터 격리
- customer_manager는 partner_company_id 기반 완전 격리
- 타사 데이터 접근 불가능
- RLS 정책으로 DB 레벨 보호

### 2. 라우트 보호
- 미들웨어에서 역할 기반 라우팅
- 파트너 전용 경로 접근 제어
- 자동 리디렉션으로 잘못된 접근 방지

### 3. API 보안
- 서버 컴포넌트에서 인증 확인
- partner_company_id 검증
- Service Role Key는 서버에서만 사용

---

## 문제 해결

### Q: customer_manager가 데이터를 볼 수 없음
```sql
-- partner_company_id 확인
SELECT partner_company_id FROM profiles WHERE email = 'user@email.com';

-- site_partners 연결 확인
SELECT * FROM site_partners WHERE partner_company_id = 'ID';
```

### Q: RLS 정책이 복잡함
```sql
-- 헬퍼 함수 활용
-- is_partner_user(), get_user_partner_company_id() 사용
-- 중복 로직 제거
```

### Q: 성능 문제
```sql
-- 인덱스 확인
\d site_partners
\d profiles

-- 쿼리 플랜 분석
EXPLAIN ANALYZE SELECT * FROM sites WHERE ...
```

---

## 향후 개선 계획

### 단기 (1-2주)
- [ ] 파트너 전용 리포트 기능
- [ ] 파트너 문서 관리
- [ ] 파트너 대시보드 위젯 추가

### 중기 (1-2개월)
- [ ] 파트너 간 협업 기능
- [ ] 파트너 성과 평가 시스템
- [ ] 파트너 전용 알림 시스템

### 장기 (3-6개월)
- [ ] 파트너 포털 모바일 앱
- [ ] 파트너 API 오픈
- [ ] 파트너 자동화 워크플로우

---

## 참고 자료

### 관련 파일
- `/supabase/migrations/20250110_add_partner_company_access_control.sql`
- `/supabase/migrations/20250110_simplify_all_rls_policies.sql`
- `/app/partner/*` - 파트너 전용 페이지
- `/components/partner/*` - 파트너 컴포넌트
- `/services/data-access.service.ts` - 데이터 접근 서비스

### 외부 문서
- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js App Router](https://nextjs.org/docs/app)
- [PostgreSQL RLS](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)

---

*문서 작성일: 2025-01-10*
*최종 수정일: 2025-01-10*
*작성자: System Development Team*