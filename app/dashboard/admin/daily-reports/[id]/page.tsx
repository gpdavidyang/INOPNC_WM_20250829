import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { getDailyReportById } from '@/app/actions/admin/daily-reports'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import EmptyState from '@/components/ui/empty-state'
import DailyReportDetailClient from '@/components/admin/daily-reports/DailyReportDetailClient'

export const metadata: Metadata = { title: '일일보고 상세' }

export default async function AdminDailyReportDetailPage({ params }: { params: { id: string } }) {
  await requireAdminProfile()
  const result = await getDailyReportById(params.id)
  const report = result.success && result.data ? (result.data as any) : null

  return (
    <div className="px-0 pb-8 space-y-6">
      <PageHeader
        title="작업일지 상세"
        description={`ID: ${params.id}`}
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
            className="inline-flex items-center rounded-md border px-3 py-2 text-sm"
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
        />
      ) : (
        <EmptyState title="오류" description="작업일지 정보를 불러오지 못했습니다." />
      )}
    </div>
  )
}
