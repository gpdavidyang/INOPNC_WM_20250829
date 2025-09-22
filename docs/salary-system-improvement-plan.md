# 급여관리 시스템 개선 계획서

## 📋 개요
시스템관리자의 급여관리 도구를 기준으로 작업자 및 현장관리자 화면의 급여정보 기능을 전면 업데이트하여, 일관성 있고 실시간 동기화되는 통합 급여관리 시스템을 구축합니다.

## 🎯 목표
- **데이터 일관성**: 모든 사용자 역할에서 동일한 급여 계산 로직 적용
- **실시간 동기화**: 관리자 변경사항이 즉시 모든 사용자에게 반영
- **역할별 최적화**: 각 사용자 역할에 맞는 전용 인터페이스 제공
- **투명성 향상**: 급여 계산 과정의 명확한 가시화

## 📊 현황 분석

### 1. 시스템 구조 현황

#### 관리자 (Admin) 인터페이스
- **위치**: `/app/dashboard/admin/salary/page.tsx`
- **주요 컴포넌트**:
  - `DailySalaryCalculation.tsx` - 출력일보 급여계산
  - `IndividualMonthlySalary.tsx` - 개인별 월급여계산
  - `SalaryStatementManager.tsx` - 급여명세서 생성 및 보관
  - `IndividualSalarySettings.tsx` - 개인별 급여기준 설정

#### 작업자 (Worker) 인터페이스
- **위치**: `/components/attendance/salary-view.tsx`
- **특징**: 개인 급여 조회만 가능, 캐싱 시스템 (5-10분)

#### 현장관리자 (Site Manager) 인터페이스
- **현재 상태**: 전용 급여관리 인터페이스 없음

### 2. 주요 문제점

#### 데이터 불일치 문제
| 구분 | Admin | Worker | 문제점 |
|------|-------|---------|--------|
| 계산 기준 | `labor_hours` | `work_hours + overtime_hours` | 서로 다른 계산 기준 |
| 세금 계산 | 고용형태별 차등 | 고정 비율 (8%) | 세금 계산 불일치 |
| 데이터 소스 | Mock 데이터 많음 | 실제 DB | 데이터 신뢰성 문제 |
| 업데이트 | 즉시 반영 | 5-10분 캐싱 | 실시간성 부족 |

#### 기능 격차
- **Admin**: 다양한 관리 기능 but Mock 데이터 의존
- **Worker**: 조회만 가능, 이의신청 불가
- **Site Manager**: 급여 관련 기능 전무

### 3. 데이터베이스 구조
```
salary_info (기본 급여 정보)
├── salary_records (상세 급여 기록)
├── salary_calculation_rules (급여 계산 규칙)
├── worker_salary_settings (개인별 설정)
└── employment_tax_rates (고용형태별 세율)
```

## 🛠️ 개선 계획

### Phase 1: 핵심 기반 구축 (우선순위: 🔴 높음)

#### 1.1 통합 급여 계산 서비스
```typescript
// /lib/services/salary-calculation.service.ts
export class SalaryCalculationService {
  // 통일된 계산 로직
  calculateDailySalary(workData: WorkData): SalaryResult
  calculateMonthlySalary(userId: string, period: Period): MonthlySalary
  calculateTaxDeductions(grossPay: number, employmentType: string): Deductions
}
```

**주요 개선사항**:
- labor_hours 기준으로 계산 로직 통일
- 고용형태별 세금 계산 표준화
- 보너스 및 수당 계산 규칙 체계화

#### 1.2 데이터베이스 최적화
```sql
-- 인덱스 추가
CREATE INDEX idx_salary_records_user_date ON salary_records(worker_id, work_date);
CREATE INDEX idx_attendance_user_date ON attendance_records(user_id, work_date);

-- RLS 정책 업데이트
ALTER POLICY salary_view_policy ON salary_records
  USING (
    auth.uid() = worker_id OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'site_manager')
    )
  );
```

#### 1.3 API 통합
```typescript
// /app/actions/unified-salary.ts
export async function getUnifiedSalaryData(params: SalaryParams) {
  const calculator = new SalaryCalculationService()
  // 통합된 데이터 fetching 및 계산
  return calculator.process(params)
}
```

### Phase 2: 현장관리자 기능 (우선순위: 🔴 높음)

