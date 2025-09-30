'use client'

import { ErrorBoundary } from '@/components/error-boundary'
import { QueryProvider } from '@/providers/query-provider'
import { FontSizeProvider } from '@/contexts/FontSizeContext'
import { TouchModeProvider } from '@/contexts/TouchModeContext'
import { ContrastModeProvider } from '@/contexts/ContrastModeContext'
import { ThemeProvider } from 'next-themes'

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ErrorBoundary>
      <ThemeProvider
        attribute="data-theme"
        defaultTheme="system"
        enableSystem
        storageKey="inopnc_theme"
        disableTransitionOnChange
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
