'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useFontSize, getTypographyClass } from '@/contexts/FontSizeContext'
import { useTouchMode } from '@/contexts/TouchModeContext'
import { 
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Building2,
  Edit2,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Plus
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { getMaterialInventory, updateMaterialStock } from '@/app/actions/materials'
import { getSites } from '@/app/actions/sites'
import { toast } from '@/components/ui/use-toast'
import { Progress } from '@/components/ui/progress'

interface MaterialInventoryProps {
  materials: any[]
  initialInventory: any[]
  currentUser: any
  currentSite?: any
  searchQuery: string
}

export function MaterialInventory({ materials, initialInventory, currentUser, currentSite, searchQuery }: MaterialInventoryProps) {
  const { isLargeFont } = useFontSize()
  const { touchMode } = useTouchMode()
  const [selectedSite, setSelectedSite] = useState<string>(currentSite?.id || '')
  const [sites, setSites] = useState<any[]>([])
  const [inventory, setInventory] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showUpdateDialog, setShowUpdateDialog] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [stockData, setStockData] = useState({
    current_stock: '',
    minimum_stock: '',
    maximum_stock: ''
  })

  // Load sites on mount
  useEffect(() => {
    loadSites()
  }, [])

  // Load inventory when site changes
  useEffect(() => {
    if (selectedSite) {
      loadInventory()
    }
  }, [selectedSite])

  const loadSites = async () => {
    const result = await getSites()
    if (result.success && result.data) {
      setSites(result.data)
      // Auto-select first site
      if (result.data.length > 0) {
        setSelectedSite(result.data[0].id)
      }
    }
  }

  const loadInventory = async () => {
    if (!selectedSite) return
    
    setLoading(true)
    try {
      const result = await getMaterialInventory(selectedSite)
      if (result.success && result.data) {
        setInventory(result.data)
      }
    } finally {
      setLoading(false)
    }
  }

  // Filter inventory based on search
  const filteredInventory = inventory.filter(item => {
    if (!searchQuery) return true
    return item.material?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           item.material?.material_code?.toLowerCase().includes(searchQuery.toLowerCase())
  })

  // Calculate stock status
  const getStockStatus = (item: any) => {
    if (!item.minimum_stock || !item.current_stock) return 'normal'
    if (item.current_stock <= 0) return 'out'
    if (item.current_stock <= item.minimum_stock) return 'low'
    if (item.maximum_stock && item.current_stock >= item.maximum_stock) return 'high'
    return 'normal'
  }

  const getStockBadge = (status: string) => {
    switch (status) {
      case 'out':
        return <Badge variant="error">재고 없음</Badge>
      case 'low':
        return <Badge variant="warning">재고 부족</Badge>
      case 'high':
        return <Badge variant="secondary">재고 과다</Badge>
      default:
        return <Badge variant="success">정상</Badge>
    }
  }

  const handleUpdateStock = async () => {
    if (!selectedItem) return

    try {
      const result = await updateMaterialStock(
        selectedSite,
        selectedItem.material_id,
        {
          current_stock: parseFloat(stockData.current_stock),
          minimum_stock: stockData.minimum_stock ? parseFloat(stockData.minimum_stock) : undefined,
          maximum_stock: stockData.maximum_stock ? parseFloat(stockData.maximum_stock) : undefined
        } as any
      )

      if (result.success) {
        toast({
          title: '재고 수정 완료',
          description: '재고 정보가 성공적으로 업데이트되었습니다.'
        })
        setShowUpdateDialog(false)
        loadInventory()
      } else {
        toast({
          title: '재고 수정 실패',
          description: result.error,
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: '오류 발생',
        description: '재고 업데이트 중 오류가 발생했습니다.',
        variant: 'destructive'
      })
    }
  }

  const openUpdateDialog = (item: any) => {
    setSelectedItem(item)
    setStockData({
      current_stock: item.current_stock?.toString() || '0',
      minimum_stock: item.minimum_stock?.toString() || '',
      maximum_stock: item.maximum_stock?.toString() || ''
    })
    setShowUpdateDialog(true)
  }

  // Get materials not in inventory
  const materialsNotInInventory = materials.filter(material => 
    !inventory.some(inv => inv.material_id === material.id)
  )

  return (
    <div className="space-y-4">
      {/* Site Selection */}
      <div className="flex items-center gap-4">
        <Building2 className="h-5 w-5 text-gray-600" />
        <select
          value={selectedSite}
          onChange={(e) => setSelectedSite(e.target.value)}
          className="w-full px-3 py-1.5 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
        >
          <option value="">현장 선택</option>
          {sites.map(site => (
            <option key={site.id} value={site.id}>
              {site.name}
            </option>
          ))}
        </select>
      </div>

      {selectedSite && (
        <>
          {/* Inventory Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">총 재고 품목</p>
                  <p className="text-2xl font-bold">{inventory.length}</p>
                </div>
                <Package className="h-8 w-8 text-gray-400" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">재고 부족</p>
                  <p className="text-2xl font-bold text-amber-600">
                    {inventory.filter(item => getStockStatus(item) === 'low').length}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-amber-400" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">재고 없음</p>
                  <p className="text-2xl font-bold text-red-600">
                    {inventory.filter(item => getStockStatus(item) === 'out').length}
                  </p>
                </div>
                <Package className="h-8 w-8 text-red-400" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">총 재고 가치</p>
                  <p className="text-xl font-bold">₩0</p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-400" />
              </div>
            </Card>
          </div>

          {/* Inventory List */}
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-8 text-gray-500">
                재고 정보를 불러오는 중...
              </div>
            ) : filteredInventory.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                재고 정보가 없습니다.
              </div>
            ) : (
              filteredInventory.map(item => {
                const status = getStockStatus(item)
                const stockPercentage = item.maximum_stock 
                  ? (item.current_stock / item.maximum_stock) * 100 
                  : 0

                return (
                  <Card key={item.id} className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-medium text-gray-900">
                            {item.material?.name || '알 수 없는 자재'}
                          </h3>
                          {getStockBadge(status)}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          코드: {item.material?.material_code || '-'} | 
                          카테고리: {item.material?.category?.name || '-'}
                        </p>
                      </div>
                      <Button
                        size="compact"
                        variant="outline"
                        onClick={() => openUpdateDialog(item)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-3">
                      <div>
                        <p className="text-xs text-gray-600">현재 재고</p>
                        <p className="text-lg font-semibold">
                          {item.current_stock || 0} {item.material?.unit}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">최소 재고</p>
                        <p className="text-lg">
                          {item.minimum_stock || '-'} {item.material?.unit}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">최대 재고</p>
                        <p className="text-lg">
                          {item.maximum_stock || '-'} {item.material?.unit}
                        </p>
                      </div>
                    </div>

                    {item.maximum_stock && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>재고 수준</span>
                          <span>{Math.round(stockPercentage)}%</span>
                        </div>
                        <Progress 
                          value={stockPercentage} 
                          className={`h-2 ${
                            status === 'out' ? 'bg-red-100' :
                            status === 'low' ? 'bg-amber-100' :
                            status === 'high' ? 'bg-blue-100' :
                            'bg-gray-100'
                          }`}
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-3 text-xs text-gray-600">
                      <span>최종 업데이트: {new Date(item.updated_at).toLocaleDateString()}</span>
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <ArrowUpRight className="h-3 w-3 text-green-600" />
                          입고: 0
                        </span>
                        <span className="flex items-center gap-1">
                          <ArrowDownRight className="h-3 w-3 text-red-600" />
                          출고: 0
                        </span>
                      </div>
                    </div>
                  </Card>
                )
              })
            )}
          </div>

          {/* Add missing materials */}
          {materialsNotInInventory.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                재고 등록 가능한 자재 ({materialsNotInInventory.length}개)
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {materialsNotInInventory.map(material => (
                  <Button
                    key={material.id}
                    variant="outline"
                    size="compact"
                    onClick={() => openUpdateDialog({ 
                      material_id: material.id, 
                      material,
                      current_stock: 0 
                    })}
                    className="justify-start"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    {material.name}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Update Stock Dialog */}
      <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>재고 정보 수정</DialogTitle>
            <DialogDescription>
              {selectedItem?.material?.name || '자재'}의 재고 정보를 수정합니다.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="current_stock">현재 재고 *</Label>
              <Input
                id="current_stock"
                type="number"
                value={stockData.current_stock}
                onChange={(e) => setStockData({ ...stockData, current_stock: e.target.value })}
                placeholder="0"
                required
              />
            </div>

            <div>
              <Label htmlFor="minimum_stock">최소 재고</Label>
              <Input
                id="minimum_stock"
                type="number"
                value={stockData.minimum_stock}
                onChange={(e) => setStockData({ ...stockData, minimum_stock: e.target.value })}
                placeholder="최소 재고량 설정"
              />
              <p className="text-xs text-gray-600 mt-1">
                이 수량 이하로 떨어지면 재고 부족 알림이 표시됩니다
              </p>
            </div>

            <div>
              <Label htmlFor="maximum_stock">최대 재고</Label>
              <Input
                id="maximum_stock"
                type="number"
                value={stockData.maximum_stock}
                onChange={(e) => setStockData({ ...stockData, maximum_stock: e.target.value })}
                placeholder="최대 재고량 설정"
              />
              <p className="text-xs text-gray-600 mt-1">
                이 수량을 초과하면 재고 과다 알림이 표시됩니다
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpdateDialog(false)}>
              취소
            </Button>
            <Button onClick={handleUpdateStock}>
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}