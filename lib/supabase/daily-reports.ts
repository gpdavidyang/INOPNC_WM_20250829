import { createClient } from '@/lib/supabase/client'
import { DailyReport } from '@/types'

export async function getDailyReports(siteId?: string) {
  const supabase = createClient()
  
  let query = supabase
    .from('daily_reports')
    .select(`
      *,
      site:sites!inner (
        id,
        name,
        organization_id
      ),
      created_by_profile:profiles!daily_reports_created_by_fkey (
        id,
        full_name,
        email
      )
    `)
    .order('report_date', { ascending: false })
  
  if (siteId) {
    query = query.eq('site_id', siteId)
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error('Error fetching daily reports:', error)
    throw error
  }
  
  return data
}

export async function getDailyReport(id: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('daily_reports')
    .select(`
      *,
      sites!inner (
        id,
        name,
        organization_id
      ),
      created_by_profile:profiles!daily_reports_created_by_fkey (
        id,
        full_name,
        email
      ),
      daily_report_workers (
        id,
        user_id,
        role,
        start_time,
        end_time,
        profiles (
          id,
          full_name,
          email
        )
      )
    `)
    .eq('id', id)
    .single()
  
  if (error) {
    console.error('Error fetching daily report:', error)
    throw error
  }
  
  return data
}

export async function createDailyReport(report: Partial<DailyReport>) {
  const supabase = createClient()
  
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    throw new Error('User not authenticated')
  }
  
  // Check for existing report with same site_id, work_date, and created_by
  const { data: existingReport, error: checkError } = await supabase
    .from('daily_reports')
    .select('id, status')
    .eq('site_id', report.site_id)
    .eq('work_date', report.work_date)
    .eq('created_by', userData.user.id)
    .single()
  
  if (checkError && checkError.code !== 'PGRST116') {
    console.error('Error checking existing daily report:', checkError)
    throw checkError
  }
  
  // If report exists, update it instead of creating new one
  if (existingReport) {
    const { data, error } = await supabase
      .from('daily_reports')
      .update({
        member_name: report.member_name,
        process_type: report.process_type,
        total_workers: report.total_workers,
        npc1000_incoming: report.npc1000_incoming,
        npc1000_used: report.npc1000_used,
        npc1000_remaining: report.npc1000_remaining,
        issues: report.issues,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingReport.id)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating existing daily report:', error)
      throw error
    }
    
    return data
  }
  
  // Create new report if none exists
  const { data, error } = await supabase
    .from('daily_reports')
    .insert({
      site_id: report.site_id,
      work_date: report.work_date,
      member_name: report.member_name,
      process_type: report.process_type,
      total_workers: report.total_workers,
      npc1000_incoming: report.npc1000_incoming || 0,
      npc1000_used: report.npc1000_used || 0,
      npc1000_remaining: report.npc1000_remaining || 0,
      issues: report.issues,
      created_by: userData.user.id,
      status: 'draft' as any
    } as any)
    .select()
    .single()
  
  if (error) {
    console.error('Error creating daily report:', error)
    throw error
  }
  
  return data
}

export async function updateDailyReport(id: string, updates: Partial<DailyReport>) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('daily_reports')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    console.error('Error updating daily report:', error)
    throw error
  }
  
  return data
}

export async function deleteDailyReport(id: string) {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('daily_reports')
    .delete()
    .eq('id', id)
  
  if (error) {
    console.error('Error deleting daily report:', error)
    throw error
  }
}

export async function submitDailyReport(id: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('daily_reports')
    .update({ 
      status: 'submitted',
      submitted_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    console.error('Error submitting daily report:', error)
    throw error
  }
  
  return data
}

export async function approveDailyReport(id: string, approvedBy: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('daily_reports')
    .update({ 
      status: 'approved',
      approved_by: approvedBy,
      approved_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    console.error('Error approving daily report:', error)
    throw error
  }
  
  return data
}

// Partner-specific function to get submitted daily reports only
export async function getPartnerDailyReports(
  siteId?: string, 
  startDate?: string, 
  endDate?: string,
  searchTerm?: string
) {
  const supabase = createClient()
  
  let query = supabase
    .from('daily_reports')
    .select(`
      *,
      site:sites!inner (
        id,
        name,
        organization_id
      ),
      created_by_profile:profiles!daily_reports_created_by_fkey (
        id,
        full_name,
        email
      )
    `)
    .eq('status', 'submitted') // Only show submitted reports to partners
    .order('work_date', { ascending: false })
  
  // Filter by site if specified
  if (siteId && siteId !== 'all') {
    query = query.eq('site_id', siteId)
  }
  
  // Filter by date range if specified
  if (startDate) {
    query = query.gte('work_date', startDate)
  }
  if (endDate) {
    query = query.lte('work_date', endDate)
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error('Error fetching partner daily reports:', error)
    throw error
  }
  
  // Apply search filter on the client side if needed
  if (searchTerm && data) {
    const filtered = data.filter(report => {
      const searchLower = searchTerm.toLowerCase()
      return (
        report.member_name?.toLowerCase().includes(searchLower) ||
        report.process_type?.toLowerCase().includes(searchLower) ||
        report.issues?.toLowerCase().includes(searchLower) ||
        report.created_by_profile?.full_name?.toLowerCase().includes(searchLower) ||
        report.site?.name?.toLowerCase().includes(searchLower)
      )
    })
    return filtered
  }
  
  return data || []
}