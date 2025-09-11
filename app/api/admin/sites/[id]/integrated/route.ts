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

    const siteId = params.id

    // Get integrated site data with all relationships
    const { data: siteData, error: siteError } = await supabase
      .from('sites')
      .select(`
        *,
        customer_sites!inner(
          relationship_type,
          contract_start_date,
          contract_end_date,
          contract_amount,
          is_primary_customer,
          customer_companies(
            id,
            name,
            contact_person,
            phone,
            email,
            company_type
          )
        ),
        daily_reports(
          id,
          work_date,
          member_name,
          process_type,
          total_workers,
          status,
          created_at,
          worker_assignments(
            id,
            role_type,
            trade_type,
            skill_level,
            labor_hours,
            is_present,
            profiles(
              id,
              full_name,
              email,
              phone,
              role
            )
          )
        ),
        unified_documents(
          id,
          document_type,
          sub_type,
          category_type,
          file_name,
          file_url,
          title,
          description,
          created_at,
          uploaded_by,
          profiles!unified_documents_uploaded_by_fkey(
            full_name,
            role
          )
        )
      `)
      .eq('id', siteId)
      .single()

    if (siteError) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 })
    }

    // Get site statistics
    const { data: statsData } = await supabase
      .rpc('get_site_statistics', { site_id_param: siteId })

    // Get recent activities
    const { data: recentActivities } = await supabase
      .from('daily_reports')
      .select(`
        id,
        work_date,
        member_name,
        process_type,
        created_at,
        profiles!daily_reports_created_by_fkey(full_name)
      `)
      .eq('site_id', siteId)
      .order('created_at', { ascending: false })
      .limit(10)

    // Get assigned workers summary
    const { data: workersSummary } = await supabase
      .from('work_records')
      .select(`
        profiles(
          id,
          full_name,
          role,
          phone
        ),
        trade_type,
        skill_level,
        daily_reports(work_date, site_id)
      `)
      .eq('daily_reports.site_id', siteId)
      .order('daily_reports.work_date', { ascending: false })

    // Group workers by profile to avoid duplicates
    const uniqueWorkers = workersSummary?.reduce((acc, assignment) => {
      const profileId = assignment.profiles?.id
      if (profileId && !acc.find(w => w.id === profileId)) {
        acc.push({
          ...assignment.profiles,
          latest_trade_type: assignment.trade_type,
          latest_skill_level: assignment.skill_level,
          assignment_count: workersSummary.filter(w => w.profiles?.id === profileId).length
        })
      }
      return acc
    }, [] as any[]) || []

    // Organize customer information
    const customers = siteData.customer_sites?.map(cs => ({
      ...cs.customer_companies,
      relationship_type: cs.relationship_type,
      contract_start_date: cs.contract_start_date,
      contract_end_date: cs.contract_end_date,
      contract_amount: cs.contract_amount,
      is_primary_customer: cs.is_primary_customer
    })) || []

    const primaryCustomer = customers.find(c => c.is_primary_customer)

    // Organize documents by category type (for new permission system)
    const documentsByCategory = siteData.unified_documents?.reduce((acc, doc) => {
      const category = doc.category_type || 'shared'
      if (!acc[category]) acc[category] = []
      acc[category].push(doc)
      return acc
    }, {} as Record<string, any[]>) || {}

    // Also organize by legacy document type for backward compatibility
    const documentsByType = siteData.unified_documents?.reduce((acc, doc) => {
      const type = doc.document_type
      if (!acc[type]) acc[type] = []
      acc[type].push(doc)
      return acc
    }, {} as Record<string, any[]>) || {}

    const response = {
      site: {
        ...siteData,
        customer_sites: undefined, // Remove to avoid duplication
        daily_reports: undefined,  // Remove to avoid duplication
        unified_documents: undefined // Remove to avoid duplication
      },
      customers,
      primary_customer: primaryCustomer,
      daily_reports: siteData.daily_reports || [],
      documents: documentsByType, // Legacy document structure
      documents_by_category: documentsByCategory, // New categorized structure
      statistics: statsData?.[0] || {
        total_reports: siteData.daily_reports?.length || 0,
        total_workers: uniqueWorkers.length,
        total_documents: siteData.unified_documents?.length || 0,
        shared_documents: documentsByCategory.shared?.length || 0,
        markup_documents: documentsByCategory.markup?.length || 0,
        required_documents: documentsByCategory.required?.length || 0,
        invoice_documents: documentsByCategory.invoice?.length || 0
      },
      recent_activities: recentActivities || [],
      assigned_workers: uniqueWorkers,
      document_counts: Object.entries(documentsByType).reduce((acc, [type, docs]) => {
        acc[type] = docs.length
        return acc
      }, {} as Record<string, number>),
      document_category_counts: Object.entries(documentsByCategory).reduce((acc, [category, docs]) => {
        acc[category] = docs.length
        return acc
      }, {} as Record<string, number>)
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error fetching integrated site data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch site data' },
      { status: 500 }
    )
  }
}