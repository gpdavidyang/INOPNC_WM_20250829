'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { approveSignupRequest, rejectSignupRequest } from '@/app/auth/actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  Building, 
  Phone, 
  Mail,
  Calendar,
  Copy,
  FileText,
  AlertTriangle
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
  const [showApprovalModal, setShowApprovalModal] = useState<string | null>(null)

  const filteredRequests = requests.filter(request => {
    if (filter === 'all') return true
    return request.status === filter
  })

  // Mock function to simulate required documents check
  const getRequiredDocumentsStatus = (request: SignupRequest) => {
    // 실제 구현에서는 DB에서 해당 사용자의 필수 서류 상태를 조회
    // 여기서는 시연을 위한 Mock 데이터
    const mockDocuments = [
      { type: '신분증', submitted: request.id !== '1' }, // 김철수(id='1')만 미제출
      { type: '재직증명서', submitted: request.id !== '2' }, // 이영희(id='2')만 미제출
      { type: '건강검진서', submitted: request.id !== '3' } // 박민수(id='3')만 미제출
    ]
    
    const total = mockDocuments.length
    const submitted = mockDocuments.filter(doc => doc.submitted).length
    const missing = mockDocuments.filter(doc => !doc.submitted)
    
    return {
      total,
      submitted,
      missing,
      isComplete: submitted === total,
      completionRate: Math.round((submitted / total) * 100)
    }
  }

  const handleApprove = async (requestId: string) => {
    // 필수 서류 상태를 먼저 확인
    const request = requests.find(r => r.id === requestId)
    if (request) {
      const docsStatus = getRequiredDocumentsStatus(request)
      if (!docsStatus.isComplete) {
        // 필수 서류가 미흡한 경우 확인 모달 표시
        setShowApprovalModal(requestId)
        return
      }
    }
    
    // 필수 서류가 완비된 경우 바로 승인 진행
    await performApproval(requestId)
  }

  const performApproval = async (requestId: string) => {
    setLoading(requestId)
    try {
      const result = await approveSignupRequest(requestId, currentUser.id)
      if (result.success) {
        toast.success('승인이 완료되었습니다.')
        setShowApprovalModal(null)
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
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
          <Clock className="w-3 h-3 mr-1" />
          대기중
        </Badge>
      case 'approved':
        return <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
          <CheckCircle className="w-3 h-3 mr-1" />
          승인됨
        </Badge>
      case 'rejected':
        return <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
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

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
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
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === tab.key
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              {filter === 'all' ? '승인 요청이 없습니다.' : `${filter === 'pending' ? '대기중인' : filter === 'approved' ? '승인된' : '거절된'} 요청이 없습니다.`}
            </p>
          </Card>
        ) : (
          filteredRequests.map(request => (
            <Card key={request.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {request.full_name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {request.job_type === 'construction' ? '건설업' : '사무직'}
                    </p>
                  </div>
                </div>
                {getStatusBadge(request.status)}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm">
                    <Building className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-400">회사:</span>
                    <span className="text-gray-900 dark:text-gray-100">{request.company}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-400">직함:</span>
                    <span className="text-gray-900 dark:text-gray-100">{request.job_title}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-400">전화:</span>
                    <span className="text-gray-900 dark:text-gray-100">{request.phone}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-400">이메일:</span>
                    <span className="text-gray-900 dark:text-gray-100">{request.email}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-400">요청일:</span>
                    <span className="text-gray-900 dark:text-gray-100">
                      {new Date(request.requested_at).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                  {/* 필수 서류 상태 표시 */}
                  {(() => {
                    const docsStatus = getRequiredDocumentsStatus(request)
                    return (
                      <div className="flex items-center space-x-2 text-sm">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400">필수서류:</span>
                        <div className="flex items-center space-x-2">
                          <span className={`text-sm font-medium ${
                            docsStatus.isComplete 
                              ? 'text-green-600 dark:text-green-400' 
                              : 'text-orange-600 dark:text-orange-400'
                          }`}>
                            {docsStatus.submitted}/{docsStatus.total} ({docsStatus.completionRate}%)
                          </span>
                          {!docsStatus.isComplete && (
                            <AlertTriangle className="w-4 h-4 text-orange-500" />
                          )}
                        </div>
                      </div>
                    )
                  })()}
                </div>
              </div>

              {/* Status Information */}
              {request.status === 'approved' && request.approved_by_profile && (
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg mb-4">
                  <p className="text-sm text-green-800 dark:text-green-400">
                    <strong>{request.approved_by_profile.full_name}</strong>님이 {new Date(request.approved_at!).toLocaleDateString('ko-KR')}에 승인했습니다.
                  </p>
                  {request.temporary_password && (
                    <div className="mt-2 flex items-center space-x-2">
                      <span className="text-sm text-green-700 dark:text-green-300">임시 비밀번호:</span>
                      <code className="bg-green-100 dark:bg-green-900/40 px-2 py-1 rounded text-sm">
                        {request.temporary_password}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(request.temporary_password!)}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {request.status === 'rejected' && request.rejected_by_profile && (
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg mb-4">
                  <p className="text-sm text-red-800 dark:text-red-400">
                    <strong>{request.rejected_by_profile.full_name}</strong>님이 {new Date(request.rejected_at!).toLocaleDateString('ko-KR')}에 거절했습니다.
                  </p>
                  {request.rejection_reason && (
                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                      사유: {request.rejection_reason}
                    </p>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              {request.status === 'pending' && (
                <div className="flex space-x-3">
                  <Button
                    onClick={() => handleApprove(request.id)}
                    disabled={loading === request.id}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {loading === request.id ? '승인 중...' : '승인'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowRejectModal(request.id)}
                    disabled={loading === request.id}
                    className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    거절
                  </Button>
                </div>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Approval Confirmation Modal - for incomplete documents */}
      {showApprovalModal && (() => {
        const request = requests.find(r => r.id === showApprovalModal)
        const docsStatus = request ? getRequiredDocumentsStatus(request) : null
        
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md">
              <div className="flex items-center mb-4">
                <AlertTriangle className="w-5 h-5 text-orange-500 mr-2" />
                <h3 className="text-lg font-semibold">승인 확인</h3>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  <strong>{request?.full_name}</strong>님의 필수 서류가 미흡합니다.
                </p>
                
                {docsStatus && !docsStatus.isComplete && (
                  <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg mb-4">
                    <div className="flex items-center mb-2">
                      <FileText className="w-4 h-4 text-orange-600 dark:text-orange-400 mr-2" />
                      <span className="text-sm font-medium text-orange-800 dark:text-orange-300">
                        서류 현황: {docsStatus.submitted}/{docsStatus.total} ({docsStatus.completionRate}%)
                      </span>
                    </div>
                    {docsStatus.missing.length > 0 && (
                      <div className="text-sm text-orange-700 dark:text-orange-300">
                        <span className="font-medium">미제출 서류:</span>
                        <ul className="mt-1 ml-4">
                          {docsStatus.missing.map((doc, index) => (
                            <li key={index} className="list-disc">{doc.type}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
                
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  그래도 승인하시겠습니까? 승인 후 사용자에게 임시 비밀번호가 발급되며, 
                  나중에 추가 서류 제출을 요청할 수 있습니다.
                </p>
              </div>
              
              <div className="flex space-x-3">
                <Button
                  onClick={() => performApproval(showApprovalModal)}
                  disabled={loading === showApprovalModal}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {loading === showApprovalModal ? '승인 중...' : '승인 진행'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowApprovalModal(null)}
                  disabled={loading === showApprovalModal}
                >
                  취소
                </Button>
              </div>
            </div>
          </div>
        )
      })()}

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
    </div>
  )
}