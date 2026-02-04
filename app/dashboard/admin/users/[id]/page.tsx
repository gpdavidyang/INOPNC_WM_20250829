import { getUser } from '@/app/actions/admin/users'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import UserTablesClient from '@/components/admin/users/UserTablesClient'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { cn } from '@/lib/utils'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '사용자 상세',
}

interface UserDetailPageProps {
  params: {
    id: string
  }
}

const STATUS_KO: Record<string, string> = {
  active: '활성',
  inactive: '비활성',
  pending: '대기',
  approved: '승인',
  rejected: '반려',
  uploaded: '업로드됨',
}

export default async function AdminUserDetailPage({ params }: UserDetailPageProps) {
  await requireAdminProfile()

  const result = await getUser(params.id)
  const user = result.success && result.data ? (result.data as any) : null

  return (
    <div className="px-0 pb-8 space-y-8 animate-in fade-in duration-700">
      <PageHeader
        title="사용자 상세 정보"
        description={`${user?.full_name || '사용자'}님의 상세 프로필 및 활동 내역을 확인합니다.`}
        breadcrumbs={[
          { label: '대시보드', href: '/dashboard/admin' },
          { label: '사용자 관리', href: '/dashboard/admin/users' },
          { label: '사용자 상세' },
        ]}
        showBackButton
        backButtonHref="/dashboard/admin/users"
        actions={
          user ? (
            <div className="flex items-center gap-2">
              <a
                href={`/dashboard/admin/users/${params.id}/edit`}
                className={buttonVariants({ variant: 'outline', size: 'standard' })}
                style={{ borderRadius: '12px', fontWeight: 'bold' }}
              >
                상세 수정
              </a>
              <div className="flex items-center gap-1.5 bg-slate-50/80 p-1.5 rounded-2xl border border-slate-100 shadow-inner ml-2">
                <a
                  href={`/dashboard/admin/salary/personal?q=${encodeURIComponent(
                    user.full_name || user.email || params.id
                  )}&worker_id=${encodeURIComponent(params.id)}`}
                  className={cn(
                    buttonVariants({ variant: 'ghost', size: 'sm' }),
                    'font-bold text-xs rounded-xl hover:bg-white'
                  )}
                >
                  급여 관리
                </a>
                <a
                  href={`/dashboard/admin/daily-reports?created_by=${encodeURIComponent(params.id)}`}
                  className={cn(
                    buttonVariants({ variant: 'ghost', size: 'sm' }),
                    'font-bold text-xs rounded-xl hover:bg-white'
                  )}
                >
                  작업일지
                </a>
                <a
                  href={`/dashboard/admin/documents/required?tab=submissions&submitted_by=${encodeURIComponent(
                    params.id
                  )}`}
                  className={cn(
                    buttonVariants({ variant: 'ghost', size: 'sm' }),
                    'font-bold text-xs rounded-xl hover:bg-white'
                  )}
                >
                  서류 현황
                </a>
              </div>
            </div>
          ) : null
        }
      />

      <div className="px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Profile Card */}
          <Card className="lg:col-span-1 rounded-3xl border-gray-200 shadow-sm shadow-gray-200/40 overflow-hidden">
            <CardHeader className="border-b border-gray-100 bg-slate-50/50 p-8">
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 rounded-3xl bg-indigo-50 flex items-center justify-center mb-4 border border-indigo-100/50 shadow-sm shadow-indigo-100">
                  <span className="text-2xl font-black text-indigo-600">
                    {(user?.full_name?.[0] || user?.email?.[0] || '?').toUpperCase()}
                  </span>
                </div>
                <CardTitle className="text-xl font-black text-[#1A254F] tracking-tight">
                  {user?.full_name || '-'}
                </CardTitle>
                <CardDescription className="text-xs font-bold text-slate-400 mt-1">
                  {user?.email || '-'}
                </CardDescription>

                <div className="flex gap-2 mt-5">
                  <Badge
                    variant="outline"
                    className="border-indigo-100 bg-indigo-50/30 text-indigo-700 font-bold text-[10px] h-5 px-3 rounded-lg"
                  >
                    {user?.role || '-'}
                  </Badge>
                  <Badge
                    variant={user?.status === 'active' ? 'success' : 'outline'}
                    className="font-bold text-[10px] h-5 px-3 rounded-lg"
                  >
                    {user?.status ? STATUS_KO[String(user.status)] || String(user.status) : '-'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-5">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    소속 조직
                  </p>
                  <p className="text-sm font-bold text-slate-700">
                    {user?.organization?.name || '소속 없음'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    최근 로그인
                  </p>
                  <p className="text-xs font-bold text-slate-500">
                    {user?.last_login_at
                      ? new Date(user.last_login_at).toLocaleString('ko-KR')
                      : '-'}
                  </p>
                </div>
                {user?.signup_request?.id && (
                  <div className="pt-2">
                    <div className="flex items-center gap-2 p-3 bg-blue-50/50 border border-blue-100 rounded-2xl">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                      <p className="text-xs font-bold text-blue-700">가입요청에서 생성됨</p>
                      <a
                        href={`/dashboard/admin/signup-requests?search=${encodeURIComponent(user?.email || '')}`}
                        className="ml-auto text-[10px] font-black underline uppercase tracking-tighter text-blue-400 hover:text-blue-600 decoration-blue-100"
                      >
                        가입요청 보기
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Activity Statistics & Tables */}
          <div className="lg:col-span-2 space-y-8">
            {/* High-Density Work Log Stats */}
            <Card className="rounded-3xl border-gray-200 shadow-sm shadow-gray-200/40 overflow-hidden">
              <CardHeader className="border-b border-gray-100 pb-5 px-8 pt-8">
                <CardTitle className="text-sm font-black text-[#1A254F] uppercase tracking-widest flex items-center gap-2">
                  <div className="w-1 h-3 rounded-full bg-indigo-500" />
                  Work log Activity Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                  <div className="p-8 group hover:bg-slate-50/50 transition-colors">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1.5">
                      총 보고서 제출
                    </p>
                    <div className="text-3xl font-black text-indigo-900 group-hover:scale-105 transition-transform origin-left">
                      {user?.work_log_stats?.total_reports ?? 0}
                      <span className="text-xs font-bold text-slate-300 ml-1">건</span>
                    </div>
                  </div>
                  <div className="p-8 group hover:bg-slate-50/50 transition-colors">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1.5">
                      이번 달 활동
                    </p>
                    <div className="text-3xl font-black text-emerald-600 group-hover:scale-105 transition-transform origin-left">
                      {user?.work_log_stats?.this_month ?? 0}
                      <span className="text-xs font-bold text-slate-300 ml-1">건</span>
                    </div>
                  </div>
                  <div className="p-8 group hover:bg-slate-50/50 transition-colors">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1.5">
                      최근 활동 일자
                    </p>
                    <div className="text-xl font-black text-slate-700 tracking-tighter line-clamp-1 group-hover:scale-105 transition-transform origin-left">
                      {user?.work_log_stats?.last_report_date
                        ? new Date(user.work_log_stats.last_report_date).toLocaleDateString('ko-KR')
                        : '활동 없음'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Assignments & Documents Table */}
            <Card className="rounded-3xl border-gray-200 shadow-sm shadow-gray-200/40 overflow-hidden">
              <CardHeader className="border-b border-gray-100 bg-gradient-to-b from-gray-50/50 to-transparent pb-6 px-8 pt-8">
                <CardTitle className="text-md font-black text-[#1A254F] tracking-tight">
                  현장 배정 · 필수서류 제출 현황
                </CardTitle>
                <CardDescription className="text-xs font-bold text-slate-400 mt-1">
                  사용자의 현재 배정된 현장 및 제출 완료된 필수 서류 목록입니다.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <UserTablesClient
                  assignments={Array.isArray(user?.site_assignments) ? user.site_assignments : []}
                  documents={Array.isArray(user?.required_documents) ? user.required_documents : []}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
