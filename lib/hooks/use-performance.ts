'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { performanceTracker } from '@/lib/monitoring/performance-metrics'
import * as Sentry from '@sentry/nextjs'

// Component performance metrics interface
interface ComponentMetrics {
  renderTime: number
  mountTime: number
  updateCount: number
  memoryUsage?: number
  lastRender: number
}

// Performance hook options
interface UsePerformanceOptions {
  componentName?: string
  enableMemoryTracking?: boolean
  slowRenderThreshold?: number
  enableAutoOptimization?: boolean
}

/**
 * Hook for tracking component performance metrics
 */
export function useComponentPerformance(options: UsePerformanceOptions = {}) {
  const {
    componentName = 'UnknownComponent',
    enableMemoryTracking = false,
    slowRenderThreshold = 16, // 16ms for 60fps
    enableAutoOptimization = true
  } = options

  const metricsRef = useRef<ComponentMetrics>({
    renderTime: 0,
    mountTime: 0,
    updateCount: 0,
    lastRender: performance.now()
  })

  const renderStartRef = useRef<number>(0)
  const mountTimeRef = useRef<number>(0)
  const [isSlowComponent, setIsSlowComponent] = useState(false)

  // Mark render start
  const markRenderStart = useCallback(() => {
    renderStartRef.current = performance.now()
  }, [])

  // Mark render end and record metrics
  const markRenderEnd = useCallback(() => {
    const renderTime = performance.now() - renderStartRef.current
    const currentMetrics = metricsRef.current

    currentMetrics.renderTime = renderTime
    currentMetrics.updateCount++
    currentMetrics.lastRender = performance.now()

    // Track slow renders
    if (renderTime > slowRenderThreshold) {
      setIsSlowComponent(true)
      
      Sentry.addBreadcrumb({
        category: 'performance',
        message: `Slow render: ${componentName}`,
        level: 'warning',
        data: {
          componentName,
          renderTime,
          threshold: slowRenderThreshold
        }
      })

      performanceTracker.recordMetric('componentSlowRender', 1, {
        componentName,
        renderTime
      })
    }

    // Record general render metrics
    performanceTracker.recordMetric('componentRenderTime', renderTime, {
      componentName
    })

    // Memory tracking if enabled
    if (enableMemoryTracking && 'memory' in performance) {
      const memoryInfo = (performance as any).memory
      currentMetrics.memoryUsage = memoryInfo.usedJSHeapSize
      
      performanceTracker.recordMetric('componentMemoryUsage', memoryInfo.usedJSHeapSize, {
        componentName
      })
    }
  }, [componentName, slowRenderThreshold, enableMemoryTracking])

  // Mount effect
  useEffect(() => {
    mountTimeRef.current = performance.now()
    metricsRef.current.mountTime = performance.now()

    // Record mount metric
    performanceTracker.recordMetric('componentMount', 1, {
      componentName
    })

    return () => {
      // Record unmount and lifecycle metrics
      const lifecycleTime = performance.now() - mountTimeRef.current
      
      performanceTracker.recordMetric('componentLifecycle', lifecycleTime, {
        componentName,
        updateCount: metricsRef.current.updateCount
      })
    }
  }, [componentName])

  // Get current metrics
  const getMetrics = useCallback((): ComponentMetrics => {
    return { ...metricsRef.current }
  }, [])

  // Reset metrics
  const resetMetrics = useCallback(() => {
    metricsRef.current = {
      renderTime: 0,
      mountTime: 0,
      updateCount: 0,
      lastRender: performance.now()
    }
    setIsSlowComponent(false)
  }, [])

  return {
    markRenderStart,
    markRenderEnd,
    getMetrics,
    resetMetrics,
    isSlowComponent,
    metrics: metricsRef.current
  }
}

/**
 * Hook for tracking API call performance within components
 */
