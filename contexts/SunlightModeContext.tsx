'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface SunlightModeContextType {
  isSunlightMode: boolean
  setSunlightMode: (enabled: boolean) => void
  toggleSunlightMode: () => void
  isAutoDetection: boolean
  setAutoDetection: (enabled: boolean) => void
}

const SunlightModeContext = createContext<SunlightModeContextType | undefined>(undefined)

interface SunlightModeProviderProps {
  children: ReactNode
}

export function SunlightModeProvider({ children }: SunlightModeProviderProps) {
  const [isSunlightMode, setIsSunlightMode] = useState(false)
  const [isAutoDetection, setIsAutoDetection] = useState(true)

  // Auto-detection based on ambient light and time
  useEffect(() => {
    if (!isAutoDetection) return

    const detectSunlightConditions = () => {
      const now = new Date()
      const hour = now.getHours()
      
      // Auto-enable during peak sunlight hours (10 AM - 4 PM)
      const isPeakSunlight = hour >= 10 && hour <= 16
      
      // Check for high screen brightness as indicator of bright environment
      const hasHighBrightness = window.screen && 'orientation' in window.screen
      
      return isPeakSunlight || hasHighBrightness
    }

    const shouldEnableSunlightMode = detectSunlightConditions()
    if (shouldEnableSunlightMode !== isSunlightMode) {
      setIsSunlightMode(shouldEnableSunlightMode)
    }
  }, [isAutoDetection, isSunlightMode])

  // Load saved preference on mount
  useEffect(() => {
    const savedSunlightMode = localStorage.getItem('inopnc-sunlight-mode')
    const savedAutoDetection = localStorage.getItem('inopnc-sunlight-auto')
    
    if (savedSunlightMode !== null) {
      setIsSunlightMode(savedSunlightMode === 'true')
    }
    
    if (savedAutoDetection !== null) {
      setIsAutoDetection(savedAutoDetection === 'true')
    }
  }, [])

  // Save preferences when changed
  useEffect(() => {
    localStorage.setItem('inopnc-sunlight-mode', isSunlightMode.toString())
  }, [isSunlightMode])

  useEffect(() => {
    localStorage.setItem('inopnc-sunlight-auto', isAutoDetection.toString())
  }, [isAutoDetection])

  // Apply sunlight mode classes to document
  useEffect(() => {
    const root = document.documentElement
    if (isSunlightMode) {
      root.classList.add('sunlight-mode')
    } else {
      root.classList.remove('sunlight-mode')
    }

    return () => {
      root.classList.remove('sunlight-mode')
    }
  }, [isSunlightMode])

  const setSunlightMode = (enabled: boolean) => {
    setIsSunlightMode(enabled)
    // Disable auto-detection when manually set
    if (isAutoDetection) {
      setIsAutoDetection(false)
    }
  }

  const toggleSunlightMode = () => {
    setSunlightMode(!isSunlightMode)
  }

  const setAutoDetection = (enabled: boolean) => {
    setIsAutoDetection(enabled)
  }

  return (
    <SunlightModeContext.Provider
      value={{
        isSunlightMode,
        setSunlightMode,
        toggleSunlightMode,
        isAutoDetection,
        setAutoDetection,
      }}
    >
      {children}
    </SunlightModeContext.Provider>
  )
}

export function useSunlightMode() {
  const context = useContext(SunlightModeContext)
  if (context === undefined) {
    throw new Error('useSunlightMode must be used within a SunlightModeProvider')
  }
  return context
}

// Utility function to get sunlight-optimized classes
export function getSunlightClass(baseClass: string, sunlightClass: string): string {
  return `${baseClass} sunlight-mode:${sunlightClass}`
}

// Helper to conditionally apply sunlight styles
export function applySunlightStyles(isSunlightMode: boolean, normalStyles: string, sunlightStyles: string): string {
  return isSunlightMode ? `${normalStyles} ${sunlightStyles}` : normalStyles
}