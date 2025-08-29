'use client'

import { useState, useEffect } from 'react'
import { Profile } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { 
  Truck, Package, CheckCircle, XCircle, Clock,
  FileText, CreditCard, DollarSign, Search, Filter,
  Calendar, Building2, Eye, Edit, Save, X,
  ChevronUp, ChevronDown, ChevronsUpDown
} from 'lucide-react'

interface ShipmentManagementTabProps {
  profile: Profile
}

interface ShipmentRecord {
  id: string
  shipment_date: string
  site_id: string
  site_name: string
  amount: number
  delivery_status: 'pending' | 'shipped' | 'delivered'
  delivery_method: 'parcel' | 'freight' | null
  invoice_confirmed: boolean
  tax_invoice_issued: boolean
  payment_confirmed: boolean
  shipping_cost: number | null
  tracking_number?: string
  notes?: string
  created_by: string
  created_at: string
  updated_at: string
}

export default function ShipmentManagementTab({ profile }: ShipmentManagementTabProps) {
  const [shipments, setShipments] = useState<ShipmentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7)
  )
  const [sites, setSites] = useState<Array<{id: string, name: string}>>([])
  const [selectedSite, setSelectedSite] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [sortField, setSortField] = useState<'shipment_date' | 'site_name' | 'amount' | 'delivery_status' | 'shipping_cost'>('shipment_date')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  
  const [editForm, setEditForm] = useState({
    delivery_status: 'pending' as 'pending' | 'shipped' | 'delivered',
    delivery_method: null as 'parcel' | 'freight' | null,
    invoice_confirmed: false,
    tax_invoice_issued: false,
    payment_confirmed: false,
    shipping_cost: 0,
    tracking_number: '',
    notes: ''
  })

  const supabase = createClient()

  useEffect(() => {
    loadSites()
  }, [])

  useEffect(() => {
    loadShipments()
  }, [selectedMonth, selectedSite, statusFilter])

  const loadSites = async () => {
    try {
      const { data, error } = await supabase
        .from('sites')
        .select('id, name')
        .eq('status', 'active')
        .order('name')

      if (!error && data) {
        setSites(data)
      }
    } catch (error) {
      console.error('Failed to load sites:', error)
    }
  }

  const loadShipments = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('npc_shipments')
        .select(`
          *,
          sites!site_id(name)
        `)
        .gte('shipment_date', `${selectedMonth}-01`)
        .lte('shipment_date', `${selectedMonth}-31`)
        .order('shipment_date', { ascending: false })

      if (selectedSite) {
        query = query.eq('site_id', selectedSite)
      }

      if (statusFilter) {
        query = query.eq('delivery_status', statusFilter)
      }

      const { data, error } = await query

      if (!error && data) {
        const formattedData: ShipmentRecord[] = data.map(item => ({
          ...item,
          site_name: (item as any).sites?.name || '알 수 없음'
        }))
        setShipments(formattedData)
      } else if (error) {
        console.warn('Shipments data table not available:', error.message)
        // Load mock data when table doesn't exist
        const { mockShipmentData } = await import('../mockData')
        let filteredData = mockShipmentData.filter(item => 
          item.shipment_date.startsWith(selectedMonth)
        )
        
        if (selectedSite) {
          filteredData = filteredData.filter(item => item.site_id === selectedSite)
        }
        
        if (statusFilter) {
          filteredData = filteredData.filter(item => item.delivery_status === statusFilter)
        }
        
        setShipments(filteredData)
      }
    } catch (error) {
      console.error('Failed to load shipments:', error)
      // Fallback to mock data
      const { mockShipmentData } = await import('../mockData')
      let filteredData = mockShipmentData.filter(item => 
        item.shipment_date.startsWith(selectedMonth)
      )
      
      if (selectedSite) {
        filteredData = filteredData.filter(item => item.site_id === selectedSite)
      }
      
      if (statusFilter) {
        filteredData = filteredData.filter(item => item.delivery_status === statusFilter)
      }
      
      setShipments(filteredData)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (shipment: ShipmentRecord) => {
    setEditingId(shipment.id)
    setEditForm({
      delivery_status: shipment.delivery_status,
      delivery_method: shipment.delivery_method,
      invoice_confirmed: shipment.invoice_confirmed,
      tax_invoice_issued: shipment.tax_invoice_issued,
      payment_confirmed: shipment.payment_confirmed,
      shipping_cost: shipment.shipping_cost || 0,
      tracking_number: shipment.tracking_number || '',
      notes: shipment.notes || ''
    })
  }

  const handleSave = async () => {
    if (!editingId) return

    try {
      const { error } = await supabase
        .from('npc_shipments')
        .update({
          ...editForm,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingId)

      if (!error) {
        setEditingId(null)
        await loadShipments()
      }
    } catch (error) {
      console.error('Failed to update shipment:', error)
      alert('출고 정보 업데이트에 실패했습니다.')
    }
  }

  const handleCancel = () => {
    setEditingId(null)
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { bg: 'bg-yellow-100 dark:bg-yellow-900/20', text: 'text-yellow-800 dark:text-yellow-200', label: '대기중' },
      shipped: { bg: 'bg-blue-100 dark:bg-blue-900/20', text: 'text-blue-800 dark:text-blue-200', label: '배송중' },
      delivered: { bg: 'bg-green-100 dark:bg-green-900/20', text: 'text-green-800 dark:text-green-200', label: '배송완료' }
    }
    const badge = badges[status as keyof typeof badges] || badges.pending
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    )
  }

  const getDeliveryMethodBadge = (method: string | null) => {
    if (!method) return <span className="text-gray-400">-</span>
    
    const badges = {
      parcel: { icon: Package, label: '택배' },
      freight: { icon: Truck, label: '화물' }
    }
    const badge = badges[method as keyof typeof badges]
    
    if (!badge) return <span className="text-gray-400">-</span>
    
    const Icon = badge.icon
    return (
      <span className="inline-flex items-center text-sm text-gray-700 dark:text-gray-300">
        <Icon className="h-4 w-4 mr-1" />
        {badge.label}
      </span>
    )
  }

  const calculateTotals = () => {
    return {
      totalShipments: shipments.length,
      totalAmount: shipments.reduce((sum, s) => sum + s.amount, 0),
      totalShippingCost: shipments.reduce((sum, s) => sum + (s.shipping_cost || 0), 0),
      pendingCount: shipments.filter(s => s.delivery_status === 'pending').length,
      shippedCount: shipments.filter(s => s.delivery_status === 'shipped').length,
      deliveredCount: shipments.filter(s => s.delivery_status === 'delivered').length
    }
  }

  const totals = calculateTotals()

  const handleSort = (field: typeof sortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const getSortIcon = (field: typeof sortField) => {
    if (field !== sortField) {
      return <ChevronsUpDown className="h-4 w-4 text-gray-400" />
    }
    return sortDirection === 'asc' 
      ? <ChevronUp className="h-4 w-4 text-blue-500" />
      : <ChevronDown className="h-4 w-4 text-blue-500" />
  }

  const sortedShipments = [...shipments].sort((a, b) => {
    let aValue: any = a[sortField]
    let bValue: any = b[sortField]
    
    if (sortField === 'delivery_status') {
      const statusOrder = { pending: 0, shipped: 1, delivered: 2 }
      aValue = statusOrder[aValue as keyof typeof statusOrder]
      bValue = statusOrder[bValue as keyof typeof statusOrder]
    }
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  return (
    <div className="p-6">
      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            조회 월
          </label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            현장 선택
          </label>
          <select
            value={selectedSite}
            onChange={(e) => setSelectedSite(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">전체 현장</option>
            {sites.map(site => (
              <option key={site.id} value={site.id}>{site.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            배송 상태
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">전체 상태</option>
            <option value="pending">대기중</option>
            <option value="shipped">배송중</option>
            <option value="delivered">배송완료</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
          <p className="text-xs text-gray-600 dark:text-gray-400">총 출고</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{totals.totalShipments}</p>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
          <p className="text-xs text-yellow-600 dark:text-yellow-400">대기중</p>
          <p className="text-xl font-bold text-yellow-900 dark:text-yellow-100">{totals.pendingCount}</p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
          <p className="text-xs text-blue-600 dark:text-blue-400">배송중</p>
          <p className="text-xl font-bold text-blue-900 dark:text-blue-100">{totals.shippedCount}</p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
          <p className="text-xs text-green-600 dark:text-green-400">완료</p>
          <p className="text-xl font-bold text-green-900 dark:text-green-100">{totals.deliveredCount}</p>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
          <p className="text-xs text-purple-600 dark:text-purple-400">총 출고량</p>
          <p className="text-xl font-bold text-purple-900 dark:text-purple-100">{totals.totalAmount.toLocaleString()}</p>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
          <p className="text-xs text-orange-600 dark:text-orange-400">운임비용</p>
          <p className="text-xl font-bold text-orange-900 dark:text-orange-100">₩{totals.totalShippingCost.toLocaleString()}</p>
        </div>
      </div>

      {/* Data Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                onClick={() => handleSort('shipment_date')}
              >
                <div className="flex items-center gap-1">
                  날짜
                  {getSortIcon('shipment_date')}
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                onClick={() => handleSort('site_name')}
              >
                <div className="flex items-center gap-1">
                  현장
                  {getSortIcon('site_name')}
                </div>
              </th>
              <th 
                className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                onClick={() => handleSort('amount')}
              >
                <div className="flex items-center justify-end gap-1">
                  수량
                  {getSortIcon('amount')}
                </div>
              </th>
              <th 
                className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                onClick={() => handleSort('delivery_status')}
              >
                <div className="flex items-center justify-center gap-1">
                  배송상태
                  {getSortIcon('delivery_status')}
                </div>
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">배송방식</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">거래명세</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">세금계산서</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">입금확인</th>
              <th 
                className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                onClick={() => handleSort('shipping_cost')}
              >
                <div className="flex items-center justify-end gap-1">
                  운임비용
                  {getSortIcon('shipping_cost')}
                </div>
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">작업</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? (
              <tr>
                <td colSpan={10} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                  데이터를 불러오는 중...
                </td>
              </tr>
            ) : shipments.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-6 py-8 text-center">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <Truck className="h-12 w-12 text-orange-400" />
                    <div className="space-y-2">
                      <p className="text-lg font-medium text-gray-900 dark:text-white">
                        출고관리 데이터베이스가 준비되지 않았습니다
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
                        npc_shipments 테이블이 생성되면 출고 기록, 배송 상태, 세금계산서 등을 관리할 수 있습니다.
                        <br />현재는 UI 미리보기 모드입니다.
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              sortedShipments.map((shipment) => (
                <tr key={shipment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  {editingId === shipment.id ? (
                    <>
                      <td className="px-4 py-3 text-sm">{shipment.shipment_date}</td>
                      <td className="px-4 py-3 text-sm">{shipment.site_name}</td>
                      <td className="px-4 py-3 text-sm text-right">{shipment.amount.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <select
                          value={editForm.delivery_status}
                          onChange={(e) => setEditForm({ ...editForm, delivery_status: e.target.value as any })}
                          className="text-xs px-2 py-1 border rounded"
                        >
                          <option value="pending">대기중</option>
                          <option value="shipped">배송중</option>
                          <option value="delivered">배송완료</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={editForm.delivery_method || ''}
                          onChange={(e) => setEditForm({ ...editForm, delivery_method: e.target.value as any || null })}
                          className="text-xs px-2 py-1 border rounded"
                        >
                          <option value="">-</option>
                          <option value="parcel">택배</option>
                          <option value="freight">화물</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={editForm.invoice_confirmed}
                          onChange={(e) => setEditForm({ ...editForm, invoice_confirmed: e.target.checked })}
                          className="h-4 w-4"
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={editForm.tax_invoice_issued}
                          onChange={(e) => setEditForm({ ...editForm, tax_invoice_issued: e.target.checked })}
                          className="h-4 w-4"
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={editForm.payment_confirmed}
                          onChange={(e) => setEditForm({ ...editForm, payment_confirmed: e.target.checked })}
                          className="h-4 w-4"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={editForm.shipping_cost}
                          onChange={(e) => setEditForm({ ...editForm, shipping_cost: parseInt(e.target.value) || 0 })}
                          className="w-20 text-xs px-2 py-1 border rounded text-right"
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={handleSave} className="text-green-600 hover:text-green-800 mr-2">
                          <Save className="h-4 w-4" />
                        </button>
                        <button onClick={handleCancel} className="text-red-600 hover:text-red-800">
                          <X className="h-4 w-4" />
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                          {shipment.shipment_date}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        <div className="flex items-center">
                          <Building2 className="h-4 w-4 mr-1 text-gray-400" />
                          {shipment.site_name}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">
                        {shipment.amount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {getStatusBadge(shipment.delivery_status)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {getDeliveryMethodBadge(shipment.delivery_method)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {shipment.invoice_confirmed ? (
                          <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                        ) : (
                          <XCircle className="h-4 w-4 text-gray-300 mx-auto" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {shipment.tax_invoice_issued ? (
                          <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                        ) : (
                          <XCircle className="h-4 w-4 text-gray-300 mx-auto" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {shipment.payment_confirmed ? (
                          <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                        ) : (
                          <XCircle className="h-4 w-4 text-gray-300 mx-auto" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">
                        {shipment.shipping_cost ? `₩${shipment.shipping_cost.toLocaleString()}` : '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleEdit(shipment)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}