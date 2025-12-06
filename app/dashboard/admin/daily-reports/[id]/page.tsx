import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { getDailyReportById } from '@/app/actions/admin/daily-reports'
import { PageHeader } from '@/components/ui/page-header'
import { buttonVariants } from '@/components/ui/button'
import EmptyState from '@/components/ui/empty-state'
import DailyReportDetailClient from '@/components/admin/daily-reports/DailyReportDetailClient'
import { getUnifiedDailyReportForAdmin } from '@/lib/daily-reports/server'
import {
  integratedResponseToUnifiedReport,
  type AdminIntegratedResponse,
} from '@/lib/daily-reports/unified-admin'

const buildFallbackUnifiedReport = (report: any) => {
  if (!report) return null
  const workers = Array.isArray(report.workers) ? report.workers : []
  const unifiedWorkers = workers.map((worker: any, index: number) => ({
    id: worker?.id || `worker-${index}`,
    workerId: worker?.worker_id || worker?.profiles?.id || undefined,
    workerName:
      worker?.profiles?.full_name || worker?.worker_name || worker?.name || `작업자-${index + 1}`,
    hours: Number(worker?.labor_hours ?? worker?.work_hours ?? worker?.hours ?? 0) || 0,
    isDirectInput: true,
    notes: worker?.notes || '',
  }))
  const totalWorkers =
    typeof report?.total_workers === 'number' ? report.total_workers : unifiedWorkers.length
  const totalHours =
    typeof report?.total_labor_hours === 'number'
      ? Number(report.total_labor_hours) || 0
      : unifiedWorkers.reduce((sum, worker) => sum + worker.hours, 0)

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
    location: { block: '', dong: '', unit: '' },
    memberTypes: [],
    workProcesses: [],
    workTypes: [],
    workEntries: [],
    workers: unifiedWorkers,
    materials: [],
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
      componentName: report?.component_name || '',
      workProcess: report?.work_process || '',
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
        />
      ) : (
        <EmptyState title="오류" description="작업일지 정보를 불러오지 못했습니다." />
      )}
    </div>
  )
}
