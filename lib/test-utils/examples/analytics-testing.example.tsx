/**
 * Analytics Testing Examples
 * 
 * This file demonstrates how to use the analytics testing infrastructure
 * for testing analytics features in your application.
 */

import React, { useState, useEffect } from 'react'

// Example 1: Testing basic event tracking
export function testEventTracking() {
  const analytics = new MockAnalyticsAPI('user-123')

  const EventTracker = () => {
    const [events, setEvents] = useState<any[]>([])

    const trackEvent = (eventName: string, properties?: unknown) => {
      analytics.track(eventName, properties)
      setEvents(analytics.getEvents())
    }

    return (
      <div>
        <button onClick={() => trackEvent('button_click', { button: 'submit' })}>
          Click to Track
        </button>
        <p>Events tracked: {events.length}</p>
      </div>
    )
  }

  const { getByText } = render(<EventTracker />)
  
  expect(getByText('Events tracked: 0')).toBeInTheDocument()
  
  fireEvent.click(getByText('Click to Track'))
  
  expect(getByText('Events tracked: 1')).toBeInTheDocument()
  
  // Verify event details
  const events = analytics.getEvents()
  expect(events[0].name).toBe('button_click')
  expect(events[0].properties?.button).toBe('submit')
}

// Example 2: Testing page view tracking
export function testPageViewTracking() {
  const analytics = new MockAnalyticsAPI()

  const PageTracker = () => {
    const [pageViews, setPageViews] = useState<any[]>([])

    useEffect(() => {
      analytics.pageView('/dashboard', 'Dashboard')
      setPageViews(analytics.getPageViews())
    }, [])

    const navigateToPage = (path: string, title: string) => {
      analytics.pageView(path, title)
      setPageViews(analytics.getPageViews())
    }

    return (
      <div>
        <p>Page views: {pageViews.length}</p>
        <button onClick={() => navigateToPage('/reports', 'Reports')}>
          Go to Reports
        </button>
        {pageViews.map((pv, idx) => (
          <div key={idx}>{pv.path} - {pv.title}</div>
        ))}
      </div>
    )
  }

  const { getByText } = render(<PageTracker />)
  
  // Initial page view
  expect(getByText('Page views: 1')).toBeInTheDocument()
  expect(getByText('/dashboard - Dashboard')).toBeInTheDocument()
  
  fireEvent.click(getByText('Go to Reports'))
  
  expect(getByText('Page views: 2')).toBeInTheDocument()
  expect(getByText('/reports - Reports')).toBeInTheDocument()
}

// Example 3: Testing Web Vitals collection
export function testWebVitalsTracking() {
  const analytics = new MockAnalyticsAPI()
  const collector = new MockMetricsCollector()

  const WebVitalsMonitor = () => {
    const [metrics, setMetrics] = useState<unknown>(null)

    const measurePerformance = () => {
      const vitals = collector.generateRealisticMetrics('good')
      analytics.webVitals(vitals)
      setMetrics(vitals)
    }

    return (
      <div>
        <button onClick={measurePerformance}>Measure Performance</button>
        {metrics && (
          <div>
            <p>LCP: {metrics.LCP}ms</p>
            <p>FID: {metrics.FID}ms</p>
            <p>CLS: {metrics.CLS}</p>
          </div>
        )}
      </div>
    )
  }

  const { getByText } = render(<WebVitalsMonitor />)
  
  fireEvent.click(getByText('Measure Performance'))
  
  // Verify metrics are displayed
  expect(getByText(/LCP: \d+ms/)).toBeInTheDocument()
  expect(getByText(/FID: \d+ms/)).toBeInTheDocument()
  expect(getByText(/CLS: 0\.\d+/)).toBeInTheDocument()
  
  // Verify analytics tracked the vitals
  const events = analytics.getEvents()
  expect(events[0].name).toBe('web_vitals')
  expect(events[0].category).toBe('performance')
}

// Example 4: Testing real-time analytics dashboard
export function testRealtimeAnalyticsDashboard() {
  const analytics = new MockAnalyticsAPI()
  const realtime = new MockRealtimeAnalytics(analytics)

  const RealtimeDashboard = () => {
    const [data, setData] = useState<unknown>(null)

    useEffect(() => {
      // Simulate some activity
      analytics.pageView('/dashboard')
      analytics.pageView('/reports')
      analytics.track('button_click')
      
      const interval = setInterval(() => {
        const newData = realtime.simulateUpdate()
        setData(newData)
      }, 1000)

      return () => clearInterval(interval)
    }, [])

    return (
      <div>
        <h2>Real-time Analytics</h2>
        {data && (
          <div>
            <p>Active Users: {data.activeUsers}</p>
            <p>Page Views: {data.pageViews}</p>
            <p>Events: {data.events}</p>
            <div>
              <h3>Top Pages</h3>
              {data.topPages.map((page: unknown, idx: number) => (
                <div key={idx}>{page.path}: {page.views}</div>
              ))}
            </div>
            <div>
              <h3>Devices</h3>
              <p>Desktop: {data.devices.desktop}%</p>
              <p>Mobile: {data.devices.mobile}%</p>
              <p>Tablet: {data.devices.tablet}%</p>
            </div>
          </div>
        )}
      </div>
    )
  }

  const { getByText } = render(<RealtimeDashboard />)
  
  expect(getByText('Real-time Analytics')).toBeInTheDocument()
  
  // Wait for data to load
  await waitFor(() => {
    expect(getByText(/Active Users: \d+/)).toBeInTheDocument()
    expect(getByText(/Page Views: \d+/)).toBeInTheDocument()
    expect(getByText(/Events: \d+/)).toBeInTheDocument()
  })
}

