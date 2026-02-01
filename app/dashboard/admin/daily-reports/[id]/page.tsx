import { getDailyReportById } from '@/app/actions/admin/daily-reports'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import DailyReportDetailClient from '@/components/admin/daily-reports/DailyReportDetailClient'
import { buttonVariants } from '@/components/ui/button'
import EmptyState from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { getUnifiedDailyReportForAdmin } from '@/lib/daily-reports/server'
import type { Metadata } from 'next'

const buildFallbackUnifiedReport = (report: any): any => {
  if (!report) return null
  const workers = Array.isArray(report.workers) ? report.workers : []
  const unifiedWorkers = workers.map((worker: any, index: number) => ({
    id: worker?.id || `worker-${index}`,
    workerId: worker?.worker_id || worker?.profiles?.id || undefined,
    workerName:
      worker?.profiles?.full_name || worker?.worker_name || worker?.name || `작업자-${index + 1}`,
    hours: Number(worker?.labor_hours) || Number(worker?.work_hours ?? worker?.hours ?? 0) / 8,
    isDirectInput: true,
    notes: worker?.notes || '',
  }))
  const totalManDays =
    (typeof report?.total_labor_hours === 'number'
      ? Number(report.total_labor_hours)
      : unifiedWorkers.reduce((sum, w) => sum + w.hours, 0) * 8) / 8
  const totalWorkers =
    calculateWorkerCount(totalManDays) ||
    (typeof report?.total_workers === 'number' ? report.total_workers : unifiedWorkers.length)

  // Parse location_info if it's a string
  let location = report.location_info || {}
  if (typeof location === 'string') {
    try {
      location = JSON.parse(location)
    } catch {
      location = {}
    }
  }

  // Parse work_content for fallback tasks if columns are empty
  let content = report.work_content || {}
  if (typeof content === 'string') {
    try {
      content = JSON.parse(content)
    } catch {
      content = {}
    }
  }

  return {
    id: report.id ? String(report.id) : undefined,
    siteId: report.site_id || '',
    siteName: report?.sites?.name || '',
    partnerCompanyId: report.partner_company_id || undefined,
    partnerCompanyName: report?.partner_company?.company_name || undefined,
    workDate: report.work_date || new Date().toISOString().split('T')[0],
    status: (report.status || 'draft') as any,
    authorId: report.created_by || undefined,
    authorName: report?.profiles?.full_name || '',
    location: {
      block: location.block || '',
      dong: location.dong || '',
      unit: location.unit || '',
    },
    memberTypes: [report.component_name || report.member_name || content.memberTypes?.[0]].filter(
      Boolean
    ),
    workProcesses: [
      report.work_process || report.process_type || content.workProcesses?.[0],
    ].filter(Boolean),
    workTypes: [report.work_section || content.workTypes?.[0]].filter(Boolean),
    workEntries: [],
    workers: unifiedWorkers,
    materials: Array.isArray(report.material_usage)
      ? report.material_usage.map((m: any, i: number) => ({
          id: m.id || `m-${i}`,
          materialName: m.material_name || m.name || '자재',
          quantity: Number(m.quantity_val ?? m.quantity ?? 0) || 0,
          unit: m.unit || '',
          notes: m.notes || '',
        }))
      : [],
    npcUsage: {
      incoming: report?.npc1000_incoming ?? null,
      used: report?.npc1000_used ?? null,
      remaining: report?.npc1000_remaining ?? null,
    },
    attachments: { photos: [], drawings: [], confirmations: [], others: [] },
    additionalPhotos: [],
    hqRequest: report?.hq_request || '',
    notes: report?.notes || '',
    issues: report?.issues || '',
    progress: report?.progress_rate || undefined,
    meta: {
      componentName: report?.component_name || report?.member_name || '',
      workProcess: report?.work_process || report?.process_type || '',
      workSection: report?.work_section || '',
      totalWorkers,
      totalHours,
      workContents: [],
    },
    createdAt: report?.created_at,
    updatedAt: report?.updated_at,
  }
}

export const metadata: Metadata = { title: '일일보고 상세' }

export default async function AdminDailyReportDetailPage({ params }: { params: { id: string } }) {
  await requireAdminProfile()
  const result = await getDailyReportById(params.id)
  const report = result.success && result.data ? (result.data as any) : null
  const unifiedReport =
    (await getUnifiedDailyReportForAdmin(params.id)) || buildFallbackUnifiedReport(report)
  const resolvedSiteName =
    report?.sites?.name ||
    (unifiedReport ? (unifiedReport as any).siteName : '') ||
    (report?.site?.name as string | undefined) ||
    ''
  const rawWorkDate =
    report?.work_date ||
    (unifiedReport ? (unifiedReport as any).workDate : '') ||
    (report?.workDate as string | undefined) ||
    ''
  const formattedWorkDate = (() => {
    if (!rawWorkDate) return ''
    try {
      return new Date(rawWorkDate).toLocaleDateString('ko-KR')
    } catch {
      return rawWorkDate
    }
  })()
  const headerDescription =
    [resolvedSiteName, formattedWorkDate].filter(Boolean).join(' · ') || undefined

  return (
    <div className="px-0 pb-8 space-y-6">
      <PageHeader
        title="작업일지 상세"
        description={headerDescription}
        breadcrumbs={[
          { label: '대시보드', href: '/dashboard/admin' },
          { label: '작업일지 관리', href: '/dashboard/admin/daily-reports' },
          { label: '작업일지 상세' },
        ]}
        showBackButton
        backButtonHref="/dashboard/admin/daily-reports"
        actions={
          <a
            href={`/dashboard/admin/daily-reports/${params.id}/edit`}
            className={buttonVariants({ variant: 'outline', size: 'standard' })}
            role="button"
          >
            수정
          </a>
        }
      />

      {report ? (
        <DailyReportDetailClient
          reportId={params.id}
          siteName={report?.sites?.name || ''}
          workDate={report?.work_date || ''}
          status={report?.status || ''}
          author={report?.profiles?.full_name || ''}
          initialReport={unifiedReport || undefined}
          allowEditing
        />
      ) : (
        <EmptyState title="오류" description="작업일지 정보를 불러오지 못했습니다." />
      )}
    </div>
  )
}
