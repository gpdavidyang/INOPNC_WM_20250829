'use client'


export default function FullMobileAppTestPage() {
  const [currentView, setCurrentView] = useState<'home' | 'daily-reports' | 'documents' | 'site-info' | 'more'>('home')
  const router = useRouter()

  const renderContent = () => {
    switch (currentView) {
      case 'home':
        return <HomeTabNew />
      case 'daily-reports':
        return <DailyReportsTabNew />
      case 'documents':
        return <DocumentsTabNew />
      case 'site-info':
        return <SiteInfoTabNew />
      case 'more':
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
      default:
        return <HomeTabNew />
    }
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Mobile Header */}
      <MobileHeader userName="김작업" notificationCount={3} />

      {/* Main Content */}
      <main style={{ 
        paddingTop: 'var(--header-h, 56px)',
        paddingBottom: 'calc(var(--nav-h, 64px) + env(safe-area-inset-bottom))',
        minHeight: '100vh'
      }}>
        {renderContent()}
      </main>

      {/* Bottom Navigation with custom handler */}
      <nav className="bottom-nav-wrap" style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 'var(--nav-h, 64px)',
        background: 'var(--nav-bg)',
        borderTop: '1px solid var(--nav-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingBottom: 'env(safe-area-inset-bottom)',
        zIndex: 100
      }}>
        <button
          onClick={() => setCurrentView('home')}
          className="nav-item"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            padding: '8px',
            background: 'transparent',
            border: 'none',
            color: currentView === 'home' ? 'var(--nav-text-active)' : 'var(--nav-text)',
            cursor: 'pointer',
            transition: 'all 0.2s',
            flex: 1
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          <span style={{ fontSize: '11px', fontWeight: currentView === 'home' ? 600 : 400 }}>
            홈
          </span>
        </button>

        <button
          onClick={() => setCurrentView('daily-reports')}
          className="nav-item"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            padding: '8px',
            background: 'transparent',
            border: 'none',
            color: currentView === 'daily-reports' ? 'var(--nav-text-active)' : 'var(--nav-text)',
            cursor: 'pointer',
            transition: 'all 0.2s',
            flex: 1
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <span style={{ fontSize: '11px', fontWeight: currentView === 'daily-reports' ? 600 : 400 }}>
            작업일지
          </span>
        </button>

        <button
          onClick={() => setCurrentView('documents')}
          className="nav-item"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            padding: '8px',
            background: 'transparent',
            border: 'none',
            color: currentView === 'documents' ? 'var(--nav-text-active)' : 'var(--nav-text)',
            cursor: 'pointer',
            transition: 'all 0.2s',
            flex: 1
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
          <span style={{ fontSize: '11px', fontWeight: currentView === 'documents' ? 600 : 400 }}>
            문서함
          </span>
        </button>

        <button
          onClick={() => setCurrentView('site-info')}
          className="nav-item"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            padding: '8px',
            background: 'transparent',
            border: 'none',
            color: currentView === 'site-info' ? 'var(--nav-text-active)' : 'var(--nav-text)',
            cursor: 'pointer',
            transition: 'all 0.2s',
            flex: 1
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          <span style={{ fontSize: '11px', fontWeight: currentView === 'site-info' ? 600 : 400 }}>
            현장정보
          </span>
        </button>

        <button
          onClick={() => setCurrentView('more')}
          className="nav-item"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            padding: '8px',
            background: 'transparent',
            border: 'none',
            color: currentView === 'more' ? 'var(--nav-text-active)' : 'var(--nav-text)',
            cursor: 'pointer',
            transition: 'all 0.2s',
            flex: 1
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="1"/>
            <circle cx="19" cy="12" r="1"/>
            <circle cx="5" cy="12" r="1"/>
          </svg>
          <span style={{ fontSize: '11px', fontWeight: currentView === 'more' ? 600 : 400 }}>
            더보기
          </span>
        </button>
      </nav>

      {/* View Status Indicator (for testing) */}
      <div style={{
        position: 'fixed',
        top: '70px',
        right: '10px',
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '4px 12px',
        borderRadius: '20px',
        fontSize: '12px',
        zIndex: 200
      }}>
        현재 화면: {currentView}
      </div>
    </div>
  )
}