/**
 * Analytics API Mock Infrastructure
 * 
 * Provides comprehensive mocks for testing analytics features including:
 * - Event tracking and page views
 * - Web Vitals (Core Web Vitals metrics)
 * - Real-time analytics data
 * - Time-series data for charts
 * - Integration with Vercel Analytics and Google Analytics
 */

import { faker } from '@faker-js/faker'

// Core Web Vitals types
export interface WebVitalsMetrics {
  LCP: number  // Largest Contentful Paint (ms)
  FID: number  // First Input Delay (ms)
  CLS: number  // Cumulative Layout Shift (score)
  TTFB: number // Time to First Byte (ms)
  FCP: number  // First Contentful Paint (ms)
  INP: number  // Interaction to Next Paint (ms)
}

// Analytics event types
export interface AnalyticsEvent {
  name: string
  category: string
  properties?: Record<string, unknown>
  timestamp: number
  userId?: string
  sessionId: string
  metadata?: {
    page?: string
    referrer?: string
    userAgent?: string
    viewport?: { width: number; height: number }
  }
}

// Page view data
export interface PageView {
  path: string
  title: string
  timestamp: number
  duration?: number
  sessionId: string
  userId?: string
  referrer?: string
  utm?: {
    source?: string
    medium?: string
    campaign?: string
    term?: string
    content?: string
  }
}

// Real-time analytics data
export interface RealtimeAnalytics {
  activeUsers: number
  pageViews: number
  events: number
  topPages: Array<{ path: string; views: number }>
  topReferrers: Array<{ domain: string; count: number }>
  devices: {
    desktop: number
    mobile: number
    tablet: number
  }
}

// User session
export interface UserSession {
  id: string
  userId?: string
  startTime: number
  endTime?: number
  pageViews: number
  events: number
  duration: number
  device: 'desktop' | 'mobile' | 'tablet'
  browser: string
  os: string
  country?: string
  city?: string
}

// Time series data point
export interface TimeSeriesDataPoint {
  timestamp: number
  value: number
  label?: string
}

// Analytics API mock
export class MockAnalyticsAPI {
  private events: AnalyticsEvent[] = []
  private pageViews: PageView[] = []
  private sessions: Map<string, UserSession> = new Map()
  private currentSessionId: string
  private userId?: string

  constructor(userId?: string) {
    this.userId = userId
    this.currentSessionId = faker.string.uuid()
    this.initializeSession()
  }

  private initializeSession() {
    const session: UserSession = {
      id: this.currentSessionId,
      userId: this.userId,
      startTime: Date.now(),
      pageViews: 0,
      events: 0,
      duration: 0,
      device: faker.helpers.arrayElement(['desktop', 'mobile', 'tablet']),
      browser: faker.helpers.arrayElement(['Chrome', 'Safari', 'Firefox', 'Edge']),
      os: faker.helpers.arrayElement(['Windows', 'macOS', 'iOS', 'Android', 'Linux'])
    }
    this.sessions.set(this.currentSessionId, session)
  }

  // Track custom event
  track(eventName: string, properties?: Record<string, unknown>, category = 'custom'): void {
    const event: AnalyticsEvent = {
      name: eventName,
      category,
      properties,
      timestamp: Date.now(),
      userId: this.userId,
      sessionId: this.currentSessionId,
      metadata: {
        page: typeof window !== 'undefined' ? window.location.pathname : undefined,
        referrer: typeof document !== 'undefined' ? document.referrer : undefined,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        viewport: typeof window !== 'undefined' ? {
          width: window.innerWidth,
          height: window.innerHeight
        } : undefined
      }
    }

    this.events.push(event)
    
    // Update session
    const session = this.sessions.get(this.currentSessionId)
    if (session) {
      session.events++
    }
  }

  // Track page view
  pageView(path: string, title?: string, options?: Partial<PageView>): void {
    const pageView: PageView = {
      path,
      title: title || path,
      timestamp: Date.now(),
      sessionId: this.currentSessionId,
      userId: this.userId,
      referrer: typeof document !== 'undefined' ? document.referrer : undefined,
      ...options
    }

    this.pageViews.push(pageView)

    // Update session
    const session = this.sessions.get(this.currentSessionId)
    if (session) {
      session.pageViews++
    }

    // Also track as event
    this.track('page_view', { path, title }, 'navigation')
  }

