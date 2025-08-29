'use client'

import { useState, useEffect } from 'react'
import { Profile } from '@/types'
import AdminDataTable from './AdminDataTable'
import BulkActionBar, { commonBulkActions } from './BulkActionBar'
import { 
  getMaterials,
  getMaterialRequests,
  processMaterialRequestApprovals,
  getNPC1000Summary,
  getNPC1000BySite,
  updateMaterialInventory,
  MaterialWithStats,
  NPC1000Summary
} from '@/app/actions/admin/materials'
import { MaterialRequestData } from '@/types'
import { Search, Package, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, XCircle, Settings } from 'lucide-react'

interface MaterialsManagementProps {
  profile: Profile
}

export default function MaterialsManagement({ profile }: MaterialsManagementProps) {
  const [activeTab, setActiveTab] = useState<'inventory' | 'requests' | 'npc1000'>('inventory')
  
  // Inventory tab state
  const [materials, setMaterials] = useState<MaterialWithStats[]>([])
  const [inventoryLoading, setInventoryLoading] = useState(true)
  const [inventoryError, setInventoryError] = useState<string | null>(null)
  
  // Requests tab state
  const [requests, setRequests] = useState<MaterialRequestData[]>([])
  const [requestsLoading, setRequestsLoading] = useState(false)
  const [requestsError, setRequestsError] = useState<string | null>(null)
  
  // NPC-1000 tab state
  const [npcSites, setNpcSites] = useState<Array<{
    site_id: string;
    site_name: string;
    latest_date: string;
    incoming: number;
    used: number;
    remaining: number;
    efficiency: number;
    status: 'normal' | 'low' | 'critical';
  }>>([])
  const [npcLoading, setNpcLoading] = useState(false)
  const [npcError, setNpcError] = useState<string | null>(null)
  const [npcSummary, setNpcSummary] = useState<NPC1000Summary>({
    total_sites: 0,
    total_incoming: 0,
    total_used: 0,
    total_remaining: 0,
    efficiency_rate: 0,
    low_stock_sites: 0
  })
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const pageSize = 10

  // Filter state
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'normal' | 'low' | 'out_of_stock' | ''>('')
  
  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // Load inventory data
  const loadMaterials = async () => {
    setInventoryLoading(true)
    setInventoryError(null)
    
    try {
      const result = await getMaterials(
        currentPage,
        pageSize,
        searchTerm,
        statusFilter || undefined
      )
      
      if (result.success && result.data) {
        setMaterials(result.data.materials)
        setTotalCount(result.data.total)
        setTotalPages(result.data.pages)
      } else {
        setInventoryError(result.error || '자재 데이터를 불러오는데 실패했습니다.')
      }
    } catch (err) {
      setInventoryError('자재 데이터를 불러오는데 실패했습니다.')
    } finally {
      setInventoryLoading(false)
    }
  }

  // Load requests data
  const loadRequests = async () => {
    setRequestsLoading(true)
    setRequestsError(null)
    
    try {
      const result = await getMaterialRequests(
        currentPage,
        pageSize,
        searchTerm,
        statusFilter as any
      )
      
      if (result.success && result.data) {
        setRequests(result.data.requests)
        setTotalCount(result.data.total)
        setTotalPages(result.data.pages)
      } else {
        setRequestsError(result.error || '자재 요청 데이터를 불러오는데 실패했습니다.')
      }
    } catch (err) {
      setRequestsError('자재 요청 데이터를 불러오는데 실패했습니다.')
    } finally {
      setRequestsLoading(false)
    }
  }

  // Load NPC-1000 data
  const loadNPC1000Data = async () => {
    setNpcLoading(true)
    setNpcError(null)
    
    try {
      const [summaryResult, sitesResult] = await Promise.all([
        getNPC1000Summary(),
        getNPC1000BySite(currentPage, pageSize, searchTerm)
      ])
      
      if (summaryResult.success && summaryResult.data) {
        setNpcSummary(summaryResult.data)
      }
      
      if (sitesResult.success && sitesResult.data) {
        setNpcSites(sitesResult.data.sites)
        setTotalCount(sitesResult.data.total)
        setTotalPages(sitesResult.data.pages)
      } else {
        setNpcError(sitesResult.error || 'NPC-1000 데이터를 불러오는데 실패했습니다.')
      }
    } catch (err) {
      setNpcError('NPC-1000 데이터를 불러오는데 실패했습니다.')
    } finally {
      setNpcLoading(false)
    }
  }

  // Load data based on active tab
  useEffect(() => {
    setSelectedIds([])
    setCurrentPage(1)
    
    if (activeTab === 'inventory') {
      loadMaterials()
    } else if (activeTab === 'requests') {
      loadRequests()
    } else if (activeTab === 'npc1000') {
      loadNPC1000Data()
    }
  }, [activeTab])

  // Load data when filters change
  useEffect(() => {
    if (activeTab === 'inventory') {
      loadMaterials()
    } else if (activeTab === 'requests') {
      loadRequests()
    } else if (activeTab === 'npc1000') {
      loadNPC1000Data()
    }
  }, [currentPage, searchTerm, statusFilter])

  // Handle search
  const handleSearch = (term: string) => {
    setSearchTerm(term)
    setCurrentPage(1)
  }

  // Handle status filter
  const handleStatusFilter = (status: string) => {
    setStatusFilter(status as any)
    setCurrentPage(1)
  }

  // Handle request approval
  const handleRequestApproval = (action: 'approve' | 'reject') => async (requestIds: string[]) => {
    const comments = prompt(`${action === 'approve' ? '승인' : '거부'} 사유를 입력하세요 (선택사항):`)
    
    try {
      const result = await processMaterialRequestApprovals(requestIds, action, comments || undefined)
      if (result.success) {
        await loadRequests()
        setSelectedIds([])
        alert(result.message)
      } else {
        alert(result.error)
      }
    } catch (error) {
      alert(`요청 ${action === 'approve' ? '승인' : '거부'} 중 오류가 발생했습니다.`)
    }
  }

  // Handle inventory adjustment
  const handleInventoryAdjustment = async (materialIds: string[]) => {
    const adjustments: { [materialId: string]: { quantity: number; notes?: string } } = {}
    
    for (const materialId of materialIds) {
      const material = materials.find(m => m.id === materialId)
      if (!material) continue
      
      const newQuantity = prompt(`${material.material_name}의 새 재고량을 입력하세요 (현재: ${material.current_stock}${material.unit}):`)
      if (newQuantity === null) return // User cancelled
      
      const quantity = parseInt(newQuantity)
      if (isNaN(quantity) || quantity < 0) {
        alert('올바른 재고량을 입력하세요.')
        return
      }
      
      const notes = prompt('조정 사유를 입력하세요 (선택사항):')
      adjustments[materialId] = { quantity, notes: notes || undefined }
    }
    
    try {
      const result = await updateMaterialInventory(materialIds, adjustments)
      if (result.success) {
        await loadMaterials()
        setSelectedIds([])
        alert(result.message)
      } else {
        alert(result.error)
      }
    } catch (error) {
      alert('재고 조정 중 오류가 발생했습니다.')
    }
  }

  // Define columns for different tabs
  const inventoryColumns = [
    {
      key: 'material_name',
      label: '자재 정보',
      sortable: true,
      filterable: true,
      render: (value: string, material: MaterialWithStats) => (
        <div className="flex items-center">
          <Package className="h-8 w-8 text-gray-400 mr-3" />
          <div>
            <div className="font-medium text-gray-900 dark:text-gray-100">{value}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{material.material_code}</div>
            {material.specification && (
              <div className="text-xs text-gray-400">{material.specification}</div>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'status',
      label: '재고 상태',
      render: (value: 'normal' | 'low' | 'out_of_stock', material: MaterialWithStats) => {
        const statusConfig = {
          normal: { text: '정상', color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300', icon: CheckCircle },
          low: { text: '부족', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300', icon: AlertTriangle },
          out_of_stock: { text: '재고없음', color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300', icon: XCircle }
        }
        
        const config = statusConfig[value] || statusConfig.normal
        const Icon = config.icon
        
        return (
          <div className="space-y-1">
            <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
              <Icon className="h-3 w-3 mr-1" />
              {config.text}
            </span>
            <div className="text-xs text-gray-500">
              {material.current_stock}{material.unit}
              {material.minimum_stock && ` / 최소 ${material.minimum_stock}${material.unit}`}
            </div>
          </div>
        )
      }
    },
    {
      key: 'cost_trend',
      label: '비용 추이',
      render: (value: 'up' | 'down' | 'stable') => {
        const trendConfig = {
          up: { icon: TrendingUp, color: 'text-red-600' },
          down: { icon: TrendingDown, color: 'text-green-600' },
          stable: { icon: TrendingUp, color: 'text-gray-400' }
        }
        
        const config = trendConfig[value]
        const Icon = config.icon
        
        return (
          <Icon className={`h-5 w-5 ${config.color}`} />
        )
      }
    },
    {
      key: 'total_requests',
      label: '요청 수',
      render: (value: number) => (
        <span className="text-sm font-medium">{value || 0}</span>
      )
    },
    {
      key: 'storage_location',
      label: '보관 위치',
      render: (value: string) => (
        <span className="text-sm text-gray-600 dark:text-gray-300">{value || 'N/A'}</span>
      )
    }
  ]

  const requestsColumns = [
    {
      key: 'request_number',
      label: '요청 정보',
      render: (value: string, request: MaterialRequestData) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-gray-100">{value}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            요청자: {request.requester?.full_name}
          </div>
          <div className="text-xs text-gray-400">
            {new Date(request.request_date).toLocaleDateString('ko-KR')}
          </div>
        </div>
      )
    },
    {
      key: 'status',
      label: '상태',
      render: (value: string) => {
        const statusConfig = {
          pending: { text: '대기중', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300' },
          approved: { text: '승인됨', color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' },
          ordered: { text: '주문됨', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' },
          delivered: { text: '배송됨', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300' },
          cancelled: { text: '취소됨', color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300' }
        }
        
        const config = statusConfig[value as keyof typeof statusConfig] || statusConfig.pending
        return (
          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
            {config.text}
          </span>
        )
      }
    },
    {
      key: 'priority',
      label: '우선순위',
      render: (value: string) => {
        const priorityConfig = {
          urgent: { text: '긴급', color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300' },
          high: { text: '높음', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300' },
          normal: { text: '보통', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300' },
          low: { text: '낮음', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' }
        }
        
        const config = priorityConfig[value as keyof typeof priorityConfig] || priorityConfig.normal
        return (
          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
            {config.text}
          </span>
        )
      }
    },
    {
      key: 'total_amount',
      label: '총 금액',
      render: (value: number) => (
        <span className="font-medium">
          {value ? `₩${value.toLocaleString()}` : 'N/A'}
        </span>
      )
    },
    {
      key: 'required_date',
      label: '필요일',
      render: (value: string) => new Date(value).toLocaleDateString('ko-KR')
    }
  ]

  const npc1000Columns = [
    {
      key: 'site_name',
      label: '현장',
      render: (value: string, site: any) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-gray-100">{value}</div>
          <div className="text-xs text-gray-400">
            최종 업데이트: {new Date(site.latest_date).toLocaleDateString('ko-KR')}
          </div>
        </div>
      )
    },
    {
      key: 'status',
      label: '상태',
      render: (value: 'normal' | 'low' | 'critical', site: any) => {
        const statusConfig = {
          normal: { text: '정상', color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' },
          low: { text: '부족', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300' },
          critical: { text: '위험', color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300' }
        }
        
        const config = statusConfig[value]
        return (
          <div className="space-y-1">
            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
              {config.text}
            </span>
            <div className="text-xs text-gray-500">
              잔량: {site.remaining}개
            </div>
          </div>
        )
      }
    },
    {
      key: 'incoming',
      label: '입고',
      render: (value: number) => <span className="font-medium">{value}</span>
    },
    {
      key: 'used',
      label: '사용',
      render: (value: number) => <span className="font-medium">{value}</span>
    },
    {
      key: 'efficiency',
      label: '효율성',
      render: (value: number) => (
        <span className={`font-medium ${value >= 80 ? 'text-green-600' : value >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
          {value}%
        </span>
      )
    }
  ]

  // Define bulk actions for different tabs
  const inventoryBulkActions = [
    {
      id: 'adjust-inventory',
      label: '재고 조정',
      icon: Settings,
      variant: 'secondary' as const,
      onClick: handleInventoryAdjustment
    }
  ]

  const requestsBulkActions = [
    {
      id: 'approve',
      label: '승인',
      icon: CheckCircle,
      variant: 'default' as const,
      onClick: handleRequestApproval('approve')
    },
    {
      id: 'reject',
      label: '거부',
      icon: XCircle,
      variant: 'destructive' as const,
      onClick: handleRequestApproval('reject')
    }
  ]

  const getCurrentData = () => {
    switch (activeTab) {
      case 'inventory': return materials
      case 'requests': return requests
      case 'npc1000': return npcSites
      default: return []
    }
  }

  const getCurrentColumns = () => {
    switch (activeTab) {
      case 'inventory': return inventoryColumns
      case 'requests': return requestsColumns
      case 'npc1000': return npc1000Columns
      default: return []
    }
  }

  const getCurrentLoading = () => {
    switch (activeTab) {
      case 'inventory': return inventoryLoading
      case 'requests': return requestsLoading
      case 'npc1000': return npcLoading
      default: return false
    }
  }

  const getCurrentError = () => {
    switch (activeTab) {
      case 'inventory': return inventoryError
      case 'requests': return requestsError
      case 'npc1000': return npcError
      default: return null
    }
  }

  const getCurrentBulkActions = () => {
    switch (activeTab) {
      case 'inventory': return inventoryBulkActions
      case 'requests': return requestsBulkActions
      case 'npc1000': return []
      default: return []
    }
  }

  return (
    <div className="space-y-4">
      {/* NPC-1000 Summary (only show when npc1000 tab is active) */}
      {activeTab === 'npc1000' && (
        <div className="grid grid-cols-2 md:grid-cols-6 xl:grid-cols-6 gap-3">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">전체 현장</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">{npcSummary.total_sites}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">총 입고</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">{npcSummary.total_incoming}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">총 사용</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">{npcSummary.total_used}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">총 잔량</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">{npcSummary.total_remaining}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">효율성</div>
            <div className={`text-lg font-semibold ${npcSummary.efficiency_rate >= 80 ? 'text-green-600' : npcSummary.efficiency_rate >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
              {npcSummary.efficiency_rate}%
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">부족 현장</div>
            <div className="text-lg font-semibold text-red-600">{npcSummary.low_stock_sites}</div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'inventory'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            자재 재고
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'requests'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            자재 요청
          </button>
          <button
            onClick={() => setActiveTab('npc1000')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'npc1000'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            NPC-1000 관리
          </button>
        </nav>
      </div>

      {/* Header with search and filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder={
                activeTab === 'inventory' ? '자재명, 코드로 검색...' :
                activeTab === 'requests' ? '요청 번호로 검색...' :
                '현장명으로 검색...'
              }
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>
        
        <div className="flex flex-row gap-2 flex-shrink-0">
          {activeTab === 'inventory' && (
            <select
              value={statusFilter}
              onChange={(e) => handleStatusFilter(e.target.value)}
              className="min-w-[120px] px-3 py-1.5 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            >
              <option value="">모든 재고 상태</option>
              <option value="normal">정상</option>
              <option value="low">부족</option>
              <option value="out_of_stock">재고없음</option>
            </select>
          )}
          
          {activeTab === 'requests' && (
            <select
              value={statusFilter}
              onChange={(e) => handleStatusFilter(e.target.value)}
              className="min-w-[100px] px-3 py-1.5 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            >
              <option value="">모든 상태</option>
              <option value="pending">대기중</option>
              <option value="approved">승인됨</option>
              <option value="ordered">주문됨</option>
              <option value="delivered">배송됨</option>
              <option value="cancelled">취소됨</option>
            </select>
          )}
        </div>
      </div>

      {/* Data table */}
      <AdminDataTable
        data={getCurrentData() as any[]}
        columns={getCurrentColumns() as any[]}
        loading={getCurrentLoading()}
        error={getCurrentError()}
        selectable={activeTab !== 'npc1000'}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        getRowId={(item: any) => item.id || item.site_id}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        pageSize={pageSize}
        totalCount={totalCount}
        emptyMessage={
          activeTab === 'inventory' ? '자재가 없습니다' :
          activeTab === 'requests' ? '자재 요청이 없습니다' :
          'NPC-1000 데이터가 없습니다'
        }
        emptyDescription={
          activeTab === 'inventory' ? '자재 재고 정보가 나타날 예정입니다.' :
          activeTab === 'requests' ? '자재 요청이 나타날 예정입니다.' :
          'NPC-1000 사용 현황이 나타날 예정입니다.'
        }
      />

      {/* Bulk action bar */}
      {activeTab !== 'npc1000' && (
        <BulkActionBar
          selectedIds={selectedIds}
          totalCount={totalCount}
          actions={getCurrentBulkActions()}
          onClearSelection={() => setSelectedIds([])}
        />
      )}
    </div>
  )
}