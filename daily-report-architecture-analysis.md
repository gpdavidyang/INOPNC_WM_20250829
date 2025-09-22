# 작업일지 작성 기능 아키텍처 분석 보고서

## 📊 현재 상황 분석

### 🎯 역할별 페이지 구조

#### 1. **일반 사용자** (`/dashboard/daily-reports/`)
- **작성**: `new/page.tsx` → `DailyReportFormEnhanced` 컴포넌트 사용
- **편집**: `[id]/edit/page.tsx` → `DailyReportFormEditMobile` 컴포넌트 사용
- **권한**: `['worker', 'site_manager', 'admin', 'system_admin']`

#### 2. **관리자** (`/dashboard/admin/daily-reports/`)
- **작성**: `new/page.tsx` → `DailyReportFormEnhanced` 컴포넌트 사용 (동일!)
- **편집**: `[id]/edit/page.tsx` → `DailyReportFormEdit` 컴포넌트 사용 (현재 비활성화)
- **권한**: `profile.role !== 'admin'` (admin만 접근)

### 🔍 컴포넌트 분석

| 컴포넌트 | 용도 | 상태 | 사용 위치 |
|----------|------|------|-----------|
| `DailyReportFormEnhanced` | 작성 (통합) | ✅ **활성** | 모든 역할의 작성 페이지 |
| `DailyReportFormEditMobile` | 편집 (일반) | ✅ **활성** | 일반 사용자 편집 |
| `DailyReportFormEdit` | 편집 (관리자) | ❌ **비활성화** | 관리자 편집 (현재 미사용) |
| `daily-report-form.tsx` | 기존 폼 | ❓ **미확인** | 사용 여부 불확실 |
| `daily-report-form-new.tsx` | 새 폼 | ❓ **미확인** | 사용 여부 불확실 |

## 🚨 발견된 문제점

### 1. **컴포넌트 중복 및 혼재**
```
✅ 통합된 부분:
- DailyReportFormEnhanced: 모든 역할의 작성 페이지에서 공통 사용

❌ 분리된 부분:
- 편집 기능: 일반사용자(Mobile) vs 관리자(비활성화)
- 5개의 다른 daily-report-form 컴포넌트 존재

❓ 불확실한 부분:
- 일부 컴포넌트의 실제 사용 여부 미확인
```

### 2. **권한 체계 불일치**
```typescript
// 일반 사용자 작성 페이지
const allowedRoles = ['worker', 'site_manager', 'admin', 'system_admin']

// 관리자 작성 페이지  
if (profile.role !== 'admin') // admin만 허용

// 🤔 문제: admin도 일반 페이지에서 작성 가능한데 왜 별도 페이지가?
```

### 3. **기능 중복**
- 관리자도 일반 작업일지 작성 페이지 접근 가능
- 동일한 `DailyReportFormEnhanced` 컴포넌트를 두 경로에서 사용
- URL만 다르고 기능은 거의 동일

### 4. **관리자 편집 기능 비활성화**
```typescript
// DailyReportFormEdit은 현재 플레이스홀더
export default function DailyReportFormEdit(props: any) {
  return (
    <div className="max-w-2xl mx-auto space-y-3">
      <div className="bg-white p-6 rounded-lg border">
        <h2 className="text-lg font-semibold mb-4">작업일지 편집 (임시)</h2>
        <p className="text-gray-600">
          작업일지 편집 기능이 임시적으로 비활성화되었습니다.
        </p>
```

## 💡 권장사항

### 🎯 **Option 1: 완전 통합 (권장)**

#### 장점:
- **코드 중복 제거**: 하나의 컴포넌트로 모든 기능 제공
- **유지보수 효율성**: 한 곳에서 모든 수정 사항 관리
- **일관된 사용자 경험**: 역할에 관계없이 동일한 인터페이스
- **버그 감소**: 단일 컴포넌트로 테스트 포인트 최소화

