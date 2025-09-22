'use client'

import type { ReactNode } from 'react'
import { NavigationProvider, useNavigation } from './navigation-context'

export function NavigationController({ children }: { children: ReactNode }) {
  return <NavigationProvider>{children}</NavigationProvider>
}

export { useNavigation }
export function useOptionalNavigation() {
  return useNavigation()
}
