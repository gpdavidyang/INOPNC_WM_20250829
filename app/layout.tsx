import type { Metadata } from 'next'
import { Noto_Sans_KR, Poppins } from 'next/font/google'
import { cookies } from 'next/headers'
import { Providers } from '@/components/providers'
import './globals.css'

// Optimized Font configurations for production
const notoSansKR = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['200', '300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-noto-sans-kr',
  display: 'swap',
  preload: true,
  fallback: [
    'system-ui',
    '-apple-system',
    'Segoe UI',
    'Roboto',
    'Apple SD Gothic Neo',
    'Malgun Gothic',
    'sans-serif',
  ],
})

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-poppins',
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'sans-serif'],
})

export const metadata: Metadata = {
  title: 'INOPNC Work Management',
  description: '건설 현장 작업 일지 및 자재 관리를 위한 통합 관리 시스템',
  manifest: '/manifest.json', // Use static manifest file instead of API route
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'INOPNC WM',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/icons/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icons/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'INOPNC WM',
    'application-name': 'INOPNC WM',
    'msapplication-TileColor': '#2563eb',
    'msapplication-config': 'none',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  minimumScale: 0.5,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: '#2563eb',
  colorScheme: 'light dark',
  interactiveWidget: 'resizes-content',
  targetDensityDpi: 'device-dpi',
  handheldFriendly: true,
  orientation: 'portrait',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Server-side role detection for CSS-based UI enforcement
  const cookieStore = cookies()
  const userRole = cookieStore.get('user-role')?.value

  // Determine body classes based on role + font classes
  let bodyClasses = `antialiased ${poppins.variable} ${notoSansKR.variable}`
  if (userRole) {
    const roleClass = `role-${userRole.replace(/_/g, '-')}`
    bodyClasses += ` ${roleClass}`

    // Add specific classes for admin/field roles
    if (userRole === 'admin' || userRole === 'system_admin') {
      bodyClasses += ' admin-role desktop-ui'
    } else if (
      userRole === 'worker' ||
      userRole === 'site_manager' ||
      userRole === 'customer_manager'
    ) {
      bodyClasses += ' field-role mobile-ui'
    }
  }

  const shouldForceLightTheme = userRole === 'admin' || userRole === 'system_admin'
  const forcedTheme = shouldForceLightTheme ? 'light' : undefined
  const defaultTheme = shouldForceLightTheme ? 'light' : 'system'
  const themeInitializer = `(() => { try {
    var forcedLight = ${shouldForceLightTheme ? 'true' : 'false'};
    var storageKey = 'inopnc_theme';
    var stored = forcedLight ? 'light' : localStorage.getItem(storageKey);
    var t = (stored === 'dark' || stored === 'light') ? stored : null;
    if (!t) {
      var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      t = forcedLight ? 'light' : (prefersDark ? 'dark' : 'light');
    }
    document.documentElement.setAttribute('data-theme', t);
    document.documentElement.classList.toggle('dark', t === 'dark');
  } catch (e) {} })();`

  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        {/* Preconnect for performance */}
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />

        {/* Critical CSS for font loading optimization */}
        <style suppressHydrationWarning>{`
          /* Prevent FOIT/FOUT during font loading */
          html { font-family: var(--font-noto-sans-kr), system-ui, -apple-system, sans-serif; }
          .font-poppins { font-family: var(--font-poppins), system-ui, sans-serif; }
        `}</style>
        {/* No-flash theme initializer: apply saved or system theme before hydration */}
        <script
          // This runs on the client before React hydration to avoid theme flicker
          dangerouslySetInnerHTML={{
            __html: themeInitializer,
          }}
        />
      </head>
      <body className={bodyClasses}>
        <Providers
          forcedTheme={forcedTheme}
          enableSystem={!shouldForceLightTheme}
          defaultTheme={defaultTheme}
        >
          {children}
        </Providers>
      </body>
    </html>
  )
}
