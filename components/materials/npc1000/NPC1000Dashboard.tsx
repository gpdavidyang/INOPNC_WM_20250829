'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Calendar,
  FileText,
  PlusCircle,
  BarChart3,
  Activity,
  Clock,
  Building2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useFontSize, getTypographyClass , getFullTypographyClass } from '@/contexts/FontSizeContext'
import { useTouchMode } from '@/contexts/TouchModeContext'
import type { Site } from '@/types'
import type { NPC1000Data } from '@/types/materials'
import { NPC1000InventoryManagement } from './NPC1000InventoryManagement'
import { NPC1000TransactionHistory } from './NPC1000TransactionHistory'
import { NPC1000Analytics } from './NPC1000Analytics'
import { NPC1000RequestForm } from './NPC1000RequestForm'

interface NPC1000DashboardProps {
  sites: Site[]
  currentUser: any
}

export function NPC1000Dashboard({ sites, currentUser }: NPC1000DashboardProps) {
  const { isLargeFont } = useFontSize()
  const { touchMode } = useTouchMode()
  const [selectedSite, setSelectedSite] = useState<string>('')
  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats] = useState({
    totalStock: 0,
    monthlyUsage: 0,
    pendingRequests: 0,
    lowStockAlerts: 0,
    averageDailyUsage: 0,
    projectedDaysRemaining: 0
  })
  const [loading, setLoading] = useState(false)
  const [showRequestForm, setShowRequestForm] = useState(false)

  useEffect(() => {
    if (sites.length > 0 && !selectedSite) {
      setSelectedSite(sites[0].id)
    }
  }, [sites])

  useEffect(() => {
    if (selectedSite) {
      loadStats()
    }
  }, [selectedSite])

  const loadStats = async () => {
    setLoading(true)
    try {
      // Mock data - replace with actual API call
      setStats({
        totalStock: 12500,
        monthlyUsage: 3200,
        pendingRequests: 5,
        lowStockAlerts: 2,
        averageDailyUsage: 106,
        projectedDaysRemaining: 118
      })
    } catch (error) {
      console.error('Failed to load NPC-1000 stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStockStatus = (daysRemaining: number) => {
    if (daysRemaining > 30) return { color: 'text-green-600', bg: 'bg-green-50', label: '정상' }
    if (daysRemaining > 14) return { color: 'text-yellow-600', bg: 'bg-yellow-50', label: '주의' }
    return { color: 'text-red-600', bg: 'bg-red-50', label: '부족' }
  }

  const stockStatus = getStockStatus(stats.projectedDaysRemaining)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className={`${getFullTypographyClass('heading', '2xl', isLargeFont)} font-bold`}>NPC-1000 자재 관리</h2>
          <p className={`${getFullTypographyClass('body', 'base', isLargeFont)} text-gray-600 mt-1`}>통합 자재 재고 및 사용 현황 관리</p>
        </div>
        <div className="flex gap-2">
          <select
            value={selectedSite}
            onChange={(e) => setSelectedSite(e.target.value)}
            className="w-full px-3 py-1.5 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          >
            <option value="">현장 선택</option>
            {sites.map((site: any) => (
              <option key={site.id} value={site.id}>
                {site.name}
              </option>
            ))}
          </select>
          <Button
            variant="primary"
            onClick={() => setShowRequestForm(true)}
            size={touchMode === 'glove' ? 'field' : touchMode === 'precision' ? 'compact' : 'standard'}
            className="flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            자재 요청
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className={touchMode === 'glove' ? 'p-8' : touchMode === 'precision' ? 'p-4' : 'p-6'}>
          <div className="flex items-start justify-between">
            <div>
              <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-600`}>현재 재고량</p>
              <p className={`${getFullTypographyClass('heading', '2xl', isLargeFont)} font-bold mt-1`}>{stats.totalStock.toLocaleString()} kg</p>
              <div className={cn('flex items-center gap-1 mt-2', stockStatus.color)}>
                <Badge className={cn(getFullTypographyClass('caption', 'xs', isLargeFont), stockStatus.bg, stockStatus.color)}>
                  {stockStatus.label}
                </Badge>
                <span className={getFullTypographyClass('caption', 'xs', isLargeFont)}>
                  (약 {stats.projectedDaysRemaining}일 사용 가능)
                </span>
              </div>
            </div>
            <div className={cn('p-3 rounded-lg', stockStatus.bg)}>
              <Package className={cn('w-6 h-6', stockStatus.color)} />
            </div>
          </div>
        </Card>

        <Card className={touchMode === 'glove' ? 'p-8' : touchMode === 'precision' ? 'p-4' : 'p-6'}>
          <div className="flex items-start justify-between">
            <div>
              <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-600`}>월간 사용량</p>
              <p className={`${getFullTypographyClass('heading', '2xl', isLargeFont)} font-bold mt-1`}>{stats.monthlyUsage.toLocaleString()} kg</p>
              <div className="flex items-center gap-1 mt-2 text-blue-600">
                <Activity className="w-4 h-4" />
                <span className={getFullTypographyClass('caption', 'xs', isLargeFont)}>일평균 {stats.averageDailyUsage} kg</span>
              </div>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className={touchMode === 'glove' ? 'p-8' : touchMode === 'precision' ? 'p-4' : 'p-6'}>
          <div className="flex items-start justify-between">
            <div>
              <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-600`}>대기중인 요청</p>
              <p className={`${getFullTypographyClass('heading', '2xl', isLargeFont)} font-bold mt-1`}>{stats.pendingRequests}건</p>
              <div className="flex items-center gap-1 mt-2 text-orange-600">
                <Clock className="w-4 h-4" />
                <span className={getFullTypographyClass('caption', 'xs', isLargeFont)}>승인 대기 중</span>
              </div>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <FileText className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </Card>

        <Card className={touchMode === 'glove' ? 'p-8' : touchMode === 'precision' ? 'p-4' : 'p-6'}>
          <div className="flex items-start justify-between">
            <div>
              <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-600`}>재고 부족 경고</p>
              <p className={`${getFullTypographyClass('heading', '2xl', isLargeFont)} font-bold mt-1`}>{stats.lowStockAlerts}개</p>
              <div className="flex items-center gap-1 mt-2 text-red-600">
                <AlertTriangle className="w-4 h-4" />
                <span className={getFullTypographyClass('caption', 'xs', isLargeFont)}>즉시 확인 필요</span>
              </div>
            </div>
            <div className="p-3 bg-red-50 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-4 max-w-2xl">
          <TabsTrigger value="overview">재고 현황</TabsTrigger>
          <TabsTrigger value="transactions">입출고 내역</TabsTrigger>
          <TabsTrigger value="analytics">사용 분석</TabsTrigger>
          <TabsTrigger value="requests">요청 관리</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <NPC1000InventoryManagement 
            siteId={selectedSite} 
            currentUser={currentUser}
          />
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <NPC1000TransactionHistory 
            siteId={selectedSite}
          />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <NPC1000Analytics 
            siteId={selectedSite}
          />
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          <Card className={touchMode === 'glove' ? 'p-8' : touchMode === 'precision' ? 'p-4' : 'p-6'}>
            <h3 className={`${getFullTypographyClass('heading', 'lg', isLargeFont)} font-semibold mb-4`}>자재 요청 관리</h3>
            <p className={`${getFullTypographyClass('body', 'base', isLargeFont)} text-gray-600`}>요청 관리 기능은 준비 중입니다.</p>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Request Form Modal */}
      {showRequestForm && (
        <NPC1000RequestForm
          siteId={selectedSite}
          currentUser={currentUser}
          onClose={() => setShowRequestForm(false)}
          onSuccess={() => {
            setShowRequestForm(false)
            loadStats()
          }}
        />
      )}
    </div>
  )
}