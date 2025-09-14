import * as Sentry from '@sentry/nextjs'
import { NextRequest, NextResponse } from 'next/server'

// API monitoring configuration
interface APIMonitoringConfig {
  slowQueryThreshold: number
  slowDatabaseThreshold: number
  errorRateThreshold: number
  enableDetailedLogging: boolean
  enableDatabaseMonitoring: boolean
  enableRealUserMonitoring: boolean
}

const DEFAULT_CONFIG: APIMonitoringConfig = {
  slowQueryThreshold: 1000, // 1 second for API calls
  slowDatabaseThreshold: 500, // 500ms for database queries
  errorRateThreshold: 5, // 5%
  enableDetailedLogging: process.env.NODE_ENV === 'development',
  enableDatabaseMonitoring: true,
  enableRealUserMonitoring: true,
}

// API monitoring metrics
interface APIMetrics {
  requestCount: number
  errorCount: number
  totalResponseTime: number
  slowQueries: number
  databaseQueries: number
  slowDatabaseQueries: number
  endpoints: Map<string, {
    count: number
    errors: number
    totalTime: number
    avgTime: number
    lastAccessed: string
    slowestRequest: number
    fastestRequest: number
  }>
  databaseOperations: Map<string, {
    count: number
    errors: number
    totalTime: number
    avgTime: number
    slowestQuery: number
    fastestQuery: number
  }>
}

// Construction-specific endpoint metrics
interface ConstructionAPIMetrics {
  dailyReports: {
    creates: number
    reads: number
    updates: number
    avgCreateTime: number
    avgReadTime: number
  }
  attendance: {
    checkins: number
    checkouts: number
    avgCheckinTime: number
    syncFailures: number
  }
  documents: {
    uploads: number
    downloads: number
    avgUploadTime: number
    avgDownloadTime: number
    uploadFailures: number
  }
  sites: {
    fetches: number
    avgFetchTime: number
    cacheHitRate: number
  }
}

class APIMonitor {
  private metrics: APIMetrics = {
    requestCount: 0,
    errorCount: 0,
    totalResponseTime: 0,
    slowQueries: 0,
    databaseQueries: 0,
    slowDatabaseQueries: 0,
    endpoints: new Map(),
    databaseOperations: new Map(),
  }
  
  private constructionMetrics: ConstructionAPIMetrics = {
    dailyReports: { creates: 0, reads: 0, updates: 0, avgCreateTime: 0, avgReadTime: 0 },
    attendance: { checkins: 0, checkouts: 0, avgCheckinTime: 0, syncFailures: 0 },
    documents: { uploads: 0, downloads: 0, avgUploadTime: 0, avgDownloadTime: 0, uploadFailures: 0 },
    sites: { fetches: 0, avgFetchTime: 0, cacheHitRate: 0 },
  }
  
  private config: APIMonitoringConfig = DEFAULT_CONFIG
  private supabase = createClient()
  
  // Monitor API request with enhanced tracking
  async monitorRequest(
    request: NextRequest,
    handler: () => Promise<NextResponse>
  ): Promise<NextResponse> {
    const startTime = Date.now()
    const method = request.method
    const pathname = request.nextUrl.pathname
    const endpoint = `${method} ${pathname}`
    const requestId = this.generateRequestId()
    
    // Initialize endpoint metrics
    if (!this.metrics.endpoints.has(endpoint)) {
      this.metrics.endpoints.set(endpoint, {
        count: 0,
        errors: 0,
        totalTime: 0,
        avgTime: 0,
        lastAccessed: new Date().toISOString(),
        slowestRequest: 0,
        fastestRequest: Infinity,
      })
    }
    
    const endpointMetrics = this.metrics.endpoints.get(endpoint)!
    
    try {
      // Execute request with Sentry tracing
      const response = await Sentry.startSpan({
        name: `API: ${endpoint}`,
        op: 'http.server',
        data: {
          'http.method': method,
          'http.url': pathname,
          'http.user_agent': request.headers.get('user-agent'),
          'request.id': requestId,
        },
      }, async (span) => {
        const response = await handler()
        const duration = Date.now() - startTime
        
        // Set span measurements
        span.setMeasurement?.('http.response_time', duration, 'millisecond')
        span.setMeasurement?.('http.response_size', 
          parseInt(response.headers.get('content-length') || '0'), 'byte')
        span.setStatus?.(response.status >= 400 ? 'internal_error' : 'ok')
        
        return response
      })
      
      const duration = Date.now() - startTime
      
      // Update metrics
      this.updateMetrics(endpoint, duration, response.status >= 400)
      
      // Track construction-specific metrics
      this.trackConstructionMetrics(endpoint, method, duration, response.status >= 400)
      
      // Log slow queries
      if (duration > this.config.slowQueryThreshold) {
        this.logSlowQuery(endpoint, duration, request, requestId)
      }
      
      // Add enhanced performance headers
      response.headers.set('X-Response-Time', `${duration}ms`)
      response.headers.set('X-Request-ID', requestId)
      response.headers.set('X-API-Version', '1.0')
      
      // Store metrics for real-time monitoring
      if (this.config.enableRealUserMonitoring) {
        await this.storeRealTimeMetrics(endpoint, duration, response.status, requestId)
      }
      
      return response
      
    } catch (error) {
      const duration = Date.now() - startTime
      
      // Update error metrics
      this.updateMetrics(endpoint, duration, true)
      
      // Enhanced error logging with construction context
      const errorContext = this.buildErrorContext(request, endpoint, duration, requestId)
      
      Sentry.captureException(error, {
        tags: {
          endpoint,
          method,
          pathname,
          request_id: requestId,
          system: 'construction-management',
        },
        extra: errorContext,
        fingerprint: [endpoint, error.message]
      })
      
      throw error
    }
  }
  