  // Record web vitals
  webVitals(metrics: Partial<WebVitalsMetrics>): void {
    const vitalsEvent = {
      LCP: metrics.LCP,
      FID: metrics.FID,
      CLS: metrics.CLS,
      TTFB: metrics.TTFB,
      FCP: metrics.FCP,
      INP: metrics.INP
    }

    this.track('web_vitals', vitalsEvent, 'performance')
  }

  // Get all events
  getEvents(): AnalyticsEvent[] {
    return [...this.events]
  }

  // Get page views
  getPageViews(): PageView[] {
    return [...this.pageViews]
  }

  // Get current session
  getCurrentSession(): UserSession | undefined {
    return this.sessions.get(this.currentSessionId)
  }

  // Set user ID
  setUser(userId: string): void {
    this.userId = userId
    const session = this.sessions.get(this.currentSessionId)
    if (session) {
      session.userId = userId
    }
  }

  // End current session
  endSession(): void {
    const session = this.sessions.get(this.currentSessionId)
    if (session) {
      session.endTime = Date.now()
      session.duration = session.endTime - session.startTime
    }
  }

  // Clear all data
  clear(): void {
    this.events = []
    this.pageViews = []
    this.sessions.clear()
    this.initializeSession()
  }
}

// Metrics collector for web vitals
export class MockMetricsCollector {
  private metrics: WebVitalsMetrics = {
    LCP: 0,
    FID: 0,
    CLS: 0,
    TTFB: 0,
    FCP: 0,
    INP: 0
  }

  // Generate realistic web vitals
  generateRealisticMetrics(performance: 'good' | 'needs-improvement' | 'poor' = 'good'): WebVitalsMetrics {
    const ranges = {
      good: {
        LCP: { min: 0, max: 2500 },
        FID: { min: 0, max: 100 },
        CLS: { min: 0, max: 0.1 },
        TTFB: { min: 0, max: 800 },
        FCP: { min: 0, max: 1800 },
        INP: { min: 0, max: 200 }
      },
      'needs-improvement': {
        LCP: { min: 2500, max: 4000 },
        FID: { min: 100, max: 300 },
        CLS: { min: 0.1, max: 0.25 },
        TTFB: { min: 800, max: 1800 },
        FCP: { min: 1800, max: 3000 },
        INP: { min: 200, max: 500 }
      },
      poor: {
        LCP: { min: 4000, max: 8000 },
        FID: { min: 300, max: 1000 },
        CLS: { min: 0.25, max: 0.5 },
        TTFB: { min: 1800, max: 3000 },
        FCP: { min: 3000, max: 5000 },
        INP: { min: 500, max: 1000 }
      }
    }

    const range = ranges[performance]

    return {
      LCP: faker.number.int(range.LCP),
      FID: faker.number.int(range.FID),
      CLS: faker.number.float({ min: range.CLS.min, max: range.CLS.max, precision: 0.001 }),
      TTFB: faker.number.int(range.TTFB),
      FCP: faker.number.int(range.FCP),
      INP: faker.number.int(range.INP)
    }
  }

  // Collect metric
  collect(metric: keyof WebVitalsMetrics, value: number): void {
    this.metrics[metric] = value
  }

  // Get all metrics
  getMetrics(): WebVitalsMetrics {
    return { ...this.metrics }
  }

  // Reset metrics
  reset(): void {
    this.metrics = {
      LCP: 0,
      FID: 0,
      CLS: 0,
      TTFB: 0,
      FCP: 0,
      INP: 0
    }
  }
}

// Real-time analytics mock
export class MockRealtimeAnalytics {
  private analytics: MockAnalyticsAPI

  constructor(analytics: MockAnalyticsAPI) {
    this.analytics = analytics
  }

