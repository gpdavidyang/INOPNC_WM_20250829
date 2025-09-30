'use client'

import { ErrorBoundary } from '@/components/error-boundary'
import { QueryProvider } from '@/providers/query-provider'
import { FontSizeProvider } from '@/contexts/FontSizeContext'
import { TouchModeProvider } from '@/contexts/TouchModeContext'
import { ContrastModeProvider } from '@/contexts/ContrastModeContext'
import { ThemeProvider } from 'next-themes'

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
        <ContrastModeProvider>
          <FontSizeProvider>
            <TouchModeProvider>
              <QueryProvider>{children}</QueryProvider>
            </TouchModeProvider>
          </FontSizeProvider>
        </ContrastModeProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}