#### 2.1 현장관리자 대시보드
```typescript
// /components/site-manager/salary-dashboard.tsx
export function SiteManagerSalaryDashboard() {
  return (
    <div>
      <TeamSalaryOverview />      {/* 팀원 급여 현황 */}
      <PendingApprovals />         {/* 승인 대기 항목 */}
      <BudgetTracking />           {/* 예산 대비 실적 */}
      <SalaryAnalytics />          {/* 급여 분석 차트 */}
    </div>
  )
}
```

#### 2.2 권한 기반 데이터 접근
```typescript
// /app/actions/site-manager/salary.ts
export async function getSiteTeamSalary(siteId: string) {
  // 현장관리자 권한 검증
  // 해당 현장 팀원 급여 데이터만 반환
}
```

### Phase 3: 실시간 동기화 (우선순위: 🟡 중간)

#### 3.1 Realtime 구독 시스템
```typescript
// /hooks/useSalaryRealtime.ts
export function useSalaryRealtime(userId: string) {
  useEffect(() => {
    const subscription = supabase
      .channel('salary-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'salary_records',
        filter: `worker_id=eq.${userId}`
      }, handleSalaryUpdate)
      .subscribe()
    
    return () => subscription.unsubscribe()
  }, [userId])
}
```

#### 3.2 캐시 무효화 전략
```typescript
// 급여 데이터 변경 시 즉시 캐시 무효화
const invalidateSalaryCache = (userId: string) => {
  queryClient.invalidateQueries(['salary', userId])
}
```

### Phase 4: 고급 기능 (우선순위: 🟢 낮음)

#### 4.1 급여명세서 시스템
```typescript
// /lib/services/payslip-generator.ts
export class PayslipGenerator {
  async generatePDF(salaryData: SalaryData): Promise<Blob> {
    // PDF 생성 로직
  }
  
  async sendEmail(payslip: Blob, recipient: string): Promise<void> {
    // 이메일 발송 로직
  }
}
```

#### 4.2 급여 분석 리포트
```typescript
// /components/admin/salary-analytics.tsx
export function SalaryAnalytics() {
  // 월별/분기별 급여 통계
  // 현장별 비교 분석
  // 예산 대비 실적 차트
}
```

## 📁 파일 구조 변경

### 신규 생성 파일
```
/lib/services/
├── salary-calculation.service.ts    # 통합 계산 엔진
├── payslip-generator.ts            # 급여명세서 생성
└── salary-notification.service.ts   # 알림 서비스

/components/
├── site-manager/
│   ├── salary-dashboard.tsx        # 현장관리자 대시보드
│   ├── team-salary-overview.tsx    # 팀 급여 현황
│   └── approval-workflow.tsx       # 승인 워크플로우
└── shared/
    ├── salary-table.tsx            # 공통 급여 테이블
    └── salary-calculation-view.tsx # 계산 과정 표시

/hooks/
├── useSalaryRealtime.ts            # 실시간 구독
└── useSalaryCache.ts               # 캐시 관리

/app/api/salary/
├── approve/route.ts                # 승인 API
├── export/route.ts                 # 내보내기 API
└── webhook/route.ts                # 웹훅 처리
```

### 수정 대상 파일
```
/components/attendance/salary-view.tsx      # 실시간 업데이트 추가
/components/admin/SalaryManagement.tsx      # Mock 데이터 제거
/app/actions/salary.ts                      # 통합 서비스 사용
/app/actions/admin/salary.ts                # 통합 서비스 사용
/app/dashboard/page.tsx                     # 현장관리자 라우팅
```

## 🔄 구현 로드맵

### Week 1: 기반 구축
| 일차 | 작업 내용 | 담당 |
|-----|----------|------|
| Day 1-2 | 통합 급여 계산 서비스 구축 | Backend |
| Day 3 | API 통합 및 Mock 데이터 제거 | Backend |
| Day 4-5 | 데이터베이스 최적화 및 마이그레이션 | Database |

### Week 2: 기능 개발
| 일차 | 작업 내용 | 담당 |
|-----|----------|------|
| Day 6-8 | 현장관리자 대시보드 개발 | Frontend |
| Day 9-10 | 실시간 동기화 구현 | Full-stack |

### Week 3: 완성 및 배포
| 일차 | 작업 내용 | 담당 |
|-----|----------|------|
| Day 11-12 | 급여명세서 시스템 구축 | Backend |
| Day 13 | 통합 테스트 | QA |
| Day 14 | 배포 및 모니터링 | DevOps |