// Example 5: Testing Vercel Analytics integration
export function testVercelAnalyticsIntegration() {
  const analytics = new MockAnalyticsAPI()
  const vercel = new MockVercelAnalytics(analytics)

  const VercelTracking = () => {
    const trackConversion = () => {
      vercel.track('conversion', { 
        value: 100, 
        currency: 'KRW',
        product: 'premium_subscription'
      })
    }

    const trackPageView = () => {
      vercel.pageview({ path: '/pricing' })
    }

    return (
      <div>
        <button onClick={trackConversion}>Track Conversion</button>
        <button onClick={trackPageView}>Track Page View</button>
      </div>
    )
  }

  const { getByText } = render(<VercelTracking />)
  
  fireEvent.click(getByText('Track Conversion'))
  fireEvent.click(getByText('Track Page View'))
  
  const events = analytics.getEvents()
  const pageViews = analytics.getPageViews()
  
  // Verify Vercel-specific properties
  expect(events[0].category).toBe('vercel')
  expect(events[0].properties?.source).toBe('vercel')
  expect(events[0].properties?.value).toBe(100)
  
  expect(pageViews[0].path).toBe('/pricing')
  expect(pageViews[0].utm?.source).toBe('vercel')
}

// Example 6: Testing Google Analytics integration
export function testGoogleAnalyticsIntegration() {
  const analytics = new MockAnalyticsAPI()
  const ga = new MockGoogleAnalytics(analytics, 'G-CONSTRUCTION')

  const GoogleAnalyticsTracking = () => {
    const trackPurchase = () => {
      ga.gtag('event', 'purchase', {
        transaction_id: 'T12345',
        value: 150000,
        currency: 'KRW',
        items: [
          { item_name: 'Construction Materials', quantity: 1 }
        ]
      })
    }

    const setUser = () => {
      ga.gtag('set', { user_id: 'construction-manager-001' })
    }

    const configPage = () => {
      ga.gtag('config', 'G-CONSTRUCTION', {
        page_path: '/construction-reports',
        page_title: 'Construction Reports'
      })
    }

    return (
      <div>
        <button onClick={trackPurchase}>Track Purchase</button>
        <button onClick={setUser}>Set User ID</button>
        <button onClick={configPage}>Config Page</button>
      </div>
    )
  }

  const { getByText } = render(<GoogleAnalyticsTracking />)
  
  fireEvent.click(getByText('Set User ID'))
  fireEvent.click(getByText('Track Purchase'))
  fireEvent.click(getByText('Config Page'))
  
  const events = analytics.getEvents()
  const pageViews = analytics.getPageViews()
  
  // Verify GA integration
  expect(events[0].name).toBe('purchase')
  expect(events[0].properties?.ga_measurement_id).toBe('G-CONSTRUCTION')
  expect(events[0].properties?.value).toBe(150000)
  expect(events[0].userId).toBe('construction-manager-001')
  
  expect(pageViews[0].path).toBe('/construction-reports')
  expect(pageViews[0].title).toBe('Construction Reports')
}

// Example 7: Testing analytics batching
export function testAnalyticsBatching() {
  let batchedEvents: unknown[] = []
  const batcher = new MockAnalyticsBatcher(
    3, // batch size
    1000, // flush interval
    (events) => { batchedEvents = events }
  )

  const BatchingTest = () => {
    const [batchCount, setBatchCount] = useState(0)

    const addEvent = () => {
      const event = createMockAnalyticsEvent({
        name: 'test_event',
        timestamp: Date.now()
      })
      batcher.add(event)
      
      // Simulate batch processing
      if (batchedEvents.length > 0) {
        setBatchCount(prev => prev + 1)
        batchedEvents = []
      }
    }

    useEffect(() => {
      return () => batcher.stop()
    }, [])

    return (
      <div>
        <button onClick={addEvent}>Add Event</button>
        <p>Batches processed: {batchCount}</p>
      </div>
    )
  }

  const { getByText } = render(<BatchingTest />)
  
  // Add events to trigger batching
  fireEvent.click(getByText('Add Event'))
  fireEvent.click(getByText('Add Event'))
  fireEvent.click(getByText('Add Event')) // Should trigger batch
  
  expect(getByText('Batches processed: 1')).toBeInTheDocument()
}

