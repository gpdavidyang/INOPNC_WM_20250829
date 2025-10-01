'use client'

import React, { useEffect } from 'react'

import { ErrorBoundary } from '@/components/error-boundary'
import { QueryProvider } from '@/providers/query-provider'
import { FontSizeProvider } from '@/contexts/FontSizeContext'
import { TouchModeProvider } from '@/contexts/TouchModeContext'
import { ContrastModeProvider } from '@/contexts/ContrastModeContext'
import { ThemeProvider, useTheme as useNextTheme } from 'next-themes'
import { ConfirmDialog } from '@/components/ui/use-confirm'

interface ProvidersProps {
  children: React.ReactNode
  forcedTheme?: 'light' | 'dark'
  enableSystem?: boolean
  defaultTheme?: 'light' | 'dark' | 'system'
}

export function Providers({
  children,
  forcedTheme,
  enableSystem = true,
  defaultTheme = 'system',
}: ProvidersProps) {
  return (
    <ErrorBoundary>
      <ThemeProvider
        attribute="data-theme"
        defaultTheme={defaultTheme}
        enableSystem={enableSystem}
        storageKey="inopnc_theme"
        disableTransitionOnChange
        forcedTheme={forcedTheme}
      >
        {/* Keep Tailwind's .dark class in sync with next-themes */}
        <ThemeClassSync />
        <ContrastModeProvider>
          <FontSizeProvider>
            <TouchModeProvider>
              <QueryProvider>
                {children}
                {/* Global confirm dialog portal */}
                <ConfirmDialog />
              </QueryProvider>
            </TouchModeProvider>
          </FontSizeProvider>
        </ContrastModeProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

// Ensures that when next-themes updates the theme attribute,
// the `.dark` class remains in sync for Tailwind and class-based CSS.
function ThemeClassSync() {
  const { theme, resolvedTheme } = useNextTheme()
  useEffect(() => {
    try {
      const t = (theme === 'system' ? resolvedTheme : theme) || 'light'
      document.documentElement.classList.toggle('dark', t === 'dark')
      document.documentElement.setAttribute('data-theme', t as string)
    } catch (_) {
      // ignore
    }
  }, [theme, resolvedTheme])
  return null
}
