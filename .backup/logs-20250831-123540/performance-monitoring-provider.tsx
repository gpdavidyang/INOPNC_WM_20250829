'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { initWebVitals, observePerformance, performanceMark } from '@/lib/monitoring/web-vitals'
import { setUserContext } from '@/lib/monitoring/sentry'
import { initRUM, rum } from '@/lib/monitoring/rum'
import { initializeMonitoring, isMonitoringInitialized, checkMonitoringHealth } from '@/lib/monitoring/init'
import { isFeatureEnabled } from '@/lib/feature-flags'
import * as Sentry from '@sentry/nextjs'

interface PerformanceMonitoringProviderProps {
  children: React.ReactNode
  user?: any
}

export function PerformanceMonitoringProvider({ 
  children, 
  user 
}: PerformanceMonitoringProviderProps) {
  const pathname = usePathname()
  const [monitoringStatus, setMonitoringStatus] = useState<'initializing' | 'ready' | 'error'>('initializing')
  
  // Initialize comprehensive monitoring system on mount
  useEffect(() => {
    const initMonitoring = async () => {
      try {
        // Check if monitoring is enabled
        if (!isFeatureEnabled('ENABLE_MONITORING')) {
          console.log('📊 Monitoring is disabled by feature flag')
          setMonitoringStatus('ready')
          return
        }

        // Check if already initialized
        if (isMonitoringInitialized()) {
          setMonitoringStatus('ready')
          return
        }

        console.log('🚀 Starting comprehensive monitoring initialization...')
        
        // Initialize the complete monitoring system
        await initializeMonitoring()
        
        // Verify monitoring health
        const health = await checkMonitoringHealth()
        console.log('📊 Monitoring health check:', health)
        
        setMonitoringStatus('ready')
        
        // Send initialization metric (only if monitoring API is enabled)
        if (isFeatureEnabled('ENABLE_PERFORMANCE_MONITORING')) {
          try {
            await fetch('/api/monitoring/metrics', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'system_event',
                data: {
                  event: 'monitoring_provider_initialized',
                  health,
                  timestamp: new Date().toISOString(),
                  user_id: user?.id
                }
              })
            })
          } catch (error) {
            // Ignore analytics errors
            console.warn('Failed to send monitoring initialization metric:', error)
          }
        }
        
      } catch (error) {
        console.error('❌ Failed to initialize monitoring system:', error)
        setMonitoringStatus('error')
        
        // Still try to initialize basic monitoring
        try {
          initWebVitals()
          observePerformance()
          
          // Initialize Real User Monitoring (only if enabled)
          if (isFeatureEnabled('ENABLE_PERFORMANCE_MONITORING')) {
            initRUM({
              sampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
              enableSessionReplay: true,
              enableUserInteractions: true,
              enableResourceTiming: true,
            })
          }
          
          console.log('⚠️ Fallback to basic monitoring only')
        } catch (fallbackError) {
          console.error('❌ Even basic monitoring failed:', fallbackError)
        }
      }
    }

    initMonitoring()
  }, [])

  // Set user context when user changes
  useEffect(() => {
    if (user && monitoringStatus === 'ready' && isFeatureEnabled('ENABLE_MONITORING')) {
      try {
        setUserContext(user)
        
        // Track user session start (only if performance monitoring is enabled)
        if (isFeatureEnabled('ENABLE_PERFORMANCE_MONITORING')) {
          fetch('/api/monitoring/metrics', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'user_session',
              data: {
                event: 'session_start',
                user_id: user.id,
                user_role: user.role,
                site_id: user.site_id,
                timestamp: new Date().toISOString()
              }
            })
          }).catch(() => {
            // Ignore errors
          })
        }
      } catch (error) {
        console.warn('Failed to set user context:', error)
      }
    }
  }, [user, monitoringStatus])
  
  // Track page transitions
  useEffect(() => {
    // Start navigation timing
    performanceMark.start('navigation')
    
    // Track page view in RUM
    rum.trackPageView()
    
    // Create span for page load using modern Sentry API
    let span: any = null
    
    try {
      const client = Sentry.getClient()
      if (client) {
        // Use modern Sentry span API
        span = Sentry.startSpan({
          name: pathname,
          op: 'navigation',
          attributes: {
            'route.path': pathname,
          },
        }, (span) => {
          return span
        })
      }
    } catch (error) {
      // Ignore Sentry errors
    }
    
    // Cleanup function
    return () => {
      // End navigation timing
      const navigationTime = performanceMark.end('navigation')
      
      if (navigationTime && span) {
        try {
          span.setMeasurement?.('navigation.duration', navigationTime, 'millisecond')
          span.end?.()
        } catch (error) {
          // Ignore Sentry errors
        }
      }
    }
  }, [pathname])
  
  // Monitor React renders in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      let renderCount = 0
      let lastRenderTime = Date.now()
      
      const checkRenderPerformance = () => {
        renderCount++
        const now = Date.now()
        const timeSinceLastRender = now - lastRenderTime
        
        // Warn about rapid re-renders
        if (timeSinceLastRender < 16 && renderCount > 5) { // More than 5 renders in 16ms
          console.warn('[Performance] Rapid re-renders detected:', {
            count: renderCount,
            timeSinceLastRender,
            pathname,
          })
          
          Sentry.addBreadcrumb({
            category: 'performance',
            message: 'Rapid re-renders detected',
            level: 'warning',
            data: {
              count: renderCount,
              pathname,
            },
          })
        }
        
        lastRenderTime = now
        
        // Reset counter periodically
        if (renderCount > 100) {
          renderCount = 0
        }
      }
      
      checkRenderPerformance()
    }
  })
  
  return <>{children}</>
}