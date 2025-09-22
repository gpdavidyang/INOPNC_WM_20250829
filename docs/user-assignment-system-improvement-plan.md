# 사용자 배정 시스템 개선 계획서

## 📋 개요

본 문서는 현재의 사용자-현장 배정 시스템에 대한 분석과 개선 방안을 제시합니다. 기존 시스템의 문제점을 파악하고, 사용자 친화적이며 직관적인 배정 시스템으로 개선하기 위한 구체적인 계획을 담고 있습니다.

## 🔍 현재 시스템 분석

### 1. 기존 구현 현황

#### 1.1 주요 컴포넌트
- **UserManagement.tsx** (`/components/admin/UserManagement.tsx`)
  - 사용자 목록 조회, 검색, 필터링
  - 사용자 생성/수정/삭제 기능
  - 역할별 분류 (작업자, 현장관리자, 파트너사, 관리자)
  - 배정된 현장 정보 표시 (site_assignments 컬럼)
  - 소속 조직 정보 표시 (organization 컬럼)

- **SiteManagement.tsx** (`/components/admin/SiteManagement.tsx`)
  - 현장 목록 관리 및 CRUD 작업
  - 현장별 작업자 관리 모달 연결
  - 통합 현장 보기 기능

- **UserSiteAssignmentModal.tsx** (`/components/admin/UserSiteAssignmentModal.tsx`)
  - 개별 사용자의 현장 배정 관리
  - 배정 역할 선택 (작업자, 감독자, 현장관리자)
  - 배정 유형 선택 (정규, 임시, 대체)
  - 배정 이력 조회

- **Server Actions** (`/app/actions/admin/users.ts`)
  - UserWithSites 인터페이스 정의
  - 사용자 데이터와 현장 배정 정보 통합 조회
  - site_assignments 관계 데이터 포함

#### 1.2 데이터베이스 구조
```sql
-- 현재 주요 테이블들
- profiles (사용자 기본 정보)
  ├── organization_id (소속 조직)
  ├── partner_company_id (파트너사 정보)
  └── role (사용자 역할)

- site_assignments (현장 배정)
  ├── user_id
  ├── site_id  
  ├── role
  └── is_active

- user_site_assignments (개별 사용자 배정)
  ├── user_id
  ├── site_id
  ├── assignment_type
  └── assigned_date
```

### 2. 현재 시스템의 문제점

#### 2.1 개념적 혼선
- **파트너사 소속 vs 현장 배정** 개념이 명확히 구분되지 않음
- 사용자가 파트너사에 소속되어 있으면서 동시에 특정 현장에 배정되는 관계가 모호함
- 관리자가 배정 프로세스를 이해하기 어려움

#### 2.2 UI/UX 문제점
- **복잡한 배정 인터페이스**: 여러 단계를 거쳐야 하는 배정 프로세스
- **부족한 설명**: 배정 개념에 대한 가이드나 툴팁 부재
- **혼재된 정보**: 소속 정보와 배정 정보가 구분되지 않음
- **분산된 관리**: 사용자 관리와 현장 관리가 별도로 분리됨

#### 2.3 데이터 구조 문제
- **중복된 배정 테이블**: `site_assignments`와 `user_site_assignments` 분리로 인한 데이터 불일치 가능성
- **파트너사-현장 매핑 부재**: 파트너사와 현장 간의 직접적인 관계 정의 부족
- **배정 이력 관리 부족**: 과거 배정 내역 추적의 어려움

#### 2.4 관리 효율성 문제
- **번거로운 배정 프로세스**: 개별 사용자마다 현장을 하나씩 배정해야 함
- **일괄 배정 기능 부족**: 파트너사 단위로 현장 배정하는 기능 없음
- **배정 상태 모니터링 어려움**: 전체적인 배정 현황 파악이 힘듦

## 🎯 개선 방향 및 요구사항

### 1. 새로운 배정 개념 정립

