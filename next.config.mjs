/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // TypeScript 빌드 최적화
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // ESLint 빌드 최적화
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Enable SWC for build
  swcMinify: true,
  
  // Enable compression for deployment
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
    
    // Font optimization disabled for quality
    adjustFontFallbacks: false,
  },
  
  // 개발 서버 최적화
  devIndicators: {
    buildActivity: false,
  },
  
  // 컴파일 성능 향상
  compiler: {
    // KEEP console for debugging
    removeConsole: false,
    // KEEP React properties for debugging
    reactRemoveProperties: false,
  },
  
  // Image configuration
  images: {
    formats: ['image/webp'],
    domains: ['localhost', 'inopnc-wm-20250829.vercel.app'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 86400,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    unoptimized: false,
  },
  
  // DISABLE font optimization
  optimizeFonts: false,
  
  // Headers
  headers: async () => {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-transform',
          },
        ],
      },
    ];
  },
}

export default nextConfig