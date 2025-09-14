/**
 * 최적화된 데이터베이스 쿼리 모음
 * RLS 정책과 함께 효율적으로 작동하는 쿼리들
 */


export interface AttendanceQueryOptions {
  siteId?: string
  startDate?: string
  endDate?: string
  userId?: string
  limit?: number
}

export interface DailyReportQueryOptions {
  siteId?: string
  workDate?: string
  status?: string
  limit?: number
}

/**
 * 근무 현황 조회 (성능 최적화)
 * 인덱스: idx_work_records_site_date 활용
 */
export async function getAttendanceRecordsOptimized(options: AttendanceQueryOptions = {}) {
  const supabase = createClient()
  
  let query = supabase
    .from('work_records')
    .select(`
      id,
      user_id,
      profile_id,
      site_id,
      work_date,
      status,
      labor_hours,
      check_in_time,
      check_out_time,
      profiles!profile_id (
        full_name,
        email,
        role
      ),
      sites!site_id (
        name,
        address
      )
    `)
    .order('work_date', { ascending: false })
    .order('check_in_time', { ascending: false })
  
  // 현장 필터 (가장 선택적인 조건부터)
  if (options.siteId) {
    query = query.eq('site_id', options.siteId)
  }
  
  // 사용자 필터 (user_id 또는 profile_id 체크)
  if (options.userId) {
    query = query.or(`user_id.eq.${options.userId},profile_id.eq.${options.userId}`)
  }
  
  // 날짜 범위 필터 (인덱스 활용)
  if (options.startDate) {
    query = query.gte('work_date', options.startDate)
  }
  if (options.endDate) {
    query = query.lte('work_date', options.endDate)
  }
  
  // 최근 30일로 기본 제한 (성능 최적화)
  if (!options.startDate && !options.endDate) {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    query = query.gte('work_date', thirtyDaysAgo.toISOString().split('T')[0])
  }
  
  // 페이지네이션
  if (options.limit) {
    query = query.limit(options.limit)
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error('근무 현황 조회 오류:', error)
    return { data: [], error }
  }
  
  return { data, error: null }
}

/**
 * 현장별 근무 현황 집계 (실시간 대시보드용)
 * 부분 인덱스: idx_work_records_recent 활용
 */
export async function getAttendanceSummaryBySite(siteId?: string, date?: string) {
  const supabase = createClient()
  
  const targetDate = date || new Date().toISOString().split('T')[0]
  
  let query = supabase
    .from('work_records')
    .select(`
      site_id,
      status,
      labor_hours,
      sites!site_id (
        name
      )
    `)
    .eq('work_date', targetDate)
  
  if (siteId) {
    query = query.eq('site_id', siteId)
  }
  
  const { data, error } = await query
  
  if (error) {
    return { data: null, error }
  }
  
  // 클라이언트 측에서 집계 (간단한 경우)
  const summary = data.reduce((acc, record) => {
    const siteKey = record.site_id
    if (!acc[siteKey]) {
      acc[siteKey] = {
        siteName: record.sites?.name || 'Unknown',
        totalWorkers: 0,
        presentWorkers: 0,
        totalLaborHours: 0,
        statusBreakdown: {}
      }
    }
    
    acc[siteKey].totalWorkers++
    if (record.status === 'present') {
      acc[siteKey].presentWorkers++
    }
    acc[siteKey].totalLaborHours += record.labor_hours || 0
    
    acc[siteKey].statusBreakdown[record.status] = 
      (acc[siteKey].statusBreakdown[record.status] || 0) + 1
    
    return acc
  }, {} as Record<string, any>)
  
  return { data: Object.values(summary), error: null }
}

/**
 * 작업일지 조회 (계층적 권한 고려)
 * 인덱스: idx_daily_reports_site_date 활용
 */
