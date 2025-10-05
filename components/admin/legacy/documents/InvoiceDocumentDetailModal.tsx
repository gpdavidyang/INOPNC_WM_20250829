'use client'

import { getSessionUserId } from '@/lib/supabase/session'
import { useConfirm } from '@/components/ui/use-confirm'
import { useToast } from '@/components/ui/use-toast'

interface InvoiceDocument {
  id: string
  title: string
  description?: string
  category_type: string
  document_type?: string // from metadata
  file_name: string
  file_url: string
  file_size: number
  mime_type: string
  status: string
  metadata?: {
    contract_phase?: 'pre_contract' | 'in_progress' | 'completed'
    amount?: number
    due_date?: string
    approval_status?: 'pending' | 'approved' | 'rejected' | 'revision_required'
    approved_by?: string
    approved_at?: string
    partner_company_id?: string
    document_type?: string
  }
  created_at: string
  updated_at: string
  uploaded_by: string
  site_id?: string
  profiles?: {
    id: string
    full_name: string
    email: string
  }
  sites?: {
    id: string
    name: string
    address: string
  }
  organizations?: {
    id: string
    name: string
    business_registration_number: string
  }
}

interface InvoiceDocumentDetailModalProps {
  document: InvoiceDocument | null
  isOpen: boolean
  onClose: () => void
  onUpdate: () => void
  userRole: string
}

// 기성청구 문서 유형
const documentTypes = [
  { value: 'contract', label: '계약서' },
  { value: 'work_order', label: '작업지시서' },
  { value: 'progress_report', label: '진행보고서' },
  { value: 'invoice', label: '청구서' },
  { value: 'completion_report', label: '완료보고서' },
  { value: 'payment_request', label: '대금청구서' },
  { value: 'tax_invoice', label: '세금계산서' },
  { value: 'other', label: '기타 서류' },
]

// 계약 단계
const contractPhases = [
  { value: 'pre_contract', label: '계약 전' },
  { value: 'in_progress', label: '진행 중' },
  { value: 'completed', label: '완료' },
]

