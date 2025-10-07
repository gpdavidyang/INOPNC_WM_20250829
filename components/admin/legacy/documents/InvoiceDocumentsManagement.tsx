'use client'

import { t } from '@/lib/ui/strings'
import { useToast } from '@/components/ui/use-toast'
import { useConfirm } from '@/components/ui/use-confirm'

import InvoiceDocumentUploadModal from './InvoiceDocumentUploadModal'
import InvoiceDocumentDetailModal from './InvoiceDocumentDetailModal'
import { getSessionUser } from '@/lib/supabase/session'

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

interface Site {
  id: string
  name: string
  address: string
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

export default function InvoiceDocumentsManagement() {
  const [documents, setDocuments] = useState<InvoiceDocument[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSite, setSelectedSite] = useState<string>('')
  const [phaseFilter, setPhaseFilter] = useState<string>('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const itemsPerPage = 20

  // Modal states
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<InvoiceDocument | null>(null)
  const [userRole, setUserRole] = useState<string>('')

  const supabase = createClient()
  const { toast } = useToast()
  const { confirm } = useConfirm()

  const fetchSites = async () => {
    try {
      const { data, error } = await supabase
        .from('sites')
        .select('id, name, address')
        .eq('status', 'active')
        .order('name')

      if (error) throw error
      setSites(data || [])
    } catch (error) {
      console.error('Error fetching sites:', error)
    }
  }

  const fetchDocuments = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('unified_document_system')
        .select(
          `
          *,
          profiles!unified_document_system_uploaded_by_fkey(id, full_name, email),
          sites(id, name, address)
        `,
          { count: 'exact' }
        )
        .eq('category_type', 'invoice')
        .eq('status', 'active')

      // 검색 필터 적용
      if (searchTerm) {
        query = query.or(
          `title.ilike.%${searchTerm}%,file_name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`
        )
      }

      // 현장 필터 적용
      if (selectedSite) {
        query = query.eq('site_id', selectedSite)
      }

      // 계약 단계 필터 적용
      if (phaseFilter) {
        query = query.contains('metadata', { contract_phase: phaseFilter })
      }

      // 문서 유형 필터 적용
      if (typeFilter) {
        query = query.contains('metadata', { document_type: typeFilter })
      }

      const from = (currentPage - 1) * itemsPerPage
      const to = from + itemsPerPage - 1

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to)

      if (error) throw error

      // Process documents to extract metadata and fetch partner companies
      const processedDocs = await Promise.all(
        (data || []).map(async doc => {
          let organizations = null
          if (doc.metadata?.partner_company_id) {
            const { data: orgData } = await supabase
              .from('organizations')
              .select('id, name, business_registration_number')
              .eq('id', doc.metadata.partner_company_id)
              .single()
            organizations = orgData
          }
          return {
            ...doc,
            document_type: doc.metadata?.document_type || doc.document_type,
            organizations,
          }
        })
      )
      setDocuments(processedDocs)
      setTotalCount(count || 0)
    } catch (error) {
      console.error('Error fetching invoice documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteDocument = async (documentId: string) => {
    const ok = await confirm({
      title: '기성청구 서류 삭제',
      description: '정말로 이 기성청구 서류를 삭제하시겠습니까?',
      variant: 'destructive',
      confirmText: '삭제',
      cancelText: '취소',
    })
    if (!ok) return

    try {
      const { error } = await supabase
        .from('unified_document_system')
        .update({ status: 'deleted' })
        .eq('id', documentId)

      if (error) throw error

      await fetchDocuments()
      toast({
        variant: 'success',
        title: '삭제 완료',
        description: '기성청구 서류가 삭제되었습니다.',
      })
    } catch (error) {
      console.error('Error deleting document:', error)
      toast({ variant: 'destructive', title: '오류', description: '서류 삭제에 실패했습니다.' })
    }
  }

  const handleDownloadDocument = async (document: InvoiceDocument) => {
    try {
      // 실제 구현에서는 Supabase Storage URL을 사용
      window.open(document.file_url, '_blank')
    } catch (error) {
      console.error('Error downloading document:', error)
      toast({ variant: 'destructive', title: '오류', description: '서류 다운로드에 실패했습니다.' })
    }
  }

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

  // Fetch user role
  const fetchUserRole = async () => {
    try {
      const currentUser = await getSessionUser(supabase)
      if (currentUser) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', currentUser.id)
          .single()

        if (profile) {
          setUserRole(profile.role)
        }
      }
    } catch (error) {
      console.error('Error fetching user role:', error)
    }
  }

  const handleShowDetail = (document: InvoiceDocument) => {
    setSelectedDocument(document)
    setShowDetailModal(true)
  }

  const handleCloseDetail = () => {
    setShowDetailModal(false)
    setSelectedDocument(null)
  }

