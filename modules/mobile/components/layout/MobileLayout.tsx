'use client'

import { FontSizeProvider } from '@/contexts/FontSizeContext'
import { TouchModeProvider } from '@/contexts/TouchModeContext'
import React, { ReactNode, useEffect, useState } from 'react'
import { AppBar } from './AppBar'
import { BottomNav } from './BottomNav'
import { Drawer } from './Drawer'
import { SearchPage } from './SearchPage'

interface MobileLayoutProps {
  children: ReactNode
  topTabs?: ReactNode
  headerHeight?: number | string
}

export const MobileLayout: React.FC<MobileLayoutProps> = ({ children, topTabs, headerHeight }) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  useEffect(() => {
    // Clear any lingering scroll locks from prior overlays so the mobile shell can scroll
    if (typeof document === 'undefined') return
    document.body.classList.remove('modal-open')
    if (document.body.style.overflow === 'hidden') {
      document.body.style.overflow = ''
    }
  }, [])

  const handleMenuClick = () => {
    setIsDrawerOpen(true)
  }

  const handleDrawerClose = () => {
    setIsDrawerOpen(false)
  }

  const mainClassName = topTabs ? 'mobile-container has-top-tabs' : 'mobile-container'

  return (
    <FontSizeProvider>
      <TouchModeProvider>
        <div className="mobile-root">
          {/* Top App Bar */}
          <AppBar
            onMenuClick={handleMenuClick}
            onSearchClick={() => setIsSearchOpen(true)}
            renderInlineSearchPage={false}
          />

          {topTabs ? <div className="mobile-top-tabs">{topTabs}</div> : null}

          {/* Side Drawer */}
          <Drawer isOpen={isDrawerOpen} onClose={handleDrawerClose} />

          {/* Shared header search overlay (same module used by 현장/생산 관리자) */}
          <SearchPage isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

          {/* Main Content Area - Enforce max-width 600px centrally */}
          <main
            className={`${mainClassName} mx-auto w-full max-w-[600px] overflow-x-hidden min-h-screen pb-24`}
            style={{
              maxWidth: '600px', // Inline style backup
              paddingTop: headerHeight
                ? typeof headerHeight === 'number'
                  ? `${headerHeight}px`
                  : headerHeight
                : undefined,
            }}
          >
            {children}
          </main>

          {/* Bottom Navigation */}
          <BottomNav />
        </div>
      </TouchModeProvider>
    </FontSizeProvider>
  )
}
