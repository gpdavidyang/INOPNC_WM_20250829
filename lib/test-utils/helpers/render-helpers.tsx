/**
 * Render Test Helpers
 * 
 * Custom render utilities that provide all necessary contexts for testing
 * INOPNC Work Management System components including Supabase, auth, and theme providers.
 */

import React, { ReactElement, ReactNode } from 'react'

// Optional theme provider import
let ThemeProvider: React.ComponentType<unknown> | null = null
try {
  const nextThemes = require('next-themes')
  ThemeProvider = nextThemes.ThemeProvider
} catch {
  // next-themes not available, use mock provider
  const MockThemeProviderComponent = React.forwardRef<any, { children: ReactNode }>(
    function MockThemeProvider({ children }, ref) {
      return <>{children}</>
    }
  )
  ThemeProvider = MockThemeProviderComponent
}

// Re-export for convenience
export * from '@testing-library/react'
export { userEvent } from '@testing-library/user-event'

// Extended render options
export interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  // Supabase context
  supabaseClient?: MockSupabaseClient
  
  // Auth context
  authState?: AuthState
  authContext?: MockAuthContext
  
  // Theme context  
  theme?: 'light' | 'dark' | 'system'
  
  // Additional providers
  wrapper?: React.ComponentType<{ children: ReactNode }>
  
  // Route context (for Next.js router)
  routerProps?: {
    pathname?: string
    query?: Record<string, string | string[]>
    asPath?: string
    push?: jest.Mock
    replace?: jest.Mock
    back?: jest.Mock
    reload?: jest.Mock
  }
}

// Mock contexts
const MockSupabaseContext = React.createContext<MockSupabaseClient | null>(null)
const MockAuthContext = React.createContext<MockAuthContext | null>(null)

// Provider wrapper components
export function SupabaseProvider({ 
  children, 
  client 
}: { 
  children: ReactNode
  client: MockSupabaseClient 
}) {
  return (
    <MockSupabaseContext.Provider value={client}>
      {children}
    </MockSupabaseContext.Provider>
  )
}

export function AuthProvider({ 
  children, 
  authContext 
}: { 
  children: ReactNode
  authContext: MockAuthContext 
}) {
  return (
    <MockAuthContext.Provider value={authContext}>
      {children}
    </MockAuthContext.Provider>
  )
}

// Mock Next.js router
export function MockRouterProvider({ 
  children, 
  routerProps = {} 
}: { 
  children: ReactNode
  routerProps?: CustomRenderOptions['routerProps']
}) {
  const mockRouter = {
    pathname: '/',
    route: '/',
    query: {},
    asPath: '/',
    basePath: '',
    isLocaleDomain: false,
    push: jest.fn().mockResolvedValue(true),
    replace: jest.fn().mockResolvedValue(true),
    reload: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn().mockResolvedValue(undefined),
    beforePopState: jest.fn(),
    events: {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn()
    },
    isFallback: false,
    isReady: true,
    isPreview: false,
    ...routerProps
  }

  // Mock useRouter hook
  jest.doMock('next/router', () => ({
    useRouter: () => mockRouter
  }))

  return <>{children}</>
}

// Combined provider wrapper
function AllProviders({ 
  children,
  supabaseClient,
  authContext,
  theme = 'light',
  routerProps
}: {
  children: ReactNode
  supabaseClient?: MockSupabaseClient
  authContext?: MockAuthContext
  theme?: 'light' | 'dark' | 'system'
  routerProps?: CustomRenderOptions['routerProps']
}) {
  let content = children

  // Wrap with router provider
  if (routerProps || true) { // Always provide router mock
    content = (
      <MockRouterProvider routerProps={routerProps}>
        {content}
      </MockRouterProvider>
    )
  }

  // Wrap with theme provider
  if (ThemeProvider) {
    content = (
      <ThemeProvider 
        attribute="class" 
        defaultTheme={theme}
        enableSystem={theme === 'system'}
        disableTransitionOnChange
      >
        {content}
      </ThemeProvider>
    )
  }

  // Wrap with auth provider
  if (authContext) {
    content = (
      <AuthProvider authContext={authContext}>
        {content}
      </AuthProvider>
    )
  }

  // Wrap with Supabase provider
  if (supabaseClient) {
    content = (
      <SupabaseProvider client={supabaseClient}>
        {content}
      </SupabaseProvider>
    )
  }

  return content
}