  // Track construction-specific API metrics
  private trackConstructionMetrics(endpoint: string, method: string, duration: number, isError: boolean) {
    // Daily Reports API tracking
    if (endpoint.includes('/daily-reports')) {
      if (method === 'POST') {
        this.constructionMetrics.dailyReports.creates++
        this.constructionMetrics.dailyReports.avgCreateTime = 
          (this.constructionMetrics.dailyReports.avgCreateTime + duration) / 2
      } else if (method === 'GET') {
        this.constructionMetrics.dailyReports.reads++
        this.constructionMetrics.dailyReports.avgReadTime = 
          (this.constructionMetrics.dailyReports.avgReadTime + duration) / 2
      } else if (method === 'PUT' || method === 'PATCH') {
        this.constructionMetrics.dailyReports.updates++
      }
    }
    
    // Attendance API tracking
    else if (endpoint.includes('/attendance')) {
      if (endpoint.includes('check-in')) {
        this.constructionMetrics.attendance.checkins++
        this.constructionMetrics.attendance.avgCheckinTime = 
          (this.constructionMetrics.attendance.avgCheckinTime + duration) / 2
        
        if (isError) {
          this.constructionMetrics.attendance.syncFailures++
        }
      } else if (endpoint.includes('check-out')) {
        this.constructionMetrics.attendance.checkouts++
      }
    }
    
    // Documents API tracking
    else if (endpoint.includes('/documents')) {
      if (method === 'POST') {
        this.constructionMetrics.documents.uploads++
        this.constructionMetrics.documents.avgUploadTime = 
          (this.constructionMetrics.documents.avgUploadTime + duration) / 2
        
        if (isError) {
          this.constructionMetrics.documents.uploadFailures++
        }
      } else if (method === 'GET') {
        this.constructionMetrics.documents.downloads++
        this.constructionMetrics.documents.avgDownloadTime = 
          (this.constructionMetrics.documents.avgDownloadTime + duration) / 2
      }
    }
    
    // Sites API tracking
    else if (endpoint.includes('/sites')) {
      if (method === 'GET') {
        this.constructionMetrics.sites.fetches++
        this.constructionMetrics.sites.avgFetchTime = 
          (this.constructionMetrics.sites.avgFetchTime + duration) / 2
      }
    }
  }
  
  // Build comprehensive error context
  private buildErrorContext(request: NextRequest, endpoint: string, duration: number, requestId: string) {
    return {
      request: {
        id: requestId,
        method: request.method,
        url: request.url,
        headers: Object.fromEntries(request.headers.entries()),
        userAgent: request.headers.get('user-agent'),
        ip: request.ip || request.headers.get('x-forwarded-for'),
        referrer: request.headers.get('referer'),
      },
      performance: {
        duration,
        endpoint,
        timestamp: new Date().toISOString(),
      },
      system: {
        nodeEnv: process.env.NODE_ENV,
        platform: process.platform,
        nodeVersion: process.version,
      },
      construction: {
        metrics: this.constructionMetrics,
        totalRequests: this.metrics.requestCount,
        errorRate: this.getErrorRate(),
      }
    }
  }
  
