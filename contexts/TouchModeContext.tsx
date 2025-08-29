'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type TouchModeType = 'normal' | 'glove' | 'precision'

interface TouchModeContextType {
  touchMode: TouchModeType
  setTouchMode: (mode: TouchModeType) => void
  isGloveMode: boolean
  isPrecisionMode: boolean
}

const TouchModeContext = createContext<TouchModeContextType | undefined>(undefined)

interface TouchModeProviderProps {
  children: ReactNode
}

export function TouchModeProvider({ children }: TouchModeProviderProps) {
  const [touchMode, setTouchModeState] = useState<TouchModeType>('normal')

  // Load touch mode preference from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('inopnc-touch-mode')
      if (saved && ['normal', 'glove', 'precision'].includes(saved)) {
        setTouchModeState(saved as TouchModeType)
      }
    } catch (error) {
      console.warn('Failed to load touch mode preference:', error)
    }
  }, [])

  // Save touch mode preference to localStorage
  const setTouchMode = (mode: TouchModeType) => {
    setTouchModeState(mode)
    try {
      localStorage.setItem('inopnc-touch-mode', mode)
    } catch (error) {
      console.warn('Failed to save touch mode preference:', error)
    }
  }

  // Apply touch mode class to document root
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement
      // Remove existing touch mode classes
      root.classList.remove('touch-mode-normal', 'touch-mode-glove', 'touch-mode-precision')
      // Add current touch mode class
      root.classList.add(`touch-mode-${touchMode}`)
    }
  }, [touchMode])

  const value = {
    touchMode,
    setTouchMode,
    isGloveMode: touchMode === 'glove',
    isPrecisionMode: touchMode === 'precision'
  }

  return (
    <TouchModeContext.Provider value={value}>
      {children}
    </TouchModeContext.Provider>
  )
}

// Custom hook to use touch mode context
export function useTouchMode() {
  const context = useContext(TouchModeContext)
  if (context === undefined) {
    throw new Error('useTouchMode must be used within a TouchModeProvider')
  }
  return context
}

// Utility function to get touch-optimized spacing classes
export function getTouchSpacingClass(
  baseSpacing: string,
  touchMode: TouchModeType
): string {
  const spacingMap = {
    normal: baseSpacing,
    glove: baseSpacing.replace(/p-(\d+)/, (match, size) => `p-${Math.min(parseInt(size) + 1, 8)}`),
    precision: baseSpacing.replace(/p-(\d+)/, (match, size) => `p-${Math.max(parseInt(size) - 1, 1)}`)
  }
  
  return spacingMap[touchMode] || baseSpacing
}

// Utility function to get minimum touch target size
export function getMinTouchTarget(touchMode: TouchModeType): string {
  switch (touchMode) {
    case 'glove':
      return 'min-h-[56px] min-w-[56px]' // 56px for glove use
    case 'precision':
      return 'min-h-[44px] min-w-[44px]' // 44px for precision
    default:
      return 'min-h-[48px] min-w-[48px]' // 48px standard
  }
}