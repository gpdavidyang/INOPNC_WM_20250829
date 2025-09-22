'use client'

import React, { ComponentType, useEffect, forwardRef } from 'react'
import * as Sentry from '@sentry/nextjs'

// HOC options for performance monitoring
interface WithPerformanceOptions {
  componentName?: string
  enableMemoryTracking?: boolean
  slowRenderThreshold?: number
  enableAutoOptimization?: boolean
  trackInteractions?: boolean
  trackApiCalls?: boolean
}

// Component performance wrapper interface
interface PerformanceWrapperProps {
  'data-performance-id'?: string
  'data-track-interactions'?: boolean
  children?: React.ReactNode
}

/**
 * Higher-Order Component for automated performance monitoring
 */
export function withPerformance<P extends object>(
  WrappedComponent: ComponentType<P>,
  options: WithPerformanceOptions = {}
) {
  const {
    componentName = WrappedComponent.displayName || WrappedComponent.name || 'Unknown',
    enableMemoryTracking = false,
    slowRenderThreshold = 16,
    enableAutoOptimization = true,
    trackInteractions = false,
    trackApiCalls = false
  } = options

  const PerformanceWrappedComponent = forwardRef<any, P & PerformanceWrapperProps>((props, ref) => {
    const performanceId = props['data-performance-id'] || componentName
    const shouldTrackInteractions = props['data-track-interactions'] || trackInteractions

    // Initialize performance monitoring hooks
    const {
      markRenderStart,
      markRenderEnd,
      getMetrics,
      isSlowComponent,
      resetMetrics
    } = useComponentPerformance({
      componentName: performanceId,
      enableMemoryTracking,
      slowRenderThreshold,
      enableAutoOptimization
    })

    const interactionMonitor = useInteractionPerformance(performanceId)

    // Mark render start before render
    useEffect(() => {
      markRenderStart()
    })

    // Mark render end after render
    useEffect(() => {
      markRenderEnd()

      // Log performance metrics in development
      if (process.env.NODE_ENV === 'development') {
        const metrics = getMetrics()
        console.log(`[Performance] ${performanceId}:`, {
          renderTime: metrics.renderTime,
          updateCount: metrics.updateCount,
          isSlowComponent,
          memoryUsage: metrics.memoryUsage
        })
      }

      // Add warning for consistently slow components
      if (isSlowComponent) {
        console.warn(
          `[Performance Warning] Component "${performanceId}" has slow renders. ` +
          `Consider optimizing with React.memo, useMemo, or useCallback.`
        )
        
        Sentry.addBreadcrumb({
          category: 'performance',
          message: `HOC detected slow component: ${performanceId}`,
          level: 'warning',
          data: {
            componentName: performanceId,
            renderThreshold: slowRenderThreshold
          }
        })
      }
    })

    // Wrap component with interaction monitoring if enabled
    const ComponentWithInteractions = shouldTrackInteractions ? (
      <div
        onMouseDown={interactionMonitor.startInteraction}
        onMouseUp={() => interactionMonitor.endInteraction(true)}
        onKeyDown={interactionMonitor.startInteraction}
        onKeyUp={() => interactionMonitor.endInteraction(true)}
        onClick={interactionMonitor.startInteraction}
        data-performance-wrapper="true"
      >
        <WrappedComponent {...props} ref={ref} />
      </div>
    ) : (
      <WrappedComponent {...props} ref={ref} />
    )

    return ComponentWithInteractions
  })

  // Set display name for debugging
  PerformanceWrappedComponent.displayName = `withPerformance(${componentName})`

  return PerformanceWrappedComponent
}

/**
 * HOC for API performance monitoring
 */
export function withApiPerformance<P extends object>(
  WrappedComponent: ComponentType<P>,
  apiEndpoints: string[] = []
) {
  const componentName = WrappedComponent.displayName || WrappedComponent.name || 'Unknown'

  const ApiPerformanceWrapper = forwardRef<any, P>((props, ref) => {
    // Create API performance trackers for each endpoint
    const apiTrackers = apiEndpoints.reduce((trackers, endpoint) => {
      trackers[endpoint] = useApiPerformance(`${componentName}.${endpoint}`)
      return trackers
    }, {} as Record<string, ReturnType<typeof useApiPerformance>>)

    // Inject API trackers into component props if it accepts them
    const enhancedProps = {
      ...props,
      apiTrackers: Object.keys(apiTrackers).length > 0 ? apiTrackers : undefined
    } as P & { apiTrackers?: typeof apiTrackers }

    return <WrappedComponent {...enhancedProps} ref={ref} />
  })

  ApiPerformanceWrapper.displayName = `withApiPerformance(${componentName})`
  return ApiPerformanceWrapper
}

