'use client'

import { Profile } from '@/types'
import { Building2, Users, FileText, TrendingUp, Calendar, MapPin, User } from 'lucide-react'
import Link from 'next/link'
import { useFontSize, getFullTypographyClass } from '@/contexts/FontSizeContext'

interface PartnerDashboardClientProps {
  profile: Profile & { partner_companies?: any }
  statistics: {
    totalSites: number
    activeSites: number
    totalWorkers: number
    recentReports: number
  }
  sitePartnerships: any[]
  recentReports: any[]
  workers: any[]
}

export default function PartnerDashboardClient({
  profile,
  statistics,
  sitePartnerships,
  recentReports,
  workers
}: PartnerDashboardClientProps) {
  const { isLargeFont } = useFontSize()

  // Defensive rendering: Ensure all arrays are properly initialized
  const safeSitePartnerships = Array.isArray(sitePartnerships) ? sitePartnerships : []
  const safeRecentReports = Array.isArray(recentReports) ? recentReports : []
  const safeWorkers = Array.isArray(workers) ? workers : []

  const getTypographyClass = (type: string, size: string = 'base') => {
    return getFullTypographyClass(type, size, isLargeFont)
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className={`${getTypographyClass('header', 'xl')} font-bold text-gray-900 dark:text-gray-100`}>
          안녕하세요, {profile.full_name || profile.email}님
        </h1>
        <p className={`${getTypographyClass('body', 'base')} text-gray-600 dark:text-gray-400 mt-2`}>
          {profile.partner_companies?.company_name} 파트너사 대시보드입니다
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className={`${getTypographyClass('caption', 'sm')} text-gray-500 dark:text-gray-400`}>
                참여 현장
              </p>
              <p className={`${getTypographyClass('header', 'lg')} font-bold text-gray-900 dark:text-gray-100 mt-1`}>
                {statistics.totalSites}
              </p>
            </div>
            <Building2 className="h-8 w-8 text-blue-500" />
          </div>
          <Link
            href="/partner/sites"
            className={`${getTypographyClass('caption', 'xs')} text-blue-600 dark:text-blue-400 hover:underline mt-2 inline-block`}
          >
            자세히 보기 →
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className={`${getTypographyClass('caption', 'sm')} text-gray-500 dark:text-gray-400`}>
                진행중 현장
              </p>
              <p className={`${getTypographyClass('header', 'lg')} font-bold text-gray-900 dark:text-gray-100 mt-1`}>
                {statistics.activeSites}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
          <p className={`${getTypographyClass('caption', 'xs')} text-gray-500 dark:text-gray-400 mt-2`}>
            전체 {statistics.totalSites}개 중
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className={`${getTypographyClass('caption', 'sm')} text-gray-500 dark:text-gray-400`}>
                소속 직원
              </p>
              <p className={`${getTypographyClass('header', 'lg')} font-bold text-gray-900 dark:text-gray-100 mt-1`}>
                {statistics.totalWorkers}
              </p>
            </div>
            <Users className="h-8 w-8 text-purple-500" />
          </div>
          <Link
            href="/partner/workers"
            className={`${getTypographyClass('caption', 'xs')} text-blue-600 dark:text-blue-400 hover:underline mt-2 inline-block`}
          >
            직원 관리 →
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className={`${getTypographyClass('caption', 'sm')} text-gray-500 dark:text-gray-400`}>
                최근 작업일지
              </p>
              <p className={`${getTypographyClass('header', 'lg')} font-bold text-gray-900 dark:text-gray-100 mt-1`}>
                {statistics.recentReports}
              </p>
            </div>
            <FileText className="h-8 w-8 text-orange-500" />
          </div>
          <Link
            href="/partner/daily-reports"
            className={`${getTypographyClass('caption', 'xs')} text-blue-600 dark:text-blue-400 hover:underline mt-2 inline-block`}
          >
            전체 보기 →
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sites */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className={`${getTypographyClass('header', 'md')} font-semibold text-gray-900 dark:text-gray-100`}>
              최근 참여 현장
            </h2>
          </div>
          <div className="p-6">
            {safeSitePartnerships.length > 0 ? (
              <div className="space-y-4">
                {safeSitePartnerships.slice(0, 5).map((sp) => (
                  <div key={sp.id} className="flex items-start space-x-3">
                    <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <Link
                        href={`/partner/sites/${sp.site_id}`}
                        className={`${getTypographyClass('body', 'sm')} font-medium text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400`}
                      >
                        {sp.sites?.name}
                      </Link>
                      <p className={`${getTypographyClass('caption', 'xs')} text-gray-500 dark:text-gray-400`}>
                        {sp.sites?.address}
                      </p>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full ${getTypographyClass('caption', 'xs')} font-medium ${
                          sp.sites?.status === 'active' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {sp.sites?.status === 'active' ? '진행중' : '완료'}
                        </span>
                        <span className={`${getTypographyClass('caption', 'xs')} text-gray-500 dark:text-gray-400`}>
                          참여일: {new Date(sp.assigned_date).toLocaleDateString('ko-KR')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className={`${getTypographyClass('body', 'sm')} text-gray-500 dark:text-gray-400`}>
                참여중인 현장이 없습니다
              </p>
            )}
          </div>
        </div>

        {/* Recent Daily Reports */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className={`${getTypographyClass('header', 'md')} font-semibold text-gray-900 dark:text-gray-100`}>
              최근 작업일지
            </h2>
          </div>
          <div className="p-6">
            {safeRecentReports.length > 0 ? (
              <div className="space-y-4">
                {safeRecentReports.slice(0, 5).map((report) => (
                  <div key={report.id} className="flex items-start space-x-3">
                    <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <Link
                        href={`/partner/daily-reports/${report.id}`}
                        className={`${getTypographyClass('body', 'sm')} font-medium text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400`}
                      >
                        {report.sites?.name}
                      </Link>
                      <p className={`${getTypographyClass('caption', 'xs')} text-gray-500 dark:text-gray-400`}>
                        {new Date(report.report_date).toLocaleDateString('ko-KR')} · {report.profiles?.full_name}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full ${getTypographyClass('caption', 'xs')} font-medium ${
                          report.status === 'submitted' 
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            : report.status === 'approved'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {report.status === 'submitted' ? '제출됨' : report.status === 'approved' ? '승인됨' : '임시저장'}
                        </span>
                        {report.worker_count && (
                          <span className={`${getTypographyClass('caption', 'xs')} text-gray-500 dark:text-gray-400`}>
                            작업인원: {report.worker_count}명
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className={`${getTypographyClass('body', 'sm')} text-gray-500 dark:text-gray-400`}>
                최근 작업일지가 없습니다
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Workers List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className={`${getTypographyClass('header', 'md')} font-semibold text-gray-900 dark:text-gray-100`}>
            소속 직원 목록
          </h2>
        </div>
        <div className="p-6">
          {safeWorkers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {safeWorkers.map((worker) => (
                <div key={worker.id} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <User className="h-10 w-10 text-gray-400" />
                  <div>
                    <p className={`${getTypographyClass('body', 'sm')} font-medium text-gray-900 dark:text-gray-100`}>
                      {worker.full_name}
                    </p>
                    <p className={`${getTypographyClass('caption', 'xs')} text-gray-500 dark:text-gray-400`}>
                      {worker.role === 'site_manager' ? '현장관리자' : '작업자'} · {worker.trade || '미지정'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className={`${getTypographyClass('body', 'sm')} text-gray-500 dark:text-gray-400`}>
              등록된 직원이 없습니다
            </p>
          )}
        </div>
      </div>
    </div>
  )
}