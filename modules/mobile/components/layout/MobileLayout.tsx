'use client'

import React, { useEffect, useState, ReactNode } from 'react'
import { AppBar } from './AppBar'
import { BottomNav } from './BottomNav'
import { Drawer } from './Drawer'
import { SearchOverlay } from './SearchOverlay'
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

  const handleSearchClick = () => {
    setIsSearchOpen(true)
  }

  const handleDrawerClose = () => {
    setIsDrawerOpen(false)
  }

  const handleSearchClose = () => {
    setIsSearchOpen(false)
  }

  const mainClassName = topTabs ? 'mobile-container has-top-tabs' : 'mobile-container'

  return (
    <FontSizeProvider>
      <TouchModeProvider>
        <div className="mobile-root">
          {/* Top App Bar */}
          <AppBar onMenuClick={handleMenuClick} onSearchClick={handleSearchClick} />

          {topTabs ? <div className="mobile-top-tabs">{topTabs}</div> : null}

          {/* Side Drawer */}
          <Drawer isOpen={isDrawerOpen} onClose={handleDrawerClose} />

          {/* Search Overlay */}
          <SearchOverlay isOpen={isSearchOpen} onClose={handleSearchClose} />

          {/* Main Content Area */}
          <main className={mainClassName}>{children}</main>

          {/* Bottom Navigation */}
          <BottomNav />
        </div>
      </TouchModeProvider>
    </FontSizeProvider>
  )
}