  const handleUploadSuccess = () => {
    setShowUploadModal(false)
    fetchDocuments()
  }

  const handleUpdateSuccess = () => {
    fetchDocuments()
  }

  useEffect(() => {
    fetchSites()
    fetchUserRole()
  }, [])

  useEffect(() => {
    fetchDocuments()
  }, [currentPage, searchTerm, selectedSite, phaseFilter, typeFilter])

  const totalPages = Math.ceil(totalCount / itemsPerPage)

  return (
    <div className="space-y-6">
      {/* 검색 및 필터 섹션 */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder={t('common.search')}
              className="pl-10 pr-4 py-2 w-full bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white"
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
            />
          </div>

          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select
              className="pl-10 pr-4 py-2 w-full bg-white border border-gray-300 rounded-md text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white appearance-none"
              value={selectedSite}
              onChange={e => {
                setSelectedSite(e.target.value)
                setCurrentPage(1)
              }}
            >
              <option value="">모든 현장</option>
              {sites.map(site => (
                <option key={site.id} value={site.id}>
                  {site.name}
                </option>
              ))}
            </select>
          </div>

          <select
            className="px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white appearance-none"
            value={phaseFilter}
            onChange={e => {
              setPhaseFilter(e.target.value)
              setCurrentPage(1)
            }}
          >
            <option value="">모든 단계</option>
            {contractPhases.map(phase => (
              <option key={phase.value} value={phase.value}>
                {phase.label}
              </option>
            ))}
          </select>

          <select
            className="px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white appearance-none"
            value={typeFilter}
            onChange={e => {
              setTypeFilter(e.target.value)
              setCurrentPage(1)
            }}
          >
            <option value="">모든 문서 유형</option>
            {documentTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>

          <button
            onClick={fetchDocuments}
            className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            {t('common.refresh')}
          </button>

          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            <Upload className="w-4 h-4 mr-2" />
            서류 등록
          </button>
        </div>
      </div>

      {/* 통계 정보 */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            전체 <span className="font-medium text-gray-900">{totalCount.toLocaleString()}</span>
            개의 기성청구 서류
            {selectedSite && (
              <span className="ml-2">(현장: {sites.find(s => s.id === selectedSite)?.name})</span>
            )}
          </div>
          <div className="text-sm text-gray-600">
            {currentPage} / {totalPages} 페이지
          </div>
        </div>
      </div>

      {/* 서류 목록 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">기성청구 서류를 불러오는 중...</span>
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <DollarSign className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>기성청구 서류가 없습니다.</p>
            {selectedSite && (
              <p className="text-sm mt-2">선택한 현장에 기성청구 서류가 없습니다.</p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    서류 정보
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    현장 / 업체
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    문서 유형
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    계약 단계
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    금액
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    등록일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    관리
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {documents.map(document => (
                  <tr key={document.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-start">
                        <DollarSign className="w-5 h-5 text-green-500 mr-3 mt-1" />
                        <div>
                          <button
                            onClick={() => handleShowDetail(document)}
                            className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline text-left"
                          >
                            {document.title}
                          </button>
                          <div className="text-sm text-gray-500 mt-1">{document.file_name}</div>
                          <div className="text-xs text-gray-400">
                            {formatFileSize(document.file_size)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {document.sites?.name || '미지정'}
                      </div>
                      {document.organizations && (
                        <div className="text-sm text-gray-500 mt-1">
                          {document.organizations.name}
                        </div>
                      )}
                      {document.sites?.address && (
                        <div className="text-xs text-gray-400">{document.sites.address}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {getDocumentTypeLabel(document)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getPhaseBadge(document)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {document.metadata?.amount
                        ? `₩${document.metadata.amount.toLocaleString()}`
                        : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(document.created_at).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleDownloadDocument(document)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded"
                          title="다운로드"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleShowDetail(document)}
                          className="text-green-600 hover:text-green-900 p-1 rounded"
                          title="상세보기"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteDocument(document.id)}
                          className="text-red-600 hover:text-red-900 p-1 rounded"
                          title="삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white px-6 py-3 rounded-lg shadow">
          <div className="text-sm text-gray-700">
            {(currentPage - 1) * itemsPerPage + 1} -{' '}
            {Math.min(currentPage * itemsPerPage, totalCount)} / {totalCount} 항목
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              {t('common.prev')}
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-1 border rounded text-sm ${
                    currentPage === pageNum
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              )
            })}

            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              {t('common.next')}
            </button>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      <InvoiceDocumentUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSuccess={handleUploadSuccess}
        sites={sites}
      />

      {/* Detail Modal */}
      <InvoiceDocumentDetailModal
        document={selectedDocument}
        isOpen={showDetailModal}
        onClose={handleCloseDetail}
        onUpdate={handleUpdateSuccess}
        userRole={userRole}
      />
    </div>
  )
}