/**
 * HOC for form performance monitoring
 */
export function withFormPerformance<P extends object>(
  WrappedComponent: ComponentType<P>,
  formName?: string
) {
  const componentName = WrappedComponent.displayName || WrappedComponent.name || 'Unknown'
  const defaultFormName = formName || `${componentName}Form`

  const FormPerformanceWrapper = forwardRef<any, P>((props, ref) => {
    // This HOC can be enhanced to inject form performance tracking
    // For now, it serves as a marker and future extension point

    useEffect(() => {
      console.log(`[Form Performance] Monitoring form: ${defaultFormName}`)
    }, [])

    return <WrappedComponent {...props} ref={ref} />
  })

  FormPerformanceWrapper.displayName = `withFormPerformance(${componentName})`
  return FormPerformanceWrapper
}

/**
 * Composite HOC that combines multiple performance monitoring aspects
 */
export function withCompletePerformance<P extends object>(
  WrappedComponent: ComponentType<P>,
  options: WithPerformanceOptions & {
    apiEndpoints?: string[]
    formName?: string
  } = {}
) {
  const { apiEndpoints = [], formName, ...performanceOptions } = options

  let EnhancedComponent = WrappedComponent

  // Apply performance monitoring
  EnhancedComponent = withPerformance(EnhancedComponent, performanceOptions)

  // Apply API monitoring if endpoints specified
  if (apiEndpoints.length > 0) {
    EnhancedComponent = withApiPerformance(EnhancedComponent, apiEndpoints)
  }

  // Apply form monitoring if form name specified
  if (formName) {
    EnhancedComponent = withFormPerformance(EnhancedComponent, formName)
  }

  return EnhancedComponent
}

/**
 * Utility HOC for development-only performance monitoring
 */
export function withDevPerformance<P extends object>(
  WrappedComponent: ComponentType<P>,
  options: WithPerformanceOptions = {}
) {
  // Only apply in development mode
  if (process.env.NODE_ENV !== 'development') {
    return WrappedComponent
  }

  return withPerformance(WrappedComponent, {
    ...options,
    enableMemoryTracking: true, // Enable memory tracking in dev
    slowRenderThreshold: 8 // Lower threshold for development
  })
}

/**
 * HOC for lazy-loaded components with performance tracking
 */
export function withLazyPerformance<P extends object>(
  lazyComponent: React.LazyExoticComponent<ComponentType<P>>,
  options: WithPerformanceOptions & {
    fallback?: React.ComponentType
    loadingComponent?: React.ComponentType
  } = {}
) {
  const { fallback: Fallback, loadingComponent: Loading, ...performanceOptions } = options
  const componentName = options.componentName || 'LazyComponent'

  const LazyPerformanceWrapper = forwardRef<any, P>((props, ref) => {
    const [loadStartTime] = React.useState(() => performance.now())
    const [hasLoaded, setHasLoaded] = React.useState(false)

    // Track lazy loading performance
    useEffect(() => {
      if (hasLoaded) {
        const loadTime = performance.now() - loadStartTime
        console.log(`[Lazy Loading] ${componentName} loaded in ${loadTime}ms`)
        
        Sentry.addBreadcrumb({
          category: 'performance',
          message: `Lazy component loaded: ${componentName}`,
          level: 'info',
          data: {
            loadTime,
            componentName
          }
        })
      }
    }, [hasLoaded, loadStartTime])

    const LoadingFallback = Loading || Fallback || (() => <div>Loading...</div>)

    return (
      <React.Suspense fallback={<LoadingFallback />}>
        <LazyComponentWrapper 
          LazyComponent={lazyComponent}
          onLoaded={() => setHasLoaded(true)}
          performanceOptions={performanceOptions}
          {...props}
          ref={ref}
        />
      </React.Suspense>
    )
  })

  LazyPerformanceWrapper.displayName = `withLazyPerformance(${componentName})`
  return LazyPerformanceWrapper
}

// Helper component for lazy loading with performance monitoring
const LazyComponentWrapper = forwardRef<any, {
  LazyComponent: React.LazyExoticComponent<ComponentType<unknown>>
  onLoaded: () => void
  performanceOptions: WithPerformanceOptions
  [key: string]: unknown
}>(({ LazyComponent, onLoaded, performanceOptions, ...props }, ref) => {
  useEffect(() => {
    onLoaded()
  }, [onLoaded])

  const PerformanceEnhancedComponent = withPerformance(LazyComponent, performanceOptions)
  
  return <PerformanceEnhancedComponent {...props} ref={ref} />
})

LazyComponentWrapper.displayName = 'LazyComponentWrapper'