  // Update metrics with enhanced tracking
  private updateMetrics(endpoint: string, duration: number, isError: boolean) {
    // Global metrics
    this.metrics.requestCount++
    this.metrics.totalResponseTime += duration
    
    if (isError) {
      this.metrics.errorCount++
    }
    
    if (duration > this.config.slowQueryThreshold) {
      this.metrics.slowQueries++
    }
    
    // Endpoint metrics with min/max tracking
    const endpointMetrics = this.metrics.endpoints.get(endpoint)!
    endpointMetrics.count++
    endpointMetrics.totalTime += duration
    endpointMetrics.avgTime = endpointMetrics.totalTime / endpointMetrics.count
    endpointMetrics.lastAccessed = new Date().toISOString()
    
    // Track fastest and slowest requests
    if (duration > endpointMetrics.slowestRequest) {
      endpointMetrics.slowestRequest = duration
    }
    if (duration < endpointMetrics.fastestRequest) {
      endpointMetrics.fastestRequest = duration
    }
    
    if (isError) {
      endpointMetrics.errors++
    }
    
    // Send enhanced metrics to Sentry
    Sentry.addBreadcrumb({
      category: 'api.request',
      message: `${endpoint}: ${duration}ms`,
      level: isError ? 'error' : duration > this.config.slowQueryThreshold ? 'warning' : 'info',
      data: {
        endpoint,
        duration,
        isError,
        totalRequests: this.metrics.requestCount,
        errorRate: this.getErrorRate(),
        avgResponseTime: this.getAverageResponseTime(),
      },
    })
    
    // Send custom metrics to Sentry (disabled - metrics not available in current Sentry version)
    try {
      // Note: Sentry.metrics is not available in @sentry/nextjs
      // Using breadcrumbs and spans for monitoring instead
      Sentry.setTag('api.endpoint', endpoint.replace(/\/\d+/g, '/:id'))
      Sentry.setTag('api.method', endpoint.split(' ')[0])
      Sentry.setTag('api.status', isError ? 'error' : 'success')
      Sentry.setMeasurement('api.response_time', duration)
    } catch (error) {
      // Ignore Sentry tagging errors
    }
  }
  
  // Log slow query with enhanced details
  private logSlowQuery(endpoint: string, duration: number, request: NextRequest, requestId: string) {
    const slowQueryData = {
      request_id: requestId,
      endpoint,
      duration,
      method: request.method,
      url: request.url,
      userAgent: request.headers.get('user-agent'),
      ip: request.ip || request.headers.get('x-forwarded-for'),
      referrer: request.headers.get('referer'),
      timestamp: new Date().toISOString(),
      threshold: this.config.slowQueryThreshold,
      severity: duration > this.config.slowQueryThreshold * 2 ? 'high' : 'medium',
    }
    
    // Log to console with construction context
    if (this.config.enableDetailedLogging) {
      console.warn('🐌 Slow API query detected:', {
        ...slowQueryData,
        constructionMetrics: this.constructionMetrics,
      })
    }
    
    // Send to Sentry with enhanced context
    Sentry.captureMessage('Slow API query detected', {
      level: duration > this.config.slowQueryThreshold * 2 ? 'error' : 'warning',
      tags: {
        endpoint: endpoint.replace(/\/\d+/g, '/:id'),
        slow_query: true,
        system: 'construction-management',
        severity: slowQueryData.severity,
      },
      extra: slowQueryData,
      fingerprint: ['slow-api-query', endpoint]
    })
  }
  
  // Store real-time metrics for monitoring dashboard
  private async storeRealTimeMetrics(endpoint: string, duration: number, status: number, requestId: string) {
    try {
      await this.supabase
        .from('analytics_events')
        .insert({
          event_type: 'api_request',
          metadata: {
            endpoint: endpoint.replace(/\/\d+/g, '/:id'), // Normalize for aggregation
            duration,
            status,
            request_id: requestId,
            timestamp: new Date().toISOString(),
            construction_context: this.getConstructionContext(endpoint),
          }
        })
    } catch (error) {
      // Don't let analytics failures affect the main request
      console.error('Failed to store real-time metrics:', error)
    }
  }
  
  // Get construction-specific context for an endpoint
  private getConstructionContext(endpoint: string): Record<string, unknown> {
    if (endpoint.includes('/daily-reports')) {
      return { feature: 'daily_reports', category: 'core_workflow' }
    } else if (endpoint.includes('/attendance')) {
      return { feature: 'attendance', category: 'core_workflow' }
    } else if (endpoint.includes('/documents')) {
      return { feature: 'documents', category: 'file_management' }
    } else if (endpoint.includes('/sites')) {
      return { feature: 'sites', category: 'configuration' }
    } else if (endpoint.includes('/markup')) {
      return { feature: 'blueprint_markup', category: 'specialized_tools' }
    }
    return { feature: 'other', category: 'system' }
  }
  
