import { getSystemConfigurations, getSystemStats } from '@/app/actions/admin/system'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import SharedDocumentCategoryManager from '@/components/admin/system/SharedDocumentCategoryManager'
import SystemConfigsTable from '@/components/admin/SystemConfigsTable'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { cn, formatBytes } from '@/lib/utils'
import { Settings } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '시스템 설정',
}

export default async function SystemManagementPage() {
  await requireAdminProfile()

  const [statsRes, configsRes] = await Promise.all([getSystemStats(), getSystemConfigurations()])

  const stats = statsRes.success ? statsRes.data : undefined
  const configs = configsRes.success && Array.isArray(configsRes.data) ? configsRes.data : []

  return (
    <div className="px-0 pb-8 space-y-6">
      <PageHeader
        title="시스템 설정"
        description="시스템 전반의 운영 지표와 핵심 설정을 중앙 관리합니다."
        breadcrumbs={[{ label: '대시보드', href: '/dashboard/admin' }, { label: '시스템 설정' }]}
      />

      <div className="px-4 sm:px-6 lg:px-8 space-y-6">
        {/* 1. Stats Grid (v1.66 Silent Efficiency) */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {[
            {
              label: '전체 사용자',
              value: stats?.total_users ?? 0,
              unit: '명',
              bg: 'bg-indigo-50/50',
              text: 'text-indigo-600',
            },
            {
              label: '활성 사용자 (30일)',
              value: stats?.active_users ?? 0,
              unit: '명',
              bg: 'bg-emerald-50/50',
              text: 'text-emerald-600',
            },
            {
              label: '활성 현장',
              value: stats?.active_sites ?? 0,
              unit: '곳',
              bg: 'bg-blue-50/50',
              text: 'text-blue-600',
            },
            {
              label: '문서 총수',
              value: stats?.total_documents ?? 0,
              unit: '건',
              bg: 'bg-slate-50/50',
              text: 'text-slate-600',
            },
            {
              label: '저장소 사용량',
              value: stats ? formatBytes(stats.storage_used * 1024 * 1024) : '-',
              bg: 'bg-rose-50/50',
              text: 'text-rose-600',
            },
            {
              label: '백업 상태',
              value: stats
                ? stats.backup_status === 'healthy'
                  ? '정상'
                  : stats.backup_status === 'warning'
                    ? '경고'
                    : '오류'
                : '-',
              bg: 'bg-amber-50/50',
              text: 'text-amber-600',
            },
            {
              label: '시스템 버전',
              value: stats ? String(stats.system_version) : '-',
              bg: 'bg-violet-50/50',
              text: 'text-violet-600',
            },
          ].map((stat, idx) => (
            <Card
              key={idx}
              className={cn(
                'rounded-2xl border-none shadow-sm shadow-gray-200/40 overflow-hidden',
                stat.bg
              )}
            >
              <CardContent className="p-4 flex flex-col justify-between h-full">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-tighter">
                  {stat.label}
                </p>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className={cn('text-xl font-bold tracking-tight', stat.text)}>
                    {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                  </span>
                  {stat.unit && <span className="text-[10px] font-medium text-slate-400">{stat.unit}</span>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-8">
          {/* 공유문서 분류 관리 */}
          <SharedDocumentCategoryManager />

          {/* 시스템 설정 테이블 */}
          <Card className="rounded-3xl border-gray-200 shadow-sm shadow-gray-200/40 overflow-hidden">
            <CardHeader className="border-b border-gray-100 bg-gray-50/30 px-6 py-6 sm:px-8">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 rounded-xl">
                  <Settings className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-[#1A254F]">시스템 설정 정보</CardTitle>
                  <CardDescription className="text-sm font-medium text-slate-400">
                    전사적으로 적용되는 핵심 설정 항목들의 현재 적용 값을 확인합니다. (읽기 전용)
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <SystemConfigsTable configs={configs.slice(0, 30)} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