export async function getDailyReportsOptimized(options: DailyReportQueryOptions = {}) {
  const supabase = createClient()
  
  let query = supabase
    .from('daily_reports')
    .select(`
      id,
      site_id,
      work_date,
      status,
      weather,
      worker_count,
      work_description,
      issues,
      safety_notes,
      created_by,
      created_at,
      updated_at,
      profiles!created_by (
        full_name,
        role
      ),
      sites!site_id (
        name,
        address
      )
    `)
    .order('work_date', { ascending: false })
    .order('created_at', { ascending: false })
  
  // 현장 필터
  if (options.siteId) {
    query = query.eq('site_id', options.siteId)
  }
  
  // 날짜 필터
  if (options.workDate) {
    query = query.eq('work_date', options.workDate)
  }
  
  // 상태 필터
  if (options.status) {
    query = query.eq('status', options.status)
  }
  
  // 기본 제한 (최근 한 달)
  if (!options.workDate) {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    query = query.gte('work_date', thirtyDaysAgo.toISOString().split('T')[0])
  }
  
  if (options.limit) {
    query = query.limit(options.limit)
  }
  
  const { data, error } = await query
  
  return { data, error }
}

/**
 * 사용자 권한 컨텍스트 조회 (캐싱 가능)
 */
export async function getUserAccessContext() {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .rpc('get_user_context')
  
  if (error) {
    console.error('사용자 컨텍스트 조회 오류:', error)
    return { data: null, error }
  }
  
  return { data, error: null }
}

/**
 * 현장별 권한 확인 (빠른 검증)
 */
export async function canAccessSite(siteId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .rpc('can_access_site_fast', { target_site_id: siteId })
  
  if (error) {
    console.error('현장 접근 권한 확인 오류:', error)
    return false
  }
  
  return data
}

/**
 * 대시보드용 집계 쿼리 (최적화된 성능)
 */
export async function getDashboardMetrics(siteId?: string) {
  const supabase = createClient()
  
  const today = new Date().toISOString().split('T')[0]
  const lastWeek = new Date()
  lastWeek.setDate(lastWeek.getDate() - 7)
  const weekAgo = lastWeek.toISOString().split('T')[0]
  
  // 병렬로 여러 쿼리 실행
  const [attendanceResult, reportsResult, siteResult] = await Promise.all([
    // 오늘 출근 현황
    getAttendanceRecordsOptimized({
      siteId,
      startDate: today,
      endDate: today
    }),
    
    // 최근 작업일지
    getDailyReportsOptimized({
      siteId,
      limit: 10
    }),
    
    // 사이트 정보
    siteId ? supabase
      .from('sites')
      .select('id, name, address, status')
      .eq('id', siteId)
      .single() : null
  ])
  
  return {
    attendance: attendanceResult.data || [],
    reports: reportsResult.data || [],
    site: siteResult?.data || null,
    errors: {
      attendance: attendanceResult.error,
      reports: reportsResult.error,
      site: siteResult?.error
    }
  }
}

/**
 * 성능 모니터링용 쿼리 실행 시간 측정
 */
export function withPerformanceLogging<T extends (...args: unknown[]) => Promise<unknown>>(
  queryFunction: T,
  queryName: string
): T {
  return (async (...args: unknown[]) => {
    const startTime = performance.now()
    
    try {
      const result = await queryFunction(...args)
      const endTime = performance.now()
      const executionTime = endTime - startTime
      
      // 성능 로깅 (개발 환경에서만)
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔍 Query: ${queryName}`)
        console.log(`⏱️  Execution time: ${executionTime.toFixed(2)}ms`)
        
        if (executionTime > 1000) {
          console.warn(`⚠️  Slow query detected: ${queryName} (${executionTime.toFixed(2)}ms)`)
        }
      }
      
      return result
    } catch (error) {
      const endTime = performance.now()
      const executionTime = endTime - startTime
      
      console.error(`❌ Query failed: ${queryName} (${executionTime.toFixed(2)}ms)`, error)
      throw error
    }
  }) as T
}

// 성능 로깅이 적용된 함수들
export const getAttendanceRecordsWithLogging = withPerformanceLogging(
  getAttendanceRecordsOptimized,
  'getAttendanceRecords'
)

export const getDailyReportsWithLogging = withPerformanceLogging(
  getDailyReportsOptimized,
  'getDailyReports'
)

export const getDashboardMetricsWithLogging = withPerformanceLogging(
  getDashboardMetrics,
  'getDashboardMetrics'
)