  // Generate enhanced request ID
  private generateRequestId(): string {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substring(2, 8)
    return `req_${timestamp}_${random}`
  }
  
  // Get current metrics with enhanced calculations
  getMetrics(): APIMetrics & { 
    errorRate: number
    avgResponseTime: number
    requestsPerMinute: number
    constructionMetrics: ConstructionAPIMetrics
  } {
    return {
      ...this.metrics,
      errorRate: this.getErrorRate(),
      avgResponseTime: this.getAverageResponseTime(),
      requestsPerMinute: this.getRequestsPerMinute(),
      constructionMetrics: this.constructionMetrics,
    }
  }
  
  // Calculate error rate
  private getErrorRate(): number {
    return this.metrics.requestCount > 0 
      ? (this.metrics.errorCount / this.metrics.requestCount) * 100 
      : 0
  }
  
  // Calculate average response time
  private getAverageResponseTime(): number {
    return this.metrics.requestCount > 0
      ? this.metrics.totalResponseTime / this.metrics.requestCount
      : 0
  }
  
  // Calculate requests per minute (simplified - would need time window tracking)
  private getRequestsPerMinute(): number {
    // This is a simplified calculation - in production you'd want to track time windows
    return this.metrics.requestCount / Math.max(1, (Date.now() - this.getStartTime()) / 60000)
  }
  
  private startTime = Date.now()
  private getStartTime(): number {
    return this.startTime
  }
  
  // Get construction-specific metrics
  getConstructionMetrics(): ConstructionAPIMetrics {
    return this.constructionMetrics
  }
  
  // Reset metrics
  resetMetrics() {
    this.metrics = {
      requestCount: 0,
      errorCount: 0,
      totalResponseTime: 0,
      slowQueries: 0,
      databaseQueries: 0,
      slowDatabaseQueries: 0,
      endpoints: new Map(),
      databaseOperations: new Map(),
    }
    
    this.constructionMetrics = {
      dailyReports: { creates: 0, reads: 0, updates: 0, avgCreateTime: 0, avgReadTime: 0 },
      attendance: { checkins: 0, checkouts: 0, avgCheckinTime: 0, syncFailures: 0 },
      documents: { uploads: 0, downloads: 0, avgUploadTime: 0, avgDownloadTime: 0, uploadFailures: 0 },
      sites: { fetches: 0, avgFetchTime: 0, cacheHitRate: 0 },
    }
    
    this.startTime = Date.now()
  }
  
  // Update configuration
  updateConfig(newConfig: Partial<APIMonitoringConfig>) {
    this.config = { ...this.config, ...newConfig }
  }
}

// Singleton instance
export const apiMonitor = new APIMonitor()

// Middleware wrapper for API routes
export function withAPIMonitoring(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    return apiMonitor.monitorRequest(req, () => handler(req))
  }
}

// Compatibility alias for existing code
export const withApiMonitoring = withAPIMonitoring

