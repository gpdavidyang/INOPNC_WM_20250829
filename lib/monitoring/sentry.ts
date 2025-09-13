import * as Sentry from '@sentry/nextjs'

// Sentry initialization configuration
export const initSentry = () => {
  const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN

  if (!SENTRY_DSN) {
    console.warn('Sentry DSN not found. Performance monitoring disabled.')
    return
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    
    // Performance Monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    // Session Replay (only sample errors in production)
    replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0.0,
    replaysOnErrorSampleRate: 1.0,
    
    // Environment
    environment: process.env.NODE_ENV || 'development',
    
    // Release tracking
    release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
    
    // Integrations
    integrations: [
      // Browser tracing for performance monitoring
      Sentry.browserTracingIntegration(),
      
      // Replay integration for session recording
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    
    // Performance monitoring options
    tracePropagationTargets: [
      'localhost',
      /^https:\/\/.*\.supabase\.co\/rest/,
      /^https:\/\/inopnc.*\.vercel\.app/,
    ],
    
    // Filtering
    beforeSend(event, hint) {
      // Filter out non-critical errors
      if (event.exception) {
        const error = hint.originalException
        
        // Ignore network errors that are expected in offline mode
        if (error?.message?.includes('NetworkError') && 
            window.navigator.onLine === false) {
          return null
        }
        
        // Ignore ResizeObserver errors
        if (error?.message?.includes('ResizeObserver')) {
          return null
        }
      }
      
      return event
    },
    
    // Breadcrumb filtering
    beforeBreadcrumb(breadcrumb) {
      // Filter out noisy console logs
      if (breadcrumb.category === 'console' && 
          breadcrumb.level === 'log') {
        return null
      }
      
      return breadcrumb
    },
  })
}

// Custom performance monitoring
export const measurePerformance = {
  // Measure page load performance
  measurePageLoad: () => {
    if (typeof window !== 'undefined' && window.performance) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      
      if (navigation) {
        const metrics = {
          // Time to First Byte
          ttfb: navigation.responseStart - navigation.requestStart,
          // DOM Content Loaded
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          // Load Complete
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          // Total page load time
          totalTime: navigation.loadEventEnd - navigation.fetchStart,
        }
        
        // Send to Sentry
        Sentry.getCurrentScope().setContext('performance', metrics)
        
        return metrics
      }
    }
    return null
  },
  
  // Measure API call performance
  measureApiCall: async (url: string, fn: () => Promise<any>) => {
    try {
      return await Sentry.startSpan({
        name: `API Call: ${url}`,
        op: 'http.client',
      }, async (span) => {
        try {
          const startTime = performance.now()
          const result = await fn()
          const duration = performance.now() - startTime
          
          span.setMeasurement?.('duration', duration, 'millisecond')
          span.setStatus?.('ok')
          
          // Log slow API calls
          if (duration > 1000) {
            Sentry.captureMessage(`Slow API call: ${url} took ${duration}ms`, 'warning')
          }
          
          return result
        } catch (error) {
          span.setStatus?.('internal_error')
          throw error
        }
      })
    } catch (error) {
      // If Sentry fails, still execute the function
      const startTime = performance.now()
      const result = await fn()
      const duration = performance.now() - startTime
      
      if (duration > 1000) {
        console.warn(`Slow API call: ${url} took ${duration}ms`)
      }
      
      return result
    }
  },
  
  // Measure React component render performance
  measureComponentRender: (componentName: string, fn: () => void) => {
    const startTime = performance.now()
    fn()
    const duration = performance.now() - startTime
    
    // Log slow renders
    if (duration > 16) { // More than one frame (60fps)
      Sentry.addBreadcrumb({
        category: 'performance',
        message: `Slow render: ${componentName} took ${duration}ms`,
        level: 'warning',
        data: { componentName, duration },
      })
    }
  },
}

// User context
export const setUserContext = (user: any) => {
  if (user) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    })
  } else {
    Sentry.setUser(null)
  }
}

// Custom error boundary
export const captureException = (error: Error, context?: Record<string, unknown>) => {
  Sentry.withScope((scope) => {
    if (context) {
      scope.setContext('additional', context)
    }
    Sentry.captureException(error)
  })
}