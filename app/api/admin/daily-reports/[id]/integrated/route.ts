import { fetchAdditionalPhotosForReport } from '@/lib/admin/site-photos'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { mergeWorkers } from '@/lib/daily-reports/merge-workers'
import { fetchLinkedDrawingsForWorklog } from '@/lib/documents/worklog-links'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const computeWorkerStats = (
  rows: any[],
  fallback?: { total_workers?: number | null; total_labor_hours?: number | null }
) => {
  const normalize = (val: number | undefined | null) => {
    const n = Number(val || 0)
    if (!Number.isFinite(n) || n <= 0) return 0
    // Standard: 8 hours = 1.0 man-day (공수)
    return Number((n / 8).toFixed(1))
  }

  const stats = rows.reduce(
    (acc, row) => {
      acc.total_workers += 1
      const hours = Number(row?.labor_hours ?? row?.work_hours ?? row?.hours ?? 0)
      const overtime = Number(row?.overtime_hours ?? 0)
      if (Number.isFinite(hours)) acc.total_hours += hours
      if (Number.isFinite(overtime)) acc.total_overtime += overtime
      if (row?.is_present === false) acc.absent_workers += 1
      const trade = row?.trade_type || row?.role_type || '기타'
      const skill = row?.skill_level || '일반'
      if (trade) acc.by_trade[trade] = (acc.by_trade[trade] || 0) + 1
      if (skill) acc.by_skill[skill] = (acc.by_skill[skill] || 0) + 1
      return acc
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

  if (stats.total_workers === 0 && typeof fallback?.total_workers === 'number') {
    stats.total_workers = Number(fallback.total_workers) || 0
  }

  // Normalize hours to man-days (공수)
  const final_hours =
    stats.total_hours > 0 ? stats.total_hours : Number(fallback?.total_labor_hours || 0)
  const final_overtime = stats.total_overtime

  return {
    ...stats,
    total_hours: normalize(final_hours),
    total_overtime: normalize(final_overtime),
  }
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    // Use service client in admin route to avoid RLS filtering out accessible rows
    const supabase = (() => {
      try {
        return createServiceRoleClient()
      } catch {
        return createClient()
      }
    })()

    const reportId = params.id

    // Attempt full integrated fetch first
    let reportData: any | null = null
    let reportError: any | null = null
    let mergedWorkerRows: any[] = []
    let authorProfile: any | null = null
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
            customer_company_id,
            organization_id,
            customer_company:customer_company_id(
              id,
              company_name
            ),
            organization:organization_id(
              id,
              name
            ),
            customer_sites(
              relationship_type,
              is_primary_customer,
              customer_companies(
                id,
                name,
                company_name,
                contact_person,
                phone,
                email,
                company_type
              )
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
            uploader:uploaded_by(
              full_name,
              email,
              role
            )
          ),
          partner_companies:partner_company_id(
            id,
            company_name
          ),
          customer_company:customer_company_id(
            id,
            company_name
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

      const [
        { data: legacyWorkers },
        { data: workRecordRows },
        { data: author },
        { data: materials },
        { data: workerAssignments },
        linkedDrawingsData,
      ] = await Promise.all([
        supabase.from('daily_report_workers').select('*').eq('daily_report_id', reportId),
        supabase
          .from('work_records')
          .select(
            `
            id,
            user_id,
            labor_hours,
            work_hours,
            overtime_hours,
            work_type,
            notes,
            metadata,
            profiles:profiles!work_records_user_id_fkey(
              id,
              full_name,
              email,
              phone,
              role,
              avatar_url
            )
          `
          )
          .eq('daily_report_id', reportId),
        supabase
          .from('profiles')
          .select('id, full_name, email, phone, role')
          .eq('id', reportData.created_by)
          .maybeSingle(),
        supabase.from('material_usage').select('*').eq('daily_report_id', reportId),
        supabase
          .from('worker_assignments')
          .select('*, profiles(id, full_name, role)')
          .eq('daily_report_id', reportId),
        fetchLinkedDrawingsForWorklog(reportId, reportData.site_id),
      ])

      // Merge linked drawings into unified_documents
      if (linkedDrawingsData?.length) {
        if (!reportData.unified_documents) reportData.unified_documents = []
        const existingUrls = new Set(reportData.unified_documents.map((d: any) => d.file_url))

        linkedDrawingsData.forEach(ld => {
          if (!existingUrls.has(ld.url)) {
            reportData.unified_documents.push({
              id: ld.id,
              document_type: 'drawing',
              sub_type: ld.documentType,
              file_name: ld.title,
              file_url: ld.url,
              title: ld.title,
              created_at: ld.createdAt,
              uploader: ld.uploader,
              metadata: {
                ...ld,
                source: ld.source,
                markup_document_id: ld.markupId,
              },
            })
          }
        })
      }

      if (workerAssignments && workerAssignments.length > 0) {
        mergedWorkerRows = workerAssignments
      } else {
        mergedWorkerRows = mergeWorkers(legacyWorkers || [], workRecordRows || [])
      }

      authorProfile = author || null
      reportData.material_usage = materials || []
    }

    // Fallback: minimal fetch when integrated join fails or row not found
    if (reportError || !reportData) {
      const { data: minimal, error: minimalErr } = await supabase
        .from('daily_reports')
        .select(
          `id, site_id, work_date, member_name, process_type, component_name, work_process, work_section, before_photos, after_photos, additional_before_photos, additional_after_photos, created_by, total_workers, total_labor_hours, work_content, location_info, additional_notes`
        )
        .eq('id', reportId)
        .maybeSingle()

      if (minimalErr || !minimal) {
        return NextResponse.json({ error: 'Daily report not found' }, { status: 404 })
      }

      // Optionally fetch site name
      const { data: site } = await supabase
        .from('sites')
        .select(
          `
          id, 
          name,
          customer_company_id,
          organization_id,
          customer_company:customer_company_id(id, company_name),
          organization:organization_id(id, name),
          customer_sites(
            is_primary_customer,
            customer_companies(id, name, company_name)
          )
        `
        )
        .eq('id', minimal.site_id)
        .maybeSingle()

      const primaryCustomer = (site as any)?.customer_sites?.find(
        (cs: any) => cs.is_primary_customer
      )?.customer_companies

      // Optionally fetch author
      const { data: author } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('id', minimal.created_by)
        .maybeSingle()

      const { data: fallbackWorkers } = await supabase
        .from('work_records')
        .select(
          `
          id,
          user_id,
          labor_hours,
          work_hours,
          overtime_hours,
          work_type,
          notes,
          metadata,
          profiles:profiles!work_records_user_id_fkey(
            id,
            full_name,
            role,
            email
          )
        `
        )
        .eq('daily_report_id', reportId)
      const fallbackWorkerRows = mergeWorkers([], fallbackWorkers || [])
      const fallbackWorkerStats = computeWorkerStats(fallbackWorkerRows, {
        total_workers: minimal.total_workers,
        total_labor_hours: minimal.total_labor_hours,
      })

      const { data: fallbackMaterials } = await supabase
        .from('material_usage')
        .select('*')
        .eq('daily_report_id', reportId)

      const fallbackResponse = {
        daily_report: {
          ...minimal,
          ...(await fetchAdditionalPhotosForReport(reportId)),
          material_usage: fallbackMaterials || [],
        },
        site,
        worker_assignments: fallbackWorkerRows,
        worker_statistics: fallbackWorkerStats,
        documents: {},
        document_counts: {},
        related_reports: [],
        report_author: author,
        primary_customer: primaryCustomer,
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
    const workerRows = mergedWorkerRows.length ? mergedWorkerRows : mergeWorkers([], [])

    const workerStats = computeWorkerStats(workerRows, {
      total_workers: reportData.total_workers,
      total_labor_hours: reportData.total_labor_hours,
    })

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

    // Extract the most logical primary customer/organization name
    const siteObj = (reportData.sites as any) || (fallbackResponse?.site as any)
    const primaryCustomerJoined = siteObj?.customer_sites?.find(
      (cs: any) => cs.is_primary_customer
    )?.customer_companies

    const primaryCustomerInfo =
      primaryCustomerJoined?.company_name ||
      primaryCustomerJoined?.name ||
      siteObj?.customer_company?.company_name ||
      siteObj?.organization?.name ||
      null

    const response = {
      daily_report: {
        ...reportData,
        sites: undefined, // Remove to avoid duplication
        worker_assignments: undefined,
        unified_documents: undefined,
      },
      site: reportData.sites,
      primary_customer: primaryCustomerInfo ? { name: primaryCustomerInfo } : null,
      primaryCustomerName: primaryCustomerInfo,
      all_customers:
        reportData.sites?.customer_sites?.map((cs: any) => ({
          ...(cs.customer_companies || {}),
          name: cs.customer_companies?.company_name || cs.customer_companies?.name,
          relationship_type: cs.relationship_type,
          is_primary_customer: cs.is_primary_customer,
        })) || [],
      worker_assignments: workerRows,
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
      report_author: authorProfile,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching integrated daily report data:', error)
    return NextResponse.json({ error: 'Failed to fetch daily report data' }, { status: 500 })
  }
}
