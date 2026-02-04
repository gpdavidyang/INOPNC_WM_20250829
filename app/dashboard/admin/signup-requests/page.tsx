import { getSignupRequests, getSignupRequestStats } from '@/app/actions/admin/signup-approvals'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import SignupRequestsTable from '@/components/admin/SignupRequestsTable'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/ui/page-header'
import { cn } from '@/lib/utils'
import { Search } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '가입 요청 관리',
}

export default async function AdminSignupRequestsPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>
}) {
  await requireAdminProfile()

  const search = ((searchParams?.search as string) || '').trim()

  const [{ stats }, { requests }] = await Promise.all([
    getSignupRequestStats(),
    getSignupRequests(search),
  ])

  return (
    <div className="px-0 pb-8 space-y-6">
      <PageHeader
        title="가입 요청 관리"
        description="서비스 이용 신청 내역을 검토하고 계정을 승인하거나 거절합니다."
        breadcrumbs={[{ label: '대시보드', href: '/dashboard/admin' }, { label: '가입 요청 관리' }]}
      />

      <div className="px-4 sm:px-6 lg:px-8 pt-2 pb-8 space-y-6">
        {/* v1.66 High-Density Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="rounded-2xl border-none shadow-sm bg-indigo-50/50 hover:bg-indigo-50 transition-colors">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[11px] font-black text-indigo-400 uppercase tracking-tighter">
                  전체 요청
                </p>
                <p className="text-2xl font-black text-indigo-900 italic tracking-tighter">
                  {stats?.total ?? 0}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-none shadow-sm bg-amber-50/50 hover:bg-amber-50 transition-colors">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[11px] font-black text-amber-500 uppercase tracking-tighter">
                  승인 대기
                </p>
                <p className="text-2xl font-black text-amber-700 italic tracking-tighter">
                  {stats?.pending ?? 0}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-none shadow-sm bg-emerald-50/50 hover:bg-emerald-50 transition-colors">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[11px] font-black text-emerald-500 uppercase tracking-tighter">
                  승인 완료
                </p>
                <p className="text-2xl font-black text-emerald-700 italic tracking-tighter">
                  {stats?.approved ?? 0}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-none shadow-sm bg-rose-50/50 hover:bg-rose-50 transition-colors">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[11px] font-black text-rose-500 uppercase tracking-tighter">
                  가입 거절
                </p>
                <p className="text-2xl font-black text-rose-700 italic tracking-tighter">
                  {stats?.rejected ?? 0}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-3xl border-gray-200 shadow-sm shadow-gray-200/40 overflow-hidden">
          <CardHeader className="border-b border-gray-100 bg-gradient-to-b from-gray-50/50 to-transparent px-8 py-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div />

              <div className="flex items-center gap-2">
                <form method="GET" className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      name="search"
                      defaultValue={search}
                      placeholder="이름, 이메일, 소속사 검색"
                      className="pl-9 h-10 w-64 md:w-80 rounded-xl bg-slate-50/50 border-slate-100 focus:bg-white transition-all font-bold text-sm"
                    />
                  </div>
                  <Button
                    type="submit"
                    variant="outline"
                    className="h-10 px-4 rounded-xl border-slate-200 font-bold hover:bg-slate-50"
                  >
                    조회
                  </Button>
                  <Link
                    href="/dashboard/admin/signup-requests"
                    className={cn(
                      buttonVariants({ variant: 'outline', size: 'sm' }),
                      'h-10 px-4 rounded-xl border-slate-200 font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 transition-all shadow-sm'
                    )}
                  >
                    새로고침
                  </Link>
                </form>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="animate-in fade-in duration-500">
              <SignupRequestsTable requests={Array.isArray(requests) ? requests : []} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
