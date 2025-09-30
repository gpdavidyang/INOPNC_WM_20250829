import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { getDailyReportById } from '@/app/actions/admin/daily-reports'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import DailyReportDetailClient from '@/components/admin/daily-reports/DailyReportDetailClient'

export const metadata: Metadata = { title: '일일보고 상세' }

export default async function AdminDailyReportDetailPage({ params }: { params: { id: string } }) {
  await requireAdminProfile()
  const result = await getDailyReportById(params.id)
  const report = result.success && result.data ? (result.data as any) : null

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">작업일지 상세</h1>
            <p className="text-sm text-muted-foreground">ID: {params.id}</p>
          </div>
          <a
            href={`/dashboard/admin/daily-reports/${params.id}/edit`}
            className="inline-flex items-center rounded-md border px-3 py-2 text-sm"
          >
            수정
          </a>
        </div>
      </div>

      <DailyReportDetailClient
        reportId={params.id}
        siteName={report?.sites?.name || ''}
        workDate={report?.work_date || ''}
        status={report?.status || ''}
        author={report?.profiles?.full_name || ''}
      />
    </div>
  )
}
