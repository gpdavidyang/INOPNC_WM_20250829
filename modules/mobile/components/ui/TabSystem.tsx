'use client'

import React, { useCallback, KeyboardEvent } from 'react'
import { cn } from '@/lib/utils'

export interface Tab {
  id: string
  label: string
  count?: number
  icon?: React.ReactNode
}

interface TabSystemProps {
  tabs: Tab[]
  activeTab: string
  onTabChange: (tabId: string) => void
  children?: React.ReactNode
  className?: string
  variant?: 'line' | 'solid' | 'underline' | 'grid'
}

export const TabSystem: React.FC<TabSystemProps> = ({
  tabs,
  activeTab,
  onTabChange,
  children,
  className,
  variant = 'line',
}) => {
  // 키보드 네비게이션 처리
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      const currentIndex = tabs.findIndex(tab => tab.id === activeTab)
      let newIndex = currentIndex

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault()
          newIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1
          break
        case 'ArrowRight':
          e.preventDefault()
          newIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0
          break
        case 'Home':
          e.preventDefault()
          newIndex = 0
          break
        case 'End':
          e.preventDefault()
          newIndex = tabs.length - 1
          break
      }

      if (newIndex !== currentIndex) {
        onTabChange(tabs[newIndex].id)
        // Focus the new tab
        const newTab = document.querySelector(
          `[role="tab"][data-tab-id="${tabs[newIndex].id}"]`
        ) as HTMLButtonElement
        newTab?.focus()
      }
    },
    [tabs, activeTab, onTabChange]
  )

  const getTabClasses = () => {
    const baseClasses =
      'tab relative font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#1A254F]'

    switch (variant) {
      case 'grid':
        return cn(
          baseClasses,
          'h-14 bg-white border border-[#E5EAF3] text-[#667085] text-sm font-semibold',
          'data-[state=active]:bg-[#1A254F] data-[state=active]:text-white data-[state=active]:border-[#1A254F]',
          'data-[state=inactive]:bg-white data-[state=inactive]:text-[#667085] data-[state=inactive]:border-[#E5EAF3]',
          'hover:bg-[#f8f9fb] hover:border-[#d0d5dd]',
          'active:scale-[0.98]',
          'flex items-center justify-center'
        )
      case 'solid':
        return cn(
          baseClasses,
          'px-4 py-3 rounded-t-lg border border-b-0',
          'data-[state=active]:bg-white data-[state=active]:border-[#e6eaf2]',
          'data-[state=inactive]:bg-transparent data-[state=inactive]:border-transparent',
          'data-[state=active]:text-[#101828]',
          'data-[state=inactive]:text-[#667085]',
          'hover:bg-[#f8f9fb]'
        )
      case 'underline':
        return cn(
          baseClasses,
          'px-4 py-3 border-b-2',
          'data-[state=active]:border-[#1A254F]',
          'data-[state=inactive]:border-transparent',
          'data-[state=active]:text-[#1A254F]',
          'data-[state=inactive]:text-[#667085]',
          'hover:text-[#101828]'
        )
      case 'line':
      default:
        return cn(
          baseClasses,
          'px-4 py-3 relative text-sm font-semibold text-center border-b-2',
          'data-[state=active]:text-[#101828] data-[state=active]:border-[#1A254F]',
          'data-[state=inactive]:text-[#667085] data-[state=inactive]:border-transparent',
          'hover:text-[#101828]'
        )
    }
  }

  const getTabContainerClasses = () => {
    if (variant === 'line') {
      return 'grid grid-cols-2'
    }
    return 'tabs flex overflow-x-auto scrollbar-hide gap-1'
  }

  return (
    <div className={cn('tab-container', className)}>
      {/* 탭 목록 */}
      <div
        className={getTabContainerClasses()}
        role="tablist"
        onKeyDown={handleKeyDown}
        aria-label="작업일지 탭"
      >
        {tabs.map(tab => (
          <button
            key={tab.id}
            role="tab"
            data-tab-id={tab.id}
            data-state={activeTab === tab.id ? 'active' : 'inactive'}
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            tabIndex={activeTab === tab.id ? 0 : -1}
            className={getTabClasses()}
            onClick={() => onTabChange(tab.id)}
          >
            <span className="flex items-center gap-2">
              {tab.icon && <span className="tab-icon">{tab.icon}</span>}
              <span className="tab-label">{tab.label}</span>
              {tab.count !== undefined && (
                <span className="tab-count inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold bg-[var(--bg-secondary)] rounded-full">
                  {tab.count}
                </span>
              )}
            </span>
          </button>
        ))}
      </div>

      {/* 탭 패널 */}
      <div className="tab-panels mt-4">
        {React.Children.map(children, child => {
          if (!React.isValidElement(child)) return null

          return React.cloneElement(child as React.ReactElement<any>, {
            role: 'tabpanel',
            id: `panel-${child.props['data-panel']}`,
            'aria-labelledby': `tab-${child.props['data-panel']}`,
            hidden: activeTab !== child.props['data-panel'],
            tabIndex: 0,
            className: cn(
              'panel focus:outline-none',
              activeTab === child.props['data-panel'] ? 'active' : '',
              child.props.className
            ),
          })
        })}
      </div>
    </div>
  )
}

// 탭 패널 컴포넌트
interface TabPanelProps {
  'data-panel': string
  children: React.ReactNode
  className?: string
}

export const TabPanel: React.FC<TabPanelProps> = ({ children, className, ...props }) => {
  return (
    <div {...props} className={cn('tab-panel', className)}>
      {children}
    </div>
  )
}