  // Get real-time data
  getData(): RealtimeAnalytics {
    const events = this.analytics.getEvents()
    const pageViews = this.analytics.getPageViews()
    const recentCutoff = Date.now() - 5 * 60 * 1000 // Last 5 minutes

    const recentEvents = events.filter(e => e.timestamp > recentCutoff)
    const recentPageViews = pageViews.filter(pv => pv.timestamp > recentCutoff)

    // Count top pages
    const pageCounts = new Map<string, number>()
    recentPageViews.forEach(pv => {
      pageCounts.set(pv.path, (pageCounts.get(pv.path) || 0) + 1)
    })
    const topPages = Array.from(pageCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([path, views]) => ({ path, views }))

    // Mock referrers
    const topReferrers = [
      { domain: 'google.com', count: faker.number.int({ min: 10, max: 100 }) },
      { domain: 'direct', count: faker.number.int({ min: 5, max: 50 }) },
      { domain: 'facebook.com', count: faker.number.int({ min: 1, max: 20 }) }
    ]

    return {
      activeUsers: faker.number.int({ min: 1, max: 50 }),
      pageViews: recentPageViews.length,
      events: recentEvents.length,
      topPages,
      topReferrers,
      devices: {
        desktop: faker.number.int({ min: 40, max: 60 }),
        mobile: faker.number.int({ min: 30, max: 50 }),
        tablet: faker.number.int({ min: 5, max: 15 })
      }
    }
  }

  // Simulate real-time update
  simulateUpdate(): RealtimeAnalytics {
    // Add some random events and page views
    const paths = ['/dashboard', '/dashboard/daily-reports', '/dashboard/documents', '/dashboard/notifications']
    const eventNames = ['button_click', 'form_submit', 'file_upload', 'search']

    if (faker.datatype.boolean({ probability: 0.7 })) {
      this.analytics.pageView(faker.helpers.arrayElement(paths))
    }

    if (faker.datatype.boolean({ probability: 0.5 })) {
      this.analytics.track(faker.helpers.arrayElement(eventNames), {
        value: faker.number.int({ min: 1, max: 100 })
      })
    }

    return this.getData()
  }
}

// Factory functions for test data

export function createMockAnalyticsEvent(overrides?: Partial<AnalyticsEvent>): AnalyticsEvent {
  return {
    name: faker.helpers.arrayElement(['button_click', 'form_submit', 'page_view', 'file_download']),
    category: faker.helpers.arrayElement(['interaction', 'navigation', 'conversion', 'custom']),
    properties: {
      value: faker.number.int({ min: 1, max: 100 }),
      label: faker.lorem.word()
    },
    timestamp: faker.date.recent().getTime(),
    sessionId: faker.string.uuid(),
    metadata: {
      page: faker.helpers.arrayElement(['/dashboard', '/login', '/reports', '/settings']),
      referrer: faker.helpers.arrayElement(['', 'https://google.com', 'https://app.com']),
      userAgent: 'Mozilla/5.0 (test)',
      viewport: { width: 1920, height: 1080 }
    },
    ...overrides
  }
}

export function createMockPageView(overrides?: Partial<PageView>): PageView {
  const paths = [
    '/dashboard',
    '/dashboard/daily-reports',
    '/dashboard/documents',
    '/dashboard/attendance',
    '/dashboard/notifications'
  ]

  return {
    path: faker.helpers.arrayElement(paths),
    title: faker.lorem.words(3),
    timestamp: faker.date.recent().getTime(),
    duration: faker.number.int({ min: 1000, max: 60000 }),
    sessionId: faker.string.uuid(),
    referrer: faker.helpers.arrayElement(['', 'https://google.com', 'https://inopnc.com']),
    utm: faker.datatype.boolean({ probability: 0.3 }) ? {
      source: faker.helpers.arrayElement(['google', 'facebook', 'email']),
      medium: faker.helpers.arrayElement(['cpc', 'organic', 'referral']),
      campaign: faker.lorem.word()
    } : undefined,
    ...overrides
  }
}

