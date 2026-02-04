import { fetchAdditionalPhotosForReport } from '@/lib/admin/site-photos'
import { mergeWorkers } from '@/lib/daily-reports/merge-workers'
import { fetchLinkedDrawingsForWorklog } from '@/lib/documents/worklog-links'
import { calculateWorkerCount } from '@/lib/labor/labor-hour-options'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import type { UnifiedDailyReport } from '@/types/daily-reports'
import { integratedResponseToUnifiedReport, type AdminIntegratedResponse } from './unified-admin'

const getSupabaseForAdmin = () => {
  try {
    return createServiceRoleClient()
  } catch {
    return createClient()
  }
}

const computeWorkerStats = (
  rows: any[],
  fallback?: { total_workers?: number | null; total_labor_hours?: number | null }
) => {
  const stats = rows.reduce(
    (acc, row) => {
      acc.total_workers += 1
      // Normalize to man-days: prioritize labor_hours, fallback to hours/8
      let h = Number(row?.labor_hours ?? 0)
      if (h === 0) {
        h = Number(row?.work_hours ?? row?.hours ?? 0) / 8
      }
      if (Number.isFinite(h)) acc.total_hours += h
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

  if (stats.total_hours === 0 && typeof fallback?.total_labor_hours === 'number') {
    stats.total_hours = (Number(fallback.total_labor_hours) || 0) / 8
  }

  // Apply rounding policy: worker count is ceil of total manpower
  const policyWorkers = calculateWorkerCount(stats.total_hours)
  if (policyWorkers > 0) {
    stats.total_workers = policyWorkers
  } else if (stats.total_workers === 0 && typeof fallback?.total_workers === 'number') {
    stats.total_workers = Number(fallback.total_workers) || 0
  }

  return stats
}

export async function getUnifiedDailyReportForAdmin(
  id: string
): Promise<UnifiedDailyReport | null> {
  const supabase = getSupabaseForAdmin()

  const { data, error } = await supabase
    .from('daily_reports')
    .select(
      `
        *,
        sites!site_id(id, name, address, status, organization_id, organizations(name)),
        created_by_profile:profiles!created_by(id, full_name, email, role),
        document_attachments(
          id,
          document_type,
          file_name,
          file_url,
          file_size,
          uploaded_at,
          uploaded_by
        )
      `
    )
    .eq('id', id)
    .maybeSingle()

  if (error || !data) {
    console.error('[getUnifiedDailyReportForAdmin] failed:', error?.message)
    // Fallback: attempt to build a minimal unified report from basic tables
    try {
      const { data: minimal, error: minimalError } = await supabase
        .from('daily_reports')
        .select('*')
        .eq('id', id)
        .maybeSingle()

      if (minimalError || !minimal) {
        return null
      }

      delete (minimal as any).issues
      delete (minimal as any).safety_notes
      if (minimal.additional_notes && typeof minimal.additional_notes === 'object') {
        delete (minimal.additional_notes as any).safetyNotes
        delete (minimal.additional_notes as any).safety_notes
      }

      const [siteRes, authorRes, workerRes, attachmentRes, assignmentRes, materialRes] =
        await Promise.all([
          supabase
            .from('sites')
            .select('id, name, address, status, organization_id, organizations(name)')
            .eq('id', minimal.site_id)
            .maybeSingle(),
          minimal.created_by
            ? supabase
                .from('profiles')
                .select('id, full_name, role, email')
                .eq('id', minimal.created_by)
                .maybeSingle()
            : Promise.resolve({ data: null, error: null }),
          Promise.resolve({ data: [] }), // Placeholder for work_records
          supabase
            .from('document_attachments')
            .select('id, document_type, file_name, file_url, file_size, uploaded_at, uploaded_by')
            .eq('daily_report_id', id),
          supabase
            .from('worker_assignments')
            .select('*, profiles(id, full_name, role)')
            .eq('daily_report_id', id),
          supabase.from('material_usage').select('*').eq('daily_report_id', id),
        ])

      const fallbackWorkerRows = assignmentRes.data?.length
        ? assignmentRes.data
        : mergeWorkers([], workerRes.data || [])

      const attachments = (attachmentRes.data || []).reduce<Record<string, any[]>>(
        (acc, attachment) => {
          const type = (attachment.document_type || '').toLowerCase()
          if (!acc[type]) acc[type] = []
          acc[type].push(attachment)
          return acc
        },
        {}
      )

      const fallbackLinked = await fetchLinkedDrawingsForWorklog(id, minimal.site_id)
      if (fallbackLinked.length > 0) {
        attachments['drawing'] = [
          ...(attachments['drawing'] || []),
          ...fallbackLinked.map(doc => ({
            id: `linked-${doc.id}`,
            document_type: 'drawing',
            file_name: doc.title,
            file_url: doc.previewUrl || doc.url,
            file_size: 0,
            uploaded_at: doc.createdAt,
            uploader: doc.uploader,
            metadata: {
              source: doc.source,
              uploader_name: doc.uploaderName,
              uploader_email: doc.uploaderEmail,
              original_url: doc.url,
              preview_url: doc.previewUrl,
              markup_document_id: doc.markupId,
              linked_worklog_id: doc.linkedWorklogIds?.[0] || id,
              linked_worklog_ids:
                doc.linkedWorklogIds && doc.linkedWorklogIds.length > 0
                  ? doc.linkedWorklogIds
                  : [id],
            },
          })),
        ]
      }

      const photoGroups = await fetchAdditionalPhotosForReport(id)

      const integratedFallback: AdminIntegratedResponse = {
        daily_report: {
          ...minimal,
          ...photoGroups,
          material_usage: materialRes.data || [],
          document_attachments: undefined,
        },
        site: siteRes.data || undefined,
        worker_assignments: fallbackWorkerRows,
        worker_statistics: computeWorkerStats(fallbackWorkerRows, {
          total_workers: minimal.total_workers,
          total_labor_hours: (minimal as any)?.total_labor_hours,
        }),
        documents: attachments,
        document_counts: {},
        related_reports: [],
        report_author: authorRes.data || undefined,
      }

      return integratedResponseToUnifiedReport(integratedFallback)
    } catch (fallbackError) {
      console.error('[getUnifiedDailyReportForAdmin] fallback failed:', fallbackError)
      return null
    }
  }

  const photoGroups = await fetchAdditionalPhotosForReport(id)
  data.additional_before_photos = photoGroups.additional_before_photos
  data.additional_after_photos = photoGroups.additional_after_photos

  const linkedDrawings = await fetchLinkedDrawingsForWorklog(id, data.site_id)

  const responses = await Promise.all([
    supabase.from('daily_report_workers').select('*').eq('daily_report_id', id),
    supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .eq('id', data.created_by)
      .maybeSingle(),
    supabase
      .from('worker_assignments')
      .select('*, profiles(id, full_name, role)')
      .eq('daily_report_id', id),
    supabase.from('material_usage').select('*').eq('daily_report_id', id),
  ])

  const legacyWorkers = responses[0].data || []
  const authorProfile = responses[1].data
  const workerAssignments = responses[2].data || []
  const materials = responses[3].data || []

  const workerRows = workerAssignments.length > 0 ? workerAssignments : legacyWorkers

  // Simplify: Ensure dailyReport has everything unified-admin needs
  const dailyReport: Record<string, any> = {
    ...data,
    author: authorProfile,
    created_by_profile: authorProfile,
    worker_assignments: workerRows,
    material_usage: materials || [],
  }

  const integrated: AdminIntegratedResponse = {
    daily_report: {
      ...(() => {
        const cloned = { ...data } as Record<string, any>
        delete cloned.issues
        delete cloned.safety_notes
        if (cloned.additional_notes && typeof cloned.additional_notes === 'object') {
          delete cloned.additional_notes.safetyNotes
          delete cloned.additional_notes.safety_notes
        }
        return cloned
      })(),
      document_attachments: undefined,
    },
    site: data.sites,
    worker_assignments: workerRows,
    worker_statistics: computeWorkerStats(workerRows, {
      total_workers: data.total_workers,
      total_labor_hours: (data as any)?.total_labor_hours,
    }),
    documents: {
      photo: (data.document_attachments || []).filter(
        (file: any) => (file?.document_type || '').toLowerCase() === 'photo'
      ),
      drawing: [
        ...(data.document_attachments || []).filter(
          (file: any) => (file?.document_type || '').toLowerCase() === 'drawing'
        ),
        ...linkedDrawings.map(doc => ({
          id: `linked-${doc.id}`,
          document_type: 'drawing',
          file_name: doc.title,
          file_url: doc.previewUrl || doc.url,
          file_size: 0,
          uploaded_at: doc.createdAt,
          uploader: doc.uploader,
          metadata: {
            source: doc.source,
            uploader_name: doc.uploaderName,
            uploader_email: doc.uploaderEmail,
            original_url: doc.url,
            preview_url: doc.previewUrl,
            markup_document_id: doc.markupId,
            linked_worklog_id: doc.linkedWorklogIds?.[0] || id,
            linked_worklog_ids:
              doc.linkedWorklogIds && doc.linkedWorklogIds.length > 0 ? doc.linkedWorklogIds : [id],
          },
        })),
      ],
      completion: (data.document_attachments || []).filter(
        (file: any) => (file?.document_type || '').toLowerCase() === 'completion'
      ),
      other: (data.document_attachments || []).filter((file: any) => {
        const type = (file?.document_type || '').toLowerCase()
        return type !== 'photo' && type !== 'drawing' && type !== 'completion'
      }),
    },
    document_counts: {},
    related_reports: [],
    report_author: authorProfile || undefined,
    material_usage: materials || [],
    material_summary: {
      npc1000_incoming: data.npc1000_incoming || 0,
      npc1000_used: data.npc1000_used || 0,
      npc1000_remaining: data.npc1000_remaining || 0,
    },
  }

  return integratedResponseToUnifiedReport(integrated)
}
