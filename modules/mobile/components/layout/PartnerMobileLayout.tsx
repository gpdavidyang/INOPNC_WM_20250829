'use client'

import React, { useEffect, useState, ReactNode } from 'react'
import { AppBar } from './AppBar'
import { Drawer } from './Drawer'
import { FontSizeProvider } from '@/contexts/FontSizeContext'
import { TouchModeProvider } from '@/contexts/TouchModeContext'
import { PartnerBottomNav } from './PartnerBottomNav'

interface PartnerMobileLayoutProps {
  children: ReactNode
}

export const PartnerMobileLayout: React.FC<PartnerMobileLayoutProps> = ({ children }) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  useEffect(() => {
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

  return (
    <FontSizeProvider>
      <TouchModeProvider>
        <div className="mobile-root">
          <AppBar onMenuClick={handleMenuClick} />
          <Drawer isOpen={isDrawerOpen} onClose={handleDrawerClose} />
          <main className="mobile-container">{children}</main>
          <PartnerBottomNav />
        </div>
      </TouchModeProvider>
    </FontSizeProvider>
  )
}
