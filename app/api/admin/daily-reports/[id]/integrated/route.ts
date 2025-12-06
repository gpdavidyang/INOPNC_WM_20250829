import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { fetchAdditionalPhotosForReport } from '@/lib/admin/site-photos'

export const dynamic = 'force-dynamic'

const computeWorkerStats = (rows: any[]) =>
  rows.reduce(
    (stats, row) => {
      stats.total_workers += 1
      const hours = Number(row?.labor_hours ?? row?.hours ?? 0)
      const overtime = Number(row?.overtime_hours ?? 0)
      if (Number.isFinite(hours)) stats.total_hours += hours
      if (Number.isFinite(overtime)) stats.total_overtime += overtime
      if (row?.is_present === false) stats.absent_workers += 1
      const trade = row?.trade_type || row?.role_type || '기타'
      const skill = row?.skill_level || '일반'
      if (trade) stats.by_trade[trade] = (stats.by_trade[trade] || 0) + 1
      if (skill) stats.by_skill[skill] = (stats.by_skill[skill] || 0) + 1
      return stats
    },
    {
      total_workers: 0,
      total_hours: 0,
      total_overtime: 0,
      absent_workers: 0,
      by_trade: {} as Record<string, number>,
      by_skill: {} as Record<string, number>,
    }
  )

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    // Use service client in admin route to avoid RLS filtering out accessible rows
    const supabase = (() => {
      try {
        return createServiceClient()
      } catch {
        return createClient()
      }
    })()

    const reportId = params.id

    // Attempt full integrated fetch first
    let reportData: any | null = null
    let reportError: any | null = null
    try {
      const r = await supabase
        .from('daily_reports')
        .select(
          `
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
          worker_entries(
            id,
            worker_id,
            worker_name,
            labor_hours,
            notes,
            is_present,
            absence_reason,
            role_type,
            trade_type,
            skill_level
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
        `
        )
        .eq('id', reportId)
        .single()
      reportData = r.data
      reportError = r.error
    } catch (e) {
      reportError = e
      reportData = null
    }

    if (reportData) {
      delete (reportData as any).issues
      delete (reportData as any).safety_notes
      const additionalNotes = reportData.additional_notes
      if (additionalNotes && typeof additionalNotes === 'object') {
        delete (additionalNotes as any).safetyNotes
        delete (additionalNotes as any).safety_notes
      }
      const { additional_before_photos, additional_after_photos } =
        await fetchAdditionalPhotosForReport(reportId)
      reportData.additional_before_photos = additional_before_photos
      reportData.additional_after_photos = additional_after_photos
    }

    // Fallback: minimal fetch when integrated join fails or row not found
    if (reportError || !reportData) {
      const { data: minimal, error: minimalErr } = await supabase
        .from('daily_reports')
        .select(
          `id, site_id, work_date, member_name, process_type, component_name, work_process, work_section, before_photos, after_photos, additional_before_photos, additional_after_photos, created_by, worker_entries(id, worker_id, worker_name, labor_hours, notes)`
        )
        .eq('id', reportId)
        .maybeSingle()

      if (minimalErr || !minimal) {
        return NextResponse.json({ error: 'Daily report not found' }, { status: 404 })
      }

      // Optionally fetch site name
      const { data: site } = await supabase
        .from('sites')
        .select('id, name')
        .eq('id', minimal.site_id)
        .maybeSingle()

      // Optionally fetch author
      const { data: author } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('id', minimal.created_by)
        .maybeSingle()

      const fallbackWorkerRows = Array.isArray(minimal.worker_entries) ? minimal.worker_entries : []
      const fallbackWorkerStats = computeWorkerStats(fallbackWorkerRows)

      const fallbackResponse = {
        daily_report: {
          ...minimal,
          ...(await fetchAdditionalPhotosForReport(reportId)),
        },
        site,
        worker_assignments: fallbackWorkerRows,
        worker_entries: fallbackWorkerRows,
        worker_statistics: fallbackWorkerStats,
        documents: {},
        document_counts: {},
        related_reports: [],
        report_author: author,
      }

      return NextResponse.json(fallbackResponse)
    }

    // Get related daily reports from the same site
    const { data: relatedReports } = await supabase
      .from('daily_reports')
      .select(
        `
        id,
        work_date,
        member_name,
        process_type,
        total_workers,
        status,
        created_at
      `
      )
      .eq('site_id', reportData.site_id)
      .neq('id', reportId)
      .order('work_date', { ascending: false })
      .limit(10)

    // Calculate labor statistics
    const workerRows =
      (Array.isArray(reportData.worker_assignments) && reportData.worker_assignments.length > 0
        ? reportData.worker_assignments
        : Array.isArray(reportData.worker_entries)
          ? reportData.worker_entries
          : []) || []

    const workerStats = computeWorkerStats(workerRows)

    // Organize documents by type
    const documentsByType =
      reportData.unified_documents?.reduce(
        (acc: unknown, doc: unknown) => {
          const type = doc.document_type
          if (!acc[type]) acc[type] = []
          acc[type].push(doc)
          return acc
        },
        {} as Record<string, any[]>
      ) || {}

    // Get primary customer
    const primaryCustomer = reportData.sites?.customer_sites?.find(
      (cs: unknown) => cs.is_primary_customer
    )

    // Calculate material usage
    const materialUsage = {
      npc1000_incoming: reportData.npc1000_incoming || 0,
      npc1000_used: reportData.npc1000_used || 0,
      npc1000_remaining: reportData.npc1000_remaining || 0,
      usage_rate: reportData.npc1000_incoming
        ? (((reportData.npc1000_used || 0) / reportData.npc1000_incoming) * 100).toFixed(1) + '%'
        : '0%',
    }

    const response = {
      daily_report: {
        ...reportData,
        sites: undefined, // Remove to avoid duplication
        worker_assignments: undefined,
        worker_entries: undefined,
        unified_documents: undefined,
      },
      site: reportData.sites,
      primary_customer: primaryCustomer?.customer_companies,
      all_customers:
        reportData.sites?.customer_sites?.map((cs: unknown) => ({
          ...cs.customer_companies,
          relationship_type: cs.relationship_type,
          is_primary_customer: cs.is_primary_customer,
        })) || [],
      worker_assignments: workerRows,
      worker_entries: Array.isArray(reportData.worker_entries) ? reportData.worker_entries : [],
      worker_statistics: workerStats,
      documents: documentsByType,
      document_counts: Object.entries(documentsByType).reduce(
        (acc, [type, docs]) => {
          acc[type] = (docs as any[]).length
          return acc
        },
        {} as Record<string, number>
      ),
      material_usage: materialUsage,
      related_reports: relatedReports || [],
      report_author: reportData.profiles,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching integrated daily report data:', error)
    return NextResponse.json({ error: 'Failed to fetch daily report data' }, { status: 500 })
  }
}