export function createMockUserSession(overrides?: Partial<UserSession>): UserSession {
  const startTime = faker.date.recent({ days: 1 }).getTime()
  const duration = faker.number.int({ min: 60000, max: 1800000 }) // 1-30 minutes

  return {
    id: faker.string.uuid(),
    userId: faker.datatype.boolean({ probability: 0.7 }) ? faker.string.uuid() : undefined,
    startTime,
    endTime: startTime + duration,
    pageViews: faker.number.int({ min: 1, max: 20 }),
    events: faker.number.int({ min: 0, max: 50 }),
    duration,
    device: faker.helpers.arrayElement(['desktop', 'mobile', 'tablet']),
    browser: faker.helpers.arrayElement(['Chrome', 'Safari', 'Firefox', 'Edge']),
    os: faker.helpers.arrayElement(['Windows', 'macOS', 'iOS', 'Android']),
    country: faker.location.countryCode(),
    city: faker.location.city(),
    ...overrides
  }
}

// Generate time series data for charts
export function generateTimeSeriesData(
  hours = 24,
  interval = 1, // hours
  generator: (timestamp: number) => number
): TimeSeriesDataPoint[] {
  const data: TimeSeriesDataPoint[] = []
  const now = Date.now()
  const startTime = now - hours * 60 * 60 * 1000

  for (let i = 0; i < hours; i += interval) {
    const timestamp = startTime + i * 60 * 60 * 1000
    data.push({
      timestamp,
      value: generator(timestamp),
      label: new Date(timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    })
  }

  return data
}

// Mock integration adapters

export class MockVercelAnalytics {
  private analytics: MockAnalyticsAPI

  constructor(analytics: MockAnalyticsAPI) {
    this.analytics = analytics
  }

  track(eventName: string, properties?: Record<string, unknown>): void {
    this.analytics.track(eventName, { ...properties, source: 'vercel' }, 'vercel')
  }

  pageview(options?: { path?: string }): void {
    const path = options?.path || (typeof window !== 'undefined' ? window.location.pathname : '/')
    this.analytics.pageView(path, undefined, { utm: { source: 'vercel' } })
  }
}

export class MockGoogleAnalytics {
  private analytics: MockAnalyticsAPI
  private measurementId: string

  constructor(analytics: MockAnalyticsAPI, measurementId = 'G-XXXXXXXXXX') {
    this.analytics = analytics
    this.measurementId = measurementId
  }

  gtag(command: string, ...args: unknown[]): void {
    switch (command) {
      case 'event':
        const [eventName, parameters] = args
        this.analytics.track(eventName, { ...parameters, ga_measurement_id: this.measurementId }, 'google')
        break
      
      case 'config':
        const [, config] = args
        if (config?.page_path) {
          this.analytics.pageView(config.page_path, config.page_title)
        }
        break
      
      case 'set':
        const [properties] = args
        if (properties.user_id) {
          this.analytics.setUser(properties.user_id)
        }
        break
    }
  }
}

// Event batching for analytics
export class MockAnalyticsBatcher {
  private queue: AnalyticsEvent[] = []
  private batchSize: number
  private flushInterval: number
  private timer?: NodeJS.Timeout
  private onFlush: (events: AnalyticsEvent[]) => void

  constructor(
    batchSize = 10,
    flushInterval = 5000,
    onFlush: (events: AnalyticsEvent[]) => void
  ) {
    this.batchSize = batchSize
    this.flushInterval = flushInterval
    this.onFlush = onFlush
    this.startTimer()
  }

  add(event: AnalyticsEvent): void {
    this.queue.push(event)
    
    if (this.queue.length >= this.batchSize) {
      this.flush()
    }
  }

  flush(): void {
    if (this.queue.length === 0) return

    const events = [...this.queue]
    this.queue = []
    this.onFlush(events)
    
    this.resetTimer()
  }

  private startTimer(): void {
    this.timer = setTimeout(() => this.flush(), this.flushInterval)
  }

  private resetTimer(): void {
    if (this.timer) clearTimeout(this.timer)
    this.startTimer()
  }

  stop(): void {
    if (this.timer) clearTimeout(this.timer)
    this.flush()
  }
}