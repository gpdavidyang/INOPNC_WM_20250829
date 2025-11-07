import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { getSystemStats, getSystemConfigurations } from '@/app/actions/admin/system'
import { PageHeader } from '@/components/ui/page-header'
import SystemConfigsTable from '@/components/admin/SystemConfigsTable'
import StatsCard from '@/components/ui/stats-card'
import { formatBytes } from '@/lib/utils'
import SharedDocumentCategoryManager from '@/components/admin/system/SharedDocumentCategoryManager'

export const metadata: Metadata = {
  title: '시스템 설정',
}

export default async function SystemManagementPage() {
  await requireAdminProfile()

  const [statsRes, configsRes] = await Promise.all([getSystemStats(), getSystemConfigurations()])

  const stats = statsRes.success ? statsRes.data : undefined
  const configs = configsRes.success && Array.isArray(configsRes.data) ? configsRes.data : []

  return (
    <div className="px-0 pb-8">
      <PageHeader
        title="시스템 설정"
        description="설정과 지표를 읽기 전용으로 표시"
        breadcrumbs={[{ label: '대시보드', href: '/dashboard/admin' }, { label: '시스템 설정' }]}
      />
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6 mb-8">
          <StatsCard label="전체 사용자" value={Number(stats?.total_users ?? 0)} unit="person" />
          <StatsCard
            label="활성 사용자(30일)"
            value={Number(stats?.active_users ?? 0)}
            unit="person"
          />
          <StatsCard label="전체 현장" value={Number(stats?.total_sites ?? 0)} unit="site" />
          <StatsCard label="활성 현장" value={Number(stats?.active_sites ?? 0)} unit="site" />
          <StatsCard label="문서 총수" value={Number(stats?.total_documents ?? 0)} unit="count" />
          <StatsCard
            label="저장소 사용량"
            value={stats ? formatBytes(stats.storage_used * 1024 * 1024) : '-'}
          />
          <StatsCard label="일일보고 총수" value={Number(stats?.total_reports ?? 0)} unit="count" />
          <StatsCard
            label="백업 상태"
            value={
              stats
                ? stats.backup_status === 'healthy'
                  ? '정상'
                  : stats.backup_status === 'warning'
                    ? '경고'
                    : '오류'
                : '-'
            }
          />
          <StatsCard
            label="최근 백업"
            value={stats ? new Date(stats.last_backup).toLocaleString('ko-KR') : '-'}
          />
          <StatsCard label="시스템 버전" value={stats ? String(stats.system_version) : '-'} />
        </div>

        <div className="grid gap-6">
          <SharedDocumentCategoryManager />

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
      </div>
    </div>
  )
}