export function useApiPerformance(apiName: string) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [metrics, setMetrics] = useState<{
    duration: number
    success: boolean
    retryCount: number
  }>({ duration: 0, success: true, retryCount: 0 })

  const trackApiCall = useCallback(async <T>(
    apiCall: () => Promise<T>,
    options: {
      retries?: number
      timeout?: number
      onRetry?: (attempt: number) => void
    } = {}
  ): Promise<T> => {
    const { retries = 0, timeout = 10000, onRetry } = options
    
    setIsLoading(true)
    setError(null)
    
    const startTime = performance.now()
    let attempt = 0
    
    const executeCall = async (): Promise<T> => {
      try {
        return await Promise.race([
          apiCall(),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('API call timeout')), timeout)
          )
        ])
      } catch (err) {
        attempt++
        
        if (attempt <= retries) {
          onRetry?.(attempt)
          
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
          return executeCall()
        }
        
        throw err
      }
    }

    try {
      const result = await executeCall()
      const duration = performance.now() - startTime
      
      setMetrics({
        duration,
        success: true,
        retryCount: attempt
      })
      
      performanceTracker.recordMetric('apiCallSuccess', 1, {
        apiName,
        duration,
        retryCount: attempt
      })
      
      return result
    } catch (err) {
      const duration = performance.now() - startTime
      const error = err as Error
      
      setError(error)
      setMetrics({
        duration,
        success: false,
        retryCount: attempt
      })
      
      performanceTracker.recordMetric('apiCallError', 1, {
        apiName,
        duration,
        retryCount: attempt,
        errorType: error.name
      })
      
      Sentry.captureException(error, {
        tags: { 
          component: 'api-performance-hook',
          apiName 
        },
        contexts: {
          apiCall: {
            name: apiName,
            duration: performance.now() - startTime,
            retryCount: attempt
          }
        }
      })
      
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [apiName])

  return {
    trackApiCall,
    isLoading,
    error,
    metrics
  }
}

/**
 * Hook for tracking user interaction performance
 */
export function useInteractionPerformance(interactionName: string) {
  const interactionStartRef = useRef<number>(0)
  const [isInteracting, setIsInteracting] = useState(false)

  const startInteraction = useCallback(() => {
    interactionStartRef.current = performance.now()
    setIsInteracting(true)
    
    performanceTracker.recordMetric('interactionStart', 1, {
      interactionName
    })
  }, [interactionName])

  const endInteraction = useCallback((success: boolean = true) => {
    if (interactionStartRef.current === 0) return
    
    const duration = performance.now() - interactionStartRef.current
    setIsInteracting(false)
    
    performanceTracker.recordMetric('interactionEnd', duration, {
      interactionName,
      success
    })
    
    // Track slow interactions (> 100ms is noticeable to users)
    if (duration > 100) {
      Sentry.addBreadcrumb({
        category: 'ui.interaction',
        message: `Slow interaction: ${interactionName}`,
        level: 'warning',
        data: {
          interactionName,
          duration
        }
      })
      
      performanceTracker.recordMetric('slowInteraction', 1, {
        interactionName,
        duration
      })
    }
    
    interactionStartRef.current = 0
  }, [interactionName])

  return {
    startInteraction,
    endInteraction,
    isInteracting
  }
}

/**
 * Hook for tracking form performance metrics
 */
export function useFormPerformance(formName: string) {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [validationTime, setValidationTime] = useState<number>(0)
  const submitStartRef = useRef<number>(0)

  const trackFieldValidation = useCallback((fieldName: string, isValid: boolean, validationDuration: number) => {
    setValidationTime(validationDuration)
    
    performanceTracker.recordMetric('formFieldValidation', validationDuration, {
      formName,
      fieldName,
      isValid
    })
    
    if (validationDuration > 500) { // Slow validation threshold
      performanceTracker.recordMetric('slowValidation', 1, {
        formName,
        fieldName,
        duration: validationDuration
      })
    }
  }, [formName])

  const startSubmit = useCallback(() => {
    submitStartRef.current = performance.now()
  }, [])

  const endSubmit = useCallback((success: boolean, errorCount: number = 0) => {
    if (submitStartRef.current === 0) return
    
    const submitTime = performance.now() - submitStartRef.current
    
    performanceTracker.recordMetric('formSubmit', submitTime, {
      formName,
      success,
      errorCount
    })
    
    if (submitTime > 2000) { // Slow submit threshold
      performanceTracker.recordMetric('slowFormSubmit', 1, {
        formName,
        duration: submitTime
      })
    }
    
    submitStartRef.current = 0
  }, [formName])

  return {
    trackFieldValidation,
    startSubmit,
    endSubmit,
    fieldErrors,
    validationTime
  }
}