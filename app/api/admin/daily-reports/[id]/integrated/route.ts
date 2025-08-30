import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const reportId = params.id

    // Get integrated daily report data with all relationships
    const { data: reportData, error: reportError } = await supabase
      .from('daily_reports')
      .select(`
        *,
        sites(
          id,
          name,
          address,
          status,
          start_date,
          end_date,
          manager_name,
          safety_manager_name,
          customer_sites(
            relationship_type,
            is_primary_customer,
            customer_companies(
              id,
              name,
              contact_person,
              phone,
              email,
              company_type
            )
          )
        ),
        worker_assignments(
          id,
          role_type,
          trade_type,
          skill_level,
          labor_hours,
          hourly_rate,
          overtime_hours,
          is_present,
          absence_reason,
          notes,
          profiles(
            id,
            full_name,
            email,
            phone,
            role,
            avatar_url
          )
        ),
        unified_documents(
          id,
          document_type,
          sub_type,
          file_name,
          file_url,
          title,
          description,
          photo_metadata,
          receipt_metadata,
          created_at,
          uploaded_by,
          profiles!unified_documents_uploaded_by_fkey(
            full_name,
            role
          )
        ),
        profiles!daily_reports_created_by_fkey(
          id,
          full_name,
          email,
          phone,
          role
        )
      `)
      .eq('id', reportId)
      .single()

    if (reportError) {
      return NextResponse.json({ error: 'Daily report not found' }, { status: 404 })
    }

    // Get related daily reports from the same site
    const { data: relatedReports } = await supabase
      .from('daily_reports')
      .select(`
        id,
        work_date,
        member_name,
        process_type,
        total_workers,
        status,
        created_at
      `)
      .eq('site_id', reportData.site_id)
      .neq('id', reportId)
      .order('work_date', { ascending: false })
      .limit(10)

    // Calculate labor statistics
    const workerStats = reportData.worker_assignments?.reduce((stats, assignment) => {
      stats.total_workers++
      stats.total_hours += assignment.labor_hours || 0
      stats.total_overtime += assignment.overtime_hours || 0
      
      if (!assignment.is_present) {
        stats.absent_workers++
      }

      // Count by trade type
      const trade = assignment.trade_type || '기타'
      stats.by_trade[trade] = (stats.by_trade[trade] || 0) + 1

      // Count by skill level
      const skill = assignment.skill_level || '견습'
      stats.by_skill[skill] = (stats.by_skill[skill] || 0) + 1

      return stats
    }, {
      total_workers: 0,
      total_hours: 0,
      total_overtime: 0,
      absent_workers: 0,
      by_trade: {} as Record<string, number>,
      by_skill: {} as Record<string, number>
    }) || {
      total_workers: 0,
      total_hours: 0,
      total_overtime: 0,
      absent_workers: 0,
      by_trade: {},
      by_skill: {}
    }

    // Organize documents by type
    const documentsByType = reportData.unified_documents?.reduce((acc, doc) => {
      const type = doc.document_type
      if (!acc[type]) acc[type] = []
      acc[type].push(doc)
      return acc
    }, {} as Record<string, any[]>) || {}

    // Get primary customer
    const primaryCustomer = reportData.sites?.customer_sites?.find(cs => cs.is_primary_customer)

    // Calculate material usage
    const materialUsage = {
      npc1000_incoming: reportData.npc1000_incoming || 0,
      npc1000_used: reportData.npc1000_used || 0,
      npc1000_remaining: reportData.npc1000_remaining || 0,
      usage_rate: reportData.npc1000_incoming ? 
        ((reportData.npc1000_used || 0) / reportData.npc1000_incoming * 100).toFixed(1) + '%' : '0%'
    }

    const response = {
      daily_report: {
        ...reportData,
        sites: undefined, // Remove to avoid duplication
        worker_assignments: undefined,
        unified_documents: undefined
      },
      site: reportData.sites,
      primary_customer: primaryCustomer?.customer_companies,
      all_customers: reportData.sites?.customer_sites?.map(cs => ({
        ...cs.customer_companies,
        relationship_type: cs.relationship_type,
        is_primary_customer: cs.is_primary_customer
      })) || [],
      worker_assignments: reportData.worker_assignments || [],
      worker_statistics: workerStats,
      documents: documentsByType,
      document_counts: Object.entries(documentsByType).reduce((acc, [type, docs]) => {
        acc[type] = docs.length
        return acc
      }, {} as Record<string, number>),
      material_usage: materialUsage,
      related_reports: relatedReports || [],
      report_author: reportData.profiles
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error fetching integrated daily report data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch daily report data' },
      { status: 500 }
    )
  }
}