// Enhanced database query monitoring with construction context
export async function monitorDatabaseQuery<T>(
  queryName: string,
  query: () => Promise<T>,
  context?: {
    table?: string
    operation?: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE'
    construction_context?: string
  }
): Promise<T> {
  const startTime = Date.now()
  const queryId = `${queryName}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
  
  // Initialize database operation metrics
  if (!apiMonitor['metrics'].databaseOperations.has(queryName)) {
    apiMonitor['metrics'].databaseOperations.set(queryName, {
      count: 0,
      errors: 0,
      totalTime: 0,
      avgTime: 0,
      slowestQuery: 0,
      fastestQuery: Infinity,
    })
  }
  
  const dbMetrics = apiMonitor['metrics'].databaseOperations.get(queryName)!
  
  try {
    const result = await Sentry.startSpan({
      name: `DB: ${queryName}`,
      op: 'db.query',
      data: {
        'db.operation': context?.operation || 'query',
        'db.table': context?.table || 'unknown',
        'db.query_id': queryId,
        'construction.context': context?.construction_context,
      },
    }, async (span) => {
      const result = await query()
      const duration = Date.now() - startTime
      
      // Set span measurements
      span.setMeasurement?.('db.query_time', duration, 'millisecond')
      span.setStatus?.('ok')
      
      return result
    })
    
    const duration = Date.now() - startTime
    
    // Update database metrics
    apiMonitor['metrics'].databaseQueries++
    dbMetrics.count++
    dbMetrics.totalTime += duration
    dbMetrics.avgTime = dbMetrics.totalTime / dbMetrics.count
    
    if (duration > dbMetrics.slowestQuery) {
      dbMetrics.slowestQuery = duration
    }
    if (duration < dbMetrics.fastestQuery) {
      dbMetrics.fastestQuery = duration
    }
    
    // Log slow database queries
    if (duration > apiMonitor['config'].slowDatabaseThreshold) {
      apiMonitor['metrics'].slowDatabaseQueries++
      
      const slowQueryData = {
        query_id: queryId,
        queryName,
        duration,
        threshold: apiMonitor['config'].slowDatabaseThreshold,
        context: context || {},
        timestamp: new Date().toISOString(),
        severity: duration > apiMonitor['config'].slowDatabaseThreshold * 2 ? 'high' : 'medium',
      }
      
      Sentry.captureMessage('Slow database query detected', {
        level: duration > apiMonitor['config'].slowDatabaseThreshold * 2 ? 'error' : 'warning',
        tags: {
          query_name: queryName,
          slow_database_query: true,
          table: context?.table || 'unknown',
          operation: context?.operation || 'query',
          construction_context: context?.construction_context || 'general',
        },
        extra: slowQueryData,
        fingerprint: ['slow-db-query', queryName]
      })
    }
    
    // Add breadcrumb
    Sentry.addBreadcrumb({
      category: 'database',
      message: `${queryName}: ${duration}ms`,
      level: duration > apiMonitor['config'].slowDatabaseThreshold ? 'warning' : 'info',
      data: {
        queryName,
        duration,
        table: context?.table,
        operation: context?.operation,
        query_id: queryId,
      },
    })
    
    // Send metrics to Sentry using alternative methods
    try {
      // Use setTag and setMeasurement instead of deprecated metrics API
      Sentry.setTag('db.last_query', queryName)
      Sentry.setTag('db.last_table', context?.table || 'unknown')
      Sentry.setTag('db.last_operation', context?.operation || 'query')
      Sentry.setTag('db.construction_context', context?.construction_context || 'general')
      Sentry.setMeasurement('db.query_time', duration)
      
      // Add breadcrumb for detailed tracking
      Sentry.addBreadcrumb({
        category: 'database.metrics',
        message: `Query metrics: ${queryName}`,
        level: 'info',
        data: {
          query_name: queryName,
          duration,
          table: context?.table,
          operation: context?.operation,
          construction_context: context?.construction_context
        }
      })
    } catch (error) {
      // Ignore Sentry metrics errors
    }
    
    return result
    
  } catch (error) {
    const duration = Date.now() - startTime
    
    // Update error metrics
    dbMetrics.errors++
    
    // Enhanced error logging with construction context
    Sentry.captureException(error, {
      tags: {
        query_name: queryName,
        database_error: true,
        table: context?.table || 'unknown',
        operation: context?.operation || 'query',
        construction_context: context?.construction_context || 'general',
      },
      extra: {
        queryName,
        duration,
        query_id: queryId,
        context: context || {},
        threshold: apiMonitor['config'].slowDatabaseThreshold,
      },
      fingerprint: ['db-error', queryName]
    })
    
    throw error
  }
}

// Helper to track specific API operations
export const apiMetrics = {
  // Track daily report operations
  trackDailyReportLoad: (duration: number) => {
    apiMonitor.trackConstructionMetrics('/api/daily-reports', 'GET', duration, false)
  },
  
  trackDailyReportSave: (duration: number) => {
    apiMonitor.trackConstructionMetrics('/api/daily-reports', 'POST', duration, false)
  },
  
  trackDailyReportSubmit: (duration: number) => {
    apiMonitor.trackConstructionMetrics('/api/daily-reports', 'PUT', duration, false)
  },
  
  // Track image operations
  trackImageUpload: (fileSize: number, duration: number) => {
    apiMonitor.trackConstructionMetrics('/api/documents', 'POST', duration, false)
  },
  
  // Track attendance operations
  trackAttendanceCheckin: (duration: number, failed: boolean = false) => {
    apiMonitor.trackConstructionMetrics('/api/attendance/check-in', 'POST', duration, failed)
  },
  
  trackAttendanceCheckout: (duration: number, failed: boolean = false) => {
    apiMonitor.trackConstructionMetrics('/api/attendance/check-out', 'POST', duration, failed)
  }
}

// Example usage in an API route:
/*
export const GET = withAPIMonitoring(
  async (request: NextRequest) => {
    // Query database with monitoring
    const data = await monitorDatabaseQuery(
      'get_daily_reports', 
      async () => {
        return await supabase
          .from('daily_reports')
          .select('*')
          .order('created_at', { ascending: false })
      },
      {
        table: 'daily_reports',
        operation: 'SELECT',
        construction_context: 'daily_reports_list'
      }
    )
    
    return NextResponse.json({ data })
  }
)
*/