# Auth Provider 분리 아키텍처 - 마이그레이션 가이드

## 개요

기존 `UnifiedAuthProvider`의 책임을 적절히 분리하여 유지보수성과 테스트 가능성을 향상시킨 새로운 아키텍처입니다.

## 새로운 아키텍처 구조

### 1. CoreAuthProvider (`/providers/core-auth-provider.tsx`)

**책임**: 기본 인증 상태 관리

- User, Session 관리
- 인증 상태 변경 감지
- 로그아웃 처리
- 세션 갱신

```tsx
interface CoreAuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  error: string | null
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
}
```

### 2. ProfileProvider (`/providers/profile-provider.tsx`)

**책임**: 프로필 데이터 관리

- 프로필 페칭 및 캐싱
- 프로필 업데이트
- 모바일 특화 헬퍼 함수 (getCurrentSite)
- 에러 핸들링 및 폴백

```tsx
interface ProfileContextType {
  profile: UnifiedProfile | null
  loading: boolean
  error: string | null
  refreshProfile: () => Promise<void>
  getCurrentSite: () => Promise<any>
}
```

### 3. RoleProvider (`/providers/role-provider.tsx`)

**책임**: 역할 기반 접근 제어

- 역할 기반 권한 계산
- 접근 제어 로직
- 계층적 권한 체크
- 성능 최적화 (useMemo)

```tsx
interface RoleContextType {
  role: string | null
  canAccessMobile: boolean
  canAccessAdmin: boolean
  isWorker: boolean
  isSiteManager: boolean
  isCustomerManager: boolean
  isAdmin: boolean
  isSystemAdmin: boolean
  getUserRole: () => string | null
  // 추가 권한 헬퍼들
  canManageUsers: boolean
  canManageSites: boolean
  canApproveReports: boolean
  canCreateReports: boolean
  canViewAllReports: boolean
}
```

### 4. CompositeAuthProvider (`/providers/composite-auth-provider.tsx`)

**책임**: Provider 조합 및 계층 구조 관리

- 모든 Provider를 올바른 순서로 조합
- 기존 UnifiedAuthProvider와 호환성 제공

### 5. useUnifiedAuth Hook (`/hooks/use-unified-auth.tsx`)

**책임**: 통합 인터페이스 제공

- 기존 UnifiedAuthProvider와 100% 호환
- 개별 Provider의 기능을 통합하여 제공
- 편의 alias 제공

## 마이그레이션 방법

### 1. 즉시 사용 가능 (호환성 모드)

기존 코드 변경 없이 바로 사용 가능합니다:

```tsx
// 기존 코드 - 변경 없음
import { useUnifiedAuth } from '@/providers/unified-auth-provider'

function MyComponent() {
  const { user, profile, isWorker, signOut } = useUnifiedAuth()
  // 모든 기존 기능이 그대로 작동
}
```

### 2. 새로운 hook 사용 (권장)

새로운 통합 hook으로 점진적 마이그레이션:

```tsx
// 새로운 import
import { useUnifiedAuth } from '@/hooks/use-unified-auth'

function MyComponent() {
  const { user, profile, isWorker, signOut } = useUnifiedAuth()
  // 동일한 인터페이스, 더 나은 성능
}
```

### 3. 개별 Provider 사용 (최적화)

특정 기능만 필요한 경우:

```tsx
import { useCoreAuth } from '@/providers/core-auth-provider'
import { useProfile } from '@/providers/profile-provider'
import { useRole } from '@/providers/role-provider'

function MyComponent() {
  const { user, signOut } = useCoreAuth()
  const { profile } = useProfile()
  const { isWorker } = useRole()
}
```

## Provider 의존성 관계

```
CompositeAuthProvider
├── CoreAuthProvider (최상위)
│   └── user, session 제공
├── ProfileProvider (CoreAuth 의존)
│   └── user.id로 profile 페칭
└── RoleProvider (Profile 의존)
    └── profile.role로 권한 계산
```

## 장점

### 1. 단일 책임 원칙 준수

- 각 Provider가 명확한 책임을 가짐
- 코드 이해 및 유지보수 용이

### 2. 테스트 가능성 향상

- 개별 Provider 단위 테스트 가능
- Mock 객체 생성 용이

### 3. 성능 최적화

- 불필요한 리렌더링 방지
- useMemo를 통한 계산 최적화

### 4. 재사용성 증대

- 필요한 Provider만 선택적 사용 가능
- 다른 프로젝트에서 부분적 재사용 가능

### 5. 확장성

- 새로운 기능 추가 시 해당 Provider에만 영향
- 기존 코드에 최소한의 영향

## 기존 코드와의 호환성

### 완전 호환 보장

```tsx
// 기존 UnifiedAuthProvider 사용법
const {
  user,
  session,
  profile,
  loading,
  error,
  signOut,
  refreshSession,
  refreshProfile,
  canAccessMobile,
  canAccessAdmin,
  isWorker,
  isSiteManager,
  isCustomerManager,
  isAdmin,
  isSystemAdmin,
  getCurrentSite,
  getUserRole,
} = useUnifiedAuth()
```

### 추가된 편의 기능

```tsx
// 새로 추가된 권한 헬퍼들
const { canManageUsers, canManageSites, canApproveReports, canCreateReports, canViewAllReports } =
  useUnifiedAuth()
```

## 성능 개선 사항

### 1. 선택적 렌더링

- 특정 데이터만 필요한 경우 해당 Provider만 구독
- 불필요한 리렌더링 방지

### 2. 계산 최적화

- 역할 기반 권한을 useMemo로 캐싱
- profile.role 변경 시에만 재계산

### 3. 메모리 효율성

- 각 Provider가 자체 상태만 관리
- 메모리 사용량 최적화

## 향후 확장 계획

### 1. 알림 Provider

```tsx
// NotificationProvider 추가 예정
const { notifications, markAsRead } = useNotification()
```

### 2. 설정 Provider

```tsx
// SettingsProvider 추가 예정
const { theme, language, preferences } = useSettings()
```

### 3. 성능 모니터링 Provider

```tsx
// PerformanceProvider 추가 예정
const { metrics, track } = usePerformance()
```

## 문제 해결

### 일반적인 이슈

1. **Provider 순서 중요**: CompositeAuthProvider 사용 권장
2. **개별 Provider 사용 시**: 의존성 순서 준수 필요
3. **성능 이슈**: 불필요한 전체 context 구독 방지

### 디버깅 팁

```tsx
// 개별 Provider 상태 확인
const coreAuth = useCoreAuth()
const profile = useProfile()
const role = useRole()

console.log('Auth state:', coreAuth)
console.log('Profile state:', profile)
console.log('Role state:', role)
```

## 결론

새로운 분리된 아키텍처는 기존 기능을 모두 유지하면서 다음을 제공합니다:

- ✅ 100% 하위 호환성
- ✅ 향상된 성능
- ✅ 더 나은 테스트 가능성
- ✅ 확장 가능한 구조
- ✅ 명확한 책임 분리

점진적 마이그레이션이 가능하므로 기존 코드를 변경하지 않고도 새로운 아키텍처의 이점을 활용할 수 있습니다.
