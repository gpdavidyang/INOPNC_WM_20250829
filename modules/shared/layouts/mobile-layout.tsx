'use client'

import React from 'react'
import { MobileHeader } from './mobile-header'
import { MobileBottomNav } from './mobile-bottom-nav'

interface MobileLayoutProps {
  children: React.ReactNode
  title?: string
  showHeader?: boolean
  showBottomNav?: boolean
}

export const MobileLayout: React.FC<MobileLayoutProps> = ({
  children,
  title = 'INOPNC',
  showHeader = true,
  showBottomNav = true,
}) => {
  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* 상단 헤더 */}
      {showHeader && <MobileHeader title={title} />}
      
      {/* 메인 콘텐츠 */}
      <main className={`flex-1 ${showHeader ? 'pt-14' : ''} ${showBottomNav ? 'pb-16' : ''}`}>
        {children}
      </main>
      
      {/* 하단 네비게이션 */}
      {showBottomNav && <MobileBottomNav />}
    </div>
  )
}

export default MobileLayout