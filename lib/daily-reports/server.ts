import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import type { UnifiedDailyReport } from '@/types/daily-reports'
import { integratedResponseToUnifiedReport, type AdminIntegratedResponse } from './unified-admin'
import { fetchAdditionalPhotosForReport } from '@/lib/admin/site-photos'

const getSupabaseForAdmin = () => {
  try {
    return createServiceClient()
  } catch {
    return createClient()
  }
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
        sites(id, name, address, status),
        profiles:profiles!daily_reports_created_by_fkey(id, full_name, role, email),
        worker_assignments:daily_report_workers(
          id,
          worker_id,
          worker_name,
          labor_hours,
          is_direct_input,
          notes
        ),
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

      const [siteRes, authorRes, workerRes, attachmentRes] = await Promise.all([
        supabase
          .from('sites')
          .select('id, name, address, status')
          .eq('id', minimal.site_id)
          .maybeSingle(),
        minimal.created_by
          ? supabase
              .from('profiles')
              .select('id, full_name, role, email')
              .eq('id', minimal.created_by)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null }),
        supabase
          .from('daily_report_workers')
          .select('id, worker_id, worker_name, labor_hours, is_direct_input, notes')
          .eq('daily_report_id', id),
        supabase
          .from('document_attachments')
          .select('id, document_type, file_name, file_url, file_size, uploaded_at, uploaded_by')
          .eq('daily_report_id', id),
      ])

      const attachments = (attachmentRes.data || []).reduce<Record<string, any[]>>(
        (acc, attachment) => {
          const type = (attachment.document_type || '').toLowerCase()
          if (!acc[type]) acc[type] = []
          acc[type].push(attachment)
          return acc
        },
        {}
      )

      const photoGroups = await fetchAdditionalPhotosForReport(id)

      const integratedFallback: AdminIntegratedResponse = {
        daily_report: {
          ...minimal,
          ...photoGroups,
          document_attachments: undefined,
        },
        site: siteRes.data || undefined,
        worker_assignments: workerRes.data || [],
        worker_statistics: {
          total_workers: (workerRes.data || []).length,
          total_hours: (workerRes.data || []).reduce(
            (sum: number, entry: any) => sum + Number(entry?.labor_hours || 0),
            0
          ),
        },
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
    worker_assignments: data.worker_assignments ?? [],
    worker_statistics: {
      total_workers: (data.worker_assignments || []).length,
      total_hours: (data.worker_assignments || []).reduce(
        (sum: number, entry: any) => sum + Number(entry?.labor_hours || 0),
        0
      ),
    },
    documents: {
      photo: (data.document_attachments || []).filter(
        (file: any) => (file?.document_type || '').toLowerCase() === 'photo'
      ),
      drawing: (data.document_attachments || []).filter(
        (file: any) => (file?.document_type || '').toLowerCase() === 'drawing'
      ),
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
    report_author: data.profiles,
  }

  return integratedResponseToUnifiedReport(integrated)
}
