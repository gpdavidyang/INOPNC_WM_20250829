/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Disable strict mode to prevent double rendering
  
  // TypeScript 빌드 최적화
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // ESLint 빌드 최적화
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
    // 메모리 캐시 최적화
    optimizePackageImports: [
      '@supabase/supabase-js',
      '@supabase/ssr',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-popover',
      '@radix-ui/react-progress',
      'lucide-react',
      'date-fns',
      'clsx',
      'tailwind-merge',
      'class-variance-authority',
    ],
    
    // Font optimization disabled for stability
    adjustFontFallbacks: false,
    
    // CSS optimization disabled for stability
    // optimizeCss: false,
  },
  
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
      : false,
    // KEEP React properties for debugging in dev
    reactRemoveProperties: process.env.NODE_ENV === 'production',
  },
  
  // Image configuration - preserve original quality
  images: {
    formats: ['image/webp'],
    domains: ['localhost', 'inopnc-wm-20250829.vercel.app'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 86400,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    unoptimized: true,
  },
  
  // DISABLE font optimization
  optimizeFonts: false,
  
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
}

export default nextConfig