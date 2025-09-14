'use client'

import React from 'react'
import { MobileHeader } from './mobile-header'
import { MobileNav } from './mobile-nav'

interface MobileLayoutProps {
  children: React.ReactNode
  title: string
  showBack?: boolean
  showNotification?: boolean
  notificationCount?: number
  onBack?: () => void
  rightAction?: React.ReactNode
  userRole?: 'worker' | 'site_manager'
  hideNav?: boolean
}

export const MobileLayout: React.FC<MobileLayoutProps> = ({
  children,
  title,
  showBack = false,
  showNotification = true,
  notificationCount = 0,
  onBack,
  rightAction,
  userRole = 'worker',
  hideNav = false,
}) => {
  return (
    <div className="mobile-layout">
      <MobileHeader
        title={title}
        showBack={showBack}
        showNotification={showNotification}
        notificationCount={notificationCount}
        onBack={onBack}
        rightAction={rightAction}
      />

      <main className="mobile-main">{children}</main>

      {!hideNav && <MobileNav userRole={userRole} />}
    </div>
  )
}

// CSS styles to add to design system
const mobileLayoutStyles = `
.mobile-layout {
  min-height: 100vh;
  background: var(--bg);
  display: flex;
  flex-direction: column;
}

.mobile-main {
  flex: 1;
  padding-top: 56px; /* Header height */
  padding-bottom: 64px; /* Nav height */
  overflow-y: auto;
}

/* When nav is hidden */
.mobile-layout:not(:has(.mobile-nav)) .mobile-main {
  padding-bottom: 20px;
}

/* Safe area handling for iOS */
@supports(padding: max(0px)) {
  .mobile-main {
    padding-top: max(56px, env(safe-area-inset-top, 0));
    padding-bottom: max(64px, env(safe-area-inset-bottom, 0));
  }
  
  .mobile-header {
    padding-top: env(safe-area-inset-top, 0);
    height: calc(56px + env(safe-area-inset-top, 0));
  }
  
  .mobile-nav {
    padding-bottom: env(safe-area-inset-bottom, 0);
    height: calc(64px + env(safe-area-inset-bottom, 0));
  }
}

/* Mobile viewport optimization */
@media (max-width: 768px) {
  .mobile-layout {
    width: 100vw;
    overflow-x: hidden;
  }
}
`
