'use client'

import React from 'react'
import { Button, NotificationBadge } from '@/modules/shared/ui'

interface MobileHeaderProps {
  title: string
  showBack?: boolean
  showNotification?: boolean
  notificationCount?: number
  onBack?: () => void
  rightAction?: React.ReactNode
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  title,
  showBack = false,
  showNotification = false,
  notificationCount = 0,
  onBack,
  rightAction,
}) => {
  return (
    <header className="mobile-header">
      <div className="mobile-header-content">
        {/* Left Section */}
        <div className="mobile-header-left">
          {showBack && (
            <Button variant="ghost" onClick={onBack} className="p-2 w-10 h-10">
              ←
            </Button>
          )}
        </div>

        {/* Center Title */}
        <div className="mobile-header-center">
          <h1 className="t-h2 text-center">{title}</h1>
        </div>

        {/* Right Section */}
        <div className="mobile-header-right">
          {showNotification && (
            <Button variant="ghost" className="relative p-2 w-10 h-10">
              🔔
              <NotificationBadge
                count={notificationCount}
                show={notificationCount > 0}
                pulse={notificationCount > 0}
              />
            </Button>
          )}
          {rightAction}
        </div>
      </div>
    </header>
  )
}

// CSS styles to add to design system
const mobileHeaderStyles = `
.mobile-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 56px;
  background: var(--card);
  border-bottom: 1px solid var(--line);
  z-index: 50;
}

.mobile-header-content {
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;
  align-items: center;
  height: 100%;
  padding: 0 8px;
}

.mobile-header-left {
  display: flex;
  justify-content: flex-start;
  align-items: center;
}

.mobile-header-center {
  display: flex;
  justify-content: center;
  align-items: center;
}

.mobile-header-right {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 4px;
}
`
