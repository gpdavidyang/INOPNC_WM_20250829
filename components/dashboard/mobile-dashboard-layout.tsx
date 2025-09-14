'use client'

import { ErrorBoundary } from './error-boundary'

interface MobileDashboardLayoutProps {
  user: User
  profile: Profile
  children?: React.ReactNode
}

export default function MobileDashboardLayout({ user, profile, children }: MobileDashboardLayoutProps) {
  const pathname = usePathname()

  // Determine which content to show based on pathname
  const renderContent = () => {
    try {
      // If children are provided (from dedicated pages), render them
      if (children) {
        return children
      }

    // Otherwise render based on pathname
    if (pathname.includes('/daily-reports')) {
      return <DailyReportsTabNew />
    }
    if (pathname.includes('/documents')) {
      return <DocumentsTabNew />
    }
    if (pathname.includes('/site-info')) {
      return <SiteInfoTabNew />
    }
    if (pathname.includes('/more')) {
      return (
        <div className="container" style={{ padding: '20px', paddingTop: '20px' }}>
          <div className="card">
            <h3 className="section-title" style={{ marginBottom: '16px' }}>더보기</h3>
            <div className="stack" style={{ gap: '12px' }}>
              <button className="btn btn--outline" style={{ width: '100%', justifyContent: 'start' }}>
                출근 기록
              </button>
              <button className="btn btn--outline" style={{ width: '100%', justifyContent: 'start' }}>
                급여 명세서
              </button>
              <button className="btn btn--outline" style={{ width: '100%', justifyContent: 'start' }}>
                본사 요청
              </button>
              <button className="btn btn--outline" style={{ width: '100%', justifyContent: 'start' }}>
                재고 관리
              </button>
              <button className="btn btn--outline" style={{ width: '100%', justifyContent: 'start' }}>
                설정
              </button>
              <button className="btn btn--danger" style={{ width: '100%', marginTop: '12px' }}>
                로그아웃
              </button>
            </div>
          </div>
        </div>
      )
    }
    
    // Default to home
    return <HomeTabNew />
    } catch (error) {
      console.error('Error rendering mobile content:', error)
      return (
        <div className="container" style={{ padding: '20px', paddingTop: '20px' }}>
          <div className="card">
            <h3 className="section-title" style={{ marginBottom: '16px' }}>오류 발생</h3>
            <p style={{ color: 'var(--muted)', marginBottom: '16px' }}>
              페이지를 로드하는 중 오류가 발생했습니다.
            </p>
            <button 
              className="btn btn--primary" 
              onClick={() => window.location.reload()}
              style={{ width: '100%' }}
            >
              새로고침
            </button>
          </div>
        </div>
      )
    }
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50" style={{ background: 'var(--bg)' }}>
        {/* Mobile Header */}
        <ErrorBoundary>
          <MobileHeader 
            userName={profile.full_name || user.email} 
            notificationCount={0}
          />
        </ErrorBoundary>

        {/* Main Content */}
        <main style={{ 
          paddingTop: 'var(--header-h, 56px)',
          paddingBottom: 'calc(var(--nav-h, 64px) + env(safe-area-inset-bottom))',
          minHeight: '100vh'
        }}>
          <ErrorBoundary>
            {renderContent()}
          </ErrorBoundary>
        </main>

        {/* Bottom Navigation */}
        <ErrorBoundary>
          <MobileBottomNav />
        </ErrorBoundary>
      </div>
    </ErrorBoundary>
  )
}