## 📊 예상 효과

### 정량적 효과
- **데이터 정확도**: 99.9% 이상 (현재 약 85%)
- **처리 시간**: 실시간 (현재 5-10분 지연)
- **관리 효율성**: 50% 향상 (자동화로 인한 수작업 감소)
- **오류율**: 90% 감소 (통합 로직으로 인한 일관성)

### 정성적 효과
- **사용자 만족도**: 투명한 급여 계산으로 신뢰도 향상
- **업무 효율성**: 현장관리자 권한 부여로 의사결정 신속화
- **시스템 안정성**: 실시간 동기화로 데이터 일관성 보장
- **확장성**: 모듈화된 구조로 향후 기능 추가 용이

## ⚠️ 리스크 및 대응 방안

### 기술적 리스크
| 리스크 | 영향도 | 대응 방안 |
|--------|--------|-----------|
| 데이터 마이그레이션 실패 | 높음 | 단계별 마이그레이션, 롤백 계획 수립 |
| 실시간 동기화 부하 | 중간 | 디바운싱, 스로틀링 적용 |
| 기존 시스템 호환성 | 낮음 | 점진적 전환, 하위 호환성 유지 |

### 운영적 리스크
| 리스크 | 영향도 | 대응 방안 |
|--------|--------|-----------|
| 사용자 교육 부족 | 중간 | 사용자 매뉴얼 작성, 교육 세션 진행 |
| 초기 버그 발생 | 중간 | 베타 테스트, 단계별 롤아웃 |
| 성능 저하 | 낮음 | 성능 모니터링, 최적화 지속 |

## 🎯 성공 지표 (KPI)

### 단기 지표 (1개월)
- 급여 계산 정확도 99% 이상 달성
- 실시간 동기화 지연 시간 1초 이내
- 현장관리자 급여 관리 기능 활용률 80% 이상

### 중기 지표 (3개월)
- 급여 관련 문의 50% 감소
- 급여 처리 시간 70% 단축
- 사용자 만족도 4.5/5.0 이상

### 장기 지표 (6개월)
- 급여 관리 자동화율 90% 달성
- 시스템 오류율 0.1% 이하 유지
- ROI 200% 달성 (인건비 절감 효과)

## 📝 부록

### A. 데이터베이스 스키마 변경사항
```sql
-- 새로운 테이블 추가
CREATE TABLE salary_approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  salary_record_id UUID REFERENCES salary_records(id),
  approver_id UUID REFERENCES profiles(id),
  status VARCHAR(50),
  approved_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 기존 테이블 수정
ALTER TABLE salary_records 
ADD COLUMN approval_status VARCHAR(50) DEFAULT 'pending',
ADD COLUMN approved_by UUID REFERENCES profiles(id),
ADD COLUMN approved_at TIMESTAMP;
```

### B. API 엔드포인트 명세
```typescript
// 통합 급여 API
POST   /api/salary/calculate     // 급여 계산
GET    /api/salary/records       // 급여 기록 조회
PUT    /api/salary/approve       // 급여 승인
POST   /api/salary/export        // 급여 데이터 내보내기
GET    /api/salary/analytics     // 급여 분석 데이터

// 현장관리자 전용 API
GET    /api/site-manager/team-salary    // 팀 급여 조회
POST   /api/site-manager/approve        // 급여 승인 요청
GET    /api/site-manager/budget         // 예산 현황 조회
```

### C. 테스트 계획
```typescript
// 단위 테스트
describe('SalaryCalculationService', () => {
  test('일일 급여 계산 정확도')
  test('월간 급여 집계 정확도')
  test('세금 계산 정확도')
})

// 통합 테스트
describe('Salary System Integration', () => {
  test('Admin → Worker 데이터 동기화')
  test('실시간 업데이트 지연 시간')
  test('권한별 데이터 접근 제어')
})

// E2E 테스트
describe('Salary Workflow E2E', () => {
  test('급여 계산 → 승인 → 지급 프로세스')
  test('급여명세서 생성 및 다운로드')
  test('이의신청 처리 워크플로우')
})
```

## 📞 문의 및 지원
- 기술 문의: tech-support@inopnc.com
- 프로젝트 관리: pm@inopnc.com
- 긴급 지원: 070-XXXX-XXXX

---

*이 문서는 INOPNC 급여관리 시스템 개선 프로젝트의 공식 계획서입니다.*
*최종 수정일: 2025-01-09*