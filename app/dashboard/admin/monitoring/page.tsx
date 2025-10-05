import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'

export const metadata: Metadata = {
  title: '모니터링',
}

export default async function AdminMonitoringPage() {
  await requireAdminProfile()
  const supabase = createClient()

  // 간단한 KPI 요약
  const [auditCountRes, todayReportsRes, docs7dRes, pendingReqRes] = await Promise.all([
    supabase.from('audit_logs').select('id', { count: 'exact', head: true }),
    supabase
      .from('daily_reports')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
    supabase
      .from('unified_document_system')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
    supabase
      .from('material_requests')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
  ])

  const auditLogs = auditCountRes.count || 0
  const reports24h = todayReportsRes.count || 0
  const docs7d = docs7dRes.count || 0
  const pendingRequests = pendingReqRes.count || 0

  return (
    <div className="px-0 pb-8 space-y-6">
      <PageHeader
        title="모니터링"
        description="핵심 운영지표 요약"
        breadcrumbs={[{ label: '대시보드', href: '/dashboard/admin' }, { label: '모니터링' }]}
      />
      <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardHeader>
              <CardTitle>감사 로그</CardTitle>
              <CardDescription>전체 누적</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">{auditLogs}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>오늘 작업일지</CardTitle>
              <CardDescription>최근 24시간 생성</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">{reports24h}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>최근 문서</CardTitle>
              <CardDescription>최근 7일 생성</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">{docs7d}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>자재 요청</CardTitle>
              <CardDescription>승인 대기</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">{pendingRequests}</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
