'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Users, 
  Building2, 
  MapPin, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  Clock,
  UserPlus,
  Wand2,
  History,
  MoveRight
} from 'lucide-react'
import { WorkflowTooltip, MappingTooltip, AssignmentExplanationTooltip } from './AssignmentTooltip'
import PartnerSiteMapping from './PartnerSiteMapping'
import UserAssignmentMatrix from './UserAssignmentMatrix'
import UserAssignmentMatrixDnD from './UserAssignmentMatrixDnD'
import AssignmentWizard from './AssignmentWizard'
import AssignmentHistory from './AssignmentHistory'

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

export default function AssignmentDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    assignedUsers: 0, 
    unassignedUsers: 0,
    totalSites: 0,
    activeSites: 0,
    totalPartners: 0,
    partnerSiteMappings: 0,
    recentAssignments: 0
  })

  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  
  // Modal states
  const [showWizard, setShowWizard] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  // Load dashboard data
  useEffect(() => {
    loadDashboardStats()
    loadRecentActivity()
  }, [])

  const loadDashboardStats = async () => {
    try {
      const response = await fetch('/api/admin/assignment/dashboard/stats')
      const result = await response.json()
      
      if (result.success) {
        setStats(result.data)
      }
    } catch (error) {
      console.error('Failed to load dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadRecentActivity = async () => {
    try {
      const response = await fetch('/api/admin/assignment/dashboard/activity?limit=10')
      const result = await response.json()
      
      if (result.success) {
        setRecentActivity(result.data)
      }
    } catch (error) {
      console.error('Failed to load recent activity:', error)
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'assignment': return <UserPlus className="h-4 w-4 text-green-500" />
      case 'mapping': return <Building2 className="h-4 w-4 text-blue-500" />
      case 'unassignment': return <AlertCircle className="h-4 w-4 text-orange-500" />
      default: return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            통합 배정 관리 대시보드
            <WorkflowTooltip />
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            파트너사-현장 매핑 및 사용자 배정을 통합 관리합니다
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowHistory(true)}
            className="flex items-center gap-2"
          >
            <History className="h-4 w-4" />
            배정 이력
          </Button>
          <Button
            onClick={() => setShowWizard(true)}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
          >
            <Wand2 className="h-4 w-4" />
            배정 마법사
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">전체 사용자</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalUsers}</p>
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
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalSites}</p>
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
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1">
                  파트너사 매핑
                  <MappingTooltip />
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.partnerSiteMappings}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    파트너사: {stats.totalPartners}
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
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.recentAssignments}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Badge variant="outline" className="text-xs">
                    지난 7일
                  </Badge>
                </div>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">전체 현황</TabsTrigger>
          <TabsTrigger value="mapping" className="flex items-center gap-2">
            파트너사-현장 매핑
            <MappingTooltip />
          </TabsTrigger>
          <TabsTrigger value="assignments" className="flex items-center gap-2">
            사용자 배정
            <AssignmentExplanationTooltip />
          </TabsTrigger>
          <TabsTrigger value="dragdrop" className="flex items-center gap-1">
            <MoveRight className="h-4 w-4" />
            드래그 배정
          </TabsTrigger>
          <TabsTrigger value="activity">최근 활동</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Assignment Status Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  배정 현황 요약
                </CardTitle>
                <CardDescription>
                  전체 사용자의 현장 배정 상태를 보여줍니다
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium text-green-900 dark:text-green-300">배정 완료</p>
                        <p className="text-sm text-green-600 dark:text-green-400">활성 배정이 있는 사용자</p>
                      </div>
                    </div>
                    <span className="text-xl font-bold text-green-600">{stats.assignedUsers}</span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="h-5 w-5 text-orange-600" />
                      <div>
                        <p className="font-medium text-orange-900 dark:text-orange-300">미배정</p>
                        <p className="text-sm text-orange-600 dark:text-orange-400">현장 배정이 필요한 사용자</p>
                      </div>
                    </div>
                    <span className="text-xl font-bold text-orange-600">{stats.unassignedUsers}</span>
                  </div>
                </div>

                {stats.unassignedUsers > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button 
                      onClick={() => setActiveTab('assignments')}
                      className="w-full"
                      variant="outline"
                    >
                      미배정 사용자 관리하기
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  최근 활동
                </CardTitle>
                <CardDescription>
                  최근 배정 관련 활동 내역입니다
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentActivity.slice(0, 5).map((activity, index) => (
                    <div key={activity.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
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
                      <p>최근 활동이 없습니다</p>
                    </div>
                  )}
                </div>

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
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="mapping">
          <PartnerSiteMapping onUpdate={loadDashboardStats} />
        </TabsContent>

        <TabsContent value="assignments">
          <UserAssignmentMatrix onUpdate={loadDashboardStats} />
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>배정 활동 내역</CardTitle>
              <CardDescription>
                모든 배정 관련 활동의 상세 내역입니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivity.map((activity, index) => (
                  <div key={activity.id} className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    {getActivityIcon(activity.type)}
                    <div className="flex-1">
                      <p className="text-sm text-gray-900 dark:text-gray-100">
                        {activity.description}
                      </p>
                      <div className="flex items-center gap-4 mt-1">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(activity.timestamp).toLocaleString('ko-KR')}
                        </p>
                        {activity.user_name && (
                          <Badge variant="outline" className="text-xs">
                            사용자: {activity.user_name}
                          </Badge>
                        )}
                        {activity.site_name && (
                          <Badge variant="outline" className="text-xs">
                            현장: {activity.site_name}
                          </Badge>
                        )}
                        {activity.partner_name && (
                          <Badge variant="outline" className="text-xs">
                            파트너사: {activity.partner_name}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {recentActivity.length === 0 && (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <Clock className="h-12 w-12 mx-auto mb-4" />
                    <p>활동 내역이 없습니다</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dragdrop" className="space-y-6">
          <UserAssignmentMatrixDnD 
            onUpdate={() => {
              loadDashboardStats()
              loadRecentActivity()
            }}
          />
        </TabsContent>
      </Tabs>

      {/* Assignment Wizard Modal */}
      <Dialog open={showWizard} onOpenChange={setShowWizard}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5" />
              배정 마법사
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <AssignmentWizard
              onClose={() => setShowWizard(false)}
              onComplete={() => {
                setShowWizard(false)
                loadDashboardStats()
                loadRecentActivity()
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Assignment History Modal */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              배정 이력
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <AssignmentHistory />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}