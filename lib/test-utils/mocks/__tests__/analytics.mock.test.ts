import {
  MockAnalyticsAPI,
  MockMetricsCollector,
  MockRealtimeAnalytics,
  MockVercelAnalytics,
  MockGoogleAnalytics,
  MockAnalyticsBatcher,
  createMockAnalyticsEvent,
  createMockPageView,
  createMockUserSession,
  generateTimeSeriesData
} from '../analytics.mock'

describe('Analytics Mock Infrastructure', () => {
  describe('MockAnalyticsAPI', () => {
    let analytics: MockAnalyticsAPI

    beforeEach(() => {
      analytics = new MockAnalyticsAPI('test-user-123')
    })

    it('should initialize with a session', () => {
      const session = analytics.getCurrentSession()
      expect(session).toBeDefined()
      expect(session?.userId).toBe('test-user-123')
      expect(session?.pageViews).toBe(0)
      expect(session?.events).toBe(0)
    })

    it('should track custom events', () => {
      analytics.track('button_click', { button: 'submit' })
      
      const events = analytics.getEvents()
      expect(events).toHaveLength(1)
      expect(events[0].name).toBe('button_click')
      expect(events[0].properties).toEqual({ button: 'submit' })
      expect(events[0].category).toBe('custom')
      expect(events[0].userId).toBe('test-user-123')
    })

    it('should track page views', () => {
      analytics.pageView('/dashboard', 'Dashboard')
      
      const pageViews = analytics.getPageViews()
      expect(pageViews).toHaveLength(1)
      expect(pageViews[0].path).toBe('/dashboard')
      expect(pageViews[0].title).toBe('Dashboard')
      
      // Should also create a page_view event
      const events = analytics.getEvents()
      expect(events).toHaveLength(1)
      expect(events[0].name).toBe('page_view')
    })

    it('should record web vitals', () => {
      analytics.webVitals({
        LCP: 2500,
        FID: 100,
        CLS: 0.1
      })
      
      const events = analytics.getEvents()
      expect(events).toHaveLength(1)
      expect(events[0].name).toBe('web_vitals')
      expect(events[0].category).toBe('performance')
      expect(events[0].properties).toMatchObject({
        LCP: 2500,
        FID: 100,
        CLS: 0.1
      })
    })

    it('should update session counters', () => {
      analytics.track('test_event')
      analytics.pageView('/test')
      
      const session = analytics.getCurrentSession()
      expect(session?.events).toBe(2) // track + pageView event
      expect(session?.pageViews).toBe(1)
    })

    it('should handle user ID changes', () => {
      analytics.setUser('new-user-456')
      
      const session = analytics.getCurrentSession()
      expect(session?.userId).toBe('new-user-456')
      
      analytics.track('test_event')
      const events = analytics.getEvents()
      expect(events[0].userId).toBe('new-user-456')
    })

    it('should end session properly', () => {
      const session = analytics.getCurrentSession()
      const startTime = session?.startTime
      
      // Wait a bit to have duration
      jest.useFakeTimers()
      jest.advanceTimersByTime(1000)
      
      analytics.endSession()
      
      const endedSession = analytics.getCurrentSession()
      expect(endedSession?.endTime).toBeDefined()
      expect(endedSession?.duration).toBeGreaterThan(0)
      
      jest.useRealTimers()
    })

    it('should clear all data', () => {
      analytics.track('event1')
      analytics.pageView('/page1')
      
      analytics.clear()
      
      expect(analytics.getEvents()).toHaveLength(0)
      expect(analytics.getPageViews()).toHaveLength(0)
      expect(analytics.getCurrentSession()?.events).toBe(0)
    })
  })

  describe('MockMetricsCollector', () => {
    let collector: MockMetricsCollector

    beforeEach(() => {
      collector = new MockMetricsCollector()
    })

    it('should generate realistic good metrics', () => {
      const metrics = collector.generateRealisticMetrics('good')
      
      expect(metrics.LCP).toBeLessThanOrEqual(2500)
      expect(metrics.FID).toBeLessThanOrEqual(100)
      expect(metrics.CLS).toBeLessThanOrEqual(0.1)
      expect(metrics.TTFB).toBeLessThanOrEqual(800)
      expect(metrics.FCP).toBeLessThanOrEqual(1800)
      expect(metrics.INP).toBeLessThanOrEqual(200)
    })

    it('should generate realistic poor metrics', () => {
      const metrics = collector.generateRealisticMetrics('poor')
      
      expect(metrics.LCP).toBeGreaterThanOrEqual(4000)
      expect(metrics.FID).toBeGreaterThanOrEqual(300)
      expect(metrics.CLS).toBeGreaterThanOrEqual(0.25)
      expect(metrics.TTFB).toBeGreaterThanOrEqual(1800)
      expect(metrics.FCP).toBeGreaterThanOrEqual(3000)
      expect(metrics.INP).toBeGreaterThanOrEqual(500)
    })

    it('should collect individual metrics', () => {
      collector.collect('LCP', 2000)
      collector.collect('FID', 50)
      collector.collect('CLS', 0.05)
      
      const metrics = collector.getMetrics()
      expect(metrics.LCP).toBe(2000)
      expect(metrics.FID).toBe(50)
      expect(metrics.CLS).toBe(0.05)
    })

    it('should reset metrics', () => {
      collector.collect('LCP', 2000)
      collector.reset()
      
      const metrics = collector.getMetrics()
      expect(metrics.LCP).toBe(0)
      expect(metrics.FID).toBe(0)
    })
  })

  describe('MockRealtimeAnalytics', () => {
    let analytics: MockAnalyticsAPI
    let realtime: MockRealtimeAnalytics

    beforeEach(() => {
      analytics = new MockAnalyticsAPI()
      realtime = new MockRealtimeAnalytics(analytics)
    })

    it('should provide real-time data', () => {
      // Add some recent data
      analytics.pageView('/dashboard')
      analytics.pageView('/reports')
      analytics.track('button_click')
      
      const data = realtime.getData()
      
      expect(data.pageViews).toBe(2)
      expect(data.events).toBe(3) // 2 page views + 1 custom event
      expect(data.topPages).toHaveLength(2)
      expect(data.activeUsers).toBeGreaterThan(0)
    })

    it('should filter by time window', () => {
      // Add old event (outside 5 minute window)
      const oldEvent = createMockAnalyticsEvent({
        timestamp: Date.now() - 10 * 60 * 1000 // 10 minutes ago
      })
      analytics['events'].push(oldEvent)
      
      // Add recent event
      analytics.track('recent_event')
      
      const data = realtime.getData()
      expect(data.events).toBe(1) // Only recent event
    })

    it('should simulate updates', () => {
      const data1 = realtime.simulateUpdate()
      const data2 = realtime.simulateUpdate()
      
      // Data should change between updates
      expect(data2.events + data2.pageViews).toBeGreaterThanOrEqual(
        data1.events + data1.pageViews
      )
    })
  })

  describe('Mock Integrations', () => {
    let analytics: MockAnalyticsAPI

    beforeEach(() => {
      analytics = new MockAnalyticsAPI()
    })

    describe('MockVercelAnalytics', () => {
      it('should track events with Vercel source', () => {
        const vercel = new MockVercelAnalytics(analytics)
        
        vercel.track('conversion', { value: 100 })
        
        const events = analytics.getEvents()
        expect(events[0].properties?.source).toBe('vercel')
        expect(events[0].category).toBe('vercel')
      })

      it('should track page views', () => {
        const vercel = new MockVercelAnalytics(analytics)
        
        vercel.pageview({ path: '/pricing' })
        
        const pageViews = analytics.getPageViews()
        expect(pageViews[0].path).toBe('/pricing')
        expect(pageViews[0].utm?.source).toBe('vercel')
      })
    })

    describe('MockGoogleAnalytics', () => {
      it('should handle gtag event command', () => {
        const ga = new MockGoogleAnalytics(analytics, 'G-TEST123')
        
        ga.gtag('event', 'purchase', { value: 50, currency: 'USD' })
        
        const events = analytics.getEvents()
        expect(events[0].name).toBe('purchase')
        expect(events[0].properties?.value).toBe(50)
        expect(events[0].properties?.ga_measurement_id).toBe('G-TEST123')
      })

      it('should handle gtag config command', () => {
        const ga = new MockGoogleAnalytics(analytics)
        
        ga.gtag('config', 'G-TEST123', {
          page_path: '/checkout',
          page_title: 'Checkout'
        })
        
        const pageViews = analytics.getPageViews()
        expect(pageViews[0].path).toBe('/checkout')
        expect(pageViews[0].title).toBe('Checkout')
      })

      it('should handle gtag set command', () => {
        const ga = new MockGoogleAnalytics(analytics)
        
        ga.gtag('set', { user_id: 'ga-user-789' })
        
        analytics.track('test') // Track event to verify user ID
        const events = analytics.getEvents()
        expect(events[0].userId).toBe('ga-user-789')
      })
    })
  })

  describe('MockAnalyticsBatcher', () => {
    let batchedEvents: any[][] = []
    let batcher: MockAnalyticsBatcher

    beforeEach(() => {
      batchedEvents = []
      batcher = new MockAnalyticsBatcher(3, 1000, (events) => {
        batchedEvents.push(events)
      })
      jest.useFakeTimers()
    })

    afterEach(() => {
      batcher.stop()
      jest.useRealTimers()
    })

    it('should batch events by size', () => {
      const event1 = createMockAnalyticsEvent({ name: 'event1' })
      const event2 = createMockAnalyticsEvent({ name: 'event2' })
      const event3 = createMockAnalyticsEvent({ name: 'event3' })
      
      batcher.add(event1)
      batcher.add(event2)
      expect(batchedEvents).toHaveLength(0)
      
      batcher.add(event3) // Triggers flush
      expect(batchedEvents).toHaveLength(1)
      expect(batchedEvents[0]).toHaveLength(3)
    })

    it('should flush on interval', () => {
      jest.useFakeTimers()
      
      // Create a new batcher with fake timers active
      let testBatchedEvents: any[][] = []
      const testBatcher = new MockAnalyticsBatcher(3, 1000, (events) => {
        testBatchedEvents.push(events)
      })
      
      const event = createMockAnalyticsEvent()
      
      testBatcher.add(event)
      expect(testBatchedEvents).toHaveLength(0)
      
      jest.advanceTimersByTime(1000)
      expect(testBatchedEvents).toHaveLength(1)
      expect(testBatchedEvents[0]).toHaveLength(1)
      
      testBatcher.stop()
      jest.useRealTimers()
    })

    it('should flush remaining on stop', () => {
      batcher.add(createMockAnalyticsEvent())
      batcher.add(createMockAnalyticsEvent())
      
      expect(batchedEvents).toHaveLength(0)
      
      batcher.stop()
      expect(batchedEvents).toHaveLength(1)
      expect(batchedEvents[0]).toHaveLength(2)
    })
  })

  describe('Factory Functions', () => {
    it('should create mock analytics event', () => {
      const event = createMockAnalyticsEvent({
        name: 'custom_event',
        userId: 'test-user'
      })
      
      expect(event.name).toBe('custom_event')
      expect(event.userId).toBe('test-user')
      expect(event.timestamp).toBeDefined()
      expect(event.sessionId).toBeDefined()
    })

    it('should create mock page view', () => {
      const pageView = createMockPageView({
        path: '/custom-page',
        utm: { source: 'email', medium: 'newsletter' }
      })
      
      expect(pageView.path).toBe('/custom-page')
      expect(pageView.utm?.source).toBe('email')
      expect(pageView.utm?.medium).toBe('newsletter')
    })

    it('should create mock user session', () => {
      const session = createMockUserSession({
        device: 'mobile',
        country: 'KR'
      })
      
      expect(session.device).toBe('mobile')
      expect(session.country).toBe('KR')
      expect(session.duration).toBeGreaterThan(0)
    })
  })

  describe('Time Series Data Generation', () => {
    it('should generate time series data', () => {
      const data = generateTimeSeriesData(
        24, // 24 hours
        1,  // 1 hour interval
        (timestamp) => Math.sin(timestamp / 1000000) * 100 + 100
      )
      
      expect(data).toHaveLength(24)
      expect(data[0].timestamp).toBeLessThan(data[23].timestamp)
      expect(data[0].value).toBeDefined()
      expect(data[0].label).toBeDefined()
    })

    it('should support custom intervals', () => {
      const data = generateTimeSeriesData(
        24,
        6, // 6 hour intervals
        () => Math.random() * 100
      )
      
      expect(data).toHaveLength(4) // 24 / 6
    })
  })
})