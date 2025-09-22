'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'

interface NavigationContextValue {
  activeTab: string
  setActiveTab: (tab: string) => void
}

const NavigationContext = createContext<NavigationContextValue | null>(null)

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState('home')
  return (
    <NavigationContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </NavigationContext.Provider>
  )
}

export function useNavigation() {
  const context = useContext(NavigationContext)
  if (!context) {
    return {
      activeTab: 'home',
      setActiveTab: () => {},
    }
  }
  return context
}
