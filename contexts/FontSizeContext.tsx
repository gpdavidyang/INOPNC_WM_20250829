'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface FontSizeContextType {
  isLargeFont: boolean
  setIsLargeFont: (large: boolean) => void
  toggleFontSize: () => void
}

const FontSizeContext = createContext<FontSizeContextType | undefined>(undefined)

interface FontSizeProviderProps {
  children: ReactNode
}

export function FontSizeProvider({ children }: FontSizeProviderProps) {
  const [isLargeFont, setIsLargeFontState] = useState(false)

  // Load font size preference from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('inopnc-font-size')
      if (saved === 'large') {
        setIsLargeFontState(true)
      } else {
        // 기본값을 작은 폰트로 설정 (saved가 null이거나 'normal'인 경우)
        setIsLargeFontState(false)
      }
    } catch (error) {
      console.warn('Failed to load font size preference:', error)
    }
  }, [])

  // Save font size preference to localStorage
  const setIsLargeFont = (large: boolean) => {
    setIsLargeFontState(large)
    try {
      localStorage.setItem('inopnc-font-size', large ? 'large' : 'normal')
    } catch (error) {
      console.warn('Failed to save font size preference:', error)
    }
  }

  // Toggle font size
  const toggleFontSize = () => {
    setIsLargeFont(!isLargeFont)
  }

  // Apply font size class to document root
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement
      // Use requestAnimationFrame to avoid layout thrashing
      requestAnimationFrame(() => {
        if (isLargeFont) {
          root.classList.add('large-font-mode')
        } else {
          root.classList.remove('large-font-mode')
        }
      })
    }
  }, [isLargeFont])

  const value = {
    isLargeFont,
    setIsLargeFont,
    toggleFontSize
  }

  return (
    <FontSizeContext.Provider value={value}>
      {children}
    </FontSizeContext.Provider>
  )
}

// Custom hook to use font size context
export function useFontSize() {
  const context = useContext(FontSizeContext)
  if (context === undefined) {
    throw new Error('useFontSize must be used within a FontSizeProvider')
  }
  return context
}

// Utility function to get responsive text class
export function getResponsiveTextClass(
  baseClass: string,
  largeClass: string,
  isLargeFont: boolean
): string {
  return isLargeFont ? largeClass : baseClass
}

// Utility function to get typography class from design system
export function getFullTypographyClass(
  type: 'heading' | 'body' | 'caption' | 'button',
  size: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl',
  isLargeFont: boolean
): string {
  const sizeMap = {
    xs: isLargeFont ? 'text-base' : 'text-xs',
    sm: isLargeFont ? 'text-lg' : 'text-sm', 
    base: isLargeFont ? 'text-xl' : 'text-base',
    lg: isLargeFont ? 'text-2xl' : 'text-lg',
    xl: isLargeFont ? 'text-3xl' : 'text-xl',
    '2xl': isLargeFont ? 'text-4xl' : 'text-2xl',
    '3xl': isLargeFont ? 'text-5xl' : 'text-3xl',
    '4xl': isLargeFont ? 'text-6xl' : 'text-4xl'
  }

  const weightMap = {
    heading: 'font-semibold',
    body: 'font-normal',
    caption: 'font-normal',
    button: 'font-medium'
  }

  return `${sizeMap[size]} ${weightMap[type]}`
}

// Simplified typography class getter (for common use cases)
export function getTypographyClass(
  size: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | 'small' | 'large' | 'label',
  isLargeFont: boolean
): string {
  // Handle common aliases
  const sizeMapping: Record<string, string> = {
    'small': 'sm',
    'large': 'lg', 
    'label': 'sm'
  }
  
  const actualSize = sizeMapping[size] || size
  
  const sizeMap = {
    xs: isLargeFont ? 'text-base' : 'text-xs',
    sm: isLargeFont ? 'text-lg' : 'text-sm', 
    base: isLargeFont ? 'text-xl' : 'text-base',
    lg: isLargeFont ? 'text-2xl' : 'text-lg',
    xl: isLargeFont ? 'text-3xl' : 'text-xl',
    '2xl': isLargeFont ? 'text-4xl' : 'text-2xl',
    '3xl': isLargeFont ? 'text-5xl' : 'text-3xl',
    '4xl': isLargeFont ? 'text-6xl' : 'text-4xl'
  }
  
  return sizeMap[actualSize as keyof typeof sizeMap] || sizeMap.base
}