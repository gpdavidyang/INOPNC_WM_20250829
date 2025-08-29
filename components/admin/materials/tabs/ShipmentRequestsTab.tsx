'use client'

import { useState, useEffect } from 'react'
import { Profile } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { 
  FileText, Clock, CheckCircle, XCircle, AlertCircle,
  User, Building2, Calendar, Package, Eye, MessageSquare,
  TrendingUp, Filter, Search,
  ChevronUp, ChevronDown, ChevronsUpDown
} from 'lucide-react'

interface ShipmentRequestsTabProps {
  profile: Profile
}

interface ShipmentRequest {
  id: string
  request_date: string
  site_id: string
  site_name: string
  requester_id: string
  requester_name: string
  requester_role: string
  requested_amount: number
  urgency: 'normal' | 'urgent' | 'critical'
  reason: string
  status: 'pending' | 'approved' | 'rejected' | 'fulfilled'
  approved_amount?: number
  approved_by?: string
  approved_at?: string
  rejection_reason?: string
  fulfillment_date?: string
  notes?: string
  created_at: string
  updated_at: string
}

export default function ShipmentRequestsTab({ profile }: ShipmentRequestsTabProps) {
  const [requests, setRequests] = useState<ShipmentRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [selectedUrgency, setSelectedUrgency] = useState<string>('')
  const [selectedSite, setSelectedSite] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [sites, setSites] = useState<Array<{id: string, name: string}>>([])
  const [selectedRequest, setSelectedRequest] = useState<ShipmentRequest | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [sortField, setSortField] = useState<'request_date' | 'site_name' | 'requester_name' | 'requested_amount' | 'urgency' | 'status'>('request_date')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  
  // Response form
  const [responseForm, setResponseForm] = useState({
    status: 'approved' as 'approved' | 'rejected',
    approved_amount: 0,
    rejection_reason: '',
    notes: ''
  })

  const supabase = createClient()

  useEffect(() => {
    loadSites()
    loadRequests()
  }, [selectedStatus, selectedUrgency, selectedSite])

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

  const loadRequests = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('npc_shipment_requests')
        .select(`
          *,
          sites!site_id(name),
          profiles!requester_id(name, email, role)
        `)
        .order('created_at', { ascending: false })

      if (selectedStatus) {
        query = query.eq('status', selectedStatus)
      }

      if (selectedUrgency) {
        query = query.eq('urgency', selectedUrgency)
      }

      if (selectedSite) {
        query = query.eq('site_id', selectedSite)
      }

      const { data, error } = await query

      if (!error && data) {
        const formattedData: ShipmentRequest[] = data.map(item => ({
          ...item,
          site_name: (item as any).sites?.name || '알 수 없음',
          requester_name: (item as any).profiles?.name || '알 수 없음',
          requester_role: (item as any).profiles?.role || 'worker'
        }))
        setRequests(formattedData)
      } else if (error) {
        console.warn('Shipment requests table not available:', error.message)
        // Load mock data when table doesn't exist
        const { mockRequestData } = await import('../mockData')
        let filteredData = mockRequestData.filter(item => 
          item.request_date.startsWith(selectedMonth)
        )
        
        if (selectedSite) {
          filteredData = filteredData.filter(item => item.site_id === selectedSite)
        }
        
        if (statusFilter) {
          filteredData = filteredData.filter(item => item.status === statusFilter)
        }
        
        if (urgencyFilter) {
          filteredData = filteredData.filter(item => item.urgency === urgencyFilter)
        }
        
        setRequests(filteredData)
      }
    } catch (error) {
      console.error('Failed to load requests:', error)
      // Fallback to mock data
      const { mockRequestData } = await import('../mockData')
      let filteredData = mockRequestData.filter(item => 
        item.request_date.startsWith(selectedMonth)
      )
      
      if (selectedSite) {
        filteredData = filteredData.filter(item => item.site_id === selectedSite)
      }
      
      if (statusFilter) {
        filteredData = filteredData.filter(item => item.status === statusFilter)
      }
      
      if (urgencyFilter) {
        filteredData = filteredData.filter(item => item.urgency === urgencyFilter)
      }
      
      setRequests(filteredData)
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetail = (request: ShipmentRequest) => {
    setSelectedRequest(request)
    setResponseForm({
      status: 'approved',
      approved_amount: request.requested_amount,
      rejection_reason: '',
      notes: ''
    })
    setShowDetailModal(true)
  }

  const handleProcessRequest = async () => {
    if (!selectedRequest) return

    try {
      const updateData: any = {
        status: responseForm.status,
        approved_by: profile.id,
        approved_at: new Date().toISOString(),
        notes: responseForm.notes,
        updated_at: new Date().toISOString()
      }

      if (responseForm.status === 'approved') {
        updateData.approved_amount = responseForm.approved_amount
      } else if (responseForm.status === 'rejected') {
        updateData.rejection_reason = responseForm.rejection_reason
      }

      const { error } = await supabase
        .from('npc_shipment_requests')
        .update(updateData)
        .eq('id', selectedRequest.id)

      if (!error) {
        alert(`출고 요청이 ${responseForm.status === 'approved' ? '승인' : '거절'}되었습니다.`)
        setShowDetailModal(false)
        setSelectedRequest(null)
        await loadRequests()
      }
    } catch (error) {
      console.error('Failed to process request:', error)
      alert('요청 처리에 실패했습니다.')
    }
  }

  const getUrgencyBadge = (urgency: string) => {
    const badges = {
      normal: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-800 dark:text-gray-200', label: '일반' },
      urgent: { bg: 'bg-orange-100 dark:bg-orange-900/20', text: 'text-orange-800 dark:text-orange-200', label: '긴급' },
      critical: { bg: 'bg-red-100 dark:bg-red-900/20', text: 'text-red-800 dark:text-red-200', label: '매우긴급' }
    }
    const badge = badges[urgency as keyof typeof badges] || badges.normal
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    )
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { bg: 'bg-yellow-100 dark:bg-yellow-900/20', text: 'text-yellow-800 dark:text-yellow-200', label: '대기중', icon: Clock },
      approved: { bg: 'bg-green-100 dark:bg-green-900/20', text: 'text-green-800 dark:text-green-200', label: '승인됨', icon: CheckCircle },
      rejected: { bg: 'bg-red-100 dark:bg-red-900/20', text: 'text-red-800 dark:text-red-200', label: '거절됨', icon: XCircle },
      fulfilled: { bg: 'bg-blue-100 dark:bg-blue-900/20', text: 'text-blue-800 dark:text-blue-200', label: '완료', icon: Package }
    }
    const badge = badges[status as keyof typeof badges] || badges.pending
    const Icon = badge.icon
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        <Icon className="h-3 w-3 mr-1" />
        {badge.label}
      </span>
    )
  }

  const getRoleBadge = (role: string) => {
    const roleLabels: Record<string, string> = {
      worker: '작업자',
      site_manager: '현장관리자',
      admin: '관리자'
    }
    return roleLabels[role] || role
  }

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

  const sortedRequests = [...requests].sort((a, b) => {
    let aValue: any = a[sortField]
    let bValue: any = b[sortField]
    
    if (sortField === 'urgency') {
      const urgencyOrder = { normal: 0, urgent: 1, critical: 2 }
      aValue = urgencyOrder[aValue as keyof typeof urgencyOrder]
      bValue = urgencyOrder[bValue as keyof typeof urgencyOrder]
    }
    
    if (sortField === 'status') {
      const statusOrder = { pending: 0, approved: 1, rejected: 2, fulfilled: 3 }
      aValue = statusOrder[aValue as keyof typeof statusOrder]
      bValue = statusOrder[bValue as keyof typeof statusOrder]
    }
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  const filteredRequests = sortedRequests.filter(request =>
    searchTerm === '' ||
    request.site_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.requester_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.reason.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
    critical: requests.filter(r => r.urgency === 'critical' && r.status === 'pending').length
  }

  return (
    <div className="p-6">
      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            상태 필터
          </label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">전체 상태</option>
            <option value="pending">대기중</option>
            <option value="approved">승인됨</option>
            <option value="rejected">거절됨</option>
            <option value="fulfilled">완료</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            긴급도
          </label>
          <select
            value={selectedUrgency}
            onChange={(e) => setSelectedUrgency(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">전체 긴급도</option>
            <option value="normal">일반</option>
            <option value="urgent">긴급</option>
            <option value="critical">매우긴급</option>
          </select>
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
            검색
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="현장, 요청자, 사유 검색..."
              className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">전체 요청</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
          <p className="text-sm text-yellow-600 dark:text-yellow-400">대기중</p>
          <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">{stats.pending}</p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <p className="text-sm text-green-600 dark:text-green-400">승인됨</p>
          <p className="text-2xl font-bold text-green-900 dark:text-green-100">{stats.approved}</p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">거절됨</p>
          <p className="text-2xl font-bold text-red-900 dark:text-red-100">{stats.rejected}</p>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
          <p className="text-sm text-orange-600 dark:text-orange-400">긴급 대기</p>
          <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">{stats.critical}</p>
          {stats.critical > 0 && <AlertCircle className="h-4 w-4 text-orange-500 mt-1" />}
        </div>
      </div>

      {/* Requests Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                onClick={() => handleSort('request_date')}
              >
                <div className="flex items-center gap-1">
                  요청일
                  {getSortIcon('request_date')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                onClick={() => handleSort('site_name')}
              >
                <div className="flex items-center gap-1">
                  현장
                  {getSortIcon('site_name')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                onClick={() => handleSort('requester_name')}
              >
                <div className="flex items-center gap-1">
                  요청자
                  {getSortIcon('requester_name')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                onClick={() => handleSort('requested_amount')}
              >
                <div className="flex items-center justify-end gap-1">
                  요청량
                  {getSortIcon('requested_amount')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                onClick={() => handleSort('urgency')}
              >
                <div className="flex items-center justify-center gap-1">
                  긴급도
                  {getSortIcon('urgency')}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">사유</th>
              <th 
                className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center justify-center gap-1">
                  상태
                  {getSortIcon('status')}
                </div>
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">작업</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                  데이터를 불러오는 중...
                </td>
              </tr>
            ) : filteredRequests.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <FileText className="h-12 w-12 text-orange-400" />
                    <div className="space-y-2">
                      <p className="text-lg font-medium text-gray-900 dark:text-white">
                        출고요청 관리 데이터베이스가 준비되지 않았습니다
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
                        npc_shipment_requests 테이블이 생성되면 현장별 출고 요청 승인/거절을 관리할 수 있습니다.
                        <br />현재는 UI 미리보기 모드입니다.
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              filteredRequests.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      {request.request_date}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    <div className="flex items-center">
                      <Building2 className="h-4 w-4 mr-2 text-gray-400" />
                      {request.site_name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div>
                      <div className="flex items-center text-gray-900 dark:text-white">
                        <User className="h-4 w-4 mr-1 text-gray-400" />
                        {request.requester_name}
                      </div>
                      <div className="text-xs text-gray-500">{getRoleBadge(request.requester_role)}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 dark:text-white">
                    {request.requested_amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {getUrgencyBadge(request.urgency)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    <p className="truncate max-w-xs" title={request.reason}>
                      {request.reason}
                    </p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {getStatusBadge(request.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <button
                      onClick={() => handleViewDetail(request)}
                      className="text-blue-600 hover:text-blue-800"
                      title="상세보기"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                출고 요청 상세
              </h2>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {/* Request Details */}
              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">요청일</p>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedRequest.request_date}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">현장</p>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedRequest.site_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">요청자</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedRequest.requester_name} ({getRoleBadge(selectedRequest.requester_role)})
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">요청량</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedRequest.requested_amount.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">긴급도</p>
                    {getUrgencyBadge(selectedRequest.urgency)}
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">상태</p>
                    {getStatusBadge(selectedRequest.status)}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">요청 사유</p>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedRequest.reason}</p>
                </div>
                {selectedRequest.notes && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">비고</p>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedRequest.notes}</p>
                  </div>
                )}
              </div>

              {/* Response Form (for pending requests) */}
              {selectedRequest.status === 'pending' && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    요청 처리
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        처리 결정
                      </label>
                      <select
                        value={responseForm.status}
                        onChange={(e) => setResponseForm({ ...responseForm, status: e.target.value as any })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="approved">승인</option>
                        <option value="rejected">거절</option>
                      </select>
                    </div>

                    {responseForm.status === 'approved' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          승인 수량
                        </label>
                        <input
                          type="number"
                          value={responseForm.approved_amount}
                          onChange={(e) => setResponseForm({ ...responseForm, approved_amount: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                    )}

                    {responseForm.status === 'rejected' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          거절 사유
                        </label>
                        <textarea
                          value={responseForm.rejection_reason}
                          onChange={(e) => setResponseForm({ ...responseForm, rejection_reason: e.target.value })}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          required
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        처리 메모 (선택)
                      </label>
                      <textarea
                        value={responseForm.notes}
                        onChange={(e) => setResponseForm({ ...responseForm, notes: e.target.value })}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Previous Response (for processed requests) */}
              {selectedRequest.status !== 'pending' && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    처리 결과
                  </h3>
                  <div className="space-y-2">
                    {selectedRequest.approved_amount && (
                      <p className="text-sm">
                        <span className="text-gray-600 dark:text-gray-400">승인 수량:</span>{' '}
                        <span className="font-medium text-gray-900 dark:text-white">
                          {selectedRequest.approved_amount.toLocaleString()}
                        </span>
                      </p>
                    )}
                    {selectedRequest.rejection_reason && (
                      <p className="text-sm">
                        <span className="text-gray-600 dark:text-gray-400">거절 사유:</span>{' '}
                        <span className="font-medium text-gray-900 dark:text-white">
                          {selectedRequest.rejection_reason}
                        </span>
                      </p>
                    )}
                    {selectedRequest.approved_at && (
                      <p className="text-sm">
                        <span className="text-gray-600 dark:text-gray-400">처리일:</span>{' '}
                        <span className="font-medium text-gray-900 dark:text-white">
                          {new Date(selectedRequest.approved_at).toLocaleDateString('ko-KR')}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDetailModal(false)
                  setSelectedRequest(null)
                }}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md"
              >
                닫기
              </button>
              {selectedRequest.status === 'pending' && (
                <button
                  onClick={handleProcessRequest}
                  className={`px-4 py-2 text-white rounded-md ${
                    responseForm.status === 'approved'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {responseForm.status === 'approved' ? '승인' : '거절'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}