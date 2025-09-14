'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'

// Combined context for all simple state management
interface OptimizedContextType {
  // Font size
  isLargeFont: boolean
  setIsLargeFont: (large: boolean) => void
  toggleFontSize: () => void
  
  // Touch mode 
  touchMode: 'normal' | 'glove' | 'precision'
  setTouchMode: (mode: 'normal' | 'glove' | 'precision') => void
  
  // Contrast mode
  isHighContrast: boolean
  setIsHighContrast: (high: boolean) => void
  
  // Sunlight mode
  isSunlightMode: boolean
  setIsSunlightMode: (sunlight: boolean) => void
}

const OptimizedContext = createContext<OptimizedContextType | undefined>(undefined)

interface OptimizedContextProviderProps {
  children: ReactNode
}

export function OptimizedContextProvider({ children }: OptimizedContextProviderProps) {
  // Initialize all state at once to reduce re-renders
  const [state, setState] = useState({
    isLargeFont: false,
    touchMode: 'normal' as 'normal' | 'glove' | 'precision',
    isHighContrast: false,
    isSunlightMode: false,
  })

  // Load all preferences in a single effect
  useEffect(() => {
    try {
      const preferences = {
        isLargeFont: localStorage.getItem('inopnc-font-size') === 'large',
        touchMode: (localStorage.getItem('inopnc-touch-mode') as unknown) || 'normal',
        isHighContrast: localStorage.getItem('inopnc-contrast-mode') === 'high',
        isSunlightMode: localStorage.getItem('inopnc-sunlight-mode') === 'true',
      }
      setState(preferences)
    } catch (error) {
      console.warn('Failed to load UI preferences:', error)
    }
  }, [])

  // Apply CSS classes in a single effect
  useEffect(() => {
    if (typeof document === 'undefined') return

    const root = document.documentElement
    const { isLargeFont, touchMode, isHighContrast, isSunlightMode } = state
    
    // Batch DOM operations
    root.classList.toggle('large-font-mode', isLargeFont)
    root.classList.toggle('high-contrast-mode', isHighContrast)
    root.classList.toggle('sunlight-mode', isSunlightMode)
    
    // Touch mode classes
    root.classList.remove('touch-normal', 'touch-glove', 'touch-precision')
    root.classList.add(`touch-${touchMode}`)
  }, [state])

  // Optimized setters that batch updates
  const setIsLargeFont = (large: boolean) => {
    setState(prev => ({ ...prev, isLargeFont: large }))
    try {
      localStorage.setItem('inopnc-font-size', large ? 'large' : 'normal')
    } catch (error) {
      console.warn('Failed to save font size preference:', error)
    }
  }

  const setTouchMode = (mode: 'normal' | 'glove' | 'precision') => {
    setState(prev => ({ ...prev, touchMode: mode }))
    try {
      localStorage.setItem('inopnc-touch-mode', mode)
    } catch (error) {
      console.warn('Failed to save touch mode preference:', error)
    }
  }

  const setIsHighContrast = (high: boolean) => {
    setState(prev => ({ ...prev, isHighContrast: high }))
    try {
      localStorage.setItem('inopnc-contrast-mode', high ? 'high' : 'normal')
    } catch (error) {
      console.warn('Failed to save contrast mode preference:', error)
    }
  }

  const setIsSunlightMode = (sunlight: boolean) => {
    setState(prev => ({ ...prev, isSunlightMode: sunlight }))
    try {
      localStorage.setItem('inopnc-sunlight-mode', sunlight.toString())
    } catch (error) {
      console.warn('Failed to save sunlight mode preference:', error)
    }
  }

  const toggleFontSize = () => setIsLargeFont(!state.isLargeFont)

  const value = {
    ...state,
    setIsLargeFont,
    setTouchMode,
    setIsHighContrast,
    setIsSunlightMode,
    toggleFontSize,
  }

  return (
    <OptimizedContext.Provider value={value}>
      {children}
    </OptimizedContext.Provider>
  )
}

export function useOptimizedContext() {
  const context = useContext(OptimizedContext)
  if (context === undefined) {
    throw new Error('useOptimizedContext must be used within OptimizedContextProvider')
  }
  return context
}

// Legacy hooks for compatibility
export const useFontSize = () => {
  const { isLargeFont, setIsLargeFont, toggleFontSize } = useOptimizedContext()
  return { isLargeFont, setIsLargeFont, toggleFontSize }
}

export const useTouchMode = () => {
  const { touchMode, setTouchMode } = useOptimizedContext()
  return { touchMode, setTouchMode }
}

export const useContrastMode = () => {
  const { isHighContrast, setIsHighContrast } = useOptimizedContext()
  return { isHighContrast, setIsHighContrast }
}

export const useSunlightMode = () => {
  const { isSunlightMode, setIsSunlightMode } = useOptimizedContext()
  return { isSunlightMode, setIsSunlightMode }
}