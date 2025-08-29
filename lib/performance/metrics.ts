'use client'

// 성능 메트릭 수집 및 모니터링
export class PerformanceMetrics {
  private metrics: Map<string, number> = new Map()
  private timers: Map<string, number> = new Map()

  // 시간 측정 시작
  startTiming(label: string) {
    this.timers.set(label, performance.now())
  }

  // 시간 측정 종료
  endTiming(label: string): number {
    const startTime = this.timers.get(label)
    if (!startTime) {
      console.warn(`[Performance] No start time found for: ${label}`)
      return 0
    }

    const duration = performance.now() - startTime
    this.metrics.set(label, duration)
    this.timers.delete(label)

    console.log(`[Performance] ${label}: ${duration.toFixed(2)}ms`)
    return duration
  }

  // 메트릭 기록
  recordMetric(label: string, value: number) {
    this.metrics.set(label, value)
  }

  // 메트릭 조회
  getMetric(label: string): number | undefined {
    return this.metrics.get(label)
  }

  // 모든 메트릭 조회
  getAllMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics)
  }

  // 성능 보고서 생성
  generateReport(): string {
    const metrics = this.getAllMetrics()
    const report = Object.entries(metrics)
      .map(([label, value]) => `${label}: ${value.toFixed(2)}ms`)
      .join('\n')

    return `Performance Report:\n${report}`
  }

  // 메트릭 초기화
  clear() {
    this.metrics.clear()
    this.timers.clear()
  }
}

// 전역 성능 메트릭 인스턴스
export const performanceMetrics = new PerformanceMetrics()

// 컴포넌트 렌더링 시간 측정 데코레이터
export const measureRenderTime = (componentName: string) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value

    descriptor.value = function (...args: any[]) {
      performanceMetrics.startTiming(`${componentName}-${propertyKey}`)
      const result = originalMethod.apply(this, args)
      performanceMetrics.endTiming(`${componentName}-${propertyKey}`)
      return result
    }

    return descriptor
  }
}

// API 호출 시간 측정
export const measureApiCall = async <T>(
  label: string,
  apiCall: () => Promise<T>
): Promise<T> => {
  performanceMetrics.startTiming(`api-${label}`)
  try {
    const result = await apiCall()
    performanceMetrics.endTiming(`api-${label}`)
    return result
  } catch (error) {
    performanceMetrics.endTiming(`api-${label}`)
    throw error
  }
}

// Web Vitals 모니터링
export const initWebVitals = () => {
  if (typeof window === 'undefined') return

  // First Paint (FP) 측정
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.name === 'first-paint') {
        performanceMetrics.recordMetric('first-paint', entry.startTime)
      }
      if (entry.name === 'first-contentful-paint') {
        performanceMetrics.recordMetric('first-contentful-paint', entry.startTime)
      }
    }
  })

  observer.observe({ entryTypes: ['paint'] })

  // Largest Contentful Paint (LCP) 측정
  const lcpObserver = new PerformanceObserver((list) => {
    const entries = list.getEntries()
    const lastEntry = entries[entries.length - 1]
    performanceMetrics.recordMetric('largest-contentful-paint', lastEntry.startTime)
  })

  lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })

  // Cumulative Layout Shift (CLS) 측정
  let clsValue = 0
  const clsObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (!(entry as any).hadRecentInput) {
        clsValue += (entry as any).value
      }
    }
    performanceMetrics.recordMetric('cumulative-layout-shift', clsValue)
  })

  clsObserver.observe({ entryTypes: ['layout-shift'] })

  // First Input Delay (FID) 측정
  const fidObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      performanceMetrics.recordMetric('first-input-delay', (entry as any).processingStart - entry.startTime)
    }
  })

  fidObserver.observe({ entryTypes: ['first-input'] })
}

// 페이지 로드 시간 측정
export const measurePageLoad = () => {
  if (typeof window === 'undefined') return

  window.addEventListener('load', () => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    
    performanceMetrics.recordMetric('dns-lookup', navigation.domainLookupEnd - navigation.domainLookupStart)
    performanceMetrics.recordMetric('tcp-connection', navigation.connectEnd - navigation.connectStart)
    performanceMetrics.recordMetric('request-response', navigation.responseEnd - navigation.requestStart)
    performanceMetrics.recordMetric('dom-parsing', navigation.domContentLoadedEventEnd - navigation.responseEnd)
    performanceMetrics.recordMetric('resource-loading', navigation.loadEventStart - navigation.domContentLoadedEventEnd)
    performanceMetrics.recordMetric('total-page-load', navigation.loadEventEnd - navigation.navigationStart)
  })
}

// 성능 임계값 설정
export const PERFORMANCE_THRESHOLDS = {
  COMPONENT_RENDER: 16, // 16ms (60fps)
  API_CALL: 1000, // 1초
  PAGE_LOAD: 3000, // 3초
  FIRST_CONTENTFUL_PAINT: 1800, // 1.8초
  LARGEST_CONTENTFUL_PAINT: 2500, // 2.5초
  FIRST_INPUT_DELAY: 100, // 100ms
  CUMULATIVE_LAYOUT_SHIFT: 0.1 // 0.1
}

// 성능 경고 확인
export const checkPerformanceWarnings = () => {
  const metrics = performanceMetrics.getAllMetrics()
  const warnings: string[] = []

  if (metrics['total-page-load'] > PERFORMANCE_THRESHOLDS.PAGE_LOAD) {
    warnings.push(`Page load time (${metrics['total-page-load'].toFixed(2)}ms) exceeds threshold`)
  }

  if (metrics['first-contentful-paint'] > PERFORMANCE_THRESHOLDS.FIRST_CONTENTFUL_PAINT) {
    warnings.push(`FCP (${metrics['first-contentful-paint'].toFixed(2)}ms) exceeds threshold`)
  }

  if (metrics['largest-contentful-paint'] > PERFORMANCE_THRESHOLDS.LARGEST_CONTENTFUL_PAINT) {
    warnings.push(`LCP (${metrics['largest-contentful-paint'].toFixed(2)}ms) exceeds threshold`)
  }

  if (warnings.length > 0) {
    console.warn('[Performance Warnings]:', warnings)
  }

  return warnings
}