// Custom render function with providers
export function renderWithProviders(
  ui: ReactElement,
  options: CustomRenderOptions = {}
): RenderResult & {
  supabaseClient: MockSupabaseClient
  authContext: MockAuthContext
  rerender: (ui: ReactElement, options?: CustomRenderOptions) => void
} {
  const {
    supabaseClient = createMockSupabaseClient(),
    authState = 'authenticated',
    authContext = mockAuthState(authState),
    theme = 'light',
    routerProps,
    wrapper: CustomWrapper,
    ...renderOptions
  } = options

  // Create wrapper
  const Wrapper = ({ children }: { children: ReactNode }) => {
    let content = (
      <AllProviders
        supabaseClient={supabaseClient}
        authContext={authContext}
        theme={theme}
        routerProps={routerProps}
      >
        {children}
      </AllProviders>
    )

    // Apply custom wrapper if provided
    if (CustomWrapper) {
      content = <CustomWrapper>{content}</CustomWrapper>
    }

    return content
  }

  const renderResult = render(ui, { wrapper: Wrapper, ...renderOptions })

  // Custom rerender that maintains provider state
  const customRerender = (ui: ReactElement, rerenderOptions?: CustomRenderOptions) => {
    const mergedOptions = { 
      supabaseClient,
      authState,
      authContext,
      theme,
      routerProps,
      ...rerenderOptions 
    }
    return renderWithProviders(ui, mergedOptions)
  }

  return {
    ...renderResult,
    supabaseClient,
    authContext,
    rerender: customRerender
  }
}

// Convenience functions for common render scenarios
export const renderForWorker = (ui: ReactElement, options?: Omit<CustomRenderOptions, 'authState'>) =>
  renderWithProviders(ui, { ...options, authState: 'authenticated', authContext: mockAuthState('authenticated', { profile: { role: 'worker' } }) })

export const renderForManager = (ui: ReactElement, options?: Omit<CustomRenderOptions, 'authState'>) =>
  renderWithProviders(ui, { ...options, authState: 'authenticated', authContext: mockAuthState('authenticated', { profile: { role: 'site_manager' } }) })

export const renderForAdmin = (ui: ReactElement, options?: Omit<CustomRenderOptions, 'authState'>) =>
  renderWithProviders(ui, { ...options, authState: 'authenticated', authContext: mockAuthState('authenticated', { profile: { role: 'admin' } }) })

export const renderForCustomer = (ui: ReactElement, options?: Omit<CustomRenderOptions, 'authState'>) =>
  renderWithProviders(ui, { ...options, authState: 'authenticated', authContext: mockAuthState('authenticated', { profile: { role: 'customer_manager' } }) })

export const renderUnauthenticated = (ui: ReactElement, options?: Omit<CustomRenderOptions, 'authState'>) =>
  renderWithProviders(ui, { ...options, authState: 'unauthenticated' })

export const renderLoading = (ui: ReactElement, options?: Omit<CustomRenderOptions, 'authState'>) =>
  renderWithProviders(ui, { ...options, authState: 'loading' })

// Custom queries for common patterns
export const customQueries = {
  // Korean UI text patterns
  findByKoreanText: (text: string) => ({ 
    query: `[data-testid*="${text}"], [title*="${text}"], [aria-label*="${text}"]`,
    description: `Korean text: ${text}`
  }),

  // Common button patterns
  findSubmitButton: () => ({
    query: 'button[type="submit"], button:contains("제출"), button:contains("저장"), button:contains("확인")',
    description: 'Submit button'
  }),

  findCancelButton: () => ({
    query: 'button:contains("취소"), button:contains("닫기"), button:contains("돌아가기")',
    description: 'Cancel button'
  }),

  // Loading states
  findLoadingSpinner: () => ({
    query: '[data-testid="loading"], .animate-spin, [role="status"]',
    description: 'Loading spinner'
  }),

  // Form patterns
  findFormError: () => ({
    query: '[role="alert"], .text-red-500, .text-destructive, [data-testid*="error"]',
    description: 'Form error message'
  }),

  // Navigation patterns
  findSidebarItem: (text: string) => ({
    query: `[data-testid="sidebar"] a:contains("${text}"), nav a:contains("${text}")`,
    description: `Sidebar item: ${text}`
  }),

  // Data patterns
  findTableRow: (identifier: string) => ({
    query: `tr:contains("${identifier}"), [data-testid*="row"]:contains("${identifier}")`,
    description: `Table row containing: ${identifier}`
  }),

  // Modal patterns
  findModal: () => ({
    query: '[role="dialog"], [data-testid*="modal"], [data-testid*="dialog"]',
    description: 'Modal dialog'
  }),

  findModalCloseButton: () => ({
    query: '[role="dialog"] button:contains("×"), [data-testid*="modal"] button:contains("닫기")',
    description: 'Modal close button'
  })
}

// Utility to wait for elements with Korean text
export async function waitForKoreanText(text: string, options?: { timeout?: number }) {
  const { findByText } = await import('@testing-library/react')
  return findByText(text, options)
}

// Utility to find elements by Korean placeholder text
export function getByKoreanPlaceholder(placeholder: string) {
  const { getByPlaceholderText } = require('@testing-library/react')
  return getByPlaceholderText(placeholder)
}

// Debug helper for Korean text
export function debugKoreanText(container: HTMLElement) {
  const koreanTextElements = container.querySelectorAll('*')
  const koreanRegex = /[\u3131-\u3163\uac00-\ud7a3]/
  
  console.log('Elements with Korean text:')
  koreanTextElements.forEach(element => {
    const text = element.textContent
    if (text && koreanRegex.test(text)) {
      console.log(`- ${element.tagName}: "${text}"`)
    }
  })
}