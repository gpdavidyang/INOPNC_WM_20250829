'use client'

import { useEffect, useState } from 'react'
import {
  AlertCircle,
  Building2,
  CheckCircle,
  Clock,
  History,
  MapPin,
  TrendingUp,
  Users,
  UserPlus,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface DashboardStats {
  totalUsers: number
  assignedUsers: number
  unassignedUsers: number
  totalSites: number
  activeSites: number
  totalPartners: number
  partnerSiteMappings: number
  recentAssignments: number
}

interface RecentActivity {
  id: string
  type: 'assignment' | 'mapping' | 'unassignment'
  description: string
  timestamp: string
  user_name?: string
  site_name?: string
  partner_name?: string
}

const DEFAULT_STATS: DashboardStats = {
  totalUsers: 0,
  assignedUsers: 0,
  unassignedUsers: 0,
  totalSites: 0,
  activeSites: 0,
  totalPartners: 0,
  partnerSiteMappings: 0,
  recentAssignments: 0,
}

export default function AssignmentDashboard() {
  const [stats, setStats] = useState<DashboardStats>(DEFAULT_STATS)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'activity'>('overview')

  useEffect(() => {
    void loadDashboardStats()
    void loadRecentActivity()
  }, [])

  const loadDashboardStats = async () => {
    try {
      const response = await fetch('/api/admin/assignment/dashboard/stats')
      if (!response.ok) throw new Error('failed to load stats')
      const result = await response.json()
      if (result?.success && result.data) {
        setStats(result.data as DashboardStats)
      }
    } catch (error) {
      console.error('Failed to load dashboard stats:', error)
      setStats(DEFAULT_STATS)
    } finally {
      setLoading(false)
    }
  }

  const loadRecentActivity = async () => {
    try {
      const response = await fetch('/api/admin/assignment/dashboard/activity?limit=10')
      if (!response.ok) throw new Error('failed to load activity')
      const result = await response.json()
      if (result?.success && Array.isArray(result.data)) {
        setRecentActivity(result.data as RecentActivity[])
      }
    } catch (error) {
      console.error('Failed to load recent activity:', error)
      setRecentActivity([])
    }
  }

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'assignment':
        return <UserPlus className="h-4 w-4 text-green-500" />
      case 'mapping':
        return <Building2 className="h-4 w-4 text-blue-500" />
      case 'unassignment':
        return <AlertCircle className="h-4 w-4 text-orange-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={`skeleton-${i}`} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            통합 배정 관리 대시보드
            <History className="h-6 w-6 text-purple-500" />
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            시공업체-현장 매핑과 사용자 배정 현황을 한눈에 확인합니다.
          </p>
        </div>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          심화 배정 도구는 Phase 2에서 제공될 예정입니다.
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">전체 사용자</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {stats.totalUsers}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    배정됨: {stats.assignedUsers}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    미배정: {stats.unassignedUsers}
                  </Badge>
                </div>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">현장 현황</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {stats.totalSites}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <Badge variant="default" className="text-xs">
                    활성: {stats.activeSites}
                  </Badge>
                </div>
              </div>
              <MapPin className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  시공업체 매핑
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {stats.partnerSiteMappings}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    시공업체: {stats.totalPartners}
                  </Badge>
                </div>
              </div>
              <Building2 className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">최근 배정</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {stats.recentAssignments}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <Badge variant="outline" className="text-xs">
                    지난 7일 기준
                  </Badge>
                </div>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={value => setActiveTab(value as typeof activeTab)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">전체 현황</TabsTrigger>
          <TabsTrigger value="activity">최근 활동</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  배정 현황 요약
                </CardTitle>
                <CardDescription>전체 사용자의 현장 배정 상태를 보여줍니다.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium text-green-900 dark:text-green-300">배정 완료</p>
                        <p className="text-sm text-green-600 dark:text-green-400">
                          활성 배정이 있는 사용자
                        </p>
                      </div>
                    </div>
                    <span className="text-xl font-bold text-green-600">{stats.assignedUsers}</span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="h-5 w-5 text-orange-600" />
                      <div>
                        <p className="font-medium text-orange-900 dark:text-orange-300">미배정</p>
                        <p className="text-sm text-orange-600 dark:text-orange-400">
                          현장 배정이 필요한 사용자
                        </p>
                      </div>
                    </div>
                    <span className="text-xl font-bold text-orange-600">
                      {stats.unassignedUsers}
                    </span>
                  </div>
                </div>

                {stats.unassignedUsers > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button className="w-full" variant="outline" disabled>
                      미배정 사용자 관리 (준비 중)
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  최근 활동 요약
                </CardTitle>
                <CardDescription>최근 5건의 배정 관련 기록입니다.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentActivity.slice(0, 5).map(activity => (
                    <div
                      key={activity.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/40 rounded-lg"
                    >
                      {getActivityIcon(activity.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 dark:text-gray-100 truncate">
                          {activity.description}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(activity.timestamp).toLocaleString('ko-KR')}
                        </p>
                      </div>
                    </div>
                  ))}

                  {recentActivity.length === 0 && (
                    <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                      <Clock className="h-8 w-8 mx-auto mb-2" />
                      <p>활동 내역이 없습니다.</p>
                    </div>
                  )}

                  {recentActivity.length > 5 && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <Button
                        onClick={() => setActiveTab('activity')}
                        className="w-full"
                        variant="outline"
                      >
                        모든 활동 보기
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>배정 활동 내역</CardTitle>
              <CardDescription>배정, 매핑, 해제 등 상세 기록입니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivity.map(activity => (
                  <div
                    key={activity.id}
                    className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    {getActivityIcon(activity.type)}
                    <div className="flex-1">
                      <p className="text-sm text-gray-900 dark:text-gray-100">
                        {activity.description}
                      </p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-gray-500 dark:text-gray-400">
                        <span>{new Date(activity.timestamp).toLocaleString('ko-KR')}</span>
                        {activity.user_name && (
                          <Badge variant="outline">사용자: {activity.user_name}</Badge>
                        )}
                        {activity.site_name && (
                          <Badge variant="outline">현장: {activity.site_name}</Badge>
                        )}
                        {activity.partner_name && (
                          <Badge variant="outline">시공업체: {activity.partner_name}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {recentActivity.length === 0 && (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <Clock className="h-12 w-12 mx-auto mb-4" />
                    <p>활동 내역이 없습니다.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