export default function InvoiceDocumentDetailModal({
  document,
  isOpen,
  onClose,
  onUpdate,
  userRole,
}: InvoiceDocumentDetailModalProps) {
  const { confirm } = useConfirm()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editData, setEditData] = useState<unknown>({})

  const supabase = createClient()
  const isAdmin = userRole === 'admin' || userRole === 'system_admin'

  useEffect(() => {
    if (document && isOpen) {
      setEditData({
        title: document.title,
        description: document.description || '',
        amount: document.metadata?.amount?.toString() || '',
        due_date: document.metadata?.due_date || '',
      })
      setEditing(false)
    }
  }, [document, isOpen])

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getDocumentTypeLabel = (document: InvoiceDocument) => {
    const type = document.metadata?.document_type || document.document_type || ''
    const docType = documentTypes.find(t => t.value === type)
    return docType ? docType.label : type
  }

  const getPhaseLabel = (document: InvoiceDocument) => {
    const phase = document.metadata?.contract_phase || ''
    const phaseInfo = contractPhases.find(p => p.value === phase)
    return phaseInfo ? phaseInfo.label : phase
  }

  const getStatusBadge = (document: InvoiceDocument) => {
    const status = document.metadata?.approval_status || 'pending'
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            승인됨
          </span>
        )
      case 'rejected':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            거부됨
          </span>
        )
      case 'revision_required':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
            <RotateCcw className="w-3 h-3 mr-1" />
            수정요청
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            승인대기
          </span>
        )
    }
  }

  const getPhaseBadge = (document: InvoiceDocument) => {
    const phase = document.metadata?.contract_phase || ''
    switch (phase) {
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            완료
          </span>
        )
      case 'in_progress':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            진행중
          </span>
        )
      case 'pre_contract':
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            계약전
          </span>
        )
    }
  }

  const handleDownload = async () => {
    if (!document) return
    try {
      window.open(document.file_url, '_blank')
    } catch (error) {
      console.error('Error downloading document:', error)
      toast({ variant: 'destructive', title: '오류', description: '파일 다운로드에 실패했습니다.' })
    }
  }

  const handleEdit = () => {
    setEditing(true)
  }

  const handleCancelEdit = () => {
    setEditing(false)
    setEditData({
      title: document?.title || '',
      description: document?.description || '',
      amount: document?.metadata?.amount?.toString() || '',
      due_date: document?.metadata?.due_date || '',
    })
  }

  const handleSaveEdit = async () => {
    if (!document) return

    setLoading(true)
    try {
      // Get current metadata and update it
      const currentMetadata = document.metadata || {}
      const updatedMetadata = {
        ...currentMetadata,
        amount: editData.amount ? parseFloat(editData.amount) : null,
        due_date: editData.due_date || null,
      }

      const updateData = {
        title: editData.title.trim(),
        description: editData.description.trim(),
        metadata: updatedMetadata,
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase
        .from('unified_document_system')
        .update(updateData)
        .eq('id', document.id)

      if (error) throw error

      toast({ variant: 'success', title: '수정 완료', description: '서류 정보가 수정되었습니다.' })
      setEditing(false)
      onUpdate()
    } catch (error: unknown) {
      console.error('Error updating document:', error)
      toast({
        variant: 'destructive',
        title: '오류',
        description: '서류 정보 수정에 실패했습니다.',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async () => {
    if (!document || !isAdmin) return
    const ok = await confirm({
      title: '서류 승인',
      description: '이 서류를 승인하시겠습니까?',
      confirmText: '승인',
      cancelText: '취소',
    })
    if (!ok) return

    setLoading(true)
    try {
      // Update metadata with approval status
      const currentMetadata = document.metadata || {}
      const approverId = await getSessionUserId(supabase)
      const updatedMetadata = {
        ...currentMetadata,
        approval_status: 'approved',
        approved_by: approverId,
        approved_at: new Date().toISOString(),
      }

      const { error } = await supabase
        .from('unified_document_system')
        .update({
          metadata: updatedMetadata,
          updated_at: new Date().toISOString(),
        })
        .eq('id', document.id)

      if (error) throw error

      toast({ variant: 'success', title: '승인 완료' })
      onUpdate()
    } catch (error: unknown) {
      console.error('Error approving document:', error)
      toast({ variant: 'destructive', title: '오류', description: '서류 승인에 실패했습니다.' })
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    if (!document || !isAdmin) return

    const reason = prompt('거부 사유를 입력하세요:')
    if (!reason) return

    setLoading(true)
    try {
      // Update metadata with rejection status
      const currentMetadata = document.metadata || {}
      const approverId = await getSessionUserId(supabase)
      const updatedMetadata = {
        ...currentMetadata,
        approval_status: 'rejected',
        approved_by: approverId,
        approved_at: new Date().toISOString(),
        rejection_reason: reason,
      }

      const { error } = await supabase
        .from('unified_document_system')
        .update({
          metadata: updatedMetadata,
          updated_at: new Date().toISOString(),
        })
        .eq('id', document.id)

      if (error) throw error

      toast({ variant: 'success', title: '거부 완료' })
      onUpdate()
    } catch (error: unknown) {
      console.error('Error rejecting document:', error)
      toast({ variant: 'destructive', title: '오류', description: '서류 거부에 실패했습니다.' })
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !document) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        <div className="inline-block w-full max-w-4xl px-6 py-4 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          {/* 헤더 */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-200">
            <div className="flex items-center">
              <DollarSign className="w-6 h-6 mr-3 text-green-600" />
              <div>
                <h3 className="text-lg font-medium text-gray-900">기성청구 서류 상세</h3>
                <p className="text-sm text-gray-500">{getDocumentTypeLabel(document)}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 왼쪽 컬럼 - 기본 정보 */}
            <div className="lg:col-span-2 space-y-6">
              {/* 서류 기본 정보 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">서류 정보</h4>

                {editing ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">서류명</label>
                      <input
                        type="text"
                        value={editData.title}
                        onChange={e => setEditData(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">설명</label>
                      <textarea
                        value={editData.description}
                        onChange={e =>
                          setEditData(prev => ({ ...prev, description: e.target.value }))
                        }
                        rows={3}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">금액</label>
                        <input
                          type="number"
                          value={editData.amount}
                          onChange={e => setEditData(prev => ({ ...prev, amount: e.target.value }))}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          만료일
                        </label>
                        <input
                          type="date"
                          value={editData.due_date}
                          onChange={e =>
                            setEditData(prev => ({ ...prev, due_date: e.target.value }))
                          }
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div className="flex space-x-2 pt-2">
                      <button
                        onClick={handleSaveEdit}
                        disabled={loading}
                        className="flex items-center px-3 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded disabled:opacity-50"
                      >
                        <Save className="w-3 h-3 mr-1" />
                        저장
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        disabled={loading}
                        className="flex items-center px-3 py-1 text-xs font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{document.title}</p>
                        {document.description && (
                          <p className="text-xs text-gray-600 mt-1">{document.description}</p>
                        )}
                      </div>
                      {!isAdmin && document.metadata?.approval_status === 'pending' && (
                        <button
                          onClick={handleEdit}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                          title="수정"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
                      <div>
                        <span className="font-medium">금액:</span>{' '}
                        {document.metadata?.amount
                          ? `₩${document.metadata.amount.toLocaleString()}`
                          : '미지정'}
                      </div>
                      <div>
                        <span className="font-medium">만료일:</span>{' '}
                        {document.metadata?.due_date
                          ? new Date(document.metadata.due_date).toLocaleDateString('ko-KR')
                          : '미지정'}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 현장 및 파트너사 정보 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">현장 및 파트너사</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-gray-700 mb-1">현장</p>
                    <p className="text-sm text-gray-900">{document.sites?.name || '미지정'}</p>
                    {document.sites?.address && (
                      <p className="text-xs text-gray-500">{document.sites.address}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-700 mb-1">파트너사</p>
                    <p className="text-sm text-gray-900">
                      {document.organizations?.name || '미지정'}
                    </p>
                    {document.organizations?.business_registration_number && (
                      <p className="text-xs text-gray-500">
                        사업자번호: {document.organizations.business_registration_number}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* 파일 정보 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">파일 정보</h4>
                <div className="flex items-center space-x-3">
                  <FileText className="w-8 h-8 text-blue-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{document.file_name}</p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(document.file_size)} • {document.mime_type}
                    </p>
                  </div>
                  <button
                    onClick={handleDownload}
                    className="flex items-center px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 border border-blue-300 hover:border-blue-400 rounded"
                  >
                    <Download className="w-3 h-3 mr-1" />
                    다운로드
                  </button>
                </div>
              </div>
            </div>

            {/* 오른쪽 컬럼 - 상태 및 관리 */}
            <div className="space-y-6">
              {/* 승인 상태 */}
              <div className="bg-white border rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">승인 상태</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-center">{getStatusBadge(document)}</div>

                  {document.metadata?.approved_by && document.metadata?.approved_at && (
                    <div className="text-center text-xs text-gray-500">
                      <p>승인자: {document.profiles?.full_name || '알 수 없음'}</p>
                      <p>{new Date(document.metadata.approved_at).toLocaleString('ko-KR')}</p>
                    </div>
                  )}

                  {isAdmin && document.metadata?.approval_status === 'pending' && (
                    <div className="flex space-x-2 pt-2">
                      <button
                        onClick={handleApprove}
                        disabled={loading}
                        className="flex-1 flex items-center justify-center px-3 py-2 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded disabled:opacity-50"
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        승인
                      </button>
                      <button
                        onClick={handleReject}
                        disabled={loading}
                        className="flex-1 flex items-center justify-center px-3 py-2 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded disabled:opacity-50"
                      >
                        <XCircle className="w-3 h-3 mr-1" />
                        거부
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* 계약 단계 */}
              <div className="bg-white border rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">계약 단계</h4>
                <div className="flex justify-center">{getPhaseBadge(document)}</div>
              </div>

              {/* 등록 정보 */}
              <div className="bg-white border rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">등록 정보</h4>
                <div className="space-y-2 text-xs text-gray-600">
                  <div className="flex items-center">
                    <Users className="w-3 h-3 mr-2" />
                    <span>등록자: {document.profiles?.full_name || '알 수 없음'}</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-3 h-3 mr-2" />
                    <span>등록일: {new Date(document.created_at).toLocaleDateString('ko-KR')}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-3 h-3 mr-2" />
                    <span>수정일: {new Date(document.updated_at).toLocaleDateString('ko-KR')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 푸터 */}
          <div className="flex justify-end space-x-3 pt-6 mt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
