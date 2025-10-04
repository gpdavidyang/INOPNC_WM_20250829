/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Disable strict mode to prevent double rendering
  
  typescript: {
    ignoreBuildErrors: true,
  },

  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Enable SWC for better performance
  swcMinify: true,
  
  // Enable compression for better performance
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  
  // 실험적 기능으로 빌드 성능 향상
  experimental: {
    // Enable instrumentation hook for build-time setup
    instrumentationHook: true,
    
    // 메모리 캐시 최적화 - lucide-react 제거하여 tree-shaking 문제 해결
    optimizePackageImports: [
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-popover',
      '@radix-ui/react-progress',
      '@supabase/supabase-js',
      '@supabase/ssr',
      'date-fns',
      'clsx',
      'tailwind-merge',
      'class-variance-authority',
      'recharts',
      'xlsx',
      'jspdf',
      'html2canvas'
    ],
    
    // Enable font fallback optimization for better UX
    adjustFontFallbacks: true,
    
    // 빌드 속도 향상을 위한 추가 설정
    serverComponentsExternalPackages: ['sharp', 'canvas'],
    
    // Parallel builds for faster compilation
    parallelServerCompiles: true,
    parallelServerBuildTraces: true,
  },
  
  // Production 빌드 최적화
  productionBrowserSourceMaps: false,
  
  // 빌드 캐시 설정
  distDir: '.next',
  cleanDistDir: true,
  
  // 개발 서버 최적화
  devIndicators: {
    buildActivity: false,
    buildActivityPosition: 'bottom-right',
  },
  
  // 컴파일 성능 향상
  compiler: {
    // Remove console in production AND development (controlled by env)
    removeConsole: process.env.NEXT_PUBLIC_DISABLE_CONSOLE_LOGS === 'true' 
      ? { exclude: ['error', 'warn'] }
      : process.env.NODE_ENV === 'production' 
      ? { exclude: ['error', 'warn'] }
      : process.env.NEXT_BUILD_MODE === 'true'
      ? { exclude: ['error', 'warn'] }
      : false,
    // KEEP React properties for debugging in dev
    reactRemoveProperties: process.env.NODE_ENV === 'production',
  },
  
  // Image configuration - optimize for production
  images: {
    formats: ['image/webp', 'image/avif'],
    domains: ['localhost', 'inopnc-wm-20250829.vercel.app', '*.vercel.app'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 86400,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    unoptimized: process.env.NODE_ENV === 'development', // Optimize in production
  },
  
  // Enable font optimization for better production performance
  optimizeFonts: true,
  
  
  // Headers
  headers: async () => {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-transform',
          },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/manifest+json',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400',
          },
        ],
      },
      {
        source: '/icons/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  redirects: async () => {
    return [
      {
        source: '/mobile/worklogs',
        destination: '/mobile/worklog',
        permanent: true,
      },
    ]
  },
  rewrites: async () => {
    return [
      // 호환성: 파일명 대소문자 이슈 방지
      {
        source: '/images/inopnc_logo_horizon.png',
        destination: '/images/Inopnc_logo_horizon.png',
      },
      {
        source: '/images/inopnc-logo-n.png',
        destination: '/images/Inopnc_logo_horizon.png',
      },
    ]
  },
}

export default nextConfig