#### 구현 방안:
```typescript
// 🔄 단일 통합 컴포넌트: DailyReportForm
interface DailyReportFormProps {
  mode: 'create' | 'edit'
  currentUser: Profile
  reportData?: DailyReport // edit 모드일 때만
  sites: Site[]
  materials?: Material[]
  workers?: Profile[]
}

// 🔑 역할 기반 기능 제어
const DailyReportForm = ({ mode, currentUser, ... }: DailyReportFormProps) => {
  const isAdmin = ['admin', 'system_admin'].includes(currentUser.role)
  const isSiteManager = currentUser.role === 'site_manager'
  
  return (
    <div>
      {/* 모든 역할 공통 기능 */}
      <BasicReportFields />
      
      {/* 관리자만 볼 수 있는 기능 */}
      {isAdmin && <AdminOnlyFeatures />}
      
      {/* 현장관리자 이상만 볼 수 있는 기능 */}
      {(isAdmin || isSiteManager) && <ManagerFeatures />}
    </div>
  )
}
```

#### 디렉토리 구조 개선:
```
components/daily-reports/
├── daily-report-form.tsx           # 🔄 통합 컴포넌트
├── sections/
│   ├── basic-info-section.tsx
│   ├── work-details-section.tsx
│   ├── materials-section.tsx
│   ├── photos-section.tsx
│   └── admin-features-section.tsx
└── hooks/
    └── use-daily-report-form.ts
```

### 🔀 **Option 2: 역할별 분리 유지**

#### 장점:
- **명확한 권한 분리**: 각 역할별로 별도 컴포넌트
- **보안 강화**: 불필요한 기능 노출 방지
- **독립적 개발**: 역할별 기능 독립적 수정 가능

#### 단점:
- **코드 중복**: 공통 기능을 여러 번 구현
- **유지보수 부담**: 수정 사항을 여러 곳에 적용
- **불일치 위험**: 역할별 기능 차이로 인한 혼란

## 🏆 최종 권장사항

### **Option 1 (완전 통합) 채택을 강력히 권장합니다**

#### 이유:
1. **현재 이미 부분적으로 통합됨**: `DailyReportFormEnhanced`를 모든 역할이 사용
2. **동적 작업옵션 시스템**: 이미 구현된 통합 시스템과 일치
3. **코드 품질**: 중복 제거로 버그 가능성 감소
4. **개발 효율성**: 하나의 컴포넌트만 유지보수
5. **사용자 경험**: 역할 변경 시에도 일관된 인터페이스

### 🛠️ 구체적 실행 계획

#### Phase 1: 컴포넌트 통합
```typescript
// ✅ 유지: DailyReportFormEnhanced (기본)
// 🔄 개선: 역할별 기능 제어 로직 추가
// ❌ 제거: 중복 컴포넌트들
```

#### Phase 2: 라우팅 정리
```typescript
// ✅ 유지: /dashboard/daily-reports/* (모든 역할)
// ❌ 제거: /dashboard/admin/daily-reports/* (중복)
// 🔄 리다이렉트: 관리자 전용 URL → 통합 URL
```

#### Phase 3: 권한 시스템 정리
```typescript
// 🎯 통합 권한 체크
const canCreateReport = ['worker', 'site_manager', 'admin', 'system_admin'].includes(user.role)
const canEditAnyReport = ['admin', 'system_admin'].includes(user.role)
const canEditOwnReport = report.created_by === user.id
```

### 📋 실행 우선순위

1. **HIGH**: 관리자 편집 기능 활성화 (현재 비활성화됨)
2. **HIGH**: 중복 컴포넌트 정리 및 통합
3. **MEDIUM**: 권한 시스템 일원화
4. **LOW**: URL 라우팅 정리 (하위 호환성 유지)

## 🎯 결론

현재 시스템은 **부분적 통합 상태**로, `DailyReportFormEnhanced` 컴포넌트를 중심으로 이미 통합이 진행되고 있습니다. 완전한 통합을 통해 코드 품질과 유지보수성을 크게 향상시킬 수 있습니다.

**핵심 메시지**: 이미 구현된 동적 작업옵션 시스템과 같은 방향으로, 역할별 권한은 컴포넌트 내부에서 제어하되 UI 컴포넌트는 통합하는 것이 최선입니다.