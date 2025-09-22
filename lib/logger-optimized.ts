/**
 * Optimized logger that reduces console output in development
 * Only shows errors and warnings unless explicitly enabled
 */

const isDevelopment = process.env.NODE_ENV === 'development'
const isDebugEnabled = process.env.DEBUG === 'true'
const disableConsoleLogs = process.env.NEXT_PUBLIC_DISABLE_CONSOLE_LOGS === 'true'

export const logger = {
  log: (...args: unknown[]) => {
    if (!disableConsoleLogs && (isDebugEnabled || !isDevelopment)) {
      console.log(...args)
    }
  },
  
  info: (...args: unknown[]) => {
    if (!disableConsoleLogs && (isDebugEnabled || !isDevelopment)) {
      console.info(...args)
    }
  },
  
  debug: (...args: unknown[]) => {
    if (isDebugEnabled) {
      console.debug(...args)
    }
  },
  
  warn: (...args: unknown[]) => {
    // Always show warnings
    console.warn(...args)
  },
  
  error: (...args: unknown[]) => {
    // Always show errors
    console.error(...args)
  },
  
  // Performance logging - only in debug mode
  perf: (label: string, fn: () => void) => {
    if (isDebugEnabled) {
      const start = performance.now()
      fn()
      const end = performance.now()
      console.debug(`[PERF] ${label}: ${(end - start).toFixed(2)}ms`)
    } else {
      fn()
    }
  }
}

// Replace global console in development to reduce noise
if (isDevelopment && disableConsoleLogs) {
  global.console.log = logger.log
  global.console.info = logger.info
  global.console.debug = logger.debug
}