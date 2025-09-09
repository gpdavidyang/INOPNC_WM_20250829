'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { approveSignupRequest, rejectSignupRequest } from '@/app/auth/actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import ApprovalModal from '@/components/admin/ApprovalModal'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Filter,
  ChevronUp,
  ChevronDown
} from 'lucide-react'

interface SignupRequest {
  id: string
  full_name: string
  company: string
  job_title: string
  phone: string
  email: string
  job_type: 'construction' | 'office'
  status: 'pending' | 'approved' | 'rejected'
  requested_at: string
  approved_by?: string
  approved_at?: string
  rejected_by?: string
  rejected_at?: string
  rejection_reason?: string
  temporary_password?: string
  approved_by_profile?: { full_name: string }
  rejected_by_profile?: { full_name: string }
}

interface SignupRequestsClientProps {
  requests: SignupRequest[]
  currentUser: any
}

export default function SignupRequestsClient({ requests, currentUser }: SignupRequestsClientProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [sortField, setSortField] = useState<'requested_at' | 'full_name' | 'company'>('requested_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [approvalRequest, setApprovalRequest] = useState<SignupRequest | null>(null)

  const filteredRequests = requests.filter(request => {
    if (filter === 'all') return true
    return request.status === filter
  }).sort((a, b) => {
    const aValue = a[sortField]
    const bValue = b[sortField]
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })

  const handleApproveClick = (request: SignupRequest) => {
    // Convert request to format expected by ApprovalModal
    const modalRequest = {
      id: request.id,
      full_name: request.full_name,
      email: request.email,
      phone: request.phone,
      company_name: request.company,
      requested_role: request.job_type === 'construction' ? 'worker' : 'site_manager'
    }
    setApprovalRequest(modalRequest as any)
    setShowApprovalModal(true)
  }

  const handleApprove = async (data: {
    requestId: string
    organizationId?: string
    siteIds?: string[]
  }) => {
    setLoading(data.requestId)
    try {
      const result = await approveSignupRequest(data.requestId, currentUser.id, data.organizationId, data.siteIds)
      if (result.success) {
        // Show detailed success message with organization, site, and temporary password info
        if (result.message) {
          toast.success(result.message, {
            duration: 10000, // Show for 10 seconds
            description: '임시 비밀번호를 사용자에게 전달해주세요.'
          })
        } else {
          toast.success('승인이 완료되었습니다.')
        }
        setShowApprovalModal(false)
        setApprovalRequest(null)
        router.refresh()
      } else {
        toast.error(result.error || '승인 처리에 실패했습니다.')
      }
    } catch (error) {
      toast.error('승인 처리 중 오류가 발생했습니다.')
    } finally {
      setLoading(null)
    }
  }

  const handleReject = async (requestId: string) => {
    setLoading(requestId)
    try {
      const result = await rejectSignupRequest(requestId, currentUser.id, rejectionReason)
      if (result.success) {
        toast.success('거절 처리가 완료되었습니다.')
        setShowRejectModal(null)
        setRejectionReason('')
        router.refresh()
      } else {
        toast.error(result.error || '거절 처리에 실패했습니다.')
      }
    } catch (error) {
      toast.error('거절 처리 중 오류가 발생했습니다.')
    } finally {
      setLoading(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 text-xs">
          <Clock className="w-3 h-3 mr-1" />
          대기중
        </Badge>
      case 'approved':
        return <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 text-xs">
          <CheckCircle className="w-3 h-3 mr-1" />
          승인됨
        </Badge>
      case 'rejected':
        return <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 text-xs">
          <XCircle className="w-3 h-3 mr-1" />
          거절됨
        </Badge>
      default:
        return null
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('클립보드에 복사되었습니다.')
    } catch (error) {
      toast.error('복사에 실패했습니다.')
    }
  }

  const toggleRowExpansion = (id: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const handleSort = (field: 'requested_at' | 'full_name' | 'company') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
          {[
            { key: 'all', label: '전체', count: requests.length },
            { key: 'pending', label: '대기중', count: requests.filter(r => r.status === 'pending').length },
            { key: 'approved', label: '승인됨', count: requests.filter(r => r.status === 'approved').length },
            { key: 'rejected', label: '거절됨', count: requests.filter(r => r.status === 'rejected').length },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as any)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filter === tab.key
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Filter className="w-4 h-4" />
          <span>총 {filteredRequests.length}건</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-3 py-2 text-left">
                  <button
                    onClick={() => handleSort('requested_at')}
                    className="flex items-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    요청일
                    {sortField === 'requested_at' && (
                      sortOrder === 'asc' ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />
                    )}
                  </button>
                </th>
                <th className="px-3 py-2 text-left">
                  <button
                    onClick={() => handleSort('full_name')}
                    className="flex items-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    이름
                    {sortField === 'full_name' && (
                      sortOrder === 'asc' ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />
                    )}
                  </button>
                </th>
                <th className="px-3 py-2 text-left">
                  <button
                    onClick={() => handleSort('company')}
                    className="flex items-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    회사
                    {sortField === 'company' && (
                      sortOrder === 'asc' ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />
                    )}
                  </button>
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  직함
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  연락처
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  업종
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  거절사유
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  작업
                </th>
                <th className="px-2 py-2"></th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-3 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                    {filter === 'all' ? '승인 요청이 없습니다.' : `${filter === 'pending' ? '대기중인' : filter === 'approved' ? '승인된' : '거절된'} 요청이 없습니다.`}
                  </td>
                </tr>
              ) : (
                filteredRequests.map(request => {
                  const isExpanded = expandedRows.has(request.id)
                  
                  return (
                    <React.Fragment key={request.id}>
                      <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-gray-100">
                          {new Date(request.requested_at).toLocaleDateString('ko-KR')}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900 dark:text-gray-100">
                          {request.full_name}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-gray-100">
                          {request.company}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-gray-100">
                          {request.job_title}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-gray-100">
                          <div className="space-y-0.5">
                            <div>{request.phone}</div>
                            <div className="text-gray-500 dark:text-gray-400">{request.email}</div>
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-gray-100">
                          {request.job_type === 'construction' ? '건설업' : '사무직'}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {getStatusBadge(request.status)}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {request.status === 'rejected' && request.rejection_reason ? (
                            <span className="text-xs text-gray-600 dark:text-gray-400 max-w-xs truncate block" title={request.rejection_reason}>
                              {request.rejection_reason.length > 30 
                                ? request.rejection_reason.substring(0, 30) + '...' 
                                : request.rejection_reason}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {request.status === 'pending' ? (
                            <div className="flex space-x-1">
                              <Button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault()
                                  handleApproveClick(request)
                                }}
                                disabled={loading === request.id}
                                size="compact"
                                className="h-7 px-2 text-xs bg-green-600 hover:bg-green-700 text-white"
                              >
                                {loading === request.id ? '처리중...' : '승인'}
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => setShowRejectModal(request.id)}
                                disabled={loading === request.id}
                                size="compact"
                                className="h-7 px-2 text-xs border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                              >
                                거절
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-2 py-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleRowExpansion(request.id)}
                            className="text-xs min-w-[40px] h-7 px-2 py-1"
                          >
                            {isExpanded ? '접기' : '펼침'}
                          </Button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${request.id}-expanded`}>
                          <td colSpan={10} className="px-3 py-3 bg-gray-50 dark:bg-gray-900/50">
                            <div className="space-y-2">
                              {/* Status Details */}
                              {request.status === 'approved' && request.approved_by_profile && (
                                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded text-xs">
                                  <p className="text-green-800 dark:text-green-400">
                                    <strong>{request.approved_by_profile.full_name}</strong>님이 {new Date(request.approved_at!).toLocaleDateString('ko-KR')}에 승인
                                  </p>
                                  {request.temporary_password && (
                                    <div className="mt-1 flex items-center space-x-2">
                                      <span className="text-green-700 dark:text-green-300">임시 비밀번호:</span>
                                      <code className="bg-green-100 dark:bg-green-900/40 px-2 py-0.5 rounded">
                                        {request.temporary_password}
                                      </code>
                                      <Button
                                        variant="ghost"
                                        size="compact"
                                        onClick={() => copyToClipboard(request.temporary_password!)}
                                        className="text-xs min-w-[35px] h-6 px-1 py-0.5"
                                      >
                                        복사
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              {request.status === 'rejected' && request.rejected_by_profile && (
                                <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded text-xs">
                                  <p className="text-red-800 dark:text-red-400">
                                    <strong>{request.rejected_by_profile.full_name}</strong>님이 {new Date(request.rejected_at!).toLocaleDateString('ko-KR')}에 거절
                                  </p>
                                  {request.rejection_reason && (
                                    <p className="text-red-700 dark:text-red-300 mt-1">
                                      사유: {request.rejection_reason}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">승인 거절</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              거절 사유를 입력해주세요 (선택사항):
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none"
              rows={3}
              placeholder="거절 사유를 입력하세요..."
            />
            <div className="flex space-x-3 mt-4">
              <Button
                onClick={() => handleReject(showRejectModal)}
                disabled={loading === showRejectModal}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {loading === showRejectModal ? '처리 중...' : '거절'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectModal(null)
                  setRejectionReason('')
                }}
                disabled={loading === showRejectModal}
              >
                취소
              </Button>
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