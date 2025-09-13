'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useFontSize, getTypographyClass , getFullTypographyClass } from '@/contexts/FontSizeContext'
import { useTouchMode } from '@/contexts/TouchModeContext'
import { 
  Package, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  Building2,
  Calendar,
  Clock,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  PlusCircle
} from 'lucide-react'
import { getNPC1000Inventory, getMaterialTransactions } from '@/app/actions/materials'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { NPC1000RequestForm } from './NPC1000RequestForm'

interface NPC1000InventoryDashboardProps {
  sites: unknown[]
  currentUser: any
}

export function NPC1000InventoryDashboard({ sites, currentUser }: NPC1000InventoryDashboardProps) {
  const { isLargeFont } = useFontSize()
  const { touchMode } = useTouchMode()
  const [selectedSite, setSelectedSite] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [showRequestForm, setShowRequestForm] = useState(false)
  const [inventory, setInventory] = useState<any[]>([])
  const [recentTransactions, setRecentTransactions] = useState<any[]>([])
  const [stats, setStats] = useState({
    totalStock: 0,
    monthlyIncoming: 0,
    monthlyUsage: 0,
    averageDailyUsage: 0,
    projectedDaysRemaining: 0,
    lowStockSites: 0
  })

  useEffect(() => {
    if (currentUser?.site_id) {
      setSelectedSite(currentUser.site_id)
    } else if (sites.length > 0) {
      setSelectedSite(sites[0].id)
    }
  }, [currentUser, sites])

  useEffect(() => {
    if (selectedSite) {
      loadData()
    }
  }, [selectedSite])

  const loadData = async () => {
    setLoading(true)
    try {
      // Load NPC-1000 inventory
      const inventoryResult = await getNPC1000Inventory(selectedSite)
      if (inventoryResult.success && inventoryResult.data) {
        setInventory(inventoryResult.data)
        calculateStats(inventoryResult.data)
      }

      // Load recent transactions for NPC-1000
      const transactionsResult = await getMaterialTransactions({
        site_id: selectedSite,
        material_id: (inventoryResult.data as any)?.[0]?.material_id,
        date_from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      })
      if (transactionsResult.success && transactionsResult.data) {
        setRecentTransactions(transactionsResult.data.slice(0, 5))
      }
    } catch (error) {
      console.error('Failed to load NPC-1000 data:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (inventoryData: unknown[]) => {
    const totalStock = inventoryData.reduce((sum, item) => sum + (item.current_stock || 0), 0)
    const lowStockSites = inventoryData.filter(item => 
      item.current_stock <= (item.minimum_stock || 1000)
    ).length

    // Calculate monthly usage from transactions (mock for now)
    const monthlyUsage = 3200
    const monthlyIncoming = 5000
    const averageDailyUsage = monthlyUsage / 30
    const projectedDaysRemaining = totalStock > 0 ? Math.floor(totalStock / averageDailyUsage) : 0

    setStats({
      totalStock,
      monthlyIncoming,
      monthlyUsage,
      averageDailyUsage,
      projectedDaysRemaining,
      lowStockSites
    })
  }

  const getStockStatus = (currentStock: number, minStock: number = 1000) => {
    const ratio = currentStock / minStock
    if (ratio > 2) return { color: 'text-green-600', bg: 'bg-green-50', label: '충분' }
    if (ratio > 1) return { color: 'text-blue-600', bg: 'bg-blue-50', label: '정상' }
    if (ratio > 0.5) return { color: 'text-yellow-600', bg: 'bg-yellow-50', label: '주의' }
    return { color: 'text-red-600', bg: 'bg-red-50', label: '부족' }
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'in': return <ArrowDownRight className="h-4 w-4 text-green-600" />
      case 'out': return <ArrowUpRight className="h-4 w-4 text-red-600" />
      case 'adjustment': return <BarChart3 className="h-4 w-4 text-blue-600" />
      default: return <Package className="h-4 w-4 text-gray-600" />
    }
  }

  const stockStatus = getStockStatus(stats.totalStock, 5000)

  return (
    <div className="space-y-6">
      {/* Header with Site Selection */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className={`${getFullTypographyClass('heading', '2xl', isLargeFont)} font-bold`}>
            NPC-1000 재고 현황
          </h2>
          <p className={`${getFullTypographyClass('body', 'base', isLargeFont)} text-gray-600 mt-1`}>
            전체 현장 NPC-1000 재고 및 사용 현황
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedSite}
            onChange={(e) => setSelectedSite(e.target.value)}
            className="w-full px-3 py-1.5 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          >
            <option value="">전체 현장</option>
            {sites.map((site: any) => (
              <option key={site.id} value={site.id}>
                {site.name}
              </option>
            ))}
          </select>
          <Button
            onClick={() => setShowRequestForm(true)}
            className={cn(
              "flex items-center gap-2",
              touchMode === 'glove' ? 'min-h-[56px] px-5' : 
              touchMode === 'precision' ? 'min-h-[44px] px-3' : 
              'min-h-[48px] px-4'
            )}
          >
            <PlusCircle className={cn(
              touchMode === 'glove' ? 'h-5 w-5' : 
              touchMode === 'precision' ? 'h-3.5 w-3.5' : 
              'h-4 w-4'
            )} />
            <span className={getFullTypographyClass('body', 'base', isLargeFont)}>자재 요청</span>
          </Button>
        </div>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Stock Card */}
        <Card>
          <CardContent className={cn(
            touchMode === 'glove' ? 'p-6' : 
            touchMode === 'precision' ? 'p-4' : 
            'p-5'
          )}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-600`}>
                  전체 재고량
                </p>
                <p className={`${getFullTypographyClass('heading', '2xl', isLargeFont)} font-bold mt-1`}>
                  {stats.totalStock.toLocaleString()} 말
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={cn(stockStatus.bg, stockStatus.color)}>
                    {stockStatus.label}
                  </Badge>
                  <span className={`${getFullTypographyClass('caption', 'xs', isLargeFont)} text-gray-500`}>
                    약 {stats.projectedDaysRemaining}일 사용 가능
                  </span>
                </div>
              </div>
              <div className={cn('p-3 rounded-lg', stockStatus.bg)}>
                <Package className={cn('h-6 w-6', stockStatus.color)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Incoming Card */}
        <Card>
          <CardContent className={cn(
            touchMode === 'glove' ? 'p-6' : 
            touchMode === 'precision' ? 'p-4' : 
            'p-5'
          )}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-600`}>
                  월간 입고량
                </p>
                <p className={`${getFullTypographyClass('heading', '2xl', isLargeFont)} font-bold mt-1`}>
                  {stats.monthlyIncoming.toLocaleString()} 말
                </p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className={`${getFullTypographyClass('caption', 'xs', isLargeFont)} text-green-600`}>
                    +12% 전월 대비
                  </span>
                </div>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <ArrowDownRight className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Usage Card */}
        <Card>
          <CardContent className={cn(
            touchMode === 'glove' ? 'p-6' : 
            touchMode === 'precision' ? 'p-4' : 
            'p-5'
          )}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-600`}>
                  월간 사용량
                </p>
                <p className={`${getFullTypographyClass('heading', '2xl', isLargeFont)} font-bold mt-1`}>
                  {stats.monthlyUsage.toLocaleString()} 말
                </p>
                <div className="flex items-center gap-1 mt-2">
                  <span className={`${getFullTypographyClass('caption', 'xs', isLargeFont)} text-gray-500`}>
                    일평균 {Math.round(stats.averageDailyUsage)}말
                  </span>
                </div>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <ArrowUpRight className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Alert Card */}
        <Card>
          <CardContent className={cn(
            touchMode === 'glove' ? 'p-6' : 
            touchMode === 'precision' ? 'p-4' : 
            'p-5'
          )}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-600`}>
                  재고 부족 현장
                </p>
                <p className={`${getFullTypographyClass('heading', '2xl', isLargeFont)} font-bold mt-1`}>
                  {stats.lowStockSites}개
                </p>
                <p className={`${getFullTypographyClass('caption', 'xs', isLargeFont)} text-red-600 mt-2`}>
                  즉시 보충 필요
                </p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Site Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle className={getFullTypographyClass('heading', 'xl', isLargeFont)}>
            현장별 재고 현황
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : inventory.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className={cn(
                      "text-left",
                      touchMode === 'glove' ? 'px-5 py-4' : 
                      touchMode === 'precision' ? 'px-3 py-2' : 
                      'px-4 py-3',
                      getFullTypographyClass('body', 'sm', isLargeFont)
                    )}>
                      현장명
                    </th>
                    <th className={cn(
                      "text-right",
                      touchMode === 'glove' ? 'px-5 py-4' : 
                      touchMode === 'precision' ? 'px-3 py-2' : 
                      'px-4 py-3',
                      getFullTypographyClass('body', 'sm', isLargeFont)
                    )}>
                      현재 재고
                    </th>
                    <th className={cn(
                      "text-right",
                      touchMode === 'glove' ? 'px-5 py-4' : 
                      touchMode === 'precision' ? 'px-3 py-2' : 
                      'px-4 py-3',
                      getFullTypographyClass('body', 'sm', isLargeFont)
                    )}>
                      최소 재고
                    </th>
                    <th className={cn(
                      "text-center",
                      touchMode === 'glove' ? 'px-5 py-4' : 
                      touchMode === 'precision' ? 'px-3 py-2' : 
                      'px-4 py-3',
                      getFullTypographyClass('body', 'sm', isLargeFont)
                    )}>
                      상태
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map((item: any) => {
                    const status = getStockStatus(item.current_stock, item.minimum_stock || 1000)
                    return (
                      <tr key={item.id} className="border-b hover:bg-gray-50">
                        <td className={cn(
                          touchMode === 'glove' ? 'px-5 py-4' : 
                          touchMode === 'precision' ? 'px-3 py-2' : 
                          'px-4 py-3',
                          getFullTypographyClass('body', 'base', isLargeFont)
                        )}>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-gray-400" />
                            {item.site?.name || '-'}
                          </div>
                        </td>
                        <td className={cn(
                          "text-right font-medium",
                          touchMode === 'glove' ? 'px-5 py-4' : 
                          touchMode === 'precision' ? 'px-3 py-2' : 
                          'px-4 py-3',
                          getFullTypographyClass('body', 'base', isLargeFont)
                        )}>
                          {item.current_stock.toLocaleString()} 말
                        </td>
                        <td className={cn(
                          "text-right text-gray-600",
                          touchMode === 'glove' ? 'px-5 py-4' : 
                          touchMode === 'precision' ? 'px-3 py-2' : 
                          'px-4 py-3',
                          getFullTypographyClass('body', 'base', isLargeFont)
                        )}>
                          {(item.minimum_stock || 1000).toLocaleString()} 말
                        </td>
                        <td className={cn(
                          "text-center",
                          touchMode === 'glove' ? 'px-5 py-4' : 
                          touchMode === 'precision' ? 'px-3 py-2' : 
                          'px-4 py-3'
                        )}>
                          <Badge className={cn(status.bg, status.color)}>
                            {status.label}
                          </Badge>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className={getFullTypographyClass('body', 'base', isLargeFont)}>
                재고 데이터가 없습니다
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className={getFullTypographyClass('heading', 'xl', isLargeFont)}>
            최근 거래 내역
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentTransactions.map((transaction: any) => (
              <div key={transaction.id} className={cn(
                "flex items-center justify-between border-b pb-3",
                touchMode === 'glove' ? 'py-4' : 
                touchMode === 'precision' ? 'py-2' : 
                'py-3'
              )}>
                <div className="flex items-center gap-3">
                  {getTransactionIcon(transaction.transaction_type)}
                  <div>
                    <p className={cn(
                      "font-medium",
                      getFullTypographyClass('body', 'base', isLargeFont)
                    )}>
                      {transaction.transaction_type === 'in' ? '입고' : 
                       transaction.transaction_type === 'out' ? '출고' : 
                       transaction.transaction_type === 'adjustment' ? '재고조정' : 
                       transaction.transaction_type}
                    </p>
                    <p className={cn(
                      "text-gray-500",
                      getFullTypographyClass('caption', 'xs', isLargeFont)
                    )}>
                      {format(new Date(transaction.transaction_date), 'yyyy년 MM월 dd일', { locale: ko })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn(
                    "font-medium",
                    getFullTypographyClass('body', 'base', isLargeFont),
                    transaction.transaction_type === 'in' ? 'text-green-600' : 
                    transaction.transaction_type === 'out' ? 'text-red-600' : 
                    'text-gray-900'
                  )}>
                    {transaction.transaction_type === 'out' ? '-' : '+'}{transaction.quantity.toLocaleString()} 말
                  </p>
                  {transaction.notes && (
                    <p className={cn(
                      "text-gray-500",
                      getFullTypographyClass('caption', 'xs', isLargeFont)
                    )}>
                      {transaction.notes}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Request Form Dialog */}
      {showRequestForm && (
        <NPC1000RequestForm
          siteId={selectedSite}
          onClose={() => setShowRequestForm(false)}
          currentUser={currentUser}
          onSuccess={() => {
            setShowRequestForm(false)
            loadData()
          }}
        />
      )}
    </div>
  )
}