'use client'

import React, { useState, ReactNode } from 'react'
import { AppBar } from './AppBar'
import { BottomNav } from './BottomNav'
import { Drawer } from './Drawer'
import { SearchOverlay } from './SearchOverlay'
import { FontSizeProvider } from '@/contexts/FontSizeContext'
import { TouchModeProvider } from '@/contexts/TouchModeContext'

interface MobileLayoutProps {
  children: ReactNode
}

export const MobileLayout: React.FC<MobileLayoutProps> = ({ children }) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)

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

  return (
    <FontSizeProvider>
      <TouchModeProvider>
        {/* Top App Bar */}
        <AppBar onMenuClick={handleMenuClick} onSearchClick={handleSearchClick} />

        {/* Side Drawer */}
        <Drawer isOpen={isDrawerOpen} onClose={handleDrawerClose} />

        {/* Search Overlay */}
        <SearchOverlay isOpen={isSearchOpen} onClose={handleSearchClose} />

        {/* Main Content Area */}
        <main className="mobile-container">{children}</main>

        {/* Bottom Navigation */}
        <BottomNav />
      </TouchModeProvider>
    </FontSizeProvider>
  )
}
