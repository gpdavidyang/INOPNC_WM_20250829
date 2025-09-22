/**
 * Fetch wrapper for build-time requests
 * Suppresses sensitive token logging during builds
 */

// Store the original fetch
const originalFetch = global.fetch

// Check if we're in build mode
const isBuildMode =
  process.env.NEXT_BUILD_MODE === 'true' || process.env.NEXT_PUBLIC_DISABLE_FETCH_LOGS === 'true'

// Override global fetch only during build
if (isBuildMode && typeof window === 'undefined') {
  global.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url

    // Sanitize URL for logging (remove tokens)
    const sanitizedUrl = url
      .replace(/apikey=[^&]*/gi, 'apikey=***')
      .replace(/authorization=[^&]*/gi, 'authorization=***')
      .replace(/access_token=[^&]*/gi, 'access_token=***')
      .replace(/refresh_token=[^&]*/gi, 'refresh_token=***')

    // Only log sanitized URLs if absolutely necessary
    if (process.env.DEBUG_BUILD === 'true') {
      console.log(`[BUILD] Fetching: ${sanitizedUrl}`)
    }

    // Perform the actual fetch
    return originalFetch(input, init)
  }
}

export {}
