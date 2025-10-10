import type { StorybookConfig } from '@storybook/react-vite'
import path from 'path'

const config: StorybookConfig = {
  stories: ['../components/**/*.stories.@(ts|tsx|mdx)', '../app/**/?(*.)stories.@(ts|tsx|mdx)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-viewport',
    '@storybook/addon-a11y',
    '@storybook/addon-measure',
    '@storybook/addon-outline',
    '@storybook/addon-themes',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  staticDirs: [{ from: '../public', to: '/public' }],
  docs: {
    autodocs: 'tag',
  },
  viteFinal: async (config, { configType }) => {
    config.resolve = config.resolve || {}
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@': path.resolve(__dirname, '../'),
      '@/': path.resolve(__dirname, '../'),
      'next/navigation': path.resolve(__dirname, './mocks/nextNavigation.ts'),
      'next/link': path.resolve(__dirname, './mocks/nextLink.tsx'),
      'next/image': path.resolve(__dirname, './mocks/nextImage.tsx'),
      '@/lib/supabase/client': path.resolve(__dirname, './mocks/supabaseClient.ts'),
    }
    // Ensure dev auth bypass for Storybook so UnifiedAuthProvider uses mock data
    config.define = {
      ...(config.define || {}),
      'process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS': JSON.stringify('true'),
      'process.env.NEXT_PUBLIC_SUPABASE_URL': JSON.stringify('https://example.supabase.co'),
      'process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY': JSON.stringify(
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock.mock_mock_mock_mock_mock_mock_mock'
      ),
    }
    return config
  },
}

export default config
