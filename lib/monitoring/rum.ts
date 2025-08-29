import * as Sentry from '@sentry/nextjs'
import { performanceTracker } from './performance-metrics'

// Real User Monitoring configuration
export interface RUMConfig {
  sampleRate: number
  sessionDuration: number
  enableSessionReplay: boolean
  enableUserInteractions: boolean
  enableResourceTiming: boolean
}

// User session data
interface UserSession {
  id: string
  userId?: string
  startTime: number
  lastActivity: number
  pageViews: number
  interactions: number
  errors: number
  device: {
    type: string
    browser: string
    os: string
    viewport: { width: number; height: number }
  }
  connection: {
    type: string
    effectiveType: string
    downlink?: number
    rtt?: number
  }
}

class RealUserMonitoring {
  private config: RUMConfig = {
    sampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    sessionDuration: 30 * 60 * 1000, // 30 minutes
    enableSessionReplay: true,
    enableUserInteractions: true,
    enableResourceTiming: true,
  }
  
  private session: UserSession | null = null
  private interactionObserver: PerformanceObserver | null = null
  private resourceObserver: PerformanceObserver | null = null
  
  // Initialize RUM
  init(config?: Partial<RUMConfig>) {
    if (typeof window === 'undefined') return
    
    // Merge config
    this.config = { ...this.config, ...config }
    
    // Check if user is sampled
    if (Math.random() > this.config.sampleRate) return
    
    // Initialize session
    this.initSession()
    
    // Start observers
    if (this.config.enableUserInteractions) {
      this.observeUserInteractions()
    }
    
    if (this.config.enableResourceTiming) {
      this.observeResourceTiming()
    }
    
    // Track page views
    this.trackPageView()
    
    // Listen for visibility changes
    document.addEventListener('visibilitychange', this.handleVisibilityChange)
    
    // Listen for errors
    window.addEventListener('error', this.handleError)
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection)
    
