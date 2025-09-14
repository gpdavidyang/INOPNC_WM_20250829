# 🔧 인증 시스템 리팩토링 계획서

## 📋 개요

현재 Next.js 애플리케이션의 인증 시스템에서 발견된 체계적인 구조적 문제를 해결하기 위한 단계별 리팩토링 계획입니다.

### 현재 상황

- ❌ 로컬 환경: 로그인 후 무한 리다이렉트 루프
- ❌ 배포 환경: 로그인 화면 로딩 실패
- ❌ 코드 구조: SOLID 원칙 위반, 중복된 로직, 불명확한 경계

### 목표

- ✅ 안정적인 인증 플로우 구축
- ✅ 명확한 아키텍처 경계 설정
- ✅ 성능 최적화 및 유지보수성 향상

---

## 🚀 Phase 0: 긴급 안정화 (1-2일)

### 목표

즉시 프로덕션 이슈를 해결하고 시스템을 안정화

### 구현 내용

#### 1. Circuit Breaker Pattern for Redirect Loop Prevention

```typescript
// lib/auth/circuit-breaker.ts
export class AuthCircuitBreaker {
  private static readonly MAX_REDIRECTS = 3
  private static readonly RESET_TIME = 5000 // 5 seconds

  static checkRedirect(path: string): boolean {
    if (typeof window === 'undefined') return true

    const key = 'auth_redirects'
    const now = Date.now()
    const redirects = JSON.parse(sessionStorage.getItem(key) || '[]')

    // Clean old redirects
    const recent = redirects.filter((r: any) => now - r.time < this.RESET_TIME)

    if (recent.length >= this.MAX_REDIRECTS) {
      console.error('Redirect loop detected!')
      sessionStorage.removeItem(key)
      return false // Break the circuit
    }

    recent.push({ path, time: now })
    sessionStorage.setItem(key, JSON.stringify(recent))
    return true
  }

  static reset(): void {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('auth_redirects')
    }
  }
}
```

#### 2. Centralized Role Routing

```typescript
// lib/auth/routing.ts
export const AUTH_ROUTES = {
  LOGIN: '/auth/login',
  DASHBOARD: {
    ADMIN: '/dashboard/admin',
    PARTNER: '/partner/dashboard',
    MOBILE: '/mobile',
  },
} as const

export function getRoleBasedRoute(role: string | null): string {
  const roleRouteMap: Record<string, string> = {
    system_admin: AUTH_ROUTES.DASHBOARD.ADMIN,
    admin: AUTH_ROUTES.DASHBOARD.ADMIN,
    customer_manager: AUTH_ROUTES.DASHBOARD.PARTNER,
    partner: AUTH_ROUTES.DASHBOARD.PARTNER,
    worker: AUTH_ROUTES.DASHBOARD.MOBILE,
    site_manager: AUTH_ROUTES.DASHBOARD.MOBILE,
  }

  return roleRouteMap[role || ''] || AUTH_ROUTES.DASHBOARD.ADMIN
}

export function shouldAccessMobile(role: string): boolean {
  return ['worker', 'site_manager', 'customer_manager'].includes(role)
}
```

#### 3. Environment Configuration Safety

```typescript
// lib/config/env.ts
export class EnvConfig {
  static get supabaseUrl(): string {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!url && process.env.NODE_ENV === 'production') {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL is required in production')
    }
    return url || 'http://localhost:54321'
  }

  static get supabaseAnonKey(): string {
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!key && process.env.NODE_ENV === 'production') {
      throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is required in production')
    }
    return key || 'dummy-key-for-development'
  }

  static validate(): void {
    this.supabaseUrl
    this.supabaseAnonKey
  }
}
```

### 테스트 계획

- Unit tests for circuit breaker
- Integration tests for role routing
- E2E tests for login flow

### 성공 지표

- 무한 루프 0건
- 로그인 성공률 > 95%

---

## 🏗️ Phase 1: 인증 서비스 레이어 구축 (3-4일)

### 목표

