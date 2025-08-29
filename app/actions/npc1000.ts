'use server'

import { createClient } from '@/lib/supabase/server'

export interface NPC1000DailyRecord {
  id: string
  site_id: string
  date: string
  incoming_qty: number
  used_qty: number
  stock_qty: number
  work_log_id?: string
  created_by: string
  created_at: string
  daily_report?: {
    id: string
    work_content: string
    created_by: {
      id: string
      full_name: string
    }
  }
}

export async function getNPC1000Records(siteId: string, period?: 'today' | '7days' | '30days' | 'all') {
  try {
    const supabase = createClient()
    
    let query = supabase
      .from('daily_reports')
      .select(`
        id,
        site_id,
        work_date,
        process_type,
        issues,
        npc1000_incoming,
        npc1000_used,
        npc1000_remaining,
        created_at,
        created_by,
      `)
      .eq('site_id', siteId)
      .not('npc1000_used', 'is', null)
      .order('work_date', { ascending: false })

    // Apply date filter based on period
    if (period !== 'all') {
      const today = new Date()
      let startDate: Date

      switch (period) {
        case 'today':
          startDate = new Date(today.setHours(0, 0, 0, 0))
          break
        case '7days':
          startDate = new Date(today.setDate(today.getDate() - 7))
          break
        case '30days':
          startDate = new Date(today.setDate(today.getDate() - 30))
          break
        default:
          startDate = new Date(today.setDate(today.getDate() - 7))
      }

      query = query.gte('work_date', startDate.toISOString())
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching NPC-1000 records:', error)
      return { success: false, error: error.message }
    }

    // Transform data to match the expected format
    const records: NPC1000DailyRecord[] = data?.map(report => ({
      id: report.id,
      site_id: report.site_id,
      date: report.work_date,
      incoming_qty: report.npc1000_incoming || 0,
      used_qty: report.npc1000_used || 0,
      stock_qty: report.npc1000_remaining || 0,
      work_log_id: report.id,
      created_by: report.created_by,
      created_at: report.created_at,
      daily_report: {
        id: report.id,
        work_content: `${report.process_type}${report.issues ? ` - ${report.issues}` : ''}`,
        created_by: {
          id: report.created_by,
          full_name: 'Unknown User'
        }
      }
    })) || []

    // Calculate cumulative totals
    const totals = records.reduce((acc, record) => ({
      totalIncoming: acc.totalIncoming + record.incoming_qty,
      totalUsed: acc.totalUsed + record.used_qty,
      currentStock: records.length > 0 ? records[0].stock_qty : 0 // Latest stock
    }), { totalIncoming: 0, totalUsed: 0, currentStock: 0 })

    return { 
      success: true, 
      data: records,
      totals 
    }
  } catch (error) {
    console.error('Error in getNPC1000Records:', error)
    return { 
      success: false, 
      error: 'Failed to fetch NPC-1000 records' 
    }
  }
}

export async function getNPC1000Summary(siteId: string) {
  try {
    const supabase = createClient()
    
    // Get today's record
    const today = new Date().toISOString().split('T')[0]
    const { data: todayData } = await supabase
      .from('daily_reports')
      .select('npc1000_incoming, npc1000_used, npc1000_remaining')
      .eq('site_id', siteId)
      .eq('work_date', today)
      .single()

    // Get all records for cumulative totals
    const { data: allData } = await supabase
      .from('daily_reports')
      .select('npc1000_incoming, npc1000_used, npc1000_remaining, work_date')
      .eq('site_id', siteId)
      .not('npc1000_used', 'is', null)
      .order('work_date', { ascending: false })

    const summary = {
      today: {
        incoming: todayData?.npc1000_incoming || 0,
        used: todayData?.npc1000_used || 0,
        stock: todayData?.npc1000_remaining || 0
      },
      cumulative: {
        totalIncoming: allData?.reduce((sum, r) => sum + (r.npc1000_incoming || 0), 0) || 0,
        totalUsed: allData?.reduce((sum, r) => sum + (r.npc1000_used || 0), 0) || 0,
        currentStock: allData && allData.length > 0 ? (allData[0].npc1000_remaining || 0) : 0
      }
    }

    return { success: true, data: summary }
  } catch (error) {
    console.error('Error in getNPC1000Summary:', error)
    return { success: false, error: 'Failed to fetch NPC-1000 summary' }
  }
}