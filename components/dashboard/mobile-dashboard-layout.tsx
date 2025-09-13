'use client'

import { User } from '@supabase/supabase-js'
import { Profile } from '@/types'
import { usePathname } from 'next/navigation'
import MobileHeader from './mobile-header'
import MobileBottomNav from './mobile-bottom-nav'
import HomeTabNew from './tabs/home-tab-new'
import DailyReportsTabNew from './tabs/daily-reports-tab-new'
import DocumentsTabNew from './tabs/documents-tab-new'
import SiteInfoTabNew from './tabs/site-info-tab-new'

interface MobileDashboardLayoutProps {
  user: User
  profile: Profile
  children?: React.ReactNode
}

export default function MobileDashboardLayout({ user, profile, children }: MobileDashboardLayoutProps) {
  const pathname = usePathname()

  // Determine which content to show based on pathname
  const renderContent = () => {
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
  }

  return (
    <div className="min-h-screen bg-gray-50" style={{ background: 'var(--bg)' }}>
      {/* Mobile Header */}
      <MobileHeader 
        userName={profile.full_name || user.email} 
        notificationCount={0}
      />

      {/* Main Content */}
      <main style={{ 
        paddingTop: 'var(--header-h, 56px)',
        paddingBottom: 'calc(var(--nav-h, 64px) + env(safe-area-inset-bottom))',
        minHeight: '100vh'
      }}>
        {renderContent()}
      </main>

      {/* Bottom Navigation */}
      <MobileBottomNav />
    </div>
  )
}