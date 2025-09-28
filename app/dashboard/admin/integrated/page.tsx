import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { getDashboardStats } from '@/app/actions/admin/dashboard-stats'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export const metadata: Metadata = {
  title: '통합 대시보드',
}

export default async function AdminIntegratedDashboardPage() {
  await requireAdminProfile()
  const result = await getDashboardStats()
  const stats = result.success && result.data ? result.data : undefined

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">통합 관리자 대시보드</h1>
        <p className="text-sm text-muted-foreground">주요 지표와 최근 활동을 요약합니다.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>전체 사용자</CardTitle>
            <CardDescription>활성/전체는 메인 통계 참조</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">
              {stats ? stats.totalUsers : <span className="text-muted-foreground">-</span>}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>활성 현장 수</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">
              {stats ? stats.activeSites : <span className="text-muted-foreground">-</span>}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>오늘 작업일지</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">
              {stats ? stats.todayReports : <span className="text-muted-foreground">-</span>}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>최근 활동</CardTitle>
          <CardDescription>최신 5건</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {!stats ||
            !Array.isArray(stats.recentActivities) ||
            stats.recentActivities.length === 0 ? (
              <div className="text-sm text-muted-foreground">표시할 활동이 없습니다.</div>
            ) : (
              stats.recentActivities.map((a: any) => (
                <div key={a.id} className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-medium text-foreground">{a.title}</div>
                    <div className="text-xs text-muted-foreground">{a.description}</div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(a.timestamp).toLocaleString('ko-KR')}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
