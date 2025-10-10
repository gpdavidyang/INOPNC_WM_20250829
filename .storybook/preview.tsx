import type { Decorator, Preview } from '@storybook/react'
import { MINIMAL_VIEWPORTS } from '@storybook/addon-viewport'
import { withThemeByDataAttribute } from '@storybook/addon-themes'
import React from 'react'

// Import Tailwind and project globals
import '../app/globals.css'
// Mobile global CSS so layout/AppBar styles (app-header, header-content, etc.) match production
import '../modules/mobile/styles/mobile-global.css'

// Lightweight providers: reuse production providers safely in Storybook
import { TouchModeProvider } from '../contexts/TouchModeContext'
import { FontSizeProvider } from '../contexts/FontSizeContext'
import { UnifiedAuthProvider } from '../providers/unified-auth-provider'

// Optional: if your components rely on overall Providers wrapper, you can add it here.
// import { Providers } from '../components/providers'

const MobileSafeArea: Decorator = Story => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'center',
      padding: '16px',
      background: 'var(--color-bg-secondary, #f7f8fa)',
    }}
  >
    <div
      style={{
        width: 390,
        maxWidth: '100%',
        minHeight: 844,
        background: 'var(--color-bg-primary, #fff)',
        border: '1px solid #e5e7eb',
        borderRadius: 24,
        boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
        paddingBottom: 'env(safe-area-inset-bottom, 0)',
      }}
    >
      <Story />
    </div>
  </div>
)

const ContextProviders: Decorator = Story => (
  <UnifiedAuthProvider>
    <FontSizeProvider>
      <TouchModeProvider>
        <Story />
      </TouchModeProvider>
    </FontSizeProvider>
  </UnifiedAuthProvider>
)

export const decorators: Decorator[] = [
  // Theme switcher via data-theme attribute (works with next-themes Tailwind setup)
  withThemeByDataAttribute({
    themes: {
      light: 'light',
      dark: 'dark',
    },
    defaultTheme: 'light',
    attribute: 'data-theme',
  }) as unknown as Decorator,
  ContextProviders,
  MobileSafeArea,
]

export const globalTypes = {
  themePreset: {
    name: 'Preset',
    description: 'Theme/Contrast preset',
    defaultValue: 'light',
    toolbar: {
      icon: 'mirror',
      items: [
        { value: 'light', title: 'Light' },
        { value: 'dark', title: 'Dark' },
        { value: 'hc-light', title: 'High Contrast Light' },
        { value: 'hc-dark', title: 'High Contrast Dark' },
      ],
    },
  },
  contrast: {
    name: 'Contrast',
    description: 'High contrast mode',
    defaultValue: 'normal',
    toolbar: {
      icon: 'contrast',
      items: [
        { value: 'normal', title: 'Normal' },
        { value: 'high', title: 'High' },
      ],
    },
  },
  touchMode: {
    name: 'Touch',
    description: 'Touch mode',
    defaultValue: 'normal',
    toolbar: {
      icon: 'button',
      items: [
        { value: 'normal', title: 'Normal' },
        { value: 'glove', title: 'Glove' },
        { value: 'precision', title: 'Precision' },
      ],
    },
  },
  fontSize: {
    name: 'Font',
    description: 'Mobile font scale',
    defaultValue: 'normal',
    toolbar: {
      icon: 'text',
      items: [
        { value: 'normal', title: 'Normal' },
        { value: 'large', title: 'Large' },
      ],
    },
  },
}

// Apply globals to DOM/classnames so our providers/styles react immediately
const ApplyGlobals: Decorator = (Story, context) => {
  const { themePreset, contrast, touchMode, fontSize } = context.globals as any
  React.useEffect(() => {
    const root = document.documentElement
    // Theme preset overrides
    if (themePreset) {
      const isDark = themePreset === 'dark' || themePreset === 'hc-dark'
      const isHigh = themePreset.startsWith('hc-')

      root.classList.toggle('dark', isDark)
      root.setAttribute('data-theme', isDark ? 'dark' : 'light')
      root.classList.toggle('high-contrast', isHigh)
    }
    root.classList.toggle('high-contrast', contrast === 'high')
    // Touch mode classes
    root.classList.remove('touch-mode-normal', 'touch-mode-glove', 'touch-mode-precision')
    root.classList.add(`touch-mode-${touchMode}`)
    // Persist for providers reading localStorage
    try {
      localStorage.setItem('inopnc-touch-mode', touchMode)
    } catch {}
    // Font size
    root.classList.toggle('large-font-mode', fontSize === 'large')
    try {
      localStorage.setItem('inopnc-font-size-mobile', fontSize === 'large' ? 'large' : 'normal')
    } catch {}
  }, [themePreset, contrast, touchMode, fontSize])
  return <Story />
}

decorators.push(ApplyGlobals)

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    viewport: {
      viewports: MINIMAL_VIEWPORTS,
      defaultViewport: 'iphonex',
    },
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#ffffff' },
        { name: 'gray', value: '#f7f8fa' },
        { name: 'dark', value: '#0f172a' },
      ],
    },
  },
}

export default preview
