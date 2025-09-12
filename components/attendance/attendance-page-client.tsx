'use client'

import { useState } from 'react'
import { AttendanceView } from './attendance-view'
import { SalaryView } from './salary-view'
import { useFontSize } from '@/contexts/FontSizeContext'
import { useTouchMode } from '@/contexts/TouchModeContext'
import { cn } from '@/lib/utils'

interface AttendancePageClientProps {
  profile: any
  isPartnerCompany: boolean
}

export function AttendancePageClient({ profile, isPartnerCompany }: AttendancePageClientProps) {
  const { isLargeFont } = useFontSize()
  const { touchMode } = useTouchMode()
  const [activeTab, setActiveTab] = useState('work')

  console.log('AttendancePageClient: Received profile:', {
    hasProfile: !!profile,
    profileId: profile?.id,
    profileRole: profile?.role,
    profileFullName: profile?.full_name,
    isPartnerCompany
  })

  return (
    <div className="min-h-screen flex flex-col items-center bg-[#f5f7fb] dark:bg-[#0f172a]">
      <main className="w-full max-w-[480px] mx-auto px-4 pb-6">
        {/* 상단 라인 탭 - worklog.html과 동일한 스타일 */}
        <nav className="line-tabs rounded-t-xl overflow-hidden mb-3.5">
          <button 
            className={cn(
              "line-tab",
              activeTab === 'work' && "active"
            )}
            onClick={() => setActiveTab('work')}
            data-tab="work"
          >
            출력현황
          </button>
          <button 
            className={cn(
              "line-tab",
              activeTab === 'pay' && "active"
            )}
            onClick={() => setActiveTab('pay')}
            data-tab="pay"
          >
            급여현황
          </button>
        </nav>

        {/* 출력현황 콘텐츠 */}
        <div id="workView" className={activeTab !== 'work' ? 'hidden' : ''}>
          <AttendanceView profile={profile} />
        </div>

        {/* 급여현황 콘텐츠 */}
        <div id="payView" className={activeTab !== 'pay' ? 'hidden' : ''}>
          <SalaryView profile={profile} />
        </div>
      </main>

      <style jsx>{`
        /* 라인 탭 스타일 - worklog.html에서 가져옴 */
        .line-tabs {
          display: flex;
          gap: 0;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          padding: 4px;
          border-radius: 12px 12px 0 0;
        }
        
        .line-tab {
          flex: 1;
          padding: 12px 16px;
          font-family: 'Noto Sans KR', system-ui, sans-serif;
          font-weight: 600;
          font-size: 15px;
          color: #6b7280;
          background: transparent;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
        }
        
        .line-tab:hover {
          color: #374151;
        }
        
        .line-tab.active {
          color: #ffffff;
          background: #1A254F;
        }
        
        :global([data-theme="dark"]) .line-tabs {
          background: #11151B;
          border-color: #3A4048;
        }
        
        :global([data-theme="dark"]) .line-tab {
          color: #A8B0BB;
        }
        
        :global([data-theme="dark"]) .line-tab:hover {
          color: #E9EEF5;
        }
        
        :global([data-theme="dark"]) .line-tab.active {
          color: #ffffff;
          background: #2F6BFF;
        }
        
        .hidden {
          display: none !important;
        }
      `}</style>
    </div>
  )
}