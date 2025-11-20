'use client'

import { fetchSignedUrlForRecord, openFileRecordInNewTab } from '@/lib/files/preview'
import {
  REQUIRED_DOC_STATUS_LABELS,
  type RequiredDocStatus,
  normalizeRequiredDocStatus,
} from '@/lib/documents/status'

interface UserDocumentsTabProps {
  userId: string
  userName: string
}

interface RequiredDocument {
  id: string
  document_name: string
  status: RequiredDocStatus
  file_url?: string
  storage_bucket?: string | null
  storage_path?: string | null
  file_name?: string
  submitted_at?: string
  reviewed_at?: string
  rejection_reason?: string
  is_required: boolean
}

export default function UserDocumentsTab({ userId, userName }: UserDocumentsTabProps) {
  const [documents, setDocuments] = useState<RequiredDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | RequiredDocStatus>('all')
  const [viewingDoc, setViewingDoc] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchRequiredDocuments()
  }, [userId])

  const fetchRequiredDocuments = async () => {
    try {
      setLoading(true)

      // user_documents 테이블에서 해당 사용자의 서류 조회
      const { data: userDocsData, error: userDocsError } = await supabase
        .from('user_documents')
        .select(
          `
          id,
          document_type,
          original_filename,
          file_path,
          storage_bucket,
          storage_path,
          file_size,
          mime_type,
          upload_date,
          created_at,
          updated_at
        `
        )
        .eq('user_id', userId)
        .order('upload_date', { ascending: false })

      if (userDocsError) {
        console.error('Error fetching user documents:', userDocsError)
        setDocuments([])
        return
      }

      // 필수 서류 타입 정의
      const requiredDocTypes = [
        '건강진단서',
        '신분증사본',
        '기본안전보건교육수료증',
        '안전교육이수증',
        '자격증사본',
        '경력증명서',
      ]

      // 제출된 서류들을 필수/선택으로 분류하고 상태 설정
      const submittedDocs =
        userDocsData?.map(doc => ({
          id: doc.id,
          document_name: doc.document_type,
          status: 'approved' as const, // 제출된 서류는 승인 상태로 표시
          file_url: doc.file_path,
          storage_bucket: doc.storage_bucket || null,
          storage_path: doc.storage_path || null,
          file_name: doc.original_filename,
          submitted_at: doc.upload_date,
          reviewed_at: doc.upload_date, // 임시로 업로드 날짜를 검토일로 설정
          is_required: requiredDocTypes.includes(doc.document_type),
        })) || []

      // 미제출 필수 서류들을 찾아서 추가
      const submittedDocTypes = new Set(submittedDocs.map(doc => doc.document_name))
      const missingRequiredDocs = requiredDocTypes
        .filter(docType => !submittedDocTypes.has(docType))
        .map((docType, index) => ({
          id: `missing-${index}`,
          document_name: docType,
          status: 'not_submitted' as const,
          is_required: true,
        }))

      // 전체 서류 목록 = 제출된 서류 + 미제출 필수 서류
      const allDocuments = [...submittedDocs, ...missingRequiredDocs]

      setDocuments(allDocuments)
    } catch (error) {
      console.error('Error fetching required documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: RequiredDocStatus) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-600" />
      case 'pending':
        return <Clock className="h-5 w-5 text-blue-600" />
      default:
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />
    }
  }

  const getStatusBadge = (status: RequiredDocStatus) => {
    const statusConfig: Record<RequiredDocStatus, { text: string; color: string }> = {
      not_submitted: {
        text: REQUIRED_DOC_STATUS_LABELS.not_submitted,
        color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300',
      },
      pending: {
        text: REQUIRED_DOC_STATUS_LABELS.pending,
        color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
      },
      approved: {
        text: REQUIRED_DOC_STATUS_LABELS.approved,
        color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
      },
      rejected: {
        text: REQUIRED_DOC_STATUS_LABELS.rejected,
        color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
      },
    }

    const config = statusConfig[status]
    return (
      <span
        className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${config.color}`}
      >
        {config.text}
      </span>
    )
  }

  const buildFileRecord = (doc: RequiredDocument) => ({
    file_url: doc.file_url,
    storage_bucket: doc.storage_bucket || undefined,
    storage_path: doc.storage_path || undefined,
    file_name: doc.file_name || doc.document_name,
    title: doc.document_name,
  })

  const handleViewDocument = async (doc: RequiredDocument) => {
    if (!doc.file_url && !doc.storage_path) return
    try {
      await openFileRecordInNewTab(buildFileRecord(doc))
    } catch (error) {
      console.error('문서를 열 수 없습니다.', error)
      if (doc.file_url) window.open(doc.file_url, '_blank', 'noopener,noreferrer')
      else alert('문서를 열 수 없습니다.')
    }
  }

  const handleDownloadDocument = async (doc: RequiredDocument) => {
    if (!doc.file_url && !doc.storage_path) return
    try {
      const signedUrl = await fetchSignedUrlForRecord(buildFileRecord(doc), {
        downloadName: doc.file_name || doc.document_name,
      })
      const anchor = window.document.createElement('a')
      anchor.href = signedUrl
      anchor.target = '_blank'
      anchor.download = doc.file_name || `${doc.document_name}.pdf`
      window.document.body.appendChild(anchor)
      anchor.click()
      window.document.body.removeChild(anchor)
    } catch (error) {
      console.error('문서를 다운로드할 수 없습니다.', error)
      if (doc.file_url) window.open(doc.file_url, '_blank', 'noopener,noreferrer')
      else alert('문서를 다운로드할 수 없습니다.')
    }
  }

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.document_name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const requiredDocs = filteredDocuments.filter(doc => doc.is_required)
  const optionalDocs = filteredDocuments.filter(doc => !doc.is_required)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">전체 서류</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {documents.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">승인</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {documents.filter(d => d.status === 'approved').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">검토중</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {documents.filter(d => d.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">미제출/반려</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {
                  documents.filter(d => d.status === 'not_submitted' || d.status === 'rejected')
                    .length
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="relative">
            <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="서류명 검색..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full sm:w-80 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as unknown)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
            >
              <option value="all">전체 상태</option>
              <option value="not_submitted">미제출</option>
              <option value="pending">검토중</option>
              <option value="approved">승인</option>
              <option value="rejected">반려</option>
            </select>
          </div>
        </div>
      </div>

      {/* Required Documents */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
            필수 제출 서류 ({requiredDocs.length}건)
          </h3>
        </div>

        {requiredDocs.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-sm text-gray-500 dark:text-gray-400">필수 제출 서류가 없습니다.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    서류명
                  </th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    파일명
                  </th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    제출일
                  </th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    검토일
                  </th>
                  <th className="text-right py-3 px-6 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    액션
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {requiredDocs.map(doc => (
                  <tr key={doc.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="py-4 px-6">
                      <div className="flex items-center">
                        {getStatusIcon(doc.status)}
                        <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                          {doc.document_name}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {doc.file_name || '-'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      {getStatusBadge(doc.status)}
                      {doc.status === 'rejected' && doc.rejection_reason && (
                        <div className="mt-1 text-xs text-red-600 dark:text-red-400">
                          {doc.rejection_reason}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {doc.submitted_at
                          ? format(new Date(doc.submitted_at), 'yyyy.MM.dd HH:mm', { locale: ko })
                          : '-'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {doc.reviewed_at
                          ? format(new Date(doc.reviewed_at), 'yyyy.MM.dd HH:mm', { locale: ko })
                          : '-'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {(doc.file_url || doc.storage_path) && (
                          <>
                            <button
                              onClick={() => handleViewDocument(doc)}
                              className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-gray-700 bg-gray-100 hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              보기
                            </button>
                            <button
                              onClick={() => handleDownloadDocument(doc)}
                              className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 dark:text-blue-300 dark:bg-blue-900/20 dark:hover:bg-blue-900/30"
                            >
                              <Download className="h-3 w-3 mr-1" />
                              다운로드
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Optional Documents */}
      {optionalDocs.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center">
              <FileText className="h-5 w-5 text-blue-500 mr-2" />
              선택 제출 서류 ({optionalDocs.length}건)
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    서류명
                  </th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    파일명
                  </th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    제출일
                  </th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    검토일
                  </th>
                  <th className="text-right py-3 px-6 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    액션
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {optionalDocs.map(doc => (
                  <tr key={doc.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="py-4 px-6">
                      <div className="flex items-center">
                        {getStatusIcon(doc.status)}
                        <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                          {doc.document_name}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {doc.file_name || '-'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      {getStatusBadge(doc.status)}
                      {doc.status === 'rejected' && doc.rejection_reason && (
                        <div className="mt-1 text-xs text-red-600 dark:text-red-400">
                          {doc.rejection_reason}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {doc.submitted_at
                          ? format(new Date(doc.submitted_at), 'yyyy.MM.dd HH:mm', { locale: ko })
                          : '-'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {doc.reviewed_at
                          ? format(new Date(doc.reviewed_at), 'yyyy.MM.dd HH:mm', { locale: ko })
                          : '-'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {(doc.file_url || doc.storage_path) && (
                          <>
                            <button
                              onClick={() => handleViewDocument(doc)}
                              className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-gray-700 bg-gray-100 hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              보기
                            </button>
                            <button
                              onClick={() => handleDownloadDocument(doc)}
                              className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 dark:text-blue-300 dark:bg-blue-900/20 dark:hover:bg-blue-900/30"
                            >
                              <Download className="h-3 w-3 mr-1" />
                              다운로드
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