#### 1.1 2단계 배정 시스템
```
1단계: 파트너사 ↔ 현장 매핑
   - 파트너사가 담당하는 현장 지정
   - 현장별 파트너사 할당

2단계: 사용자 ↔ 현장 개별 배정
   - 관리자가 개별 사용자를 특정 현장에 배정
   - 사용자의 파트너사 소속과 독립적으로 관리
   - 배정 이력 유지하되 접근 제한 없음
```

#### 1.2 배정 타입 표준화
- **파트너사 소속**: 사용자의 기본 소속 정보 (자주 변경 가능)
- **현장 배정**: 관리자에 의한 개별 현장 할당 (명시적 배정)
- **배정 이력**: 과거 배정 기록 보관 (데이터 분석용)

### 2. 사용자 인터페이스 개선

#### 2.1 통합 대시보드 구현
- 파트너사-현장 매핑 현황을 한눈에 볼 수 있는 대시보드
- 사용자별 현재 배정 상태 실시간 모니터링
- 배정되지 않은 사용자/현장 식별 기능

#### 2.2 직관적인 배정 인터페이스
- 드래그 앤 드롭 방식의 배정 인터페이스
- 단계별 가이드 및 툴팁 제공
- 배정 충돌 방지 및 경고 시스템

#### 2.3 설명 및 가이드 강화
- 각 단계별 상세 설명 제공
- 배정 개념에 대한 도움말 팝업
- 사용 예시 및 베스트 프랙티스 가이드

## 📊 구체적 개선 계획

### Phase 1: 데이터베이스 스키마 재설계 (1-2주)

#### 1.1 새로운 테이블 구조
```sql
-- 파트너사-현장 매핑 테이블 신규 생성
CREATE TABLE partner_site_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_company_id UUID REFERENCES partner_companies(id),
  site_id UUID REFERENCES sites(id),
  start_date DATE NOT NULL,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 통합 사용자 배정 테이블 (기존 테이블들 통합)
CREATE TABLE unified_user_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  site_id UUID REFERENCES sites(id),
  assignment_type VARCHAR(20) CHECK (assignment_type IN ('permanent', 'temporary', 'substitute')),
  role VARCHAR(20) CHECK (role IN ('worker', 'supervisor', 'site_manager')),
  assigned_by UUID REFERENCES profiles(id),
  assigned_date TIMESTAMP DEFAULT NOW(),
  unassigned_date TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  notes TEXT
);
```

#### 1.2 기존 데이터 마이그레이션
- `site_assignments`와 `user_site_assignments` 데이터 통합
- 파트너사-현장 관계 데이터 정리
- 배정 이력 데이터 보존

### Phase 2: Admin UI 완전 개편 (2-3주)

#### 2.1 새로운 컴포넌트 구조
```typescript
// 통합 배정 관리 컴포넌트
components/admin/assignment/
├── AssignmentDashboard.tsx          // 전체 배정 현황 대시보드
├── PartnerSiteMapping.tsx           // 파트너사-현장 매핑 관리
├── UserAssignmentMatrix.tsx         // 사용자-현장 배정 매트릭스
├── AssignmentWizard.tsx             // 단계별 배정 마법사
└── AssignmentHistory.tsx            // 배정 이력 조회
```

#### 2.2 주요 기능 구현
- **통합 대시보드**: 파트너사, 현장, 사용자 배정 상태 종합 표시
- **시각적 매핑 인터페이스**: 파트너사와 현장 간의 관계를 직관적으로 표현
- **일괄 배정 기능**: 파트너사 단위로 여러 사용자를 한번에 배정
- **스마트 추천**: 파트너사 소속에 따른 현장 배정 제안

