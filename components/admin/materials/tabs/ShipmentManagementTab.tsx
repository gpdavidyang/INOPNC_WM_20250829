'use client'

import { useState, useEffect } from 'react'
import { Profile } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { 
  Truck, Package, Calendar, Building2, Search, Filter, 
  Download, PlusCircle, Edit, Eye, CheckCircle, 
  XCircle, Clock, AlertTriangle, MapPin, Phone, User
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

interface MaterialShipment {
  id: string
  shipment_number: string
  site_id: string
  request_id: string | null
  status: 'preparing' | 'shipped' | 'delivered' | 'cancelled'
  shipment_date: string | null
  delivery_date: string | null
  expected_delivery_date: string | null
  carrier: string | null
  tracking_number: string | null
  total_weight: number | null
  driver_name: string | null
  driver_phone: string | null
  shipped_by: string | null
  received_by: string | null
  notes: string | null
  created_at: string
  updated_at: string
  site?: { id: string; name: string }
  request?: { id: string; request_number: string }
  shipper?: { id: string; full_name: string }
  receiver?: { id: string; full_name: string }
  items?: MaterialShipmentItem[]
}

interface MaterialShipmentItem {
  id: string
  shipment_id: string
  material_id: string
  shipped_quantity: number
  received_quantity: number
  unit_price: number | null
  batch_number: string | null
  expiry_date: string | null
  notes: string | null
  material?: { id: string; name: string; code: string; unit: string }
}

interface Site {
  id: string
  name: string
}

interface Material {
  id: string
  code: string
  name: string
  unit: string
}

interface MaterialRequest {
  id: string
  request_number: string
  site?: { name: string }
}

export default function ShipmentManagementTab({ profile }: ShipmentManagementTabProps) {
  const [shipments, setShipments] = useState<MaterialShipment[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
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
  const [selectedShipment, setSelectedShipment] = useState<MaterialShipment | null>(null)

  // Form states
  const [formData, setFormData] = useState({
    site_id: '',
    request_id: '',
    expected_delivery_date: '',
    carrier: '',
    tracking_number: '',
    driver_name: '',
    driver_phone: '',
    notes: '',
    items: [] as {
      material_id: string
      shipped_quantity: string
      unit_price: string
      batch_number: string
      expiry_date: string
      notes: string
    }[]
  })

  const supabase = createClient()

  // Fetch data
  useEffect(() => {
    fetchShipments()
    fetchSites()
    fetchMaterials()
    fetchRequests()
  }, [selectedSite, selectedStatus, selectedDateRange])

  const fetchShipments = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('material_shipments')
        .select(`
          *,
          site:sites(id, name),
          request:material_requests(id, request_number),
          shipper:profiles!material_shipments_shipped_by_fkey(id, full_name),
          receiver:profiles!material_shipments_received_by_fkey(id, full_name),
          items:material_shipment_items(
            *,
            material:materials(id, code, name, unit)
          )
        `)
        .order('created_at', { ascending: false })

      if (selectedSite !== 'all') {
        query = query.eq('site_id', selectedSite)
      }

      if (selectedStatus !== 'all') {
        query = query.eq('status', selectedStatus)
      }

      // Date range filter
      const now = new Date()
      if (selectedDateRange === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        query = query.gte('created_at', weekAgo.toISOString())
      } else if (selectedDateRange === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        query = query.gte('created_at', monthAgo.toISOString())
      }

      const { data, error } = await query

      if (error) throw error
      setShipments(data || [])
    } catch (error) {
      console.error('Error fetching shipments:', error)
      toast.error('출고 기록을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const fetchSites = async () => {
    try {
      const { data, error } = await supabase
        .from('sites')
        .select('id, name')
        .order('name')

      if (error) throw error
      setSites(data || [])
    } catch (error) {
      console.error('Error fetching sites:', error)
    }
  }

  const fetchMaterials = async () => {
    try {
      const { data, error } = await supabase
        .from('materials')
        .select('id, code, name, unit')
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      setMaterials(data || [])
    } catch (error) {
      console.error('Error fetching materials:', error)
    }
  }

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('material_requests')
        .select(`
          id,
          request_number,
          site:sites(name)
        `)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })

      if (error) throw error
      setRequests(data || [])
    } catch (error) {
      console.error('Error fetching requests:', error)
    }
  }

  const generateShipmentNumber = () => {
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '')
    const random = Math.random().toString(36).substr(2, 4).toUpperCase()
    return `SHIP-${today}-${random}`
  }

  const handleAdd = () => {
    setFormData({
      site_id: '',
      request_id: '',
      expected_delivery_date: '',
      carrier: '',
      tracking_number: '',
      driver_name: '',
      driver_phone: '',
      notes: '',
      items: []
    })
    setShowAddModal(true)
  }

  const handleEdit = (shipment: MaterialShipment) => {
    setSelectedShipment(shipment)
    setFormData({
      site_id: shipment.site_id,
      request_id: shipment.request_id || '',
      expected_delivery_date: shipment.expected_delivery_date || '',
      carrier: shipment.carrier || '',
      tracking_number: shipment.tracking_number || '',
      driver_name: shipment.driver_name || '',
      driver_phone: shipment.driver_phone || '',
      notes: shipment.notes || '',
      items: shipment.items?.map(item => ({
        material_id: item.material_id,
        shipped_quantity: item.shipped_quantity.toString(),
        unit_price: item.unit_price?.toString() || '',
        batch_number: item.batch_number || '',
        expiry_date: item.expiry_date || '',
        notes: item.notes || ''
      })) || []
    })
    setShowEditModal(true)
  }

  const handleDetail = (shipment: MaterialShipment) => {
    setSelectedShipment(shipment)
    setShowDetailModal(true)
  }

  const addItemToForm = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          material_id: '',
          shipped_quantity: '',
          unit_price: '',
          batch_number: '',
          expiry_date: '',
          notes: ''
        }
      ]
    })
  }

  const removeItemFromForm = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    })
  }

  const updateFormItem = (index: number, field: string, value: string) => {
    const updatedItems = [...formData.items]
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value
    }
    setFormData({
      ...formData,
      items: updatedItems
    })
  }

  const submitShipment = async () => {
    try {
      if (!formData.site_id || formData.items.length === 0) {
        toast.error('필수 정보를 모두 입력해주세요.')
        return
      }

      // Validate items
      for (const item of formData.items) {
        if (!item.material_id || !item.shipped_quantity) {
          toast.error('모든 출고 항목의 자재와 수량을 입력해주세요.')
          return
        }
        
        const quantity = parseFloat(item.shipped_quantity)
        if (isNaN(quantity) || quantity <= 0) {
          toast.error('올바른 출고 수량을 입력해주세요.')
          return
        }
      }

      const shipmentData = {
        shipment_number: generateShipmentNumber(),
        site_id: formData.site_id,
        request_id: formData.request_id || null,
        status: 'preparing' as const,
        expected_delivery_date: formData.expected_delivery_date || null,
        carrier: formData.carrier || null,
        tracking_number: formData.tracking_number || null,
        driver_name: formData.driver_name || null,
        driver_phone: formData.driver_phone || null,
        shipped_by: profile.id,
        notes: formData.notes || null,
        total_weight: formData.items.reduce((sum, item) => sum + parseFloat(item.shipped_quantity || '0'), 0)
      }

      const { data: shipment, error: shipmentError } = await supabase
        .from('material_shipments')
        .insert([shipmentData])
        .select()
        .single()

      if (shipmentError) throw shipmentError

      // Insert shipment items
      const itemsData = formData.items.map(item => ({
        shipment_id: shipment.id,
        material_id: item.material_id,
        shipped_quantity: parseFloat(item.shipped_quantity),
        received_quantity: 0,
        unit_price: item.unit_price ? parseFloat(item.unit_price) : null,
        batch_number: item.batch_number || null,
        expiry_date: item.expiry_date || null,
        notes: item.notes || null
      }))

      const { error: itemsError } = await supabase
        .from('material_shipment_items')
        .insert(itemsData)

      if (itemsError) throw itemsError

      toast.success('출고 기록이 추가되었습니다.')
      setShowAddModal(false)
      fetchShipments()
    } catch (error) {
      console.error('Error adding shipment:', error)
      toast.error('출고 기록 추가에 실패했습니다.')
    }
  }

  const updateShipmentStatus = async (shipmentId: string, newStatus: string) => {
    try {
      const updates: any = {
        status: newStatus,
        updated_at: new Date().toISOString()
      }

      if (newStatus === 'shipped' && !selectedShipment?.shipment_date) {
        updates.shipment_date = new Date().toISOString()
      }

      if (newStatus === 'delivered' && !selectedShipment?.delivery_date) {
        updates.delivery_date = new Date().toISOString()
        updates.received_by = profile.id
      }

      const { error } = await supabase
        .from('material_shipments')
        .update(updates)
        .eq('id', shipmentId)

      if (error) throw error

      toast.success('출고 상태가 업데이트되었습니다.')
      fetchShipments()
      setShowDetailModal(false)
    } catch (error) {
      console.error('Error updating shipment status:', error)
      toast.error('상태 업데이트에 실패했습니다.')
    }
  }

  const filteredShipments = shipments.filter(shipment =>
    searchTerm === '' || 
    shipment.shipment_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shipment.site?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shipment.carrier?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shipment.tracking_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shipment.driver_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
        return <Badge variant="default" className="bg-green-100 text-green-800">배송완료</Badge>
      case 'shipped':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">배송중</Badge>
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
      case 'shipped':
        return <Truck className="h-4 w-4 text-blue-600" />
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'preparing':
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />
    }
  }

  const totalShipments = filteredShipments.length
  const deliveredCount = filteredShipments.filter(s => s.status === 'delivered').length
  const shippedCount = filteredShipments.filter(s => s.status === 'shipped').length
  const preparingCount = filteredShipments.filter(s => s.status === 'preparing').length

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
                <p className="text-sm text-gray-600 dark:text-gray-400">배송중</p>
                <p className="text-2xl font-bold text-blue-600">{shippedCount}</p>
              </div>
              <Truck className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">준비중</p>
                <p className="text-2xl font-bold text-yellow-600">{preparingCount}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
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
              placeholder="출고번호, 현장명, 운송업체, 추적번호로 검색..."
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
              <SelectItem value="shipped">배송중</SelectItem>
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">출고번호</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">현장</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">상태</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">예정일</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">운송업체</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">추적번호</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">기사명</th>
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
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {shipment.shipment_number}
                        </div>
                        {shipment.request && (
                          <div className="text-xs text-gray-500">
                            요청: {shipment.request.request_number}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Building2 className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900 dark:text-white">
                            {shipment.site?.name || '-'}
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
                            {shipment.expected_delivery_date ? formatDate(shipment.expected_delivery_date) : '-'}
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
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {shipment.driver_name || '-'}
                        </div>
                        {shipment.driver_phone && (
                          <div className="text-xs text-gray-500">
                            {shipment.driver_phone}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDetail(shipment)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(shipment)}
                          >
                            <Edit className="h-4 w-4" />
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
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>출고 추가</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
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
                <Label>연결된 요청</Label>
                <Select value={formData.request_id} onValueChange={(value) => setFormData({...formData, request_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="요청 선택 (선택사항)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">없음</SelectItem>
                    {requests.map((request) => (
                      <SelectItem key={request.id} value={request.id}>
                        {request.request_number} - {request.site?.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>예정 배송일</Label>
                <Input
                  type="date"
                  value={formData.expected_delivery_date}
                  onChange={(e) => setFormData({...formData, expected_delivery_date: e.target.value})}
                />
              </div>
              <div>
                <Label>운송업체</Label>
                <Input
                  value={formData.carrier}
                  onChange={(e) => setFormData({...formData, carrier: e.target.value})}
                  placeholder="운송업체명 입력"
                />
              </div>
              <div>
                <Label>추적번호</Label>
                <Input
                  value={formData.tracking_number}
                  onChange={(e) => setFormData({...formData, tracking_number: e.target.value})}
                  placeholder="추적번호 입력"
                />
              </div>
              <div>
                <Label>기사명</Label>
                <Input
                  value={formData.driver_name}
                  onChange={(e) => setFormData({...formData, driver_name: e.target.value})}
                  placeholder="기사명 입력"
                />
              </div>
              <div>
                <Label>기사 연락처</Label>
                <Input
                  value={formData.driver_phone}
                  onChange={(e) => setFormData({...formData, driver_phone: e.target.value})}
                  placeholder="연락처 입력"
                />
              </div>
              <div>
                <Label>비고</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="추가 설명이나 비고사항"
                  rows={2}
                />
              </div>
            </div>

            {/* Items Section */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-4">
                <Label className="text-base font-medium">출고 항목</Label>
                <Button type="button" variant="outline" size="sm" onClick={addItemToForm}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  항목 추가
                </Button>
              </div>
              
              {formData.items.map((item, index) => (
                <div key={index} className="grid grid-cols-6 gap-2 mb-3 p-3 border rounded-md">
                  <div>
                    <Select 
                      value={item.material_id} 
                      onValueChange={(value) => updateFormItem(index, 'material_id', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="자재 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {materials.map((material) => (
                          <SelectItem key={material.id} value={material.id}>
                            {material.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="출고량"
                      value={item.shipped_quantity}
                      onChange={(e) => updateFormItem(index, 'shipped_quantity', e.target.value)}
                    />
                  </div>
                  <div>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="단가"
                      value={item.unit_price}
                      onChange={(e) => updateFormItem(index, 'unit_price', e.target.value)}
                    />
                  </div>
                  <div>
                    <Input
                      placeholder="배치번호"
                      value={item.batch_number}
                      onChange={(e) => updateFormItem(index, 'batch_number', e.target.value)}
                    />
                  </div>
                  <div>
                    <Input
                      type="date"
                      placeholder="유효기간"
                      value={item.expiry_date}
                      onChange={(e) => updateFormItem(index, 'expiry_date', e.target.value)}
                    />
                  </div>
                  <div className="flex items-center">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeItemFromForm(index)}
                      className="text-red-600"
                    >
                      삭제
                    </Button>
                  </div>
                </div>
              ))}
              
              {formData.items.length === 0 && (
                <div className="text-center text-gray-500 py-4">
                  출고할 항목을 추가해주세요.
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>취소</Button>
            <Button onClick={submitShipment}>추가</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>출고 상세</DialogTitle>
          </DialogHeader>
          {selectedShipment && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">출고번호</Label>
                    <p className="text-lg font-medium">{selectedShipment.shipment_number}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">현장</Label>
                    <p className="text-lg">{selectedShipment.site?.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">상태</Label>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(selectedShipment.status)}
                      {getStatusBadge(selectedShipment.status)}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">운송업체</Label>
                    <p className="text-lg">{selectedShipment.carrier || '-'}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">추적번호</Label>
                    <p className="text-lg">{selectedShipment.tracking_number || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">기사정보</Label>
                    <p className="text-lg">{selectedShipment.driver_name || '-'}</p>
                    {selectedShipment.driver_phone && (
                      <p className="text-sm text-gray-600">{selectedShipment.driver_phone}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">예정 배송일</Label>
                    <p className="text-lg">{selectedShipment.expected_delivery_date ? formatDate(selectedShipment.expected_delivery_date) : '-'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">총 중량</Label>
                    <p className="text-lg">{selectedShipment.total_weight ? `${selectedShipment.total_weight.toLocaleString()} kg` : '-'}</p>
                  </div>
                </div>
              </div>

              {/* Items */}
              {selectedShipment.items && selectedShipment.items.length > 0 && (
                <div>
                  <Label className="text-base font-medium text-gray-900">출고 항목</Label>
                  <div className="mt-2 border rounded-md overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left">자재</th>
                          <th className="px-4 py-2 text-right">출고량</th>
                          <th className="px-4 py-2 text-right">수령량</th>
                          <th className="px-4 py-2 text-right">단가</th>
                          <th className="px-4 py-2 text-left">배치번호</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedShipment.items.map((item) => (
                          <tr key={item.id} className="border-t">
                            <td className="px-4 py-2">
                              <div>
                                <div className="font-medium">{item.material?.name}</div>
                                <div className="text-gray-500">{item.material?.code}</div>
                              </div>
                            </td>
                            <td className="px-4 py-2 text-right">
                              {item.shipped_quantity.toLocaleString()} {item.material?.unit}
                            </td>
                            <td className="px-4 py-2 text-right">
                              {item.received_quantity.toLocaleString()} {item.material?.unit}
                            </td>
                            <td className="px-4 py-2 text-right">
                              {item.unit_price ? `₩${item.unit_price.toLocaleString()}` : '-'}
                            </td>
                            <td className="px-4 py-2">
                              {item.batch_number || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Status Actions */}
              {selectedShipment.status !== 'delivered' && selectedShipment.status !== 'cancelled' && (
                <div className="flex gap-2 pt-4 border-t">
                  {selectedShipment.status === 'preparing' && (
                    <Button 
                      onClick={() => updateShipmentStatus(selectedShipment.id, 'shipped')}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      출고 처리
                    </Button>
                  )}
                  {selectedShipment.status === 'shipped' && (
                    <Button 
                      onClick={() => updateShipmentStatus(selectedShipment.id, 'delivered')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      배송 완료 처리
                    </Button>
                  )}
                  <Button 
                    variant="destructive"
                    onClick={() => updateShipmentStatus(selectedShipment.id, 'cancelled')}
                  >
                    출고 취소
                  </Button>
                </div>
              )}
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