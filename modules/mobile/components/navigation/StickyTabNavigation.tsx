'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useMobileViewport } from '../hooks/use-mobile-viewport'

export interface TabItem {
  id: string
  label: string
  count?: number
  disabled?: boolean
}

interface StickyTabNavigationProps {
  tabs: TabItem[]
  activeTab: string
  onTabChange: (tabId: string) => void
  className?: string
  showCounts?: boolean
  scrollThreshold?: number
}

export const StickyTabNavigation: React.FC<StickyTabNavigationProps> = ({
  tabs,
  activeTab,
  onTabChange,
  className = '',
  showCounts = false,
  scrollThreshold = 100
}) => {
  const [isSticky, setIsSticky] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('up')
  const navRef = useRef<HTMLDivElement>(null)
  const lastScrollY = useRef(0)
  const { viewportHeight } = useMobileViewport()

  // Handle scroll behavior for sticky positioning
  const handleScroll = useCallback(() => {
    const currentScrollY = window.scrollY
    const scrollDiff = currentScrollY - lastScrollY.current

    // Update scroll direction
    if (scrollDiff > 0) {
      setScrollDirection('down')
    } else if (scrollDiff < 0) {
      setScrollDirection('up')
    }

    // Update sticky state
    setIsSticky(currentScrollY > scrollThreshold)

    // Update visibility based on scroll direction and position
    if (currentScrollY <= scrollThreshold) {
      setIsVisible(true)
    } else if (scrollDirection === 'up' || currentScrollY < lastScrollY.current) {
      setIsVisible(true)
    } else if (scrollDirection === 'down' && scrollDiff > 5) {
      setIsVisible(false)
    }

    lastScrollY.current = currentScrollY
  }, [scrollThreshold, scrollDirection])

  // Throttled scroll handler
  const throttledScrollHandler = useCallback(() => {
    let ticking = false
    
    return () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll()
          ticking = false
        })
        ticking = true
      }
    }
  }, [handleScroll])

  useEffect(() => {
    const scrollHandler = throttledScrollHandler()
    
    window.addEventListener('scroll', scrollHandler, { passive: true })
    return () => {
      window.removeEventListener('scroll', scrollHandler)
    }
  }, [throttledScrollHandler])

  // Handle tab click with haptic feedback
  const handleTabClick = (tabId: string, disabled?: boolean) => {
    if (disabled) return

    // Haptic feedback for mobile devices
    if (navigator.vibrate && tabId !== activeTab) {
      navigator.vibrate(10)
    }

    onTabChange(tabId)
  }

  // Calculate dynamic styles based on viewport and scroll state
  const getTabStyles = () => {
    const baseTop = viewportHeight ? Math.min(60, viewportHeight * 0.08) : 60
    
    return {
      transform: isVisible ? 'translateY(0)' : 'translateY(-100%)',
      top: isSticky ? `${baseTop}px` : 'auto',
    }
  }

  return (
    <div 
      ref={navRef}
      className={`sticky-tab-navigation ${isSticky ? 'sticky' : ''} ${!isVisible ? 'hidden' : ''} ${className}`}
      style={getTabStyles()}
    >
      <div className="tab-navigation-container">
        <div className="tab-list" role="tablist">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab
            
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-disabled={tab.disabled}
                className={`tab-item ${isActive ? 'active' : ''} ${tab.disabled ? 'disabled' : ''}`}
                onClick={() => handleTabClick(tab.id, tab.disabled)}
                disabled={tab.disabled}
              >
                <span className="tab-label">{tab.label}</span>
                {showCounts && typeof tab.count === 'number' && (
                  <span className="tab-count">{tab.count}</span>
                )}
                {isActive && <div className="tab-active-indicator" />}
              </button>
            )
          })}
        </div>
        
        {/* Background blur effect when sticky */}
        {isSticky && <div className="tab-backdrop" />}
      </div>
    </div>
  )
}

// CSS-in-JS styles (will be extracted to CSS file)
export const stickyTabNavigationStyles = `
.sticky-tab-navigation {
  position: relative;
  z-index: 100;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform;
}

.sticky-tab-navigation.sticky {
  position: fixed;
  left: 0;
  right: 0;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.sticky-tab-navigation.hidden {
  pointer-events: none;
}

.tab-navigation-container {
  position: relative;
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-light);
}

.sticky-tab-navigation.sticky .tab-navigation-container {
  background: rgba(var(--bg-primary-rgb), 0.85);
}

.tab-list {
  display: flex;
  gap: var(--spacing-xs);
  padding: 4px;
  background: var(--bg-secondary);
  border-radius: 12px;
  width: fit-content;
  margin: 0 auto;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
}

.tab-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  background: transparent;
  color: var(--text-secondary);
  white-space: nowrap;
  outline: none;
  
  /* Touch optimization */
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  user-select: none;
}

.tab-item:hover:not(.disabled):not(.active) {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.tab-item:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

.tab-item.active {
  background: var(--primary);
  color: white;
  box-shadow: 
    0 2px 8px rgba(var(--primary-rgb), 0.3),
    0 1px 3px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.tab-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.tab-label {
  font-weight: inherit;
}

.tab-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.2);
  color: currentColor;
}

.tab-item.active .tab-count {
  background: rgba(255, 255, 255, 0.3);
}

.tab-item:not(.active) .tab-count {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
}

.tab-active-indicator {
  position: absolute;
  bottom: -6px;
  left: 50%;
  transform: translateX(-50%);
  width: 12px;
  height: 3px;
  background: white;
  border-radius: 2px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.tab-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    to bottom,
    rgba(var(--bg-primary-rgb), 0.9),
    rgba(var(--bg-primary-rgb), 0.7)
  );
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  z-index: -1;
}

/* Responsive adjustments */
@media (max-width: 480px) {
  .tab-navigation-container {
    padding: var(--spacing-xs) var(--spacing-sm);
  }
  
  .tab-item {
    padding: 8px 12px;
    font-size: 13px;
  }
  
  .tab-count {
    min-width: 18px;
    height: 18px;
    font-size: 11px;
  }
}

/* Dark theme support */
@media (prefers-color-scheme: dark) {
  .tab-navigation-container {
    border-bottom-color: var(--border-dark);
  }
  
  .tab-list {
    box-shadow: inset 0 1px 3px rgba(255, 255, 255, 0.1);
  }
  
  .tab-item.active {
    box-shadow: 
      0 2px 8px rgba(var(--primary-rgb), 0.4),
      0 1px 3px rgba(255, 255, 255, 0.1);
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .sticky-tab-navigation,
  .tab-item,
  .tab-active-indicator {
    transition: none;
  }
}
`