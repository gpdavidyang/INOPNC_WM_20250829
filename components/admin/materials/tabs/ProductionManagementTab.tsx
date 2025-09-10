'use client'

import { useState, useEffect } from 'react'
import { Profile } from '@/types'
import { ProductionRecord } from '@/types/materials'
import { 
  createProductionRecord,
  updateProductionRecord,
  deleteProductionRecord,
  getProductionHistory,
  getDailyProductionStatus
} from '@/app/actions/admin/production'
import { 
  Package, TrendingUp, Calendar, Building2, Search, Filter, 
  Download, PlusCircle, Edit, Eye, Trash2, CheckCircle, 
  XCircle, AlertTriangle, BarChart3, Factory, Save, X,
  DollarSign
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'

interface ProductionManagementTabProps {
  profile: Profile
}

interface ExtendedProductionRecord extends ProductionRecord {
  creator_name?: string
}

export default function ProductionManagementTab({ profile }: ProductionManagementTabProps) {
  const [productions, setProductions] = useState<ExtendedProductionRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDateRange, setSelectedDateRange] = useState<string>('week')

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedProduction, setSelectedProduction] = useState<ExtendedProductionRecord | null>(null)

  // Form states
  const [formData, setFormData] = useState({
    production_date: new Date().toISOString().split('T')[0],
    quantity_produced: '',
    unit_cost: '',
    notes: ''
  })

  // Stats from daily status
  const [dailyStats, setDailyStats] = useState({
    total_produced: 0,
    total_cost: 0,
    avg_unit_cost: 0,
    record_count: 0
  })

  // Fetch data
  useEffect(() => {
    fetchProductions()
    fetchDailyStats()
  }, [selectedDateRange])

  const fetchProductions = async () => {
    setLoading(true)
    try {
      const filters: any = {}
      
      // Date range filter
      const now = new Date()
      if (selectedDateRange === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        filters.start_date = weekAgo.toISOString().split('T')[0]
      } else if (selectedDateRange === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        filters.start_date = monthAgo.toISOString().split('T')[0]
      }

      const result = await getProductionHistory(filters)
      
      if (result.success) {
        setProductions(result.data || [])
      } else {
        toast.error(result.error || '생산 기록을 불러오는데 실패했습니다.')
      }
    } catch (error) {
      console.error('Error fetching productions:', error)
      toast.error('생산 기록을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const fetchDailyStats = async () => {
    try {
      const result = await getDailyProductionStatus()
      if (result.success && result.data) {
        setDailyStats(result.data.stats)
      }
    } catch (error) {
      console.error('Error fetching daily stats:', error)
    }
  }

  const handleAdd = () => {
    setFormData({
      production_date: new Date().toISOString().split('T')[0],
      quantity_produced: '',
      unit_cost: '',
      notes: ''
    })
    setShowAddModal(true)
  }

  const handleEdit = (production: ExtendedProductionRecord) => {
    setSelectedProduction(production)
    setFormData({
      production_date: production.production_date,
      quantity_produced: production.quantity_produced.toString(),
      unit_cost: production.unit_cost.toString(),
      notes: production.notes || ''
    })
    setShowEditModal(true)
  }

  const handleDetail = (production: ExtendedProductionRecord) => {
    setSelectedProduction(production)
    setShowDetailModal(true)
  }

  const handleDelete = async (production: ExtendedProductionRecord) => {
    if (!confirm('이 생산 기록을 삭제하시겠습니까?')) return

    try {
      const result = await deleteProductionRecord(production.id)
      if (result.success) {
        toast.success('생산 기록이 삭제되었습니다.')
        fetchProductions()
        fetchDailyStats()
      } else {
        toast.error(result.error || '삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('Error deleting production:', error)
      toast.error('삭제에 실패했습니다.')
    }
  }

  const submitProduction = async () => {
    try {
      if (!formData.production_date || !formData.quantity_produced) {
        toast.error('필수 정보를 모두 입력해주세요.')
        return
      }

      const quantity = parseFloat(formData.quantity_produced)
      const unitCost = parseFloat(formData.unit_cost) || 0

      if (isNaN(quantity) || quantity <= 0) {
        toast.error('올바른 수량을 입력해주세요.')
        return
      }

      if (unitCost < 0) {
        toast.error('단위비용은 0 이상이어야 합니다.')
        return
      }

      const productionData = {
        production_date: formData.production_date,
        quantity_produced: quantity,
        unit_cost: unitCost,
        notes: formData.notes || undefined
      }

      const result = await createProductionRecord(productionData)

      if (result.success) {
        toast.success('생산 기록이 추가되었습니다.')
        setShowAddModal(false)
        fetchProductions()
        fetchDailyStats()
      } else {
        toast.error(result.error || '생산 기록 추가에 실패했습니다.')
      }
    } catch (error) {
      console.error('Error adding production:', error)
      toast.error('생산 기록 추가에 실패했습니다.')
    }
  }

  const updateProduction = async () => {
    if (!selectedProduction) return

    try {
      const quantity = parseFloat(formData.quantity_produced)
      const unitCost = parseFloat(formData.unit_cost) || 0

      if (isNaN(quantity) || quantity <= 0) {
        toast.error('올바른 수량을 입력해주세요.')
        return
      }

      if (unitCost < 0) {
        toast.error('단위비용은 0 이상이어야 합니다.')
        return
      }

      const updates = {
        production_date: formData.production_date,
        quantity_produced: quantity,
        unit_cost: unitCost,
        notes: formData.notes || undefined
      }

      const result = await updateProductionRecord(selectedProduction.id, updates)

      if (result.success) {
        toast.success('생산 기록이 수정되었습니다.')
        setShowEditModal(false)
        setSelectedProduction(null)
        fetchProductions()
        fetchDailyStats()
      } else {
        toast.error(result.error || '생산 기록 수정에 실패했습니다.')
      }
    } catch (error) {
      console.error('Error updating production:', error)
      toast.error('생산 기록 수정에 실패했습니다.')
    }
  }

  const filteredProductions = productions.filter(production =>
    searchTerm === '' || 
    production.production_date.includes(searchTerm) ||
    production.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    production.creator_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalProduction = filteredProductions.reduce((sum, prod) => sum + prod.quantity_produced, 0)
  const totalCost = filteredProductions.reduce((sum, prod) => sum + prod.total_cost, 0)
  const avgCost = totalProduction > 0 ? totalCost / totalProduction : 0

  return (
    <div className="p-6 space-y-6">
      {/* Header & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">총 생산량</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalProduction.toLocaleString()} 말</p>
              </div>
              <Factory className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">총 생산비용</p>
                <p className="text-2xl font-bold text-green-600">₩{totalCost.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">평균 단가</p>
                <p className="text-2xl font-bold text-yellow-600">₩{Math.round(avgCost).toLocaleString()}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">생산 기록</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{filteredProductions.length}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="생산일, 비고, 생성자로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-80"
            />
          </div>

          <Select value={selectedDateRange} onValueChange={setSelectedDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="기간" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">1주일</SelectItem>
              <SelectItem value="month">1개월</SelectItem>
              <SelectItem value="all">전체</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            내보내기
          </Button>
          <Button onClick={handleAdd} size="sm">
            <PlusCircle className="h-4 w-4 mr-2" />
            생산 기록 추가
          </Button>
        </div>
      </div>

      {/* Productions Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">생산일</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">생산량</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">단위비용</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">총비용</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">비고</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">생성자</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">작업</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">로딩 중...</td>
                  </tr>
                ) : filteredProductions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">생산 기록이 없습니다.</td>
                  </tr>
                ) : (
                  filteredProductions.map((production) => (
                    <tr key={production.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {formatDate(production.production_date)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Factory className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900 dark:text-white">
                            {production.quantity_produced.toLocaleString()} 말
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          ₩{production.unit_cost.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-green-600">
                          ₩{production.total_cost.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap max-w-xs">
                        <div className="text-sm text-gray-900 dark:text-white truncate">
                          {production.notes || '-'}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {production.creator_name || '-'}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDetail(production)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(production)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(production)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add Production Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>생산 기록 추가</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>생산일 *</Label>
              <Input
                type="date"
                value={formData.production_date}
                onChange={(e) => setFormData({...formData, production_date: e.target.value})}
              />
            </div>
            <div>
              <Label>생산량 (말) *</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.quantity_produced}
                onChange={(e) => setFormData({...formData, quantity_produced: e.target.value})}
                placeholder="생산량 입력"
              />
            </div>
            <div>
              <Label>단위비용 (원)</Label>
              <Input
                type="number"
                step="1"
                value={formData.unit_cost}
                onChange={(e) => setFormData({...formData, unit_cost: e.target.value})}
                placeholder="말당 단위비용"
              />
            </div>
            <div>
              <Label>비고</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="추가 설명이나 비고사항"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>취소</Button>
            <Button onClick={submitProduction}>추가</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Production Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>생산 기록 수정</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>생산일 *</Label>
              <Input
                type="date"
                value={formData.production_date}
                onChange={(e) => setFormData({...formData, production_date: e.target.value})}
              />
            </div>
            <div>
              <Label>생산량 (말) *</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.quantity_produced}
                onChange={(e) => setFormData({...formData, quantity_produced: e.target.value})}
                placeholder="생산량 입력"
              />
            </div>
            <div>
              <Label>단위비용 (원)</Label>
              <Input
                type="number"
                step="1"
                value={formData.unit_cost}
                onChange={(e) => setFormData({...formData, unit_cost: e.target.value})}
                placeholder="말당 단위비용"
              />
            </div>
            <div>
              <Label>비고</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="추가 설명이나 비고사항"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>취소</Button>
            <Button onClick={updateProduction}>수정</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>생산 기록 상세</DialogTitle>
          </DialogHeader>
          {selectedProduction && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">생산일</Label>
                    <p className="text-lg font-medium">{formatDate(selectedProduction.production_date)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">생산량</Label>
                    <p className="text-lg">{selectedProduction.quantity_produced.toLocaleString()} 말</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">단위비용</Label>
                    <p className="text-lg">₩{selectedProduction.unit_cost.toLocaleString()}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">총비용</Label>
                    <p className="text-lg font-medium text-green-600">₩{selectedProduction.total_cost.toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">생성자</Label>
                    <p className="text-lg">{selectedProduction.creator_name || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">생성일</Label>
                    <p className="text-lg">{formatDate(selectedProduction.created_at)}</p>
                  </div>
                </div>
              </div>
              
              {selectedProduction.notes && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">비고</Label>
                  <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-3 rounded-md mt-1">
                    {selectedProduction.notes}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <Label className="text-sm font-medium text-gray-500">생성일</Label>
                  <p className="text-sm">{formatDate(selectedProduction.created_at)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">수정일</Label>
                  <p className="text-sm">{formatDate(selectedProduction.updated_at)}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailModal(false)}>닫기</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}