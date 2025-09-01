'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useFontSize, getFullTypographyClass } from '@/contexts/FontSizeContext'
import { useTouchMode } from '@/contexts/TouchModeContext'
import { QuickActionsSettings } from '@/components/admin/quick-actions-settings'
import { 
  Users, 
  Building2, 
  FileText, 
  DollarSign,
  Package,
  Layers,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Home,
  Search,
  Calendar,
  Bell,
  Shield,
  Monitor,
  Database,
  Settings,
  HelpCircle,
  Camera
} from 'lucide-react'
import Link from 'next/link'
import type { QuickAction } from '@/types'
import { getDashboardStats, formatRelativeTime, type DashboardStats, type RecentActivity } from '@/app/actions/admin/dashboard-stats'

// 아이콘 매핑
const ICON_MAP = {
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
  Camera
}

// 활동 아이콘 매핑
const ACTIVITY_ICON_MAP = {
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Camera,
  Building2,
  Users
}

export function AdminDashboardContent() {
  const { isLargeFont } = useFontSize()
  const { touchMode } = useTouchMode()
  const [quickActions, setQuickActions] = useState<QuickAction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [pendingSignups, setPendingSignups] = useState(0)
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeSites: 0,
    todayReports: 0,
    recentActivities: []
  })

  // 빠른 작업 불러오기
  const fetchQuickActions = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/quick-actions')
      if (response.ok) {
        const data = await response.json()
        setQuickActions(data.quickActions?.filter((action: QuickAction) => action.is_active) || [])
      }
    } catch (error) {
      console.error('Error fetching quick actions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 읽지 않은 알림 수 불러오기
  const fetchUnreadNotifications = async () => {
    try {
      const response = await fetch('/api/notifications/history')
      if (response.ok) {
        const data = await response.json()
        const unreadCount = data.notifications?.filter((n: any) => !n.is_read).length || 0
        setUnreadNotifications(unreadCount)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }

  // 가입 승인 대기 수 불러오기
  const fetchPendingSignups = async () => {
    try {
      const module = await import('@/app/actions/admin/signup-approvals')
      const result = await module.getSignupRequests('pending')
      if (result.success && result.data) {
        setPendingSignups(result.data.length)
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
    fetchQuickActions()
    fetchUnreadNotifications()
    fetchPendingSignups()
    fetchDashboardStats()
    
    // 30초마다 통계 새로고침
    const interval = setInterval(fetchDashboardStats, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className={`${
      touchMode === 'glove' ? 'px-5 sm:px-7 lg:px-9 py-10' : touchMode === 'precision' ? 'px-3 sm:px-5 lg:px-7 py-6' : 'px-4 sm:px-6 lg:px-8 py-8'
    }`}>
      {/* Page Header - 시스템관리자 화면임을 명확히 표시 */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="h-8 w-8 text-red-600" />
          <h1 className={`${getFullTypographyClass('heading', '2xl', isLargeFont)} font-bold text-gray-900 dark:text-gray-100`}>시스템 관리자 대시보드</h1>
        </div>
        <p className={`mt-2 ${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-700 dark:text-gray-300`}>전체 시스템 현황과 관리 기능에 접근할 수 있습니다</p>
      </div>
      
      <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className={`${
          touchMode === 'glove' ? 'p-5' : touchMode === 'precision' ? 'p-3' : 'p-4'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-500`}>전체 사용자</p>
              <p className={`${getFullTypographyClass('heading', '2xl', isLargeFont)} font-bold`}>{dashboardStats.totalUsers}명</p>
            </div>
            <Users className="h-8 w-8 text-blue-500" />
          </div>
        </Card>
        
        <Card className={`${
          touchMode === 'glove' ? 'p-5' : touchMode === 'precision' ? 'p-3' : 'p-4'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-500`}>활성 현장</p>
              <p className={`${getFullTypographyClass('heading', '2xl', isLargeFont)} font-bold`}>{dashboardStats.activeSites}개</p>
            </div>
            <Building2 className="h-8 w-8 text-green-500" />
          </div>
        </Card>
        
        <Card className={`${
          touchMode === 'glove' ? 'p-5' : touchMode === 'precision' ? 'p-3' : 'p-4'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-500`}>오늘 작업일지</p>
              <p className={`${getFullTypographyClass('heading', '2xl', isLargeFont)} font-bold`}>{dashboardStats.todayReports}건</p>
            </div>
            <FileText className="h-8 w-8 text-orange-500" />
          </div>
        </Card>
        
        <Card className={`${
          touchMode === 'glove' ? 'p-5' : touchMode === 'precision' ? 'p-3' : 'p-4'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-500`}>미확인 알림</p>
              <p className={`${getFullTypographyClass('heading', '2xl', isLargeFont)} font-bold`}>{unreadNotifications}건</p>
            </div>
            <Bell className="h-8 w-8 text-purple-500" />
          </div>
        </Card>
        
        <Card className={`${
          touchMode === 'glove' ? 'p-5' : touchMode === 'precision' ? 'p-3' : 'p-4'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-500`}>가입요청 승인대기</p>
              <p className={`${getFullTypographyClass('heading', '2xl', isLargeFont)} font-bold`}>{pendingSignups}건</p>
            </div>
            <Clock className="h-8 w-8 text-red-500" />
          </div>
        </Card>
      </div>

      {/* Quick Actions - Compact Version */}
      <Card className={`${
        touchMode === 'glove' ? 'p-5' : touchMode === 'precision' ? 'p-3' : 'p-4'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <h2 className={`${getFullTypographyClass('heading', 'base', isLargeFont)} font-semibold`}>빠른 작업</h2>
          <QuickActionsSettings onUpdate={fetchQuickActions} />
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {[...Array(6)].map((_, index) => (
              <div
                key={index}
                className={`${
                  touchMode === 'glove' ? 'h-14' : touchMode === 'precision' ? 'h-10' : 'h-12'
                } bg-gray-100 rounded-md animate-pulse`}
              />
            ))}
          </div>
        ) : quickActions.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {quickActions.map((action) => {
              const IconComponent = ICON_MAP[action.icon_name as keyof typeof ICON_MAP] || Home
              
              return (
                <Link key={action.id} href={action.link_url}>
                  <Button 
                    variant="outline" 
                    className={`${
                      touchMode === 'glove' ? 'h-14' : touchMode === 'precision' ? 'h-10' : 'h-12'
                    } flex items-center justify-center gap-2 w-full hover:bg-gray-50 dark:hover:bg-gray-700 px-2`}
                    title={action.description}
                  >
                    <IconComponent className="h-4 w-4 flex-shrink-0" />
                    <span className={`${getFullTypographyClass('caption', 'xs', isLargeFont)} truncate`}>
                      {action.title}
                    </span>
                  </Button>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className={`${getFullTypographyClass('caption', 'xs', isLargeFont)} text-gray-500 mb-2`}>
              등록된 빠른 작업이 없습니다.
            </p>
            <QuickActionsSettings onUpdate={fetchQuickActions} />
          </div>
        )}
      </Card>

      {/* Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className={`${
          touchMode === 'glove' ? 'p-8' : touchMode === 'precision' ? 'p-4' : 'p-6'
        }`}>
          <h2 className={`${getFullTypographyClass('heading', 'lg', isLargeFont)} font-semibold mb-4`}>최근 활동</h2>
          <div className="space-y-3">
            {dashboardStats.recentActivities.length > 0 ? (
              dashboardStats.recentActivities.map((activity) => {
                const IconComponent = ACTIVITY_ICON_MAP[activity.icon as keyof typeof ACTIVITY_ICON_MAP] || AlertCircle
                return (
                  <div key={activity.id} className="flex items-start gap-3">
                    <IconComponent className={`h-5 w-5 ${activity.iconColor} mt-0.5`} />
                    <div className="flex-1">
                      <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} font-medium`}>{activity.title}</p>
                      <p className={`${getFullTypographyClass('caption', 'xs', isLargeFont)} text-gray-500`}>
                        {activity.description} ({formatRelativeTime(activity.timestamp)})
                      </p>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-4">
                <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-500`}>
                  최근 활동이 없습니다
                </p>
              </div>
            )}
          </div>
        </Card>
        
        <Card className={`${
          touchMode === 'glove' ? 'p-8' : touchMode === 'precision' ? 'p-4' : 'p-6'
        }`}>
          <h2 className={`${getFullTypographyClass('heading', 'lg', isLargeFont)} font-semibold mb-4`}>시스템 상태</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className={getFullTypographyClass('body', 'sm', isLargeFont)}>서버 상태</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-green-600`}>정상</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className={getFullTypographyClass('body', 'sm', isLargeFont)}>데이터베이스</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-green-600`}>정상</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className={getFullTypographyClass('body', 'sm', isLargeFont)}>백업 상태</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-green-600`}>최신</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className={getFullTypographyClass('body', 'sm', isLargeFont)}>스토리지 사용량</span>
              <span className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-600`}>45%</span>
            </div>
          </div>
        </Card>
      </div>
      </div>
    </div>
  )
}