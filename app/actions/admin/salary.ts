'use server'

import type { SupabaseClient } from '@supabase/supabase-js'
import { assertOrgAccess, type SimpleAuth } from '@/lib/auth/ultra-simple'
import { AppError, ErrorType, logError } from '@/lib/error-handling'
import type { Database } from '@/types/database'
import type { AsyncState, ApiResponse } from '@/types/utils'
import { withAdminAuth, AdminErrors, validateRequired, type AdminActionResult } from './common'

type AdminSupabaseClient = SupabaseClient<Database>

async function ensureSiteAccess(
  supabase: AdminSupabaseClient,
  auth: SimpleAuth,
  siteId?: string | null
) {
  if (!auth.isRestricted || !siteId) {
    return
  }

  const { data, error } = await supabase
    .from('sites')
    .select('organization_id')
    .eq('id', siteId)
    .single()

  if (error || !data) {
    throw new AppError('현장 정보를 확인할 수 없습니다.', ErrorType.NOT_FOUND, 404)
  }

  await assertOrgAccess(auth, data.organization_id ?? undefined)
}

async function filterReportsByOrg(
  supabase: AdminSupabaseClient,
  auth: SimpleAuth,
  reports: Array<{ site_id: string | null; site?: { organization_id?: string | null } }>
) {
  if (!auth.isRestricted || reports.length === 0) {
    return reports
  }

  const siteIds = Array.from(new Set(reports.map(report => report.site_id).filter(Boolean)))

  if (siteIds.length === 0) {
    return []
  }

  const { data, error } = await supabase
    .from('sites')
    .select('id, organization_id')
    .in('id', siteIds)

  if (error) {
    throw new AppError('현장 정보를 확인할 수 없습니다.', ErrorType.SERVER_ERROR, 500)
  }

  const orgMap = new Map<string, string | undefined>()
  for (const site of data || []) {
    orgMap.set(site.id, site.organization_id ?? undefined)
  }

  for (const [, organizationId] of orgMap) {
    await assertOrgAccess(auth, organizationId)
  }

  return reports.filter(report => {
    if (!report.site_id) {
      return false
    }
    return orgMap.get(report.site_id) === auth.restrictedOrgId
  })
}

async function ensureSalaryRecordsAccess(
  supabase: AdminSupabaseClient,
  auth: SimpleAuth,
  recordIds: string[]
) {
  if (!auth.isRestricted || recordIds.length === 0) {
    return
  }

  const { data, error } = await supabase
    .from('salary_records')
    .select('id, site_id, site:sites(organization_id)')
    .in('id', recordIds)

  if (error) {
    throw new AppError('급여 기록을 확인할 수 없습니다.', ErrorType.SERVER_ERROR, 500)
  }

  const records = data || []
  const filtered = await filterReportsByOrg(supabase, auth, records)

  if (filtered.length !== records.length) {
    throw new AppError('급여 기록에 접근할 권한이 없습니다.', ErrorType.AUTHORIZATION, 403)
  }
}

async function getAccessibleSiteIds(
  supabase: AdminSupabaseClient,
  auth: SimpleAuth
): Promise<string[]> {
  if (!auth.isRestricted) {
    return []
  }

  const { data, error } = await supabase
    .from('sites')
    .select('id')
    .eq('organization_id', auth.restrictedOrgId)

  if (error) {
    throw new AppError('현장 정보를 확인할 수 없습니다.', ErrorType.SERVER_ERROR, 500)
  }

  return (data || []).map(site => site.id)
}

