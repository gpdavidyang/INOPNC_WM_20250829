import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import type { UnifiedDailyReport } from '@/types/daily-reports'
import { integratedResponseToUnifiedReport } from './unified-admin'

export async function getUnifiedDailyReportForAdmin(
  id: string
): Promise<UnifiedDailyReport | null> {
  const supabase = (() => {
    try {
      return createServiceClient()
    } catch {
      return createClient()
    }
  })()

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
    console.error('[getUnifiedDailyReportForAdmin] failed to load report:', error?.message)
    return null
  }

  const documents: Record<string, any[]> = {
    photo: [],
    drawing: [],
    completion: [],
    other: [],
  }

  for (const attachment of data.document_attachments || []) {
    const type = (attachment?.document_type || 'other').toLowerCase()
    const mapped = {
      ...attachment,
      file_name: attachment.file_name,
      file_url: attachment.file_url,
    }
    if (type === 'photo') documents.photo.push(mapped)
    else if (type === 'drawing') documents.drawing.push(mapped)
    else if (type === 'completion') documents.completion.push(mapped)
    else documents.other.push(mapped)
  }

  const integratedResponse = {
    daily_report: {
      ...data,
      document_attachments: undefined,
    },
    site: data.sites,
    worker_assignments: data.worker_assignments ?? [],
    worker_statistics: {
      total_workers: (data.worker_assignments || []).length,
      total_hours: (data.worker_assignments || []).reduce(
        (sum: number, w: any) => sum + Number(w?.labor_hours || 0),
        0
      ),
      total_overtime: 0,
      absent_workers: 0,
      by_trade: {},
      by_skill: {},
    },
    documents,
    document_counts: {
      photo: documents.photo.length,
      drawing: documents.drawing.length,
      completion: documents.completion.length,
      other: documents.other.length,
    },
    material_usage: {
      npc1000_incoming: data.npc1000_incoming ?? null,
      npc1000_used: data.npc1000_used ?? null,
      npc1000_remaining: data.npc1000_remaining ?? null,
    },
    related_reports: [],
    report_author: data.profiles,
  }

  return integratedResponseToUnifiedReport(integratedResponse)
}