중앙 집중식 인증 서비스 레이어 구축

### 구현 내용

#### 1. Session Manager

```typescript
// lib/auth/services/session-manager.ts
import { Session, User } from '@supabase/supabase-js'

export interface ISessionManager {
  getSession(): Promise<Session | null>
  refreshSession(): Promise<Session | null>
  clearSession(): Promise<void>
  validateSession(session: Session): boolean
}

export class SessionManager implements ISessionManager {
  private static instance: SessionManager
  private sessionCache: Session | null = null
  private cacheExpiry: number = 0
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager()
    }
    return SessionManager.instance
  }

  async getSession(): Promise<Session | null> {
    // Check cache first
    if (this.sessionCache && Date.now() < this.cacheExpiry) {
      return this.sessionCache
    }

    // Fetch fresh session
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (session && this.validateSession(session)) {
      this.sessionCache = session
      this.cacheExpiry = Date.now() + this.CACHE_DURATION
      return session
    }

    return null
  }

  async refreshSession(): Promise<Session | null> {
    const {
      data: { session },
      error,
    } = await supabase.auth.refreshSession()

    if (error || !session) {
      await this.clearSession()
      return null
    }

    this.sessionCache = session
    this.cacheExpiry = Date.now() + this.CACHE_DURATION
    return session
  }

  async clearSession(): Promise<void> {
    this.sessionCache = null
    this.cacheExpiry = 0
    await supabase.auth.signOut()
  }

  validateSession(session: Session): boolean {
    if (!session || !session.access_token || !session.user) {
      return false
    }

    // Check token expiry
    const tokenExp = session.expires_at || 0
    const now = Math.floor(Date.now() / 1000)

    return tokenExp > now
  }
}
```

#### 2. Permission Service

```typescript
// lib/auth/services/permission-service.ts
export interface IPermissionService {
  canAccessRoute(role: string, route: string): boolean
  canPerformAction(role: string, action: string): boolean
  getRolePermissions(role: string): string[]
}

export class PermissionService implements IPermissionService {
  private readonly permissions: Record<string, string[]> = {
    system_admin: ['*'], // All permissions
    admin: ['dashboard.*', 'reports.*', 'users.*'],
    site_manager: ['mobile.*', 'workers.*', 'daily-reports.*'],
    worker: ['mobile.worklog', 'mobile.documents'],
    customer_manager: ['partner.*', 'documents.*'],
  }

  canAccessRoute(role: string, route: string): boolean {
    const rolePerms = this.permissions[role] || []

    // Check for wildcard permission
    if (rolePerms.includes('*')) return true

    // Check specific route permission
    return rolePerms.some(perm => {
      if (perm.endsWith('*')) {
        const prefix = perm.slice(0, -1)
        return route.startsWith(prefix)
      }
      return perm === route
    })
  }

  canPerformAction(role: string, action: string): boolean {
    return this.canAccessRoute(role, action)
  }

  getRolePermissions(role: string): string[] {
    return this.permissions[role] || []
  }
}
```

### 테스트 계획

- Mock Supabase client for testing
- Unit tests for all service methods
- Integration tests with real auth flow

### 성공 지표

- 세션 캐시 히트율 > 80%
- 권한 체크 성능 < 10ms

---

## 🔌 Phase 2: 인증 프로바이더 추상화 (2-3일)

### 목표

Supabase 의존성을 추상화하여 테스트 가능성과 유연성 향상

### 구현 내용

#### Auth Provider Interface

```typescript
// lib/auth/providers/auth-provider.interface.ts
export interface IAuthProvider {
  signIn(email: string, password: string): Promise<AuthResult>
  signOut(): Promise<void>
  getSession(): Promise<Session | null>
  refreshSession(): Promise<Session | null>
  onAuthStateChange(callback: (session: Session | null) => void): () => void
}

export interface AuthResult {
  success: boolean
  session?: Session
  error?: string
}
```

#### Supabase Provider Implementation

