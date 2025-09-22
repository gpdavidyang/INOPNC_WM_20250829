'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

interface ContrastModeContextType {
  isHighContrast: boolean
  toggleHighContrast: () => void
  isSunlightMode: boolean
  toggleSunlightMode: () => void
}

const ContrastModeContext = createContext<ContrastModeContextType | undefined>(undefined)

export function ContrastModeProvider({ children }: { children: ReactNode }) {
  const [isHighContrast, setIsHighContrast] = useState(false)
  const [isSunlightMode, setIsSunlightMode] = useState(false)

  // Load preference from localStorage on mount
  useEffect(() => {
    const savedHighContrast = localStorage.getItem('highContrastMode')
    const savedSunlightMode = localStorage.getItem('sunlightMode')
    
    if (savedHighContrast === 'true') {
      setIsHighContrast(true)
      document.documentElement.classList.add('high-contrast')
    }
    
    if (savedSunlightMode === 'true') {
      setIsSunlightMode(true)
      document.documentElement.classList.add('sunlight-mode')
    }
  }, [])

  const toggleHighContrast = () => {
    const newValue = !isHighContrast
    setIsHighContrast(newValue)
    
    if (newValue) {
      document.documentElement.classList.add('high-contrast')
      localStorage.setItem('highContrastMode', 'true')
    } else {
      document.documentElement.classList.remove('high-contrast')
      localStorage.setItem('highContrastMode', 'false')
    }
  }

  const toggleSunlightMode = () => {
    const newValue = !isSunlightMode
    setIsSunlightMode(newValue)
    
    if (newValue) {
      document.documentElement.classList.add('sunlight-mode')
      localStorage.setItem('sunlightMode', 'true')
    } else {
      document.documentElement.classList.remove('sunlight-mode')
      localStorage.setItem('sunlightMode', 'false')
    }
  }

  return (
    <ContrastModeContext.Provider 
      value={{ 
        isHighContrast, 
        toggleHighContrast,
        isSunlightMode,
        toggleSunlightMode
      }}
    >
      {children}
    </ContrastModeContext.Provider>
  )
}

export function useContrastMode() {
  const context = useContext(ContrastModeContext)
  if (!context) {
    throw new Error('useContrastMode must be used within a ContrastModeProvider')
  }
  return context
}