// Example 8: Testing time series data for charts
export function testTimeSeriesDataGeneration() {
  const ChartComponent = () => {
    const [chartData, setChartData] = useState<any[]>([])

    useEffect(() => {
      // Generate page views over last 24 hours
      const data = generateTimeSeriesData(
        24, // 24 hours
        1,  // 1 hour intervals
        (timestamp) => {
          // Simulate daily pattern with peak during work hours
          const hour = new Date(timestamp).getHours()
          const baseViews = Math.sin((hour - 6) * Math.PI / 12) * 50 + 60
          return Math.max(0, Math.floor(baseViews + Math.random() * 20))
        }
      )
      setChartData(data)
    }, [])

    return (
      <div>
        <h3>Page Views Over Time</h3>
        {chartData.map((point, idx) => (
          <div key={idx}>
            {point.label}: {point.value} views
          </div>
        ))}
      </div>
    )
  }

  const { getByText } = render(<ChartComponent />)
  
  expect(getByText('Page Views Over Time')).toBeInTheDocument()
  
  // Should have 24 data points
  const dataPoints = document.querySelectorAll('div:not(h3)')
  expect(dataPoints.length).toBe(24)
}

// Example 9: Testing performance metrics by page
export function testPerformanceMetricsByPage() {
  const analytics = new MockAnalyticsAPI()
  const collector = new MockMetricsCollector()

  const PerformanceMonitor = () => {
    const [pageMetrics, setPageMetrics] = useState<unknown>({})

    const measurePagePerformance = (page: string, quality: 'good' | 'needs-improvement' | 'poor') => {
      const metrics = collector.generateRealisticMetrics(quality)
      analytics.webVitals(metrics)
      analytics.pageView(page)
      
      setPageMetrics((prev: unknown) => ({
        ...prev,
        [page]: metrics
      }))
    }

    return (
      <div>
        <button onClick={() => measurePagePerformance('/dashboard', 'good')}>
          Dashboard (Good)
        </button>
        <button onClick={() => measurePagePerformance('/reports', 'needs-improvement')}>
          Reports (Needs Improvement)
        </button>
        <button onClick={() => measurePagePerformance('/settings', 'poor')}>
          Settings (Poor)
        </button>
        
        {Object.entries(pageMetrics).map(([page, metrics]: [string, any]) => (
          <div key={page}>
            <h4>{page}</h4>
            <p>LCP: {metrics.LCP}ms</p>
            <p>Performance: {
              metrics.LCP <= 2500 ? '좋음' :
              metrics.LCP <= 4000 ? '개선 필요' : '나쁨'
            }</p>
          </div>
        ))}
      </div>
    )
  }

  const { getByText } = render(<PerformanceMonitor />)
  
  fireEvent.click(getByText('Dashboard (Good)'))
  fireEvent.click(getByText('Reports (Needs Improvement)'))
  
  expect(getByText('/dashboard')).toBeInTheDocument()
  expect(getByText('/reports')).toBeInTheDocument()
  expect(getByText('좋음')).toBeInTheDocument()
  expect(getByText('개선 필요')).toBeInTheDocument()
}

// Example 10: Integration test with all analytics features
export function testCompleteAnalyticsIntegration() {
  const analytics = new MockAnalyticsAPI('integration-user')
  const collector = new MockMetricsCollector()
  const realtime = new MockRealtimeAnalytics(analytics)
  const vercel = new MockVercelAnalytics(analytics)

  // Track various events
  analytics.pageView('/dashboard', 'Dashboard')
  analytics.track('feature_used', { feature: 'daily_reports' })
  
  // Measure performance
  const vitals = collector.generateRealisticMetrics('good')
  analytics.webVitals(vitals)
  
  // Track through Vercel
  vercel.track('conversion', { type: 'subscription' })
  
  // Get real-time data
  const realtimeData = realtime.getData()
  
  // Verify all data is captured
  const events = analytics.getEvents()
  const pageViews = analytics.getPageViews()
  const session = analytics.getCurrentSession()
  
  expect(events.length).toBeGreaterThanOrEqual(3) // web_vitals, feature_used, conversion
  expect(pageViews.length).toBe(1)
  expect(session?.userId).toBe('integration-user')
  expect(session?.events).toBeGreaterThan(0)
  expect(session?.pageViews).toBe(1)
  
  expect(realtimeData.activeUsers).toBeGreaterThan(0)
  expect(realtimeData.pageViews).toBeGreaterThan(0)
  
  // Verify specific event types
  const webVitalsEvent = events.find(e => e.name === 'web_vitals')
  const featureEvent = events.find(e => e.name === 'feature_used')
  const conversionEvent = events.find(e => e.name === 'conversion')
  
  expect(webVitalsEvent?.category).toBe('performance')
  expect(featureEvent?.properties?.feature).toBe('daily_reports')
  expect(conversionEvent?.category).toBe('vercel')
}