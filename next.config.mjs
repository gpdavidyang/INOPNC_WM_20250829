import path from 'node:path'

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Disable strict mode to prevent double rendering
  
  typescript: {
    ignoreBuildErrors: true,
  },

  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Enable SWC minifier when stable
  swcMinify: true,
  
  // Enable compression for better performance
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  
  // 실험적 기능으로 빌드 성능 향상
  experimental: {},
  
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
  
  // Use default compiler settings to avoid TSX parsing regressions
  compiler: {},

  // Reduce SSR bundle conflicts with Sentry/OpenTelemetry in dev by
  // aliasing @sentry/nextjs to a no-op shim on the server only.
  webpack: (config, { isServer, dev }) => {
    if (isServer && dev) {
      config.resolve = config.resolve || {}
      config.resolve.alias = config.resolve.alias || {}
      config.resolve.alias['@sentry/nextjs'] = path.resolve(
        process.cwd(),
        'lib/shims/sentry-server-shim.ts'
      )
    }
    return config
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
      // API responses should never be cached
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
        ],
      },

      // Next.js build assets: long-term immutable cache
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/_next/image/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },

      // HTML/pages: prevent caching to avoid stale markup referencing old chunk names
      {
        source: '/((?!_next/|icons/|images/|fonts/|manifest.json|robots.txt|sw.js).*)',
        headers: [
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
        ],
      },

      // Service worker
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
          { key: 'Content-Type', value: 'application/javascript' },
        ],
      },

      // Manifest and icons
      {
        source: '/manifest.json',
        headers: [
          { key: 'Content-Type', value: 'application/manifest+json' },
          { key: 'Cache-Control', value: 'public, max-age=86400' },
        ],
      },
      {
        source: '/icons/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ]
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
      // 호환성: 과거 경로를 소문자 표준 경로로 정규화
      { source: '/images/Inopnc_logo_horizon.png', destination: '/images/inopnc_logo_horizon.png' },
      { source: '/images/inopnc-logo-n.png', destination: '/images/inopnc_logo_horizon.png' },
    ]
  },
}

export default nextConfig