export interface SalaryCalculationRule {
  id: string
  rule_name: string
  rule_type: 'hourly_rate' | 'daily_rate' | 'overtime_multiplier' | 'bonus_calculation'
  base_amount: number
  multiplier?: number
  conditions?: unknown
  site_id?: string
  role?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface SalaryRecord {
  id: string
  worker_id: string
  worker: {
    full_name: string
    email: string
    role: string
  }
  site_id: string
  site: {
    name: string
  }
  work_date: string
  regular_hours: number
  overtime_hours: number
  base_pay: number
  overtime_pay: number
  bonus_pay: number
  deductions: number
  total_pay: number
  status: 'calculated' | 'approved' | 'paid'
  notes?: string
  created_at: string
  updated_at: string
}

export interface OutputSummary {
  worker_id: string
  worker_name: string
  worker_role: string
  site_id: string
  site_name: string
  work_days_count: number  // 실제 근무한 날짜 수 (참고용)
  total_labor_hours: number  // 총 공수 (급여 계산 기준)
  total_work_hours: number
  total_actual_hours: number
  total_overtime_hours: number
  total_pay: number
  base_pay: number
  overtime_pay: number
  bonus_pay: number
  deductions: number
  first_work_date: string
  last_work_date: string
  work_dates: string[]
}

export interface WorkerCalendarData {
  date: string
  work_hours: number
  site_name: string
}

export interface SalaryStats {
  total_workers: number
  pending_calculations: number
  approved_payments: number
  total_payroll: number
  average_daily_pay: number
  overtime_percentage: number
}

/**
 * Get salary calculation rules
 */
export async function getSalaryRules(
  page = 1,
  limit = 10,
  search = '',
  rule_type?: string,
  site_id?: string
): Promise<AdminActionResult<{ rules: SalaryCalculationRule[]; total: number; pages: number }>> {
  return withAdminAuth(async (supabase, profile) => {
    try {
      const auth = profile.auth

      await ensureSiteAccess(supabase, auth, site_id)

      let query = supabase
        .from('salary_calculation_rules')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })

      // Apply search filter
      if (search.trim()) {
        query = query.or(`rule_name.ilike.%${search}%,rule_type.ilike.%${search}%`)
      }

      // Apply rule type filter
      if (rule_type) {
        query = query.eq('rule_type', rule_type)
      }

      // Apply site filter
      if (site_id) {
        query = query.or(`site_id.eq.${site_id},site_id.is.null`)
      }

      let accessibleSiteIds: string[] | null = null
      if (auth.isRestricted && !site_id) {
        accessibleSiteIds = await getAccessibleSiteIds(supabase, auth)

        if (accessibleSiteIds.length === 0) {
          query = query.is('site_id', null)
        } else {
          const expressions = accessibleSiteIds.map(id => `site_id.eq.${id}`)
          expressions.push('site_id.is.null')
          query = query.or(expressions.join(','))
        }
      }

      // Apply pagination
      const offset = (page - 1) * limit
      query = query.range(offset, offset + limit - 1)

      const { data: rules, error, count } = await query

      if (error) {
        logError(error, 'getSalaryRules')
        
        // If table doesn't exist, return mock data for development
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          // console.log('🧪 Using mock data for salary rules (table not found)')
          const mockRules = [
            {
              id: '1',
              rule_name: '일반 작업자 시급',
              rule_type: 'hourly_rate' as const,
              base_amount: 15000,
              multiplier: 1,
              site_id: null,
              role: 'worker',
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            {
              id: '2', 
              rule_name: '현장관리자 일급',
              rule_type: 'daily_rate' as const,
              base_amount: 200000,
              multiplier: 1,
              site_id: null,
              role: 'site_manager',
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            {
              id: '3',
              rule_name: '연장근무 배율',
              rule_type: 'overtime_multiplier' as const,
              base_amount: 0,
              multiplier: 1.5,
              site_id: null,
              role: null,
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ]
          
          return {
            success: true,
            data: {
              rules: mockRules,
              total: mockRules.length,
              pages: 1
            }
          }
        }
        
        return {
          success: false,
          error: AdminErrors.DATABASE_ERROR
        }
      }

      const filteredRules = auth.isRestricted
        ? (rules || []).filter(rule => !rule.site_id || accessibleSiteIds?.includes(rule.site_id))
        : rules || []

      const totalCount = auth.isRestricted ? filteredRules.length : count || 0
      const totalPages = Math.ceil(totalCount / limit)

      return {
        success: true,
        data: {
          rules: filteredRules,
          total: totalCount,
          pages: totalPages
        }
      }
    } catch (error) {
      logError(error, 'getSalaryRules')
      return {
        success: false,
        error: error instanceof AppError ? error.message : AdminErrors.UNKNOWN_ERROR
      }
    }
  })
}

/**
 * Create or update salary calculation rule
 */
export async function upsertSalaryRule(
  data: Partial<SalaryCalculationRule>
): Promise<AdminActionResult<SalaryCalculationRule>> {
  return withAdminAuth(async (supabase, profile) => {
    try {
      const auth = profile.auth

      // Validate required fields
      const ruleNameError = validateRequired(data.rule_name, '규칙명')
      if (ruleNameError) {
        return { success: false, error: ruleNameError }
      }

      const ruleTypeError = validateRequired(data.rule_type, '규칙 타입')
      if (ruleTypeError) {
        return { success: false, error: ruleTypeError }
      }

      // Validate base_amount - should be a number and >= 0
      if (typeof data.base_amount !== 'number' || data.base_amount < 0) {
        return { success: false, error: '기본 금액은 0 이상의 숫자여야 합니다' }
      }

      const ruleData = {
        rule_name: data.rule_name,
        rule_type: data.rule_type,
        base_amount: Number(data.base_amount), // Ensure it's a proper number
        multiplier: data.multiplier ? Number(data.multiplier) : null,
        conditions: data.conditions,
        site_id: data.site_id || null, // Convert empty string to null
        role: data.role || null, // Convert empty string to null
        is_active: data.is_active ?? true,
        updated_at: new Date().toISOString()
      }

      if (ruleData.site_id) {
        await ensureSiteAccess(supabase, auth, ruleData.site_id)
      }

      if (data.id) {
        const { data: existingRule, error: existingError } = await supabase
          .from('salary_calculation_rules')
          .select('site_id')
          .eq('id', data.id)
          .single()

        if (existingError) {
          logError(existingError, 'upsertSalaryRule')
          return { success: false, error: AdminErrors.DATABASE_ERROR }
        }

        if (existingRule?.site_id) {
          await ensureSiteAccess(supabase, auth, existingRule.site_id)
        }
      }

      let result
      if (data.id) {
        // Update existing rule
        result = await supabase
          .from('salary_calculation_rules')
          .update(ruleData)
          .eq('id', data.id)
          .select()
          .single()
      } else {
        // Create new rule
        result = await supabase
          .from('salary_calculation_rules')
          .insert({
            ...ruleData,
            created_at: new Date().toISOString()
          })
          .select()
          .single()
      }

      if (result.error) {
        logError(result.error, 'upsertSalaryRule')
        
        // If table doesn't exist, return a mock success for development
        if (result.error.code === '42P01' || result.error.message?.includes('does not exist')) {
          // console.log('🧪 Mock success for salary rule upsert (table not found)')
          return {
            success: true,
            data: {
              id: data.id || '1',
              ...ruleData,
              created_at: new Date().toISOString()
            } as unknown,
            message: data.id ? '급여 규칙이 업데이트되었습니다.' : '급여 규칙이 생성되었습니다.'
          }
        }
        
        return { success: false, error: AdminErrors.DATABASE_ERROR }
      }

      return {
        success: true,
        data: result.data,
        message: data.id ? '급여 규칙이 업데이트되었습니다.' : '급여 규칙이 생성되었습니다.'
      }
    } catch (error) {
      logError(error, 'upsertSalaryRule')
      return {
        success: false,
        error: error instanceof AppError ? error.message : AdminErrors.UNKNOWN_ERROR
      }
    }
  })
}

/**
 * Delete salary calculation rules
 */
export async function deleteSalaryRules(ruleIds: string[]): Promise<AdminActionResult<void>> {
  return withAdminAuth(async (supabase, profile) => {
    try {
      const auth = profile.auth

      if (auth.isRestricted) {
        const { data: rulesToDelete, error: fetchError } = await supabase
          .from('salary_calculation_rules')
          .select('id, site_id')
          .in('id', ruleIds)

        if (fetchError) {
          logError(fetchError, 'deleteSalaryRules')
          return { success: false, error: AdminErrors.DATABASE_ERROR }
        }

        const inaccessible = (rulesToDelete || []).filter(rule => rule.site_id && rule.site_id !== null)

        for (const rule of inaccessible) {
          await ensureSiteAccess(supabase, auth, rule.site_id)
        }
      }

      const { error } = await supabase
        .from('salary_calculation_rules')
        .delete()
        .in('id', ruleIds)

      if (error) {
        logError(error, 'deleteSalaryRules')
        
        // If table doesn't exist, return mock success for development
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          // console.log('🧪 Mock success for salary rules deletion (table not found)')
          return {
            success: true,
            message: `${ruleIds.length}개 급여 규칙이 삭제되었습니다.`
          }
        }
        
        return { success: false, error: AdminErrors.DATABASE_ERROR }
      }

      return {
        success: true,
        message: `${ruleIds.length}개 급여 규칙이 삭제되었습니다.`
      }
    } catch (error) {
      logError(error, 'deleteSalaryRules')
      return {
        success: false,
        error: error instanceof AppError ? error.message : AdminErrors.UNKNOWN_ERROR
      }
    }
  })
}

