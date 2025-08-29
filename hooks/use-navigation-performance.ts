'use client'

import { useEffect, useRef, useCallback } from 'react'
import { usePathname } from 'next/navigation'

interface NavigationMetrics {
  route: string
  duration: number
  timestamp: number
  userAgent: string
}

export function useNavigationPerformance() {
  const pathname = usePathname()
  const navigationStartRef = useRef<number | null>(null)
  const metricsRef = useRef<NavigationMetrics[]>([])

  // Start timing navigation
  const startNavigation = useCallback(() => {
    navigationStartRef.current = Date.now()
  }, [])

  // End timing and record metrics
  useEffect(() => {
    if (navigationStartRef.current) {
      const duration = Date.now() - navigationStartRef.current
      const metric: NavigationMetrics = {
        route: pathname,
        duration,
        timestamp: Date.now(),
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'SSR'
      }
      
      metricsRef.current.push(metric)
      
      // Log slow navigations (>500ms) for debugging
      if (duration > 500) {
        console.warn(`Slow navigation detected: ${pathname} took ${duration}ms`)
      }
      
      // Keep only last 10 metrics to prevent memory leaks
      if (metricsRef.current.length > 10) {
        metricsRef.current = metricsRef.current.slice(-10)
      }
      
      navigationStartRef.current = null
    }
  }, [pathname])

  // Get performance insights
  const getMetrics = useCallback(() => {
    const metrics = metricsRef.current
    if (metrics.length === 0) return null

    const durations = metrics.map(m => m.duration)
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length
    const slowNavigations = metrics.filter(m => m.duration > 500)

    return {
      totalNavigations: metrics.length,
      averageDuration: Math.round(avgDuration),
      slowNavigations: slowNavigations.length,
      slowestNavigation: Math.max(...durations),
      recentMetrics: metrics.slice(-5)
    }
  }, [])

  return {
    startNavigation,
    getMetrics
  }
}