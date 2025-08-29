'use server'

import { createClient } from '@/lib/supabase/server'
import { withAdminAuth } from './common'

interface DailyReportsFilter {
  site?: string
  status?: string
  dateFrom?: string
  dateTo?: string
  search?: string
  page?: number
  itemsPerPage?: number
}

export async function getDailyReports(filters: DailyReportsFilter = {}) {
  return withAdminAuth(async (supabase) => {
    const { 
      site, 
      status, 
      dateFrom, 
      dateTo, 
      search, 
      page = 1, 
      itemsPerPage = 20 
    } = filters

    let query = supabase
      .from('daily_reports')
      .select(`
        *,
        sites!inner(name, address)
      `, { count: 'exact' })

    // Apply filters
    if (site) {
      query = query.eq('site_id', site)
    }
    if (status) {
      query = query.eq('status', status)
    }
    if (dateFrom) {
      query = query.gte('work_date', dateFrom)
    }
    if (dateTo) {
      query = query.lte('work_date', dateTo)
    }
    if (search) {
      query = query.or(`member_name.ilike.%${search}%,process_type.ilike.%${search}%`)
    }

    // Pagination
    const from = (page - 1) * itemsPerPage
    const to = from + itemsPerPage - 1

    const { data, error, count } = await query
      .order('work_date', { ascending: false })
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) throw error

    // Enrich with profile data separately to avoid FK issues
    const enrichedReports = await Promise.all(
      (data || []).map(async (report) => {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', report.created_by)
            .single()
          
          return {
            ...report,
            profiles: profile
          }
        } catch (err) {
          // If profile not found, continue without it
          return {
            ...report,
            profiles: null
          }
        }
      })
    )

    return {
      success: true,
      data: {
        reports: enrichedReports,
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / itemsPerPage),
        currentPage: page
      }
    }
  })
}

export async function getDailyReportById(id: string) {
  return withAdminAuth(async (supabase) => {
    const { data, error } = await supabase
      .from('daily_reports')
      .select(`
        *,
        sites(name, address)
      `)
      .eq('id', id)
      .single()

    if (error) throw error

    // Get profile separately
    let profile = null
    if (data?.created_by) {
      try {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', data.created_by)
          .single()
        profile = profileData
      } catch (err) {
        // Profile not found, continue without it
      }
    }

    return {
      success: true,
      data: {
        ...data,
        profiles: profile
      }
    }
  })
}

export async function updateDailyReport(id: string, updates: any) {
  return withAdminAuth(async (supabase) => {
    const { data, error } = await supabase
      .from('daily_reports')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return {
      success: true,
      data
    }
  })
}

export async function deleteDailyReport(id: string) {
  return withAdminAuth(async (supabase) => {
    const { error } = await supabase
      .from('daily_reports')
      .delete()
      .eq('id', id)

    if (error) throw error

    return {
      success: true,
      message: '작업일지가 삭제되었습니다.'
    }
  })
}

export async function getSites() {
  return withAdminAuth(async (supabase) => {
    const { data, error } = await supabase
      .from('sites')
      .select('id, name')
      .eq('status', 'active')
      .order('name')

    if (error) throw error

    return {
      success: true,
      data: data || []
    }
  })
}