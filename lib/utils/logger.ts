/**
 * Centralized logging configuration
 * Controls all application logging to prevent disk overflow
 */

// Environment-based logging levels
export const LogLevel = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
} as const

type LogLevelType = typeof LogLevel[keyof typeof LogLevel]

// Get current log level from environment
const getCurrentLogLevel = (): LogLevelType => {
  if (process.env.NODE_ENV === 'production') {
    return LogLevel.ERROR // Only errors in production
  }
  
  // In development, check for specific debug flags
  const debugLevel = process.env.DEBUG_LEVEL
  switch (debugLevel) {
    case 'debug':
      return LogLevel.DEBUG
    case 'info':
      return LogLevel.INFO
    case 'warn':
      return LogLevel.WARN
    case 'error':
      return LogLevel.ERROR
    default:
      return LogLevel.ERROR // Default to errors only to reduce noise
  }
}

const currentLogLevel = getCurrentLogLevel()

// Specific module debug flags
const isModuleDebugEnabled = (module: string): boolean => {
  if (process.env.NODE_ENV === 'production') return false
  
  // Check if debugging is explicitly disabled
  if (process.env.DEBUG_MODULES === 'none') return false
  
  const debugModules = process.env.DEBUG_MODULES?.split(',') || []
  return debugModules.includes(module) || debugModules.includes('*')
}

// Logger factory
export const createLogger = (module: string) => {
  const shouldLog = (level: LogLevelType) => {
    return level <= currentLogLevel && (level === LogLevel.ERROR || isModuleDebugEnabled(module))
  }

  return {
    error: (...args: unknown[]) => {
      if (shouldLog(LogLevel.ERROR)) {
        console.error(`[${module}]`, ...args)
      }
    },
    warn: (...args: unknown[]) => {
      if (shouldLog(LogLevel.WARN)) {
        console.warn(`[${module}]`, ...args)
      }
    },
    info: (...args: unknown[]) => {
      if (shouldLog(LogLevel.INFO)) {
        console.info(`[${module}]`, ...args)
      }
    },
    debug: (...args: unknown[]) => {
      if (shouldLog(LogLevel.DEBUG)) {
        console.log(`[${module}]`, ...args)
      }
    },
    log: (...args: unknown[]) => {
      // Alias for debug
      if (shouldLog(LogLevel.DEBUG)) {
        console.log(`[${module}]`, ...args)
      }
    },
  }
}

// Silent logger for production
export const silentLogger = {
  error: () => {},
  warn: () => {},
  info: () => {},
  debug: () => {},
  log: () => {},
}

// Default export for backward compatibility
export default createLogger