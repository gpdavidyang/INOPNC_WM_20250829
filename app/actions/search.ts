'use server'

import { createClient } from '@/lib/supabase/server'
import { validateSupabaseResponse, logError, AppError } from '@/lib/error-handling'
import type { 
  SearchOptions, 
  SearchResult, 
  AppliedFilter,
  SearchOperator 
} from '@/lib/search/types'
import type { DailyReport, Site } from '@/types'

export async function searchDailyReports(
  options: SearchOptions
): Promise<{ success: boolean; data?: SearchResult<DailyReport>; error?: string }> {
  try {
    const supabase = createClient()
    let query = supabase
      .from('daily_reports')
      .select(`
        *,
        profiles!daily_reports_created_by_fkey(
          id,
          full_name,
          role
        ),
        sites!daily_reports_site_id_fkey(
          id,
          name,
          location
        )
      `)

    // Apply global search query
    if (options.query && options.query.trim()) {
      const globalQuery = options.query.trim()
      query = query.or(`
        member_name.ilike.%${globalQuery}%,
        process_type.ilike.%${globalQuery}%,
        issues.ilike.%${globalQuery}%,
        work_description.ilike.%${globalQuery}%
      `)
    }

    // Apply specific filters
    const appliedFilters: AppliedFilter[] = []
    
    for (const filter of options.filters) {
      const { field, operator, value, values } = filter
      
      if (value === '' && (!values || values.length === 0)) {
        continue
      }

      // Build the query based on operator
      switch (operator) {
        case 'contains':
          if (value) {
            query = query.ilike(field, `%${value}%`)
            appliedFilters.push({
              field,
              operator,
              value,
              label: getFieldLabel(field),
              displayValue: `"${value}" 포함`
            })
          }
          break

        case 'equals':
          if (value !== '') {
            query = query.eq(field, value)
            appliedFilters.push({
              field,
              operator,
              value,
              label: getFieldLabel(field),
              displayValue: getDisplayValue(field, value)
            })
          }
          break

        case 'startsWith':
          if (value) {
            query = query.ilike(field, `${value}%`)
            appliedFilters.push({
              field,
              operator,
              value,
              label: getFieldLabel(field),
              displayValue: `"${value}"로 시작`
            })
          }
          break

        case 'endsWith':
          if (value) {
            query = query.ilike(field, `%${value}`)
            appliedFilters.push({
              field,
              operator,
              value,
              label: getFieldLabel(field),
              displayValue: `"${value}"로 끝남`
            })
          }
          break

        case 'gte':
          if (value !== '') {
            query = query.gte(field, value)
            appliedFilters.push({
              field,
              operator,
              value,
              label: getFieldLabel(field),
              displayValue: `${formatValue(field, value)} 이상`
            })
          }
          break

        case 'lte':
          if (value !== '') {
            query = query.lte(field, value)
            appliedFilters.push({
              field,
              operator,
              value,
              label: getFieldLabel(field),
              displayValue: `${formatValue(field, value)} 이하`
            })
          }
          break

        case 'between':
          if (values && values.length === 2 && values[0] !== '' && values[1] !== '') {
            query = query.gte(field, values[0]).lte(field, values[1])
            appliedFilters.push({
              field,
              operator,
              value,
              values,
              label: getFieldLabel(field),
              displayValue: `${formatValue(field, values[0])} ~ ${formatValue(field, values[1])}`
            })
          }
          break
      }
    }

    // Apply sorting
    if (options.sortBy) {
      query = query.order(options.sortBy, { 
        ascending: options.sortOrder === 'asc' 
      })
    }

    // Get total count first
    const { count } = await supabase
      .from('daily_reports')
      .select('*', { count: 'exact', head: true })

    // Apply pagination
    const limit = options.limit || 50
    const offset = options.offset || 0
    
    if (limit) {
      query = query.range(offset, offset + limit - 1)
    }

    const { data, error } = await query

    validateSupabaseResponse(data, error)

    const totalFiltered = data?.length || 0
    const hasMore = totalFiltered === limit

    return {
      success: true,
      data: {
        items: data as DailyReport[],
        total: count || 0,
        hasMore,
        filters: appliedFilters
      }
    }
  } catch (error) {
    logError(error, 'searchDailyReports')
    return {
      success: false,
      error: error instanceof AppError ? error.message : '검색 중 오류가 발생했습니다.'
    }
  }
}

export async function getQuickFilterResults(
  filterId: string,
  quickFilters: any[]
): Promise<{ success: boolean; data?: SearchResult<DailyReport>; error?: string }> {
  try {
    const quickFilter = quickFilters.find(f => f.id === filterId)
    if (!quickFilter) {
      throw new AppError('빠른 필터를 찾을 수 없습니다.')
    }

    const searchOptions: SearchOptions = {
      filters: quickFilter.filters,
      sortBy: 'work_date',
      sortOrder: 'desc'
    }

    return await searchDailyReports(searchOptions)
  } catch (error) {
    logError(error, 'getQuickFilterResults')
    return {
      success: false,
      error: error instanceof AppError ? error.message : '빠른 필터 검색 중 오류가 발생했습니다.'
    }
  }
}

// Helper functions
function getFieldLabel(field: string): string {
  const labels: Record<string, string> = {
    work_date: '작업일자',
    member_name: '담당자명',
    process_type: '공정',
    status: '상태',
    site_id: '현장',
    total_workers: '작업인원',
    npc1000_used: 'NPC-1000 사용량',
    npc1000_remaining: 'NPC-1000 잔량',
    issues: '특이사항',
    created_at: '작성일',
    submitted_at: '제출일',
    approved_at: '승인일'
  }
  return labels[field] || field
}

function formatValue(field: string, value: any): string {
  if (field.includes('date') || field.includes('_at')) {
    return new Date(value).toLocaleDateString('ko-KR')
  }
  if (field.includes('npc1000')) {
    return `${value}kg`
  }
  if (field === 'total_workers') {
    return `${value}명`
  }
  return String(value)
}

function getDisplayValue(field: string, value: any): string {
  // Handle select field display values
  const selectValues: Record<string, Record<string, string>> = {
    status: {
      draft: '임시저장',
      submitted: '제출됨',
      approved: '승인됨',
      rejected: '반려됨'
    },
    process_type: {
      토공사: '토공사',
      철근공사: '철근공사',
      거푸집공사: '거푸집공사',
      콘크리트공사: '콘크리트공사',
      조적공사: '조적공사',
      방수공사: '방수공사',
      타일공사: '타일공사',
      도장공사: '도장공사',
      기타: '기타'
    }
  }

  if (selectValues[field] && selectValues[field][value]) {
    return selectValues[field][value]
  }

  return formatValue(field, value)
}