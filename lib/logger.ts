type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'none'

interface LoggerConfig {
  level: LogLevel
  enabled: boolean
  modules: {
    database: boolean
    auth: boolean
    sites: boolean
    reports: boolean
    api: boolean
    realtime: boolean
  }
}

class Logger {
  private config: LoggerConfig
  private levels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
    none: 4
  }

  constructor() {
    this.config = this.loadConfig()
  }

  private loadConfig(): LoggerConfig {
    const isDevelopment = process.env.NODE_ENV === 'development'
    const isProduction = process.env.NODE_ENV === 'production'
    
    return {
      level: (process.env.DEBUG_LEVEL as LogLevel) || (isProduction ? 'error' : 'warn'),
      enabled: process.env.ENABLE_LOGGING !== 'false' && !isProduction,
      modules: {
        database: process.env.DEBUG_DATABASE === 'true',
        auth: process.env.DEBUG_AUTH === 'true',
        sites: process.env.DEBUG_SITE_INFO === 'true',
        reports: process.env.DEBUG_REPORTS === 'true',
        api: process.env.DEBUG_API === 'true',
        realtime: process.env.DEBUG_REALTIME === 'true'
      }
    }
  }

  private shouldLog(level: LogLevel, module?: keyof LoggerConfig['modules']): boolean {
    if (!this.config.enabled) return false
    if (this.levels[level] < this.levels[this.config.level]) return false
    if (module && !this.config.modules[module]) return false
    return true
  }

  debug(message: string, data?: any, module?: keyof LoggerConfig['modules']) {
    if (this.shouldLog('debug', module)) {
      console.debug(`[DEBUG]${module ? `[${module.toUpperCase()}]` : ''}`, message, data || '')
    }
  }

  info(message: string, data?: any, module?: keyof LoggerConfig['modules']) {
    if (this.shouldLog('info', module)) {
      console.info(`[INFO]${module ? `[${module.toUpperCase()}]` : ''}`, message, data || '')
    }
  }

  warn(message: string, data?: any, module?: keyof LoggerConfig['modules']) {
    if (this.shouldLog('warn', module)) {
      console.warn(`[WARN]${module ? `[${module.toUpperCase()}]` : ''}`, message, data || '')
    }
  }

  error(message: string, error?: any, module?: keyof LoggerConfig['modules']) {
    if (this.shouldLog('error', module)) {
      console.error(`[ERROR]${module ? `[${module.toUpperCase()}]` : ''}`, message, error || '')
    }
  }

  // Special method for production-safe logging
  production(message: string, data?: any) {
    if (process.env.NODE_ENV === 'production' && this.config.level === 'error') {
      // Only log critical errors in production
      return
    }
    this.error(message, data)
  }
}

// Export singleton instance
export const logger = new Logger()

// Export a no-op logger for client-side code in production
export const clientLogger = {
  debug: (...args: any[]) => {},
  info: (...args: any[]) => {},
  warn: (...args: any[]) => {},
  error: (...args: any[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.error(...args)
    }
  }
}