import type { Metadata } from 'next'
import { Poppins, Noto_Sans_KR } from 'next/font/google'
import { cookies } from 'next/headers'
import { Providers } from '@/components/providers'
import './globals.css'
import './fonts.css'

// Font configurations
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
})

const notoSansKR = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-noto-sans-kr',
  display: 'swap',
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

  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        {/* Google Fonts for Design System */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={bodyClasses}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