#### 2.3 UX 개선 요소
```typescript
// 설명 툴팁 컴포넌트
const AssignmentTooltip = ({ type }: { type: 'partner' | 'assignment' }) => (
  <div className="tooltip">
    {type === 'partner' && (
      <div>
        <h4>파트너사 소속</h4>
        <p>사용자가 소속된 파트너 회사입니다. 현장 변경 시 자주 바뀔 수 있습니다.</p>
      </div>
    )}
    {type === 'assignment' && (
      <div>
        <h4>현장 배정</h4>
        <p>관리자가 개별적으로 지정하는 작업 현장입니다. 명확한 업무 할당을 위해 필요합니다.</p>
      </div>
    )}
  </div>
)
```

### Phase 3: 기능 고도화 (1-2주)

#### 3.1 고급 배정 기능
- **배정 시뮬레이션**: 배정 변경 전 영향도 분석
- **자동 배정 알고리즘**: 조건에 따른 최적 배정 제안
- **배정 템플릿**: 자주 사용하는 배정 패턴 저장

#### 3.2 모니터링 및 리포팅
- **실시간 배정 현황**: 대시보드를 통한 실시간 모니터링
- **배정 통계**: 파트너사별, 현장별 배정 현황 리포트
- **이력 추적**: 상세한 배정 변경 이력 관리

### Phase 4: 문서화 및 교육 자료 (1주)

#### 4.1 사용자 가이드 작성
```markdown
# 사용자 배정 시스템 가이드

## 배정 개념 이해
1. 파트너사 소속: 사용자의 기본 회사 정보
2. 현장 배정: 실제 작업할 현장 지정

## 배정 프로세스
1. 파트너사와 현장 매핑 확인
2. 개별 사용자 현장 배정
3. 배정 확인 및 알림
```

#### 4.2 관리자 교육 자료
- 화면별 사용법 스크린샷
- 자주 묻는 질문 (FAQ)
- 문제 해결 가이드

## 🎉 예상 효과

### 1. 관리 효율성 향상
- **50% 시간 단축**: 직관적인 인터페이스로 배정 시간 단축
- **실수 방지**: 자동 검증 및 경고 시스템으로 오배정 방지
- **일관된 프로세스**: 표준화된 배정 절차로 관리 일관성 확보

### 2. 사용자 경험 개선
- **직관적 이해**: 명확한 배정 개념으로 혼선 해소
- **간편한 조작**: 드래그 앤 드롭 등 직관적 인터페이스
- **실시간 피드백**: 즉시 확인 가능한 배정 결과

### 3. 데이터 품질 향상
- **데이터 일관성**: 통합 테이블로 데이터 불일치 해소
- **완전한 이력**: 모든 배정 변경 사항의 완전한 추적
- **정확한 분석**: 신뢰할 수 있는 배정 통계 및 리포트

## 📅 구현 일정

| Phase | 기간 | 주요 작업 | 산출물 |
|-------|------|-----------|--------|
| Phase 1 | 1-2주 | DB 스키마 재설계 | 새로운 테이블 구조, 마이그레이션 스크립트 |
| Phase 2 | 2-3주 | UI 컴포넌트 개발 | 새로운 관리 인터페이스 |
| Phase 3 | 1-2주 | 고급 기능 구현 | 자동화 및 모니터링 기능 |
| Phase 4 | 1주 | 문서화 및 테스트 | 사용자 가이드, 테스트 결과 |

**총 예상 기간**: 5-8주

## 🔧 구현 우선순위

### High Priority (즉시 구현)
1. 파트너사-현장 매핑 테이블 생성
2. 통합 배정 대시보드 구현
3. 배정 개념 설명 툴팁 추가

### Medium Priority (Phase 2)
1. 드래그 앤 드롭 배정 인터페이스
2. 일괄 배정 기능
3. 배정 이력 조회 개선

### Low Priority (Phase 3)
1. 자동 배정 알고리즘
2. 고급 리포팅 기능
3. 배정 템플릿 관리

---

**작성일**: 2025년 9월 11일  
**문서 버전**: v1.0  
**작성자**: Claude AI Assistant  
**검토 필요**: 시스템 관리자, 사용자 대표