```typescript
// lib/auth/providers/supabase-provider.ts
export class SupabaseAuthProvider implements IAuthProvider {
  private client: SupabaseClient

  constructor(client: SupabaseClient) {
    this.client = client
  }

  async signIn(email: string, password: string): Promise<AuthResult> {
    const { data, error } = await this.client.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, session: data.session }
  }

  async signOut(): Promise<void> {
    await this.client.auth.signOut()
  }

  async getSession(): Promise<Session | null> {
    const {
      data: { session },
    } = await this.client.auth.getSession()
    return session
  }

  async refreshSession(): Promise<Session | null> {
    const {
      data: { session },
    } = await this.client.auth.refreshSession()
    return session
  }

  onAuthStateChange(callback: (session: Session | null) => void): () => void {
    const {
      data: { subscription },
    } = this.client.auth.onAuthStateChange((_event, session) => callback(session))

    return () => subscription.unsubscribe()
  }
}
```

### 테스트 계획

- Mock provider for testing
- Provider switching tests
- Error handling tests

### 성공 지표

- 100% provider interface coverage
- Zero Supabase dependencies in business logic

---

## ⚛️ Phase 3: React Context & Hooks (2-3일)

### 목표

React 컴포넌트를 위한 깔끔한 인증 인터페이스 제공

### 구현 내용

#### Auth Context Provider

```typescript
// lib/auth/context/auth-context.tsx
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const sessionManager = SessionManager.getInstance();
  const authProvider = new SupabaseAuthProvider(supabase);

  useEffect(() => {
    // Initial session load
    loadSession();

    // Subscribe to auth changes
    const unsubscribe = authProvider.onAuthStateChange((newSession) => {
      setSession(newSession);
      setUser(newSession?.user || null);
    });

    return unsubscribe;
  }, []);

  const loadSession = async () => {
    setIsLoading(true);
    try {
      const session = await sessionManager.getSession();
      setSession(session);
      setUser(session?.user || null);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const result = await authProvider.signIn(email, password);
    if (!result.success) {
      throw new Error(result.error);
    }
    await loadSession();
  };

  const signOut = async () => {
    await authProvider.signOut();
    setSession(null);
    setUser(null);
    AuthCircuitBreaker.reset();
  };

  const refreshSession = async () => {
    await sessionManager.refreshSession();
    await loadSession();
  };

  const value: AuthContextValue = {
    user,
    session,
    isLoading,
    isAuthenticated: !!session,
    signIn,
    signOut,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
```

#### useAuth Hook

```typescript
// lib/auth/hooks/use-auth.ts
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function useRequireAuth(redirectTo = '/auth/login') {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(redirectTo)
    }
  }, [isAuthenticated, isLoading, redirectTo, router])

  return { isAuthenticated, isLoading }
}
```

#### Protected Route Component

```typescript
// lib/auth/components/protected-route.tsx
export function ProtectedRoute({
  children,
  roles,
  fallback = null
}: {
  children: React.ReactNode;
  roles?: string[];
  fallback?: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const permissionService = new PermissionService();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return null; // useRequireAuth will handle redirect
  }

  if (roles && !roles.includes(user.role)) {
    return fallback || <UnauthorizedError />;
  }

  return <>{children}</>;
}
```

### 테스트 계획

- React Testing Library tests
- Hook testing with renderHook
- Context provider tests

### 성공 지표

- Zero prop drilling for auth state
- < 50ms auth state updates

---

## 🔄 Phase 4: 마이그레이션 및 테스팅 (3-4일)

### 목표

기존 컴포넌트를 새로운 아키텍처로 안전하게 마이그레이션

### 구현 내용

#### Migration Guide

```typescript
// BEFORE - Old pattern
export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  if (user.role === 'admin') {
    redirect('/dashboard/admin');
  }
  // ... rest of logic
}

// AFTER - New pattern
export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      const route = getRoleBasedRoute(user.role);
      router.push(route);
    }
  }, [user, router]);

  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
```

#### Testing Strategy