    // Send session data periodically
    this.startSessionReporting()
  }
  
  // Initialize user session
  private initSession() {
    const sessionId = this.getOrCreateSessionId()
    
    this.session = {
      id: sessionId,
      userId: this.getUserId(),
      startTime: Date.now(),
      lastActivity: Date.now(),
      pageViews: 0,
      interactions: 0,
      errors: 0,
      device: this.getDeviceInfo(),
      connection: this.getConnectionInfo(),
    }
    
    // Set session context in Sentry
    Sentry.setContext('session', {
      id: sessionId,
      startTime: new Date(this.session.startTime).toISOString(),
    })
  }
  
  // Get or create session ID
  private getOrCreateSessionId(): string {
    const stored = sessionStorage.getItem('rum-session-id')
    if (stored) {
      const [id, timestamp] = stored.split(':')
      const age = Date.now() - parseInt(timestamp)
      
      if (age < this.config.sessionDuration) {
        return id
      }
    }
    
    const newId = this.generateSessionId()
    sessionStorage.setItem('rum-session-id', `${newId}:${Date.now()}`)
    return newId
  }
  
  // Generate unique session ID
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
  
  // Get user ID if available
  private getUserId(): string | undefined {
    try {
      // Try to get from Sentry context using modern API
      const client = Sentry.getClient()
      if (client) {
        return Sentry.getCurrentScope().getUser()?.id
      }
    } catch (error) {
      // Ignore Sentry errors
    }
    return undefined
  }
  
  // Get device information
  private getDeviceInfo() {
    const ua = navigator.userAgent
    const mobile = /Mobile|Android|iPhone|iPad/i.test(ua)
    
    return {
      type: mobile ? 'mobile' : 'desktop',
      browser: this.getBrowserName(),
      os: this.getOSName(),
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
    }
  }
  
  // Get browser name
  private getBrowserName(): string {
    const ua = navigator.userAgent
    if (ua.includes('Chrome')) return 'Chrome'
    if (ua.includes('Firefox')) return 'Firefox'
    if (ua.includes('Safari')) return 'Safari'
    if (ua.includes('Edge')) return 'Edge'
    return 'Unknown'
  }
  
  // Get OS name
  private getOSName(): string {
    const ua = navigator.userAgent
    if (ua.includes('Windows')) return 'Windows'
    if (ua.includes('Mac')) return 'macOS'
    if (ua.includes('Linux')) return 'Linux'
    if (ua.includes('Android')) return 'Android'
    if (ua.includes('iOS')) return 'iOS'
    return 'Unknown'
  }
  
  // Get connection information
  private getConnectionInfo() {
    const nav = navigator as any
    const connection = nav.connection || nav.mozConnection || nav.webkitConnection
    
    return {
      type: connection?.type || 'unknown',
      effectiveType: connection?.effectiveType || 'unknown',
      downlink: connection?.downlink,
      rtt: connection?.rtt,
    }
  }
  
  // Track page view
  trackPageView(customData?: Record<string, any>) {
    if (!this.session) return
    
    this.session.pageViews++
    this.session.lastActivity = Date.now()
    
    const pageViewData = {
      url: window.location.href,
      title: document.title,
      referrer: document.referrer,
      timestamp: new Date().toISOString(),
      sessionId: this.session.id,
      ...customData,
    }
    
    // Send to Sentry
    Sentry.addBreadcrumb({
      category: 'navigation',
      message: `Page view: ${pageViewData.title}`,
      level: 'info',
      data: pageViewData,
    })
    
    // Send to analytics
    this.sendEvent('page_view', pageViewData)
  }
  
  // Observe user interactions
  private observeUserInteractions() {
    if (!window.PerformanceObserver) return
    
    try {
      this.interactionObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const interaction = entry as any
          
          if (this.session) {
            this.session.interactions++
            this.session.lastActivity = Date.now()
          }
          
          // Track slow interactions
          if (interaction.duration > 100) {
            Sentry.addBreadcrumb({
              category: 'ui.interaction',
              message: `Slow interaction: ${interaction.name}`,
              level: 'warning',
              data: {
                duration: interaction.duration,
                target: interaction.target,
                type: interaction.name,
              },
            })
          }
        }
      })
      
      this.interactionObserver.observe({ 
        entryTypes: ['event', 'first-input'] 
      })
    } catch (error) {
      // Observer not supported
    }
  }
  
  // Observe resource timing
  private observeResourceTiming() {
    if (!window.PerformanceObserver) return
    
    try {
      this.resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const resource = entry as PerformanceResourceTiming
          
          // Track slow resources
          if (resource.duration > 1000) {
            const resourceType = this.getResourceType(resource.name)
            
            Sentry.addBreadcrumb({
              category: 'resource',
              message: `Slow resource: ${resourceType}`,
              level: 'warning',
              data: {
                url: resource.name,
                duration: resource.duration,
                type: resourceType,
                size: resource.transferSize,
              },
            })
          }
        }
      })
      
      this.resourceObserver.observe({ entryTypes: ['resource'] })
    } catch (error) {
      // Observer not supported
    }
  }
  
  // Get resource type from URL
  private getResourceType(url: string): string {
    if (/\.(js|mjs)$/i.test(url)) return 'script'
    if (/\.(css)$/i.test(url)) return 'stylesheet'
    if (/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url)) return 'image'
    if (/\.(woff|woff2|ttf|otf)$/i.test(url)) return 'font'
    if (/\/api\//i.test(url)) return 'api'
    return 'other'
  }
  
  // Handle visibility change
  private handleVisibilityChange = () => {
    if (!this.session) return
    
    if (document.hidden) {
      // Page hidden - pause session
      this.sendSessionUpdate()
    } else {
      // Page visible - resume session
      this.session.lastActivity = Date.now()
    }
  }
  
  // Handle errors
  private handleError = (event: ErrorEvent) => {
    if (!this.session) return
    
    this.session.errors++
    
    this.sendEvent('error', {
      message: event.message,
      source: event.filename,
      line: event.lineno,
      column: event.colno,
      stack: event.error?.stack,
      sessionId: this.session.id,
    })
  }
  
  // Handle unhandled promise rejections
  private handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    if (!this.session) return
    
    this.session.errors++
    
    this.sendEvent('unhandled_rejection', {
      reason: event.reason,
      sessionId: this.session.id,
    })
  }
  
  // Send event to analytics
  private async sendEvent(eventType: string, data: any) {
    try {
      await fetch('/api/analytics/realtime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: `rum_${eventType}`,
          eventData: data,
        }),
      })
    } catch (error) {
      // Ignore errors - this is best effort
    }
  }
  
  // Send session update
  private async sendSessionUpdate() {
    if (!this.session) return
    
    const sessionData = {
      ...this.session,
      duration: Date.now() - this.session.startTime,
      performance: performanceTracker.getPerformanceSummary(),
    }
    
    await this.sendEvent('session_update', sessionData)
  }
  
  // Start session reporting
  private startSessionReporting() {
    // Send updates every minute
    setInterval(() => {
      if (this.session && !document.hidden) {
        const sessionAge = Date.now() - this.session.startTime
        
        if (sessionAge > this.config.sessionDuration) {
          // Session expired - create new one
          this.initSession()
        } else {
          // Send update
          this.sendSessionUpdate()
        }
      }
    }, 60 * 1000)
    
    // Send final update on unload
    window.addEventListener('beforeunload', () => {
      this.sendSessionUpdate()
    })
  }
  
  // Clean up
  destroy() {
    this.interactionObserver?.disconnect()
    this.resourceObserver?.disconnect()
    document.removeEventListener('visibilitychange', this.handleVisibilityChange)
    window.removeEventListener('error', this.handleError)
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection)
  }
}

// Singleton instance
export const rum = new RealUserMonitoring()

// Initialize RUM
export function initRUM(config?: Partial<RUMConfig>) {
  if (typeof window !== 'undefined') {
    rum.init(config)
  }
}