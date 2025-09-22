/**
 * Next.js Instrumentation
 * This runs before the app starts, perfect for build-time setup
 */

export async function register() {
  // Only run on server-side
  if (typeof window === 'undefined') {
    // Apply fetch wrapper to suppress sensitive logs during build
    if (
      process.env.NEXT_BUILD_MODE === 'true' ||
      process.env.NEXT_PUBLIC_DISABLE_FETCH_LOGS === 'true'
    ) {
      await import('./lib/fetch-wrapper')
    }
  }
}
