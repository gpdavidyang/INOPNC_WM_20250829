'use client'

import { useState, useEffect } from 'react'
import { 
  UserPlus, 
  Check, 
  X, 
  Eye, 
  Mail, 
  Phone, 
  Building,
  Calendar,
  Shield,
  AlertCircle
} from 'lucide-react'
import { getSignupRequests, approveSignupRequest, rejectSignupRequest } from '@/app/actions/admin/signup-approvals'
import { UserRole } from '@/types'
import ApprovalModal from './ApprovalModal'

interface SignupRequest {
  id: string
  email: string
  full_name: string
  phone?: string
  company_name?: string
  requested_role: UserRole
  status: 'pending' | 'approved' | 'rejected'
  request_message?: string
  rejection_reason?: string
  created_at: string
  approved_at?: string
  approved_by?: string
  approver?: {
    full_name: string
    email: string
  }
}

export default function SignupApprovals() {
  const [requests, setRequests] = useState<SignupRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [selectedRequest, setSelectedRequest] = useState<SignupRequest | null>(null)
  const [processing, setProcessing] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [approvalRequest, setApprovalRequest] = useState<SignupRequest | null>(null)

  useEffect(() => {
    fetchRequests()
  }, [filter])

  const fetchRequests = async () => {
    setLoading(true)
    try {
      const result = await getSignupRequests(filter)
      
      if (result.success) {
        setRequests(result.data || [])
      } else {
        console.error('Error fetching signup requests:', result.error)
        // Mock data for development
        setRequests([
          {
            id: '1',
            email: 'newuser@example.com',
            full_name: '홍길동',
            phone: '010-1234-5678',
            company_name: 'ABC 건설',
            requested_role: 'worker',
            status: 'pending',
            request_message: '현장 작업자로 등록하고 싶습니다.',
            created_at: new Date().toISOString()
          },
          {
            id: '2',
            email: 'partner@company.com',
            full_name: '김철수',
            phone: '010-9876-5432',
            company_name: 'XYZ 파트너사',
            requested_role: 'customer_manager',
            status: 'pending',
            request_message: '파트너사 관리자 권한을 요청합니다.',
            created_at: new Date(Date.now() - 86400000).toISOString()
          }
        ])
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApproveClick = (request: SignupRequest) => {
    setApprovalRequest(request)
    setShowApprovalModal(true)
  }

  const handleApprove = async (data: {
    requestId: string
    organizationId?: string
    siteIds?: string[]
  }) => {
    try {
      const result = await approveSignupRequest(
        data.requestId,
        data.organizationId,
        data.siteIds
      )
      
      if (result.success) {
        alert(result.message)
        if (result.tempPassword) {
          // In development, show the temp password
          console.log('Temporary password:', result.tempPassword)
          alert(`임시 비밀번호가 생성되었습니다: ${result.tempPassword}\n(실제 운영에서는 이메일로 전송됩니다)`)
        }
        fetchRequests()
        setShowApprovalModal(false)
        setApprovalRequest(null)
      } else {
        throw new Error(result.error)
      }
    } catch (error: any) {
      console.error('Error approving request:', error)
      alert(error.message || '승인 처리 중 오류가 발생했습니다.')
      throw error // Re-throw to let modal handle loading state
    }
  }

  const handleReject = async (request: SignupRequest) => {
    if (!rejectionReason.trim()) {
      alert('거절 사유를 입력해주세요.')
      return
    }

    setProcessing(true)
    try {
      const result = await rejectSignupRequest(request.id, rejectionReason)
      
      if (result.success) {
        alert(result.message)
        setRejectionReason('')
        fetchRequests()
        setSelectedRequest(null)
      } else {
        throw new Error(result.error)
      }
    } catch (error: any) {
      console.error('Error rejecting request:', error)
      alert(error.message || '거절 처리 중 오류가 발생했습니다.')
    } finally {
      setProcessing(false)
    }
  }

  const getRoleBadge = (role: UserRole) => {
    const roleConfig = {
      worker: { text: '작업자', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' },
      site_manager: { text: '현장관리자', color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' },
      customer_manager: { text: '파트너사', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300' },
      admin: { text: '관리자', color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300' }
    }
    
    const config = roleConfig[role] || roleConfig.worker
    return (
      <span className={`inline-flex items-center px-1.5 py-0.5 text-xs font-medium rounded ${config.color}`}>
        <Shield className="h-2.5 w-2.5 mr-1" />
        {config.text}
      </span>
    )
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { text: '대기중', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300' },
      approved: { text: '승인됨', color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' },
      rejected: { text: '거절됨', color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    return (
      <span className={`inline-flex px-1.5 py-0.5 text-xs font-medium rounded ${config.color}`}>
        {config.text}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          {[
            { key: 'pending', label: '대기중', count: requests.filter(r => r.status === 'pending').length },
            { key: 'approved', label: '승인됨', count: requests.filter(r => r.status === 'approved').length },
            { key: 'rejected', label: '거절됨', count: requests.filter(r => r.status === 'rejected').length },
            { key: 'all', label: '전체', count: requests.length }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                filter === tab.key
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 py-0.5 px-2 rounded-full text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Requests List */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        {requests.length === 0 ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            {filter === 'pending' ? '대기 중인 가입 요청이 없습니다.' : '요청이 없습니다.'}
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {requests.map((request) => (
              <li key={request.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {request.full_name}
                      </h3>
                      {getRoleBadge(request.requested_role)}
                      {getStatusBadge(request.status)}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1 min-w-0">
                        <Mail className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{request.email}</span>
                      </div>
                      {request.phone && (
                        <div className="flex items-center gap-1 min-w-0">
                          <Phone className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{request.phone}</span>
                        </div>
                      )}
                      {request.company_name && (
                        <div className="flex items-center gap-1 min-w-0">
                          <Building className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{request.company_name}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 flex-shrink-0" />
                        <span>{new Date(request.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}</span>
                      </div>
                    </div>

                    {request.request_message && (
                      <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded text-xs text-gray-700 dark:text-gray-300 line-clamp-2">
                        {request.request_message}
                      </div>
                    )}

                    {request.rejection_reason && (
                      <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded">
                        <div className="flex items-start gap-1">
                          <AlertCircle className="h-3 w-3 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-red-800 dark:text-red-300">거절 사유</p>
                            <p className="text-xs text-red-700 dark:text-red-400 line-clamp-2">
                              {request.rejection_reason}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {request.status === 'pending' && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleApproveClick(request)}
                        disabled={processing}
                        className="p-1.5 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 disabled:opacity-50 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                        title="승인"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedRequest(request)
                          setRejectionReason('')
                        }}
                        disabled={processing}
                        className="p-1.5 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                        title="거절"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Rejection Modal */}
      {selectedRequest && rejectionReason !== undefined && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              가입 거절
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {selectedRequest.full_name}님의 가입을 거절하시겠습니까?
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="거절 사유를 입력해주세요..."
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              rows={4}
            />
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setSelectedRequest(null)
                  setRejectionReason('')
                }}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              >
                취소
              </button>
              <button
                onClick={() => handleReject(selectedRequest)}
                disabled={processing || !rejectionReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                거절
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approval Modal */}
      <ApprovalModal
        isOpen={showApprovalModal}
        onClose={() => {
          setShowApprovalModal(false)
          setApprovalRequest(null)
        }}
        request={approvalRequest}
        onApprove={handleApprove}
      />
    </div>
  )
}