'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import StatsCard from '@/components/ui/stats-card'
import { useFontSize, getFullTypographyClass } from '@/contexts/FontSizeContext'
import { useTouchMode } from '@/contexts/TouchModeContext'
import { getDashboardStats, type DashboardStats } from '@/app/actions/admin/dashboard-stats'
import { formatRelativeTime } from '@/lib/utils/format-time'
import * as Icons from 'lucide-react'

// Destructure icons to ensure they're properly imported
const {
  Users,
  Building2,
  DollarSign,
  Package,
  FileText,
  Layers,
  Home,
  Search,
  Calendar,
  Bell,
  Shield,
  Monitor,
  Database,
  Settings,
  HelpCircle,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Camera,
} = Icons

// (빠른 작업 섹션 제거로 ICON_MAP 불필요)

// 활동 아이콘 매핑 - explicitly typed to avoid bundling issues
const ACTIVITY_ICON_MAP: Record<string, React.ComponentType<any>> = {
  CheckCircle: CheckCircle,
  AlertCircle: AlertCircle,
  TrendingUp: TrendingUp,
  Camera: Camera,
  Building2: Building2,
  Users: Users,
}

export function AdminDashboardContent() {
  const { isLargeFont } = useFontSize()
  const { touchMode } = useTouchMode()
  const [mounted, setMounted] = useState(false)
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [pendingSignups, setPendingSignups] = useState(0)
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeSites: 0,
    todayReports: 0,
    recentActivities: [],
  })

  // 좌측 사이드바 메뉴 라벨과 맞춤 매핑
  const SIDEBAR_LABELS: Record<string, string> = {
    '/dashboard/admin': '홈',
    '/dashboard/admin/sites': '현장 관리',
    '/dashboard/admin/daily-reports': '작업일지 관리',
    '/dashboard/admin/documents/invoice': '기성청구 관리',
    '/dashboard/admin/materials': '자재 관리',
    '/dashboard/admin/tools/photo-grid': '사진대지 관리',
    '/dashboard/admin/tools/markup': '도면마킹 관리',
    '/dashboard/admin/signup-requests': '가입 요청 관리',
    '/dashboard/admin/users': '사용자 관리',
    '/dashboard/admin/salary': '급여관리 도구',
    '/dashboard/admin/documents/required': '필수서류 관리',
    '/dashboard/admin/organizations': '소속(시공사) 관리',
    '/dashboard/admin/communication': '커뮤니케이션',
    '/dashboard/admin/notifications': '알림 관리',
    '/dashboard/admin/documents/company': '이노피앤씨 설정',
  }

  const resolveQuickActionTitle = (url: string, fallback: string) => {
    if (!url) return fallback
    if (SIDEBAR_LABELS[url]) return SIDEBAR_LABELS[url]
    const match = Object.keys(SIDEBAR_LABELS)
      .filter(k => url.startsWith(k))
      .sort((a, b) => b.length - a.length)[0]
    return match ? SIDEBAR_LABELS[match] : fallback
  }

  // 읽지 않은 알림 수 불러오기
  const fetchUnreadNotifications = async () => {
    try {
      const response = await fetch('/api/notifications/history')
      if (response.ok) {
        const data = await response.json()
        const unreadCount = data.notifications?.filter((n: unknown) => !n.is_read).length || 0
        setUnreadNotifications(unreadCount)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }

  // 가입 승인 대기 수 불러오기
  const fetchPendingSignups = async () => {
    try {
      const signupModule = await import('@/app/actions/admin/signup-approvals')
      const result = await signupModule.getPendingSignupRequests()
      if (result.requests) {
        setPendingSignups(result.requests.length)
      }
    } catch (error) {
      console.error('Error fetching pending signups:', error)
    }
  }

  // 대시보드 통계 불러오기
  const fetchDashboardStats = async () => {
    try {
      const result = await getDashboardStats()
      if (result.success && result.data) {
        setDashboardStats(result.data)
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    }
  }

  useEffect(() => {
    setMounted(true)
    fetchUnreadNotifications()
    fetchPendingSignups()
    fetchDashboardStats()

    // 30초마다 통계 새로고침
    const interval = setInterval(fetchDashboardStats, 30000)
    return () => clearInterval(interval)
  }, [])

  if (!mounted) {
    // Avoid hydration mismatch by rendering after client mount
    return <div />
  }

  return (
    <div
      className={`${
        touchMode === 'glove'
          ? 'px-5 sm:px-7 lg:px-9 py-10'
          : touchMode === 'precision'
            ? 'px-3 sm:px-5 lg:px-7 py-6'
            : 'px-4 sm:px-6 lg:px-8 py-8'
      }`}
    >
      {/* Page Header - 시스템관리자 화면임을 명확히 표시 */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="h-8 w-8 text-red-600" />
          <h1
            className={`${getFullTypographyClass('heading', '2xl', isLargeFont)} font-bold text-gray-900 dark:text-gray-100`}
          >
            홈
          </h1>
        </div>
        <p
          className={`mt-2 ${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-700 dark:text-gray-300`}
        >
          전체 시스템 현황과 관리 기능에 접근할 수 있습니다
        </p>
      </div>

      <div className="space-y-6">
        {/* Quick Stats (standardized) */}
        <div className="grid grid-cols-5 gap-4">
          <StatsCard label="전체 사용자" value={dashboardStats.totalUsers} unit="person" />
          <StatsCard label="활성 현장" value={dashboardStats.activeSites} unit="site" />
          <StatsCard label="오늘 작업일지" value={dashboardStats.todayReports} unit="count" />
          <StatsCard label="미확인 알림" value={unreadNotifications} unit="count" />
          <StatsCard label="가입요청 승인대기" value={pendingSignups} unit="count" />
        </div>

        {/* Recent Activities */}
        <div className="grid grid-cols-2 gap-6">
          <Card
            className={`${
              touchMode === 'glove' ? 'p-8' : touchMode === 'precision' ? 'p-4' : 'p-6'
            }`}
          >
            <h2
              className={`${getFullTypographyClass('heading', 'lg', isLargeFont)} font-semibold mb-4`}
            >
              최근 활동
            </h2>
            <div className="space-y-3">
              {Array.isArray(dashboardStats.recentActivities) &&
              dashboardStats.recentActivities.length > 0 ? (
                dashboardStats.recentActivities.map(activity => {
                  const IconComponent = ACTIVITY_ICON_MAP[activity.icon] || AlertCircle
                  return (
                    <div key={activity.id} className="flex items-start gap-3">
                      <IconComponent className={`h-5 w-5 ${activity.iconColor} mt-0.5`} />
                      <div className="flex-1">
                        <p
                          className={`${getFullTypographyClass('body', 'sm', isLargeFont)} font-medium`}
                        >
                          {activity.title}
                        </p>
                        <p
                          className={`${getFullTypographyClass('caption', 'xs', isLargeFont)} text-gray-500`}
                        >
                          {activity.description} ({formatRelativeTime(activity.timestamp)})
                        </p>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-4">
                  <p
                    className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-500`}
                  >
                    최근 활동이 없습니다
                  </p>
                </div>
              )}
            </div>
          </Card>

          <Card
            className={`${
              touchMode === 'glove' ? 'p-8' : touchMode === 'precision' ? 'p-4' : 'p-6'
            }`}
          >
            <h2
              className={`${getFullTypographyClass('heading', 'lg', isLargeFont)} font-semibold mb-4`}
            >
              시스템 상태
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className={getFullTypographyClass('body', 'sm', isLargeFont)}>서버 상태</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span
                    className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-green-600`}
                  >
                    정상
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className={getFullTypographyClass('body', 'sm', isLargeFont)}>
                  데이터베이스
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span
                    className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-green-600`}
                  >
                    정상
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className={getFullTypographyClass('body', 'sm', isLargeFont)}>백업 상태</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span
                    className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-green-600`}
                  >
                    최신
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className={getFullTypographyClass('body', 'sm', isLargeFont)}>
                  스토리지 사용량
                </span>
                <span
                  className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-600`}
                >
                  45%
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboardContent
