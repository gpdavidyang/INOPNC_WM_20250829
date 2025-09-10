'use client'

import { useState, useEffect } from 'react'
import { Profile } from '@/types'
import { InventoryStatus } from '@/types/materials'
import { createClient } from '@/lib/supabase/client'
import { 
  Package, TrendingUp, TrendingDown, AlertTriangle, 
  Calendar, Building2, Search, Filter, Download,
  Truck, CheckCircle, XCircle, Clock, FileText,
  BarChart3, PlusCircle, Edit, Eye, RefreshCw,
  Database, Zap, Target
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'

interface IntegratedInventoryStatusProps {
  profile: Profile
}

interface ExtendedInventoryStatus extends InventoryStatus {
  site_name?: string
  material_name?: string
}

interface InventoryAlert {
  type: 'low_stock' | 'out_of_stock' | 'over_threshold'
  location: string
  message: string
  current_stock: number
  threshold: number
}

export default function IntegratedInventoryStatus({ profile }: IntegratedInventoryStatusProps) {
  const [inventoryData, setInventoryData] = useState<ExtendedInventoryStatus[]>([])
  const [alerts, setAlerts] = useState<InventoryAlert[]>([])
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLocation, setSelectedLocation] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')

  const supabase = createClient()

  // Fetch inventory data
  useEffect(() => {
    fetchInventoryData()
    
    // Set up real-time updates
    const interval = setInterval(fetchInventoryData, 30000) // Update every 30 seconds
    
    return () => clearInterval(interval)
  }, [])

  const fetchInventoryData = async () => {
    setLoading(true)
    try {
      const { data: inventoryData, error } = await supabase
        .from('v_inventory_status')
        .select(`
          *,
          material:materials(name, code),
          site:sites(name)
        `)
        .order('location')

      if (error) throw error

      const processedData: ExtendedInventoryStatus[] = (inventoryData || []).map(item => ({
        ...item,
        site_name: item.site?.name || item.location,
        material_name: item.material?.name || 'NPC-1000'
      }))

      setInventoryData(processedData)
      
      // Generate alerts
      const newAlerts: InventoryAlert[] = []
      processedData.forEach(item => {
        if (item.status === 'out_of_stock') {
          newAlerts.push({
            type: 'out_of_stock',
            location: item.location,
            message: `${item.location}의 재고가 소진되었습니다`,
            current_stock: item.current_stock,
            threshold: item.minimum_threshold
          })
        } else if (item.status === 'low') {
          newAlerts.push({
            type: 'low_stock',
            location: item.location,
            message: `${item.location}의 재고가 부족합니다 (${item.current_stock}말 남음)`,
            current_stock: item.current_stock,
            threshold: item.minimum_threshold
          })
        }
      })
      
      setAlerts(newAlerts)
      setLastUpdated(new Date())
      
    } catch (error) {
      console.error('Error fetching inventory:', error)
      toast.error('재고 정보를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return 'text-green-600'
      case 'low': return 'text-yellow-600'
      case 'out_of_stock': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'normal':
        return <Badge className="bg-green-100 text-green-800">정상</Badge>
      case 'low':
        return <Badge className="bg-yellow-100 text-yellow-800">부족</Badge>
      case 'out_of_stock':
        return <Badge variant="destructive">소진</Badge>
      default:
        return <Badge variant="secondary">알 수 없음</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'normal':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'low':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'out_of_stock':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <Package className="h-4 w-4 text-gray-600" />
    }
  }

  const calculateStockLevel = (current: number, threshold: number) => {
    if (current === 0) return 0
    return Math.min((current / (threshold * 2)) * 100, 100)
  }

  const filteredInventory = inventoryData.filter(item => {
    const matchesSearch = searchTerm === '' || 
      item.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.material_name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesLocation = selectedLocation === 'all' || item.location === selectedLocation
    const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus
    
    return matchesSearch && matchesLocation && matchesStatus
  })

  // Calculate summary stats
  const totalStock = inventoryData.reduce((sum, item) => sum + item.current_stock, 0)
  const totalReserved = inventoryData.reduce((sum, item) => sum + item.reserved_stock, 0)
  const totalAvailable = inventoryData.reduce((sum, item) => sum + item.available_stock, 0)
  const alertCount = alerts.length

  // Get unique locations for filter
  const uniqueLocations = [...new Set(inventoryData.map(item => item.location))]

  return (
    <div className="p-6 space-y-6">
      {/* Header & Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">총 재고</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalStock.toLocaleString()} 말</p>
              </div>
              <Database className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">예약 재고</p>
                <p className="text-2xl font-bold text-orange-600">{totalReserved.toLocaleString()} 말</p>
              </div>
              <Target className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">가용 재고</p>
                <p className="text-2xl font-bold text-green-600">{totalAvailable.toLocaleString()} 말</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">알림</p>
                <p className="text-2xl font-bold text-red-600">{alertCount}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-900/10">
          <CardHeader>
            <CardTitle className="flex items-center text-red-800 dark:text-red-400">
              <AlertTriangle className="h-5 w-5 mr-2" />
              재고 알림 ({alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.slice(0, 5).map((alert, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-md">
                  <div className="flex items-center">
                    {alert.type === 'out_of_stock' ? (
                      <XCircle className="h-4 w-4 text-red-600 mr-2" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2" />
                    )}
                    <span className="text-sm">{alert.message}</span>
                  </div>
                  <Badge variant={alert.type === 'out_of_stock' ? 'destructive' : 'secondary'}>
                    {alert.current_stock}/{alert.threshold}
                  </Badge>
                </div>
              ))}
              {alerts.length > 5 && (
                <p className="text-xs text-gray-500 text-center">
                  +{alerts.length - 5}개 더 보기
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="위치, 자재명으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-80"
            />
          </div>

          <Select value={selectedLocation} onValueChange={setSelectedLocation}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="위치 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 위치</SelectItem>
              {uniqueLocations.map((location) => (
                <SelectItem key={location} value={location}>{location}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="상태" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 상태</SelectItem>
              <SelectItem value="normal">정상</SelectItem>
              <SelectItem value="low">부족</SelectItem>
              <SelectItem value="out_of_stock">소진</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2 items-center">
          <span className="text-xs text-gray-500">
            마지막 업데이트: {formatDate(lastUpdated.toISOString())}
          </span>
          <Button variant="outline" size="sm" onClick={fetchInventoryData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            새로고침
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            내보내기
          </Button>
        </div>
      </div>

      {/* Inventory Status Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">위치</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">현재재고</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">예약재고</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">가용재고</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">최소기준</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">재고수준</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">상태</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">최근업데이트</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">로딩 중...</td>
                  </tr>
                ) : filteredInventory.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">재고 정보가 없습니다.</td>
                  </tr>
                ) : (
                  filteredInventory.map((item, index) => {
                    const stockLevel = calculateStockLevel(item.current_stock, item.minimum_threshold)
                    
                    return (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Building2 className="h-4 w-4 text-gray-400 mr-2" />
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {item.location}
                              </div>
                              <div className="text-xs text-gray-500">
                                {item.material_name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {item.current_stock.toLocaleString()} 말
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-orange-600">
                            {item.reserved_stock.toLocaleString()} 말
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-green-600">
                            {item.available_stock.toLocaleString()} 말
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {item.minimum_threshold.toLocaleString()} 말
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <div className="w-16">
                              <Progress 
                                value={stockLevel} 
                                className={`h-2 ${
                                  stockLevel < 25 ? 'bg-red-200' : 
                                  stockLevel < 50 ? 'bg-yellow-200' : 'bg-green-200'
                                }`}
                              />
                            </div>
                            <span className="text-xs text-gray-500">
                              {Math.round(stockLevel)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getStatusIcon(item.status)}
                            <span className="ml-2">{getStatusBadge(item.status)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-900 dark:text-white">
                              {formatDate(item.last_updated)}
                            </span>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}