/**
 * Get salary records with calculations
 */
export async function getSalaryRecords(
  page = 1,
  limit = 10,
  search = '',
  status?: 'calculated' | 'approved' | 'paid',
  site_id?: string,
  date_from?: string,
  date_to?: string
): Promise<AdminActionResult<{ records: SalaryRecord[]; total: number; pages: number }>> {
  return withAdminAuth(async (supabase, profile) => {
    try {
      const auth = profile.auth

      await ensureSiteAccess(supabase, auth, site_id)

      let accessibleSiteIds: string[] | null = null
      if (auth.isRestricted && !site_id) {
        accessibleSiteIds = await getAccessibleSiteIds(supabase, auth)
        if (accessibleSiteIds.length === 0) {
          return {
            success: true,
            data: { records: [], total: 0, pages: 0 },
          }
        }
      }

      // Since salary_records table doesn't exist, use daily_reports data to simulate salary records
      let query = supabase
        .from('daily_reports')
        .select(`
          id,
          work_date,
          site_id,
          created_by,
          daily_report_workers(worker_name, work_hours)
        `)
        .order('work_date', { ascending: false })

      // Apply site filter
      if (site_id) {
        query = query.eq('site_id', site_id)
      }

      if (accessibleSiteIds) {
        query = query.in('site_id', accessibleSiteIds)
      }

      // Apply date filters  
      if (date_from) {
        query = query.gte('work_date', date_from)
      }
      if (date_to) {
        query = query.lte('work_date', date_to)
      }

      const { data: dailyReports, error } = await query

      if (error) {
        logError(error, 'getSalaryRecords')
        return { success: false, error: AdminErrors.DATABASE_ERROR }
      }

      const filteredReports = auth.isRestricted
        ? await filterReportsByOrg(supabase, auth, dailyReports || [])
        : dailyReports || []

      const accessibleSiteFilter = accessibleSiteIds || (site_id ? [site_id] : null)

      const sitesQuery = supabase.from('sites').select('id, name')
      const { data: sitesData } = accessibleSiteFilter && accessibleSiteFilter.length > 0
        ? await sitesQuery.in('id', accessibleSiteFilter)
        : await sitesQuery
      const { data: profilesData } = await supabase.from('profiles').select('id, full_name, email, role')
      
      const sites = sitesData || []
      const profiles = profilesData || []

      // Transform daily reports into salary record format
      const salaryRecords: SalaryRecord[] = []

      for (const report of filteredReports) {
        const site = sites.find((s: unknown) => s.id === report.site_id)
        
        for (const workerEntry of report.daily_report_workers || []) {
          const worker = profiles.find((p: unknown) => p.full_name === workerEntry.worker_name)
          
          if (worker) {
            const workHours = parseFloat(workerEntry.work_hours) || 0
            const regularHours = Math.min(workHours, 8) // Regular hours capped at 8
            const overtimeHours = Math.max(workHours - 8, 0) // Overtime beyond 8 hours
            
            // Calculate pay based on role (matching OutputSummary logic)
            const hourlyRate = worker.role === 'site_manager' ? 27500 : 16250 // 220k/8h, 130k/8h
            const basePay = regularHours * hourlyRate
            const overtimePay = overtimeHours * hourlyRate * 1.5 // 1.5x for overtime
            
            salaryRecords.push({
              id: `${report.id}-${worker.id}`,
              worker_id: worker.id,
              worker: {
                full_name: worker.full_name,
                email: worker.email,
                role: worker.role
              },
              site_id: report.site_id,
              site: { name: site?.name || '알 수 없는 현장' },
              work_date: report.work_date,
              regular_hours: regularHours,
              overtime_hours: overtimeHours,
              base_pay: Math.round(basePay),
              overtime_pay: Math.round(overtimePay),
              bonus_pay: 0,
              deductions: 0,
              total_pay: Math.round(basePay + overtimePay),
              status: 'calculated' as const,
              notes: workHours > 8 ? `연장근무 ${overtimeHours.toFixed(1)}시간` : undefined,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
          }
        }
      }

      // Apply status filter (all records are 'calculated' in this implementation)
      const filteredRecords = status ? salaryRecords.filter(r => r.status === status) : salaryRecords

      // Apply search filter
      const searchedRecords = search 
        ? filteredRecords.filter(r => 
            r.worker.full_name.toLowerCase().includes(search.toLowerCase()) ||
            r.site.name.toLowerCase().includes(search.toLowerCase())
          )
        : filteredRecords

      // Calculate pagination
      const totalRecords = searchedRecords.length
      const totalPages = Math.ceil(totalRecords / limit)
      const offset = (page - 1) * limit
      const paginatedRecords = searchedRecords.slice(offset, offset + limit)

      return {
        success: true,
        data: {
          records: paginatedRecords,
          total: totalRecords,
          pages: totalPages
        }
      }

    } catch (error) {
      logError(error, 'getSalaryRecords')
      return {
        success: false,
        error: error instanceof AppError ? error.message : AdminErrors.UNKNOWN_ERROR
      }
    }
  })
}

/**
 * Calculate salaries for a specific date range using daily reports data
 */
export async function calculateSalaries(
  site_id?: string,
  worker_id?: string,
  date_from?: string,
  date_to?: string
): Promise<AdminActionResult<{ calculated_records: number }>> {
  return withAdminAuth(async (supabase, profile) => {
    try {
      const auth = profile.auth

      await ensureSiteAccess(supabase, auth, site_id)

      let accessibleSiteIds: string[] | null = null
      if (auth.isRestricted && !site_id) {
        accessibleSiteIds = await getAccessibleSiteIds(supabase, auth)
        if (accessibleSiteIds.length === 0) {
          return {
            success: true,
            data: { calculated_records: 0 },
            message: '계산할 급여 데이터가 없습니다.',
          }
        }
      }

      // Get daily reports with worker hours data
      let dailyReportsQuery = supabase
        .from('daily_reports')
        .select(`
          id,
          site_id,
          work_date,
          daily_report_workers(worker_name, work_hours)
        `)
        .gte('work_date', date_from || new Date().toISOString().split('T')[0])
        .lte('work_date', date_to || new Date().toISOString().split('T')[0])

      if (site_id) {
        dailyReportsQuery = dailyReportsQuery.eq('site_id', site_id)
      }

      if (accessibleSiteIds) {
        dailyReportsQuery = dailyReportsQuery.in('site_id', accessibleSiteIds)
      }

      const { data: dailyReportsData, error: dailyReportsError } = await dailyReportsQuery

      if (dailyReportsError) {
        logError(dailyReportsError, 'calculateSalaries')
        return { success: false, error: `Database Error: ${dailyReportsError.message}` }
      }

      const filteredReports = auth.isRestricted
        ? await filterReportsByOrg(supabase, auth, dailyReportsData || [])
        : dailyReportsData || []

      // Get salary rules
      const { data: rulesData, error: rulesError } = await supabase
        .from('salary_calculation_rules')
        .select('*')
        .eq('is_active', true)

      if (rulesError) {
        logError(rulesError, 'calculateSalaries')
        return { success: false, error: `Rules Error: ${rulesError.message}` }
      }

      // Get worker profiles to match names to IDs
      const { data: workersData, error: workersError } = await supabase
        .from('profiles')
        .select('id, full_name, role')

      if (workersError) {
        logError(workersError, 'calculateSalaries')
        return { success: false, error: `Workers Error: ${workersError.message}` }
      }

      const accessibleRules = auth.isRestricted
        ? (rulesData || []).filter(rule => !rule.site_id || (accessibleSiteIds || [site_id]).includes(rule.site_id))
        : rulesData || []

      const workers = workersData || []
      const calculatedRecords = []
      const recordMap = new Map() // To track unique worker+date combinations

      for (const report of filteredReports) {
        for (const workerEntry of report.daily_report_workers || []) {
          // Find worker profile by name
          const worker = workers.find((w: unknown) => w.full_name === workerEntry.worker_name)
          if (!worker) {
            continue
          }

          // Apply worker filter if specified
          if (worker_id && worker.id !== worker_id) {
            continue
          }

          const workHours = parseFloat(workerEntry.work_hours) || 0
          if (workHours <= 0) continue

          // Create unique key for worker+date combination (without site_id to aggregate across sites)
          const uniqueKey = `${worker.id}_${report.work_date}`
          
          // If we already have a record for this worker+date, aggregate the hours
          if (recordMap.has(uniqueKey)) {
            const existingRecord = recordMap.get(uniqueKey)
            existingRecord.workHours += workHours
            continue
          }

          // Convert work_hours (공수) to actual hours (1 공수 = 8시간)
          const actualHours = workHours * 8
          const regularHours = Math.min(actualHours, 8)
          const overtimeHours = Math.max(actualHours - 8, 0)

          // Find applicable rules
          const hourlyRule = accessibleRules.find((r: unknown) => 
            r.rule_type === 'hourly_rate' && 
            (!r.site_id || r.site_id === report.site_id) &&
            (!r.role || r.role === worker.role)
          )
          
          const dailyRule = accessibleRules.find((r: unknown) => 
            r.rule_type === 'daily_rate' && 
            (!r.site_id || r.site_id === report.site_id) &&
            (!r.role || r.role === worker.role)
          )
          
          const overtimeRule = accessibleRules.find((r: unknown) => 
            r.rule_type === 'overtime_multiplier' && 
            (!r.site_id || r.site_id === report.site_id)
          )

          // Store the record data for aggregation (use first site encountered for display)
          recordMap.set(uniqueKey, {
            worker,
            site_id: report.site_id, // This will be the first site encountered for this worker on this date
            work_date: report.work_date,
            workHours,
            hourlyRule,
            dailyRule,
            overtimeRule
          })
        }
      }

      // Process aggregated records
      for (const [uniqueKey, recordData] of Array.from(recordMap.entries())) {
        const { worker, site_id, work_date, workHours, hourlyRule, dailyRule, overtimeRule } = recordData
        
        // Convert work_hours (공수) to actual hours (1 공수 = 8시간)
        const actualHours = workHours * 8
        const regularHours = Math.min(actualHours, 8)
        const overtimeHours = Math.max(actualHours - 8, 0)

        let basePay = 0
        let overtimePay = 0

        if (dailyRule) {
          // Use daily rate calculation (공수 기반)
          basePay = workHours * dailyRule.base_amount
        } else if (hourlyRule) {
          // Use hourly rate calculation
          const hourlyRate = hourlyRule.base_amount
          basePay = regularHours * hourlyRate
          
          if (overtimeHours > 0) {
            const overtimeMultiplier = overtimeRule?.multiplier || 1.5
            overtimePay = overtimeHours * hourlyRate * overtimeMultiplier
          }
        } else {
          // Default calculation - assume 150,000 per day (1 공수)
          basePay = workHours * 150000
        }

        const totalPay = basePay + overtimePay

        calculatedRecords.push({
          id: crypto.randomUUID(),
          worker_id: worker.id,
          site_id,
          work_date,
          regular_hours: workHours, // Store work_hours (공수) in regular_hours
          overtime_hours: overtimeHours / 8, // Convert back to 공수 for overtime
          base_pay: Math.round(basePay),
          overtime_pay: Math.round(overtimePay),
          bonus_pay: 0,
          deductions: 0,
          total_pay: Math.round(totalPay),
          status: 'calculated',
          notes: `공수: ${workHours}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      }

      // Insert calculated records
      if (calculatedRecords.length > 0) {
        // First, delete existing records for the date range to avoid conflicts
        let deleteQuery = supabase
          .from('salary_records')
          .delete()
          .gte('work_date', date_from || new Date().toISOString().split('T')[0])
          .lte('work_date', date_to || new Date().toISOString().split('T')[0])
          .eq('status', 'calculated') // Only delete calculated records, not finalized ones

        // Apply same filters as used for calculation
        if (site_id) {
          deleteQuery = deleteQuery.eq('site_id', site_id)
        }
        if (worker_id) {
          deleteQuery = deleteQuery.eq('worker_id', worker_id)
        }
        if (accessibleSiteIds) {
          deleteQuery = deleteQuery.in('site_id', accessibleSiteIds)
        }

        const { error: deleteError } = await deleteQuery

        if (deleteError) {
          logError(deleteError, 'calculateSalaries')
          return { success: false, error: `Delete Error: ${deleteError.message}` }
        }

        // Insert new records
        const { error: insertError } = await supabase
          .from('salary_records')
          .insert(calculatedRecords)

        if (insertError) {
          logError(insertError, 'calculateSalaries')
          return { success: false, error: `Insert Error: ${insertError.message}` }
        }
      }

      return {
        success: true,
        data: { calculated_records: calculatedRecords.length },
        message: `${calculatedRecords.length}개 급여 계산이 완료되었습니다.`
      }
    } catch (error) {
      logError(error, 'calculateSalaries')
      return {
        success: false,
        error: error instanceof AppError ? error.message : AdminErrors.UNKNOWN_ERROR
      }
    }
  })
}

/**
 * Approve salary records (bulk operation)
 */
export async function approveSalaryRecords(recordIds: string[]): Promise<AdminActionResult<void>> {
  return withAdminAuth(async (supabase, profile) => {
    try {
      const auth = profile.auth

      await ensureSalaryRecordsAccess(supabase, auth, recordIds)

      const { error } = await supabase
        .from('salary_records')
        .update({
          status: 'approved',
          updated_at: new Date().toISOString()
        })
        .in('id', recordIds)

      if (error) {
        logError(error, 'approveSalaryRecords')
        
        // If table doesn't exist, return mock success for development
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          // console.log('🧪 Mock success for salary approval (table not found)')
          return {
            success: true,
            message: `${recordIds.length}개 급여 기록이 승인되었습니다.`
          }
        }
        
        return { success: false, error: AdminErrors.DATABASE_ERROR }
      }

      return {
        success: true,
        message: `${recordIds.length}개 급여 기록이 승인되었습니다.`
      }
    } catch (error) {
      logError(error, 'approveSalaryRecords')
      return {
        success: false,
        error: error instanceof AppError ? error.message : AdminErrors.UNKNOWN_ERROR
      }
    }
  })
}

/**
 * Get salary statistics
 */
export async function getSalaryStats(
  site_id?: string,
  worker_id?: string,
  date_from?: string,
  date_to?: string
): Promise<AdminActionResult<SalaryStats>> {
  return withAdminAuth(async (supabase, profile) => {
    try {
      const auth = profile.auth

      await ensureSiteAccess(supabase, auth, site_id)

      let accessibleSiteIds: string[] | null = null
      if (auth.isRestricted && !site_id) {
        accessibleSiteIds = await getAccessibleSiteIds(supabase, auth)

        if (accessibleSiteIds.length === 0) {
          const emptyStats: SalaryStats = {
            total_workers: 0,
            pending_calculations: 0,
            approved_payments: 0,
            total_payroll: 0,
            average_daily_pay: 0,
            overtime_percentage: 0,
          }
          return { success: true, data: emptyStats }
        }
      }

      let query = supabase
        .from('salary_records')
        .select('*')

      if (site_id) {
        query = query.eq('site_id', site_id)
      }

      if (accessibleSiteIds) {
        query = query.in('site_id', accessibleSiteIds)
      }

      if (worker_id) {
        query = query.eq('worker_id', worker_id)
      }

      if (date_from) {
        query = query.gte('work_date', date_from)
      }

      if (date_to) {
        query = query.lte('work_date', date_to)
      }

      const { data: records, error } = await query

      if (error) {
        logError(error, 'getSalaryStats')
        
        // If table doesn't exist, return mock data for development
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          // console.log('🧪 Using mock data for salary stats (table not found)')
          const mockStats: SalaryStats = {
            total_workers: 15,
            pending_calculations: 5,
            approved_payments: 8,
            total_payroll: 2500000,
            average_daily_pay: 156250,
            overtime_percentage: 15.5
          }
          
          return {
            success: true,
            data: mockStats
          }
        }
        
        return { success: false, error: AdminErrors.DATABASE_ERROR }
      }

      const totalWorkers = new Set(records?.map((r: unknown) => r.worker_id)).size
      const pendingCalculations = records?.filter((r: unknown) => r.status === 'calculated').length || 0
      const approvedPayments = records?.filter((r: unknown) => r.status === 'approved').length || 0
      const totalPayroll = records?.reduce((sum: number, r: unknown) => sum + (r.total_pay || 0), 0) || 0
      const averageDailyPay = records?.length ? totalPayroll / records.length : 0
      const totalHours = records?.reduce((sum: number, r: unknown) => sum + (r.regular_hours || 0) + (r.overtime_hours || 0), 0) || 0
      const overtimeHours = records?.reduce((sum: number, r: unknown) => sum + (r.overtime_hours || 0), 0) || 0
      const overtimePercentage = totalHours > 0 ? (overtimeHours / totalHours) * 100 : 0

      const stats: SalaryStats = {
        total_workers: totalWorkers,
        pending_calculations: pendingCalculations,
        approved_payments: approvedPayments,
        total_payroll: totalPayroll,
        average_daily_pay: averageDailyPay,
        overtime_percentage: overtimePercentage
      }

      return {
        success: true,
        data: stats
      }
    } catch (error) {
      logError(error, 'getSalaryStats')
      return {
        success: false,
        error: error instanceof AppError ? error.message : AdminErrors.UNKNOWN_ERROR
      }
    }
  })
}

/**
 * Get available sites for salary management
 */
export async function getAvailableSitesForSalary(): Promise<AdminActionResult<Array<{ id: string; name: string }>>> {
  return withAdminAuth(async (supabase, profile) => {
    try {
      const auth = profile.auth

      const baseQuery = supabase
        .from('sites')
        .select('id, name')
        .neq('status', 'inactive')
        .order('name')

      const { data: sites, error } = auth.isRestricted
        ? await baseQuery.eq('organization_id', auth.restrictedOrgId)
        : await baseQuery

      if (error) {
        logError(error, 'getAvailableSitesForSalary')
        
        // If table doesn't exist, return mock data for development
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          // console.log('🧪 Using mock data for sites (table not found)')
          const mockSites = [
            { id: '1', name: 'A 현장' },
            { id: '2', name: 'B 현장' },
            { id: '3', name: 'C 현장' }
          ]
          
          return {
            success: true,
            data: mockSites
          }
        }
        
        return { success: false, error: AdminErrors.DATABASE_ERROR }
      }

      return {
        success: true,
        data: sites || []
      }
    } catch (error) {
      logError(error, 'getAvailableSitesForSalary')
      return {
        success: false,
        error: error instanceof AppError ? error.message : AdminErrors.UNKNOWN_ERROR
      }
    }
  })
}

/**
 * Get available workers for salary management
 */
export async function getAvailableWorkersForSalary(): Promise<AdminActionResult<Array<{ id: string; name: string }>>> {
  return withAdminAuth(async (supabase, profile) => {
    try {
      const auth = profile.auth

      let accessibleWorkerIds: string[] | null = null
      if (auth.isRestricted) {
        const accessibleSiteIds = await getAccessibleSiteIds(supabase, auth)

        if (accessibleSiteIds.length === 0) {
          return { success: true, data: [] }
        }

        const { data: assignments, error: assignmentsError } = await supabase
          .from('site_assignments')
          .select('user_id, site_id')
          .in('site_id', accessibleSiteIds)
          .eq('is_active', true)

        if (assignmentsError) {
          logError(assignmentsError, 'getAvailableWorkersForSalary')
          return { success: false, error: AdminErrors.DATABASE_ERROR }
        }

        accessibleWorkerIds = Array.from(new Set((assignments || []).map(a => a.user_id)))

        if (accessibleWorkerIds.length === 0) {
          return { success: true, data: [] }
        }
      }

      const { data: workers, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('role', ['worker', 'site_manager', 'customer_manager'])
        .neq('status', 'inactive')
        .order('full_name')

      if (error) {
        logError(error, 'getAvailableWorkersForSalary')
        
        // If table doesn't exist, return mock data for development
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          // console.log('🧪 Using mock data for workers (table not found)')
          const mockWorkers = [
            { id: '1', name: '김철수' },
            { id: '2', name: '이영희' },
            { id: '3', name: '박민수' }
          ]
          
          return {
            success: true,
            data: mockWorkers
          }
        }
        
        return { success: false, error: AdminErrors.DATABASE_ERROR }
      }

      // Transform data to match expected format
      const filteredWorkers = accessibleWorkerIds
        ? (workers || []).filter(worker => accessibleWorkerIds?.includes(worker.id))
        : workers || []

      const transformedWorkers = filteredWorkers.map((worker: unknown) => ({
        id: worker.id,
        name: worker.full_name
      }))

      return {
        success: true,
        data: transformedWorkers
      }
    } catch (error) {
      logError(error, 'getAvailableWorkersForSalary')
      return {
        success: false,
        error: error instanceof AppError ? error.message : AdminErrors.UNKNOWN_ERROR
      }
    }
  })
}

/**
 * Get output summary data for workers by month
 */
export async function getOutputSummary(
  year: number,
  month: number,
  site_id?: string,
  searchTerm?: string
): Promise<AdminActionResult<OutputSummary[]>> {
  return withAdminAuth(async (supabase, profile) => {
    try {
      const auth = profile.auth

      await ensureSiteAccess(supabase, auth, site_id)

      // Calculate date range for the specified month
      const startDate = `${year}-${month.toString().padStart(2, '0')}-01`
      const endDate = new Date(year, month, 0).toISOString().split('T')[0] // Last day of month

      // Get daily reports with worker data for the specified month
      let dailyReportsQuery = supabase
        .from('daily_reports')
        .select(`
          id,
          site_id,
          work_date,
          daily_report_workers(worker_name, work_hours)
        `)
        .gte('work_date', startDate)
        .lte('work_date', endDate)

      if (site_id) {
        dailyReportsQuery = dailyReportsQuery.eq('site_id', site_id)
      }

      let accessibleSiteIds: string[] | null = null
      if (auth.isRestricted && !site_id) {
        accessibleSiteIds = await getAccessibleSiteIds(supabase, auth)

        if (accessibleSiteIds.length === 0) {
          return { success: true, data: [] }
        }

        dailyReportsQuery = dailyReportsQuery.in('site_id', accessibleSiteIds)
      }

      const { data: dailyReportsData, error: dailyReportsError } = await dailyReportsQuery

      if (dailyReportsError) {
        logError(dailyReportsError, 'getOutputSummary')
        return { success: false, error: AdminErrors.DATABASE_ERROR }
      }

      const filteredReports = auth.isRestricted
        ? await filterReportsByOrg(supabase, auth, dailyReportsData || [])
        : dailyReportsData || []

      // Get all worker profiles
      const { data: workersData, error: workersError } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .in('role', ['worker', 'site_manager', 'customer_manager'])
        .neq('status', 'inactive')

      if (workersError) {
        logError(workersError, 'getOutputSummary')
        return { success: false, error: AdminErrors.DATABASE_ERROR }
      }

      // Get all sites
      const sitesQuery = supabase
        .from('sites')
        .select('id, name')
        .neq('status', 'inactive')

      const { data: sitesData, error: sitesError } = accessibleSiteIds && accessibleSiteIds.length > 0
        ? await sitesQuery.in('id', accessibleSiteIds)
        : await sitesQuery

      if (sitesError) {
        logError(sitesError, 'getOutputSummary')
        return { success: false, error: AdminErrors.DATABASE_ERROR }
      }

      // Get salary calculation rules for estimating pay
      const { data: rulesData, error: rulesError } = await supabase
        .from('salary_calculation_rules')
        .select('*')
        .eq('is_active', true)

      if (rulesError) {
        logError(rulesError, 'getOutputSummary')
        // Continue without rules - we'll use default calculations
      }

      const workers = workersData || []
      const sites = sitesData || []
      const rules = rulesData || []
      const reports = filteredReports

      // Group work data by worker and site
      const workSummary: Record<string, {
        worker: unknown
        site: unknown
        work_days: Set<string>
        total_labor_hours: number  // 총 공수
        total_work_hours: number
        total_actual_hours: number
        total_overtime_hours: number
        total_pay: number
        base_pay: number
        overtime_pay: number
        bonus_pay: number
        deductions: number
      }> = {}

      for (const report of reports) {
        const site = sites.find((s: unknown) => s.id === report.site_id)
        if (!site) continue

        for (const workerEntry of report.daily_report_workers || []) {
          const worker = workers.find((w: unknown) => w.full_name === workerEntry.worker_name)
          if (!worker) continue

          // Apply search filter if specified
          if (searchTerm && !worker.full_name.toLowerCase().includes(searchTerm.toLowerCase())) continue

          const key = `${worker.id}-${site.id}`
          
          if (!workSummary[key]) {
            workSummary[key] = {
              worker,
              site,
              work_days: new Set(),
              total_labor_hours: 0,  // 총 공수
              total_work_hours: 0,
              total_actual_hours: 0,
              total_overtime_hours: 0,
              total_pay: 0,
              base_pay: 0,
              overtime_pay: 0,
              bonus_pay: 0,
              deductions: 0
            }
          }

          // 공수 데이터 가져오기 (labor_hours 필드 우선, 없으면 work_hours/8로 계산)
          const laborHours = workerEntry.labor_hours || (parseFloat(workerEntry.work_hours) || 0) / 8
          const workHours = parseFloat(workerEntry.work_hours) || 0
          const regularHours = Math.min(workHours, 8)
          const overtimeHours = Math.max(workHours - 8, 0)

          workSummary[key].work_days.add(report.work_date)
          workSummary[key].total_labor_hours += laborHours  // 총 공수 누적
          workSummary[key].total_work_hours += workHours
          workSummary[key].total_actual_hours += workHours
          workSummary[key].total_overtime_hours += overtimeHours

          // Calculate pay based on role (공수 기반)
          // 현장관리자: 220,000원/공수, 작업자: 130,000원/공수
          const dailyRate = worker.role === 'site_manager' ? 220000 : 130000
          // 공수 기반 계산: 공수 × 일당
          const dayPay = laborHours * dailyRate

          workSummary[key].base_pay += Math.round(dayPay)
          workSummary[key].overtime_pay += 0 // 공수 기반에서는 연장수당 별도 계산 안함
          workSummary[key].total_pay += Math.round(dayPay)
        }
      }

      // Transform to output format 
      const outputData: OutputSummary[] = Object.values(workSummary).map((item: unknown) => {
        const workDatesArray: string[] = Array.from(item.work_days as Set<string>).sort()
        
        return {
          worker_id: item.worker.id,
          worker_name: item.worker.full_name,
          worker_role: item.worker.role,
          site_id: item.site.id,
          site_name: item.site.name,
          work_days_count: item.work_days.size,
          total_labor_hours: item.total_labor_hours,  // 총 공수
          total_work_hours: item.total_work_hours,
          total_actual_hours: item.total_actual_hours,
          total_overtime_hours: item.total_overtime_hours,
          total_pay: item.total_pay,
          base_pay: item.base_pay,
          overtime_pay: item.overtime_pay,
          bonus_pay: item.bonus_pay,
          deductions: item.deductions,
          first_work_date: workDatesArray[0] || '',
          last_work_date: workDatesArray[workDatesArray.length - 1] || '',
          work_dates: workDatesArray
        }
      })

      return {
        success: true,
        data: outputData
      }
    } catch (error) {
      logError(error, 'getOutputSummary')
      return {
        success: false,
        error: error instanceof AppError ? error.message : AdminErrors.UNKNOWN_ERROR
      }
    }
  })
}

/**
 * Get worker calendar data for a specific month
 */
export async function getWorkerCalendarData(
  worker_id: string,
  year: number,
  month: number
): Promise<AdminActionResult<WorkerCalendarData[]>> {
  return withAdminAuth(async (supabase, profile) => {
    try {
      const auth = profile.auth

      // Calculate date range for the specified month
      const startDate = `${year}-${month.toString().padStart(2, '0')}-01`
      const endDate = new Date(year, month, 0).toISOString().split('T')[0] // Last day of month

      // Get worker profile
      const { data: workerData, error: workerError } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', worker_id)
        .single()

      if (workerError || !workerData) {
        logError(workerError, 'getWorkerCalendarData')
        return { success: false, error: AdminErrors.DATABASE_ERROR }
      }

      let accessibleSiteIds: string[] | null = null
      if (auth.isRestricted) {
        accessibleSiteIds = await getAccessibleSiteIds(supabase, auth)

        if (accessibleSiteIds.length === 0) {
          return { success: true, data: [] }
        }

        const { data: assignments, error: assignmentsError } = await supabase
          .from('site_assignments')
          .select('site_id')
          .eq('user_id', worker_id)
          .eq('is_active', true)

        if (assignmentsError) {
          logError(assignmentsError, 'getWorkerCalendarData')
          return { success: false, error: AdminErrors.DATABASE_ERROR }
        }

        const workerSiteIds = new Set((assignments || []).map(a => a.site_id))
        const accessibleWorkerSiteIds = accessibleSiteIds.filter(id => workerSiteIds.has(id))

        if (accessibleWorkerSiteIds.length === 0) {
          return { success: false, error: '해당 작업자의 근무 기록에 접근할 권한이 없습니다.' }
        }

        accessibleSiteIds = accessibleWorkerSiteIds
      }

      // Get daily reports with this worker's data
      let workerReportsQuery = supabase
        .from('daily_reports')
        .select(`
          work_date,
          site_id,
          daily_report_workers(worker_name, work_hours)
        `)
        .gte('work_date', startDate)
        .lte('work_date', endDate)

      if (accessibleSiteIds && accessibleSiteIds.length > 0) {
        workerReportsQuery = workerReportsQuery.in('site_id', accessibleSiteIds)
      }

      const { data: dailyReportsData, error: dailyReportsError } = await workerReportsQuery

      if (dailyReportsError) {
        logError(dailyReportsError, 'getWorkerCalendarData')
        return { success: false, error: AdminErrors.DATABASE_ERROR }
      }

      // Get sites data
      const sitesQuery = supabase.from('sites').select('id, name')
      const { data: sitesData, error: sitesError } = accessibleSiteIds && accessibleSiteIds.length > 0
        ? await sitesQuery.in('id', accessibleSiteIds)
        : await sitesQuery

      if (sitesError) {
        logError(sitesError, 'getWorkerCalendarData')
        return { success: false, error: AdminErrors.DATABASE_ERROR }
      }

      const sites = sitesData || []
      const reports = auth.isRestricted
        ? await filterReportsByOrg(supabase, auth, dailyReportsData || [])
        : dailyReportsData || []

      // Filter and transform data for this specific worker
      const calendarData: WorkerCalendarData[] = []

      for (const report of reports) {
        const site = sites.find((s: unknown) => s.id === report.site_id)
        
        for (const workerEntry of report.daily_report_workers || []) {
          if (workerEntry.worker_name === workerData.full_name) {
            calendarData.push({
              date: report.work_date,
              work_hours: parseFloat(workerEntry.work_hours) || 0,
              site_name: site?.name || '알 수 없는 현장'
            })
            break // Only one entry per worker per day
          }
        }
      }

      return {
        success: true,
        data: calendarData
      }
    } catch (error) {
      logError(error, 'getWorkerCalendarData')
      return {
        success: false,
        error: error instanceof AppError ? error.message : AdminErrors.UNKNOWN_ERROR
      }
    }
  })
}
