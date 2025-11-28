'use client'

import React, { useEffect, useState, ReactNode } from 'react'
import { AppBar } from './AppBar'
import { BottomNav } from './BottomNav'
import { Drawer } from './Drawer'
import { SearchPage } from './SearchPage'
import { FontSizeProvider } from '@/contexts/FontSizeContext'
import { TouchModeProvider } from '@/contexts/TouchModeContext'

interface MobileLayoutProps {
  children: ReactNode
  topTabs?: ReactNode
}

export const MobileLayout: React.FC<MobileLayoutProps> = ({ children, topTabs }) => {
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

          {/* Main Content Area */}
          <main className={mainClassName}>{children}</main>

          {/* Bottom Navigation */}
          <BottomNav />
        </div>
      </TouchModeProvider>
    </FontSizeProvider>
  )
}