```typescript
// tests/auth/integration.test.ts
describe('Authentication Flow', () => {
  it('should handle login → dashboard → mobile redirect', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    })

    // Login as site_manager
    await act(async () => {
      await result.current.signIn('manager@test.com', 'password')
    })

    expect(result.current.user?.role).toBe('site_manager')
    expect(mockRouter.push).toHaveBeenCalledWith('/mobile')
  })

  it('should prevent infinite redirect loops', async () => {
    let redirectCount = 0
    mockRouter.push.mockImplementation(() => {
      redirectCount++
      if (redirectCount > 5) {
        throw new Error('Too many redirects')
      }
    })

    // Should not throw
    renderHook(() => useRequireAuth(), {
      wrapper: AuthProvider,
    })

    expect(redirectCount).toBeLessThanOrEqual(3)
  })
})
```

### 마이그레이션 체크리스트

- [ ] `/app/auth/actions.ts` - 새로운 AuthProvider 사용
- [ ] `/middleware.ts` - Circuit breaker 추가
- [ ] `/app/dashboard/page.tsx` - 중앙 라우팅 사용
- [ ] `/app/mobile/*` - ProtectedRoute 적용
- [ ] `/app/dashboard/admin/*` - useAuth hook 적용

### 테스트 계획

- Unit tests: 100% coverage
- Integration tests: 주요 플로우
- E2E tests: Cypress/Playwright
- Load tests: 동시 사용자 100명

### 성공 지표

- 모든 테스트 통과
- 0 regression bugs
- 성능 저하 없음

---

## 📊 Phase 5: 모니터링 및 최적화 (2-3일)

### 목표

프로덕션 모니터링 및 성능 최적화

### 구현 내용

#### Performance Monitoring

```typescript
// lib/auth/monitoring/auth-metrics.ts
export class AuthMetrics {
  private static metrics = {
    loginAttempts: 0,
    loginSuccess: 0,
    loginFailure: 0,
    sessionRefresh: 0,
    redirectLoops: 0,
  }

  static recordLoginAttempt(success: boolean) {
    this.metrics.loginAttempts++
    if (success) {
      this.metrics.loginSuccess++
    } else {
      this.metrics.loginFailure++
    }

    // Send to analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'login_attempt', {
        success,
        success_rate: this.getSuccessRate(),
      })
    }
  }

  static recordRedirectLoop() {
    this.metrics.redirectLoops++
    console.error('Redirect loop detected!', {
      count: this.metrics.redirectLoops,
      timestamp: new Date().toISOString(),
    })

    // Alert if too many loops
    if (this.metrics.redirectLoops > 10) {
      // Send alert to monitoring service
    }
  }

  static getSuccessRate(): number {
    if (this.metrics.loginAttempts === 0) return 0
    return (this.metrics.loginSuccess / this.metrics.loginAttempts) * 100
  }
}
```

#### Error Boundary

```typescript
// lib/auth/components/auth-error-boundary.tsx
export class AuthErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Auth Error:', error, errorInfo);

    // Log to monitoring service
    if (error.message.includes('auth') || error.message.includes('session')) {
      AuthMetrics.recordAuthError(error);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="auth-error">
          <h2>인증 오류가 발생했습니다</h2>
          <button onClick={() => window.location.href = '/auth/login'}>
            다시 로그인
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### 모니터링 대시보드

- 로그인 성공률
- 평균 세션 지속 시간
- 리다이렉트 루프 발생 빈도
- API 응답 시간
- 에러율

### 성능 최적화

- Session caching: 80% 캐시 히트율
- Lazy loading: 인증 관련 컴포넌트
- Bundle optimization: ~20KB 감소

---

## 🎯 구현 우선순위 및 일정

### 전체 일정: 13-19일

| Phase   | 기간  | 우선순위    | 리스크 |
| ------- | ----- | ----------- | ------ |
| Phase 0 | 1-2일 | 🔴 Critical | Low    |
| Phase 1 | 3-4일 | 🟠 High     | Medium |
| Phase 2 | 2-3일 | 🟡 Medium   | Low    |
| Phase 3 | 2-3일 | 🟡 Medium   | Medium |
| Phase 4 | 3-4일 | 🟠 High     | High   |
| Phase 5 | 2-3일 | 🟢 Low      | Low    |

### 즉시 실행 (Phase 0)

```bash
# 1. Circuit breaker 구현
npm run dev # 테스트
npm run test:auth # 인증 테스트

