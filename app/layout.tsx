import type { Metadata } from "next";
import { Poppins, Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import "./fonts.css"; // Font optimization for production quality

// Font configurations
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
});

const notoSansKR = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-noto-sans-kr',
  display: 'swap',
});
// import "@/styles/sunlight-mode.css"; // Sunlight Mode CSS 비활성화
// import "@/styles/font-optimization.css"; // 폰트 최적화 CSS 비활성화
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;

export const metadata: Metadata = {
  title: "INOPNC Work Management",
  description: "건설 현장 작업 일지 및 자재 관리를 위한 통합 관리 시스템",
  manifest: "/api/pwa/manifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "INOPNC WM"
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }
    ]
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "INOPNC WM",
    "application-name": "INOPNC WM",
    "msapplication-TileColor": "#2563eb",
    "msapplication-config": "none"
  }
};

export const viewport = {
  width: "device-width",
  initialScale: 1.0, // Default to normal scale for mobile-optimized roles
  maximumScale: 5, // Allow reasonable zoom
  minimumScale: 0.5, // Allow some zoom out
  userScalable: true, // Allow user scaling
  viewportFit: "cover",
  themeColor: "#2563eb",
  // High DPI optimization
  colorScheme: "light dark",
  interactiveWidget: "resizes-content",
  // Additional viewport optimization for high-quality rendering
  targetDensityDpi: "device-dpi", // Use device's native DPI
  handheldFriendly: true,
  orientation: "portrait"
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Server-side role detection for CSS-based UI enforcement
  const cookieStore = cookies();
  const userRole = cookieStore.get('user-role')?.value;
  
  // Determine body classes based on role + font classes
  let bodyClasses = `antialiased ${poppins.variable} ${notoSansKR.variable}`;
  if (userRole) {
    const roleClass = `role-${userRole.replace(/_/g, '-')}`;
    bodyClasses += ` ${roleClass}`;
    
    // Add specific classes for admin/field roles
    if (userRole === 'admin' || userRole === 'system_admin') {
      bodyClasses += " admin-role desktop-ui";
    } else if (userRole === 'worker' || userRole === 'site_manager' || userRole === 'customer_manager') {
      bodyClasses += " field-role mobile-ui";
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
        
        <script dangerouslySetInnerHTML={{
          __html: `
            // Suppress Chrome extension console errors in development
            if (typeof console !== 'undefined') {
              const originalError = console.error;
              console.error = function(...args) {
                const message = args[0];
                if (typeof message === 'string' && 
                    (message.includes('chrome-extension://pejdijmoenmkgeppbflobdenhhabjlaj') ||
                     message.includes('Failed to load resource') && 
                     (message.includes('utils.js') || message.includes('extensionState.js') || message.includes('heuristicsRedefinitions.js')))) {
                  // Suppress Chrome extension errors
                  return;
                }
                originalError.apply(console, args);
              };
            }
          `
        }} />
      </head>
      <body className={bodyClasses}>
        <ErrorBoundary>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
            <FontSizeProvider>
              <TouchModeProvider>
                <ContrastModeProvider>
                  <SunlightModeProvider>
                    <EnvironmentalProvider>
                      <ThemeInitializer />
                      <ProductionQualityOptimizer />
                      <SkipNavigation />
                      <QueryProvider>
                        <AuthProvider>
                          <PerformanceMonitoringProvider>
                            <ViewportController>
                              <AdminViewportMeta />
                              <DeepLinkProvider />
                              <UIDebugIndicator />
                              {children}
                              <OfflineIndicator />
                              <InstallPrompt />
                              <ServiceWorkerRegistration />
                              <NotificationPermission />
                            </ViewportController>
                          </PerformanceMonitoringProvider>
                        </AuthProvider>
                      </QueryProvider>
                      <EnvironmentStatus />
                      <Toaster 
                        position="top-right"
                        richColors
                        closeButton
                        toastOptions={{
                          duration: 4000,
                          style: {
                            borderRadius: '8px',
                          }
                        }}
                      />
                  </EnvironmentalProvider>
                </SunlightModeProvider>
              </ContrastModeProvider>
            </TouchModeProvider>
          </FontSizeProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}