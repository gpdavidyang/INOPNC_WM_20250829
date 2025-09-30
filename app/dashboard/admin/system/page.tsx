import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { getSystemStats, getSystemConfigurations } from '@/app/actions/admin/system'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import SystemConfigsTable from '@/components/admin/SystemConfigsTable'
import { Badge } from '@/components/ui/badge'
import { formatBytes } from '@/lib/utils'

export const metadata: Metadata = {
  title: '시스템 관리',
}

export default async function SystemManagementPage() {
  await requireAdminProfile()

  const [statsRes, configsRes] = await Promise.all([getSystemStats(), getSystemConfigurations()])

  const stats = statsRes.success ? statsRes.data : undefined
  const configs = configsRes.success && Array.isArray(configsRes.data) ? configsRes.data : []

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">시스템 관리</h1>
        <p className="text-sm text-muted-foreground">설정과 지표를 읽기 전용으로 표시합니다.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>사용자</CardTitle>
            <CardDescription>전체/활성 (30일)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">
              {stats ? (
                <span>
                  {stats.total_users}{' '}
                  <span className="text-muted-foreground text-base">/ {stats.active_users}</span>
                </span>
              ) : (
                <span className="text-muted-foreground">-</span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>현장</CardTitle>
            <CardDescription>전체/활성</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">
              {stats ? (
                <span>
                  {stats.total_sites}{' '}
                  <span className="text-muted-foreground text-base">/ {stats.active_sites}</span>
                </span>
              ) : (
                <span className="text-muted-foreground">-</span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>문서</CardTitle>
            <CardDescription>저장소 사용량 포함</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">
              {stats ? (
                <span>{stats.total_documents}</span>
              ) : (
                <span className="text-muted-foreground">-</span>
              )}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              저장소: {stats ? formatBytes(stats.storage_used * 1024 * 1024) : '-'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>일일보고</CardTitle>
            <CardDescription>총 보고서 수</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">
              {stats ? (
                <span>{stats.total_reports}</span>
              ) : (
                <span className="text-muted-foreground">-</span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>백업 상태</CardTitle>
            <CardDescription>최근 백업 시각</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {stats ? (
                <Badge
                  variant={
                    stats.backup_status === 'healthy'
                      ? 'default'
                      : stats.backup_status === 'warning'
                        ? 'outline'
                        : 'outline'
                  }
                >
                  {stats.backup_status === 'healthy'
                    ? '정상'
                    : stats.backup_status === 'warning'
                      ? '경고'
                      : '오류'}
                </Badge>
              ) : (
                <span className="text-muted-foreground text-sm">-</span>
              )}
            </div>
            <div className="text-sm text-muted-foreground mt-2">
              {stats ? new Date(stats.last_backup).toLocaleString('ko-KR') : '-'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>시스템 버전</CardTitle>
            <CardDescription>현재 배포 버전</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">
              {stats ? stats.system_version : <span className="text-muted-foreground">-</span>}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-lg border bg-card p-4 shadow-sm overflow-x-auto">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-foreground">시스템 설정</h2>
          <p className="text-sm text-muted-foreground">
            읽기 전용으로 일부 설정 항목을 표시합니다.
          </p>
        </div>
        <SystemConfigsTable configs={configs.slice(0, 20)} />
      </div>
    </div>
  )
}