# 2. 배포
git checkout -b fix/auth-infinite-loop
git add .
git commit -m "fix: prevent auth infinite redirect loops"
git push origin fix/auth-infinite-loop
```

---

## ✅ 성공 지표

### 기술적 지표

- **무한 루프**: 0건
- **로그인 성공률**: > 95%
- **세션 체크 성능**: < 50ms
- **캐시 히트율**: > 80%
- **번들 사이즈**: 20KB 감소

### 비즈니스 지표

- **지원 티켓**: 50% 감소
- **사용자 만족도**: 20% 향상
- **개발 속도**: 30% 향상
- **버그 발생률**: 70% 감소

---

## 🚨 리스크 관리

### 리스크 매트릭스

| 리스크                      | 가능성 | 영향도   | 대응 전략                         |
| --------------------------- | ------ | -------- | --------------------------------- |
| 마이그레이션 중 서비스 중단 | Low    | High     | Feature flag 사용, 점진적 롤아웃  |
| 성능 저하                   | Medium | Medium   | 캐싱 전략, 성능 모니터링          |
| 하위 호환성 문제            | Medium | High     | Adapter 패턴, 단계적 마이그레이션 |
| 보안 취약점                 | Low    | Critical | 보안 감사, 펜테스팅               |

### 롤백 계획

```bash
# Phase별 롤백 태그 생성
git tag -a v1.0-pre-refactor -m "Before auth refactoring"

# 문제 발생 시 롤백
git checkout v1.0-pre-refactor
npm run deploy:emergency
```

---

## 📚 참고 자료

### 아키텍처 패턴

- [SOLID Principles in React](https://blog.logrocket.com/solid-principles-react/)
- [Circuit Breaker Pattern](https://martinfowler.com/bliki/CircuitBreaker.html)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)

### Next.js 특화

- [Next.js Authentication Best Practices](https://nextjs.org/docs/authentication)
- [App Router Migration](https://nextjs.org/docs/app/building-your-application/routing)

### 테스팅

- [Testing React Applications](https://kentcdodds.com/blog/testing-react-apps)
- [E2E Testing with Playwright](https://playwright.dev/docs/intro)

---

## 🤝 팀 역할 분담

| 역할         | 담당자 | 책임                     |
| ------------ | ------ | ------------------------ |
| Tech Lead    | TBD    | 아키텍처 결정, 코드 리뷰 |
| Frontend Dev | TBD    | React 컴포넌트, Hooks    |
| Backend Dev  | TBD    | 서비스 레이어, API       |
| QA Engineer  | TBD    | 테스트 전략, E2E 테스트  |
| DevOps       | TBD    | 배포, 모니터링           |

---

## 📝 결론

이 리팩토링 계획은 현재 인증 시스템의 체계적인 문제를 단계적으로 해결합니다:

1. **즉시 안정화** (Phase 0)로 프로덕션 이슈 해결
2. **아키텍처 개선** (Phase 1-3)으로 구조적 문제 해결
3. **안전한 마이그레이션** (Phase 4)으로 기존 기능 보호
4. **지속적 개선** (Phase 5)으로 장기적 안정성 확보

각 단계는 독립적으로 배포 가능하며, 비즈니스 영향을 최소화하면서 점진적으로 시스템을 개선합니다.

**예상 결과**:

- 인증 관련 버그 70% 감소
- 개발 생산성 30% 향상
- 사용자 경험 대폭 개선

이 계획을 통해 안정적이고 확장 가능한 인증 시스템을 구축할 수 있습니다.
