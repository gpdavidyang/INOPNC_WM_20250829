'use client'

import { useState, useEffect } from 'react'
import { Profile } from '@/types'
import { ShipmentRecord } from '@/types/materials'
import { 
  processShipment,
  updateShipmentStatus,
  updateShipmentInfo,
  getShipmentHistory,
  getPendingShipmentRequests,
  trackDelivery
} from '@/app/actions/admin/shipments'
import { 
  Truck, Package, Calendar, Building2, Search, Filter, 
  Download, PlusCircle, Edit, Eye, CheckCircle, 
  XCircle, Clock, AlertTriangle, MapPin, Phone, User,
  Zap, BarChart3, Target
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

interface ShipmentManagementTabProps {
  profile: Profile
}

interface ExtendedShipmentRecord extends ShipmentRecord {
  site_name?: string
  creator_name?: string
}

interface Site {
  id: string
  name: string
}

interface MaterialRequest {
  id: string
  request_number: string
  site?: { name: string }
}

export default function ShipmentManagementTab({ profile }: ShipmentManagementTabProps) {
  const [shipments, setShipments] = useState<ExtendedShipmentRecord[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [requests, setRequests] = useState<MaterialRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSite, setSelectedSite] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedDateRange, setSelectedDateRange] = useState<string>('week')

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showTrackModal, setShowTrackModal] = useState(false)
  const [selectedShipment, setSelectedShipment] = useState<ExtendedShipmentRecord | null>(null)

  // Form states
  const [formData, setFormData] = useState({
    site_id: '',
    material_request_id: '',
    quantity_shipped: '',
    planned_delivery_date: '',
    tracking_number: '',
    carrier: '',
    notes: ''
  })

  // Track form state
  const [trackingNumber, setTrackingNumber] = useState('')
  const [trackingInfo, setTrackingInfo] = useState<any>(null)

  // Pending requests
  const [pendingRequests, setPendingRequests] = useState({
    urgent: [] as any[],
    high_priority: [] as any[],
    normal: [] as any[],
    total_count: 0
  })

  // Fetch data
  useEffect(() => {
    fetchShipments()
    fetchSites()
    fetchRequests()
    fetchPendingRequests()
  }, [selectedSite, selectedStatus, selectedDateRange])

  const fetchShipments = async () => {
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

      if (selectedStatus !== 'all') {
        filters.status = selectedStatus
      }

      const result = await getShipmentHistory(selectedSite === 'all' ? undefined : selectedSite, filters)
      
      if (result.success) {
        setShipments(result.data || [])
      } else {
        toast.error(result.error || '출고 기록을 불러오는데 실패했습니다.')
      }
    } catch (error) {
      console.error('Error fetching shipments:', error)
      toast.error('출고 기록을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const fetchSites = async () => {
    try {
      const response = await fetch('/api/sites')
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          setSites(result.data)
        } else {
          setSites([])
        }
      }
    } catch (error) {
      console.error('Error fetching sites:', error)
      setSites([])
    }
  }

  const fetchRequests = async () => {
    try {
      // This would fetch approved material requests
      // For now, we'll set empty array
      setRequests([])
    } catch (error) {
      console.error('Error fetching requests:', error)
    }
  }

  const fetchPendingRequests = async () => {
    try {
      const result = await getPendingShipmentRequests()
      if (result.success && result.data) {
        setPendingRequests(result.data)
      }
    } catch (error) {
      console.error('Error fetching pending requests:', error)
    }
  }

  const handleAdd = () => {
    setFormData({
      site_id: '',
      material_request_id: '',
      quantity_shipped: '',
      planned_delivery_date: '',
      tracking_number: '',
      carrier: '',
      notes: ''
    })
    setShowAddModal(true)
  }

  const handleEdit = (shipment: ExtendedShipmentRecord) => {
    setSelectedShipment(shipment)
    setFormData({
      site_id: shipment.site_id,
      material_request_id: shipment.material_request_id || '',
      quantity_shipped: shipment.quantity_shipped.toString(),
      planned_delivery_date: shipment.planned_delivery_date || '',
      tracking_number: shipment.tracking_number || '',
      carrier: shipment.carrier || '',
      notes: shipment.notes || ''
    })
    setShowEditModal(true)
  }

  const handleDetail = (shipment: ExtendedShipmentRecord) => {
    setSelectedShipment(shipment)
    setShowDetailModal(true)
  }

  const handleTrack = () => {
    setTrackingNumber('')
    setTrackingInfo(null)
    setShowTrackModal(true)
  }

  const handleDelete = async (shipmentId: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    
    try {
      const { error } = await supabase
        .from('shipments')
        .delete()
        .eq('id', shipmentId)
      
      if (error) throw error
      
      toast.success('출고 기록이 삭제되었습니다.')
      fetchShipments()
    } catch (error) {
      console.error('Error deleting shipment:', error)
      toast.error('출고 기록 삭제에 실패했습니다.')
    }
  }

  const submitShipment = async () => {
    try {
      if (!formData.site_id || !formData.quantity_shipped) {
        toast.error('필수 정보를 모두 입력해주세요.')
        return
      }

      const quantity = parseFloat(formData.quantity_shipped)
      if (isNaN(quantity) || quantity <= 0) {
        toast.error('올바른 수량을 입력해주세요.')
        return
      }

      const shipmentData = {
        site_id: formData.site_id,
        material_request_id: formData.material_request_id || undefined,
        quantity_shipped: quantity,
        planned_delivery_date: formData.planned_delivery_date || undefined,
        tracking_number: formData.tracking_number || undefined,
        carrier: formData.carrier || undefined,
        notes: formData.notes || undefined
      }

      const result = await processShipment(shipmentData)

      if (result.success) {
        toast.success('출고 기록이 추가되었습니다.')
        setShowAddModal(false)
        fetchShipments()
        fetchPendingRequests()
      } else {
        toast.error(result.error || '출고 기록 추가에 실패했습니다.')
      }
    } catch (error) {
      console.error('Error adding shipment:', error)
      toast.error('출고 기록 추가에 실패했습니다.')
    }
  }

  const updateShipment = async () => {
    if (!selectedShipment) return

    try {
      const updates = {
        planned_delivery_date: formData.planned_delivery_date || undefined,
        tracking_number: formData.tracking_number || undefined,
        carrier: formData.carrier || undefined,
        notes: formData.notes || undefined
      }

      const result = await updateShipmentInfo(selectedShipment.id, updates)

      if (result.success) {
        toast.success('출고 정보가 수정되었습니다.')
        setShowEditModal(false)
        setSelectedShipment(null)
        fetchShipments()
      } else {
        toast.error(result.error || '출고 정보 수정에 실패했습니다.')
      }
    } catch (error) {
      console.error('Error updating shipment:', error)
      toast.error('출고 정보 수정에 실패했습니다.')
    }
  }

  const handleStatusUpdate = async (shipmentId: string, newStatus: 'preparing' | 'shipped' | 'in_transit' | 'delivered' | 'cancelled') => {
    try {
      const result = await updateShipmentStatus(shipmentId, newStatus)

      if (result.success) {
        toast.success('출고 상태가 업데이트되었습니다.')
        fetchShipments()
        if (showDetailModal) {
          setShowDetailModal(false)
        }
      } else {
        toast.error(result.error || '상태 업데이트에 실패했습니다.')
      }
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('상태 업데이트에 실패했습니다.')
    }
  }

  const handleTrackDelivery = async () => {
    if (!trackingNumber.trim()) {
      toast.error('추적번호를 입력해주세요.')
      return
    }

    try {
      const result = await trackDelivery(trackingNumber.trim())
      if (result.success) {
        setTrackingInfo(result.data)
      } else {
        toast.error(result.error || '추적 정보를 찾을 수 없습니다.')
      }
    } catch (error) {
      console.error('Error tracking delivery:', error)
      toast.error('추적에 실패했습니다.')
    }
  }

  const filteredShipments = shipments.filter(shipment =>
    searchTerm === '' || 
    shipment.shipment_date.includes(searchTerm) ||
    shipment.site_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shipment.carrier?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shipment.tracking_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shipment.notes?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
        return <Badge variant="default" className="bg-green-100 text-green-800">배송완료</Badge>
      case 'in_transit':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">운송중</Badge>
      case 'shipped':
        return <Badge variant="default" className="bg-indigo-100 text-indigo-800">출고완료</Badge>
      case 'cancelled':
        return <Badge variant="destructive">취소됨</Badge>
      case 'preparing':
      default:
        return <Badge variant="secondary">준비중</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'in_transit':
        return <Truck className="h-4 w-4 text-blue-600" />
      case 'shipped':
        return <Package className="h-4 w-4 text-indigo-600" />
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'preparing':
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />
    }
  }

  const totalShipments = filteredShipments.length
  const deliveredCount = filteredShipments.filter(s => s.status === 'delivered').length
  const inTransitCount = filteredShipments.filter(s => s.status === 'in_transit' || s.status === 'shipped').length
  const preparingCount = filteredShipments.filter(s => s.status === 'preparing').length
  const totalQuantity = filteredShipments.reduce((sum, s) => sum + s.quantity_shipped, 0)

  return (
    <div className="p-6 space-y-6">
      {/* Header & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">총 출고</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalShipments}</p>
                <p className="text-xs text-gray-500">{totalQuantity.toLocaleString()} 말</p>
              </div>
              <Truck className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">배송완료</p>
                <p className="text-2xl font-bold text-green-600">{deliveredCount}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">운송중</p>
                <p className="text-2xl font-bold text-blue-600">{inTransitCount}</p>
              </div>
              <Truck className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">대기중</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingRequests.total_count}</p>
                <p className="text-xs text-red-500">긴급: {pendingRequests.urgent.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
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
              placeholder="출고일, 현장명, 운송업체, 추적번호로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-80"
            />
          </div>

          <Select value={selectedSite} onValueChange={setSelectedSite}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="현장 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 현장</SelectItem>
              {sites.map((site) => (
                <SelectItem key={site.id} value={site.id}>{site.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="상태" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 상태</SelectItem>
              <SelectItem value="preparing">준비중</SelectItem>
              <SelectItem value="shipped">출고완료</SelectItem>
              <SelectItem value="in_transit">운송중</SelectItem>
              <SelectItem value="delivered">배송완료</SelectItem>
              <SelectItem value="cancelled">취소됨</SelectItem>
            </SelectContent>
          </Select>

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
          <Button variant="outline" size="sm" onClick={handleTrack}>
            <Search className="h-4 w-4 mr-2" />
            배송 추적
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            내보내기
          </Button>
          <Button onClick={handleAdd} size="sm">
            <PlusCircle className="h-4 w-4 mr-2" />
            출고 추가
          </Button>
        </div>
      </div>

      {/* Shipments Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">출고일</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">현장</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">출고량</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">상태</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">예정일</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">운송업체</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">추적번호</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">작업</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">로딩 중...</td>
                  </tr>
                ) : filteredShipments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">출고 기록이 없습니다.</td>
                  </tr>
                ) : (
                  filteredShipments.map((shipment) => (
                    <tr key={shipment.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {formatDate(shipment.shipment_date)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Building2 className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900 dark:text-white">
                            {shipment.site_name || '-'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Package className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900 dark:text-white">
                            {shipment.quantity_shipped.toLocaleString()} 말
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(shipment.status)}
                          <span className="ml-2">{getStatusBadge(shipment.status)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900 dark:text-white">
                            {shipment.planned_delivery_date ? formatDate(shipment.planned_delivery_date) : '-'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {shipment.carrier || '-'}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {shipment.tracking_number || '-'}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDetail(shipment)}
                          >
                            보기
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(shipment)}
                          >
                            수정
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(shipment.id)}
                            className="text-red-600 hover:text-red-800 hover:bg-red-50"
                          >
                            삭제
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

      {/* Add Shipment Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>출고 추가</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>현장 *</Label>
              <Select value={formData.site_id} onValueChange={(value) => setFormData({...formData, site_id: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="현장 선택" />
                </SelectTrigger>
                <SelectContent>
                  {sites.map((site) => (
                    <SelectItem key={site.id} value={site.id}>{site.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>출고량 (말) *</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.quantity_shipped}
                onChange={(e) => setFormData({...formData, quantity_shipped: e.target.value})}
                placeholder="출고량 입력"
              />
            </div>
            <div>
              <Label>예정 배송일</Label>
              <Input
                type="date"
                value={formData.planned_delivery_date}
                onChange={(e) => setFormData({...formData, planned_delivery_date: e.target.value})}
              />
            </div>
            <div>
              <Label>운송업체</Label>
              <Input
                value={formData.carrier}
                onChange={(e) => setFormData({...formData, carrier: e.target.value})}
                placeholder="운송업체명"
              />
            </div>
            <div>
              <Label>추적번호</Label>
              <Input
                value={formData.tracking_number}
                onChange={(e) => setFormData({...formData, tracking_number: e.target.value})}
                placeholder="추적번호"
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
            <Button onClick={submitShipment}>추가</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Shipment Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>출고 정보 수정</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>예정 배송일</Label>
              <Input
                type="date"
                value={formData.planned_delivery_date}
                onChange={(e) => setFormData({...formData, planned_delivery_date: e.target.value})}
              />
            </div>
            <div>
              <Label>운송업체</Label>
              <Input
                value={formData.carrier}
                onChange={(e) => setFormData({...formData, carrier: e.target.value})}
                placeholder="운송업체명"
              />
            </div>
            <div>
              <Label>추적번호</Label>
              <Input
                value={formData.tracking_number}
                onChange={(e) => setFormData({...formData, tracking_number: e.target.value})}
                placeholder="추적번호"
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
            <Button onClick={updateShipment}>수정</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>출고 상세</DialogTitle>
          </DialogHeader>
          {selectedShipment && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">출고일</Label>
                    <p className="text-lg font-medium">{formatDate(selectedShipment.shipment_date)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">현장</Label>
                    <p className="text-lg">{selectedShipment.site_name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">출고량</Label>
                    <p className="text-lg">{selectedShipment.quantity_shipped.toLocaleString()} 말</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">상태</Label>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(selectedShipment.status)}
                      {getStatusBadge(selectedShipment.status)}
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">예정 배송일</Label>
                    <p className="text-lg">{selectedShipment.planned_delivery_date ? formatDate(selectedShipment.planned_delivery_date) : '-'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">실제 배송일</Label>
                    <p className="text-lg">{selectedShipment.actual_delivery_date ? formatDate(selectedShipment.actual_delivery_date) : '-'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">운송업체</Label>
                    <p className="text-lg">{selectedShipment.carrier || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">추적번호</Label>
                    <p className="text-lg">{selectedShipment.tracking_number || '-'}</p>
                  </div>
                </div>
              </div>
              
              {selectedShipment.notes && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">비고</Label>
                  <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-3 rounded-md mt-1">
                    {selectedShipment.notes}
                  </p>
                </div>
              )}

              {/* Status Actions */}
              {selectedShipment.status !== 'delivered' && selectedShipment.status !== 'cancelled' && (
                <div className="flex gap-2 pt-4 border-t">
                  {selectedShipment.status === 'preparing' && (
                    <Button 
                      onClick={() => handleStatusUpdate(selectedShipment.id, 'shipped')}
                      className="bg-indigo-600 hover:bg-indigo-700"
                    >
                      출고 처리
                    </Button>
                  )}
                  {selectedShipment.status === 'shipped' && (
                    <Button 
                      onClick={() => handleStatusUpdate(selectedShipment.id, 'in_transit')}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      운송 시작
                    </Button>
                  )}
                  {selectedShipment.status === 'in_transit' && (
                    <Button 
                      onClick={() => handleStatusUpdate(selectedShipment.id, 'delivered')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      배송 완료
                    </Button>
                  )}
                  <Button 
                    variant="destructive"
                    onClick={() => handleStatusUpdate(selectedShipment.id, 'cancelled')}
                  >
                    출고 취소
                  </Button>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <Label className="text-sm font-medium text-gray-500">생성일</Label>
                  <p className="text-sm">{formatDate(selectedShipment.created_at)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">수정일</Label>
                  <p className="text-sm">{formatDate(selectedShipment.updated_at)}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailModal(false)}>닫기</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Track Delivery Modal */}
      <Dialog open={showTrackModal} onOpenChange={setShowTrackModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>배송 추적</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>추적번호</Label>
              <div className="flex gap-2">
                <Input
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="추적번호를 입력하세요"
                />
                <Button onClick={handleTrackDelivery}>추적</Button>
              </div>
            </div>
            
            {trackingInfo && (
              <div className="border rounded-md p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">상태</Label>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(trackingInfo.status)}
                    {getStatusBadge(trackingInfo.status)}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-xs text-gray-500">현장</Label>
                    <p>{trackingInfo.site_name}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">출고량</Label>
                    <p>{trackingInfo.quantity_shipped} 말</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">출고일</Label>
                    <p>{formatDate(trackingInfo.shipment_date)}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">예정일</Label>
                    <p>{trackingInfo.planned_delivery_date ? formatDate(trackingInfo.planned_delivery_date) : '-'}</p>
                  </div>
                </div>
                {trackingInfo.carrier && (
                  <div>
                    <Label className="text-xs text-gray-500">운송업체</Label>
                    <p className="text-sm">{trackingInfo.carrier}</p>
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTrackModal(false)}>닫기</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}