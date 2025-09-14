/**
 * Auth Event Logger
 *
 * Provides centralized logging for authentication events
 * with structured logging and configurable verbosity
 */

export enum AuthEventType {
  // Authentication events
  SIGN_IN_ATTEMPT = 'auth.sign_in.attempt',
  SIGN_IN_SUCCESS = 'auth.sign_in.success',
  SIGN_IN_FAILURE = 'auth.sign_in.failure',
  SIGN_OUT = 'auth.sign_out',
  SIGN_UP_ATTEMPT = 'auth.sign_up.attempt',
  SIGN_UP_SUCCESS = 'auth.sign_up.success',
  SIGN_UP_FAILURE = 'auth.sign_up.failure',

  // Session events
  SESSION_CREATED = 'auth.session.created',
  SESSION_REFRESHED = 'auth.session.refreshed',
  SESSION_EXPIRED = 'auth.session.expired',
  SESSION_INVALID = 'auth.session.invalid',
  SESSION_BRIDGE_ATTEMPT = 'auth.session.bridge.attempt',
  SESSION_BRIDGE_SUCCESS = 'auth.session.bridge.success',
  SESSION_BRIDGE_FAILURE = 'auth.session.bridge.failure',

  // Permission events
  PERMISSION_CHECK = 'auth.permission.check',
  PERMISSION_GRANTED = 'auth.permission.granted',
  PERMISSION_DENIED = 'auth.permission.denied',

  // Circuit breaker events
  CIRCUIT_BREAKER_TRIGGERED = 'auth.circuit_breaker.triggered',
  CIRCUIT_BREAKER_RESET = 'auth.circuit_breaker.reset',

  // Error events
  ERROR_GENERAL = 'auth.error.general',
  ERROR_NETWORK = 'auth.error.network',
  ERROR_INVALID_CREDENTIALS = 'auth.error.invalid_credentials',
  ERROR_TOKEN_EXPIRED = 'auth.error.token_expired',
}

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface AuthLogEntry {
  timestamp: string
  level: LogLevel
  event: AuthEventType
  userId?: string
  email?: string
  role?: string
  metadata?: Record<string, any>
  error?: Error | string
  duration?: number
}

export class AuthLogger {
  private static instance: AuthLogger
  private logLevel: LogLevel = LogLevel.INFO
  private logs: AuthLogEntry[] = []
  private maxLogs = 1000
  private listeners: Set<(entry: AuthLogEntry) => void> = new Set()

  private constructor() {
    // Set log level based on environment
    if (process.env.NODE_ENV === 'development') {
      this.logLevel = LogLevel.DEBUG
    } else if (process.env.NODE_ENV === 'test') {
      this.logLevel = LogLevel.WARN
    } else {
      this.logLevel = LogLevel.ERROR
    }
  }

  static getInstance(): AuthLogger {
    if (!AuthLogger.instance) {
      AuthLogger.instance = new AuthLogger()
    }
    return AuthLogger.instance
  }

  setLogLevel(level: LogLevel) {
    this.logLevel = level
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel
  }

  private createEntry(
    level: LogLevel,
    event: AuthEventType,
    data?: Partial<AuthLogEntry>
  ): AuthLogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      event,
      ...data,
    }
  }

  private log(entry: AuthLogEntry) {
    if (!this.shouldLog(entry.level)) return

    // Store in memory
    this.logs.push(entry)
    if (this.logs.length > this.maxLogs) {
      this.logs.shift()
    }

    // Notify listeners
    this.listeners.forEach(listener => listener(entry))

    // Console output
    const prefix = `[AUTH-${LogLevel[entry.level]}]`
    const message = `${prefix} ${entry.event}`

    if (entry.level === LogLevel.ERROR) {
      console.error(message, entry)
    } else if (entry.level === LogLevel.WARN) {
      console.warn(message, entry)
    } else if (process.env.NODE_ENV === 'development') {
      console.log(message, entry)
    }
  }

  // Public logging methods
  debug(event: AuthEventType, data?: Partial<AuthLogEntry>) {
    this.log(this.createEntry(LogLevel.DEBUG, event, data))
  }

  info(event: AuthEventType, data?: Partial<AuthLogEntry>) {
    this.log(this.createEntry(LogLevel.INFO, event, data))
  }

  warn(event: AuthEventType, data?: Partial<AuthLogEntry>) {
    this.log(this.createEntry(LogLevel.WARN, event, data))
  }

  error(event: AuthEventType, data?: Partial<AuthLogEntry>) {
    this.log(this.createEntry(LogLevel.ERROR, event, data))
  }

  // Track operation duration
  startTimer(): () => number {
    const start = Date.now()
    return () => Date.now() - start
  }

  // Get logs for debugging
  getLogs(filter?: {
    level?: LogLevel
    event?: AuthEventType
    userId?: string
    since?: Date
  }): AuthLogEntry[] {
    let filtered = [...this.logs]

    if (filter) {
      if (filter.level !== undefined) {
        filtered = filtered.filter(log => log.level >= filter.level!)
      }
      if (filter.event) {
        filtered = filtered.filter(log => log.event === filter.event)
      }
      if (filter.userId) {
        filtered = filtered.filter(log => log.userId === filter.userId)
      }
      if (filter.since) {
        const sinceTime = filter.since.toISOString()
        filtered = filtered.filter(log => log.timestamp >= sinceTime)
      }
    }

    return filtered
  }

  // Export logs for analysis
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2)
  }

  // Clear logs
  clearLogs() {
    this.logs = []
  }

  // Subscribe to log events
  subscribe(listener: (entry: AuthLogEntry) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  // Get statistics
  getStats(): {
    totalLogs: number
    byLevel: Record<string, number>
    byEvent: Record<string, number>
    recentErrors: AuthLogEntry[]
  } {
    const byLevel: Record<string, number> = {}
    const byEvent: Record<string, number> = {}

    this.logs.forEach(log => {
      const levelName = LogLevel[log.level]
      byLevel[levelName] = (byLevel[levelName] || 0) + 1
      byEvent[log.event] = (byEvent[log.event] || 0) + 1
    })

    const recentErrors = this.logs.filter(log => log.level === LogLevel.ERROR).slice(-10)

    return {
      totalLogs: this.logs.length,
      byLevel,
      byEvent,
      recentErrors,
    }
  }
}

// Export singleton instance
export const authLogger = AuthLogger.getInstance()
