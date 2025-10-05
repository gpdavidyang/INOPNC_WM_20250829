'use client'

import { useConfirm } from '@/components/ui/use-confirm'
import { useToast } from '@/components/ui/use-toast'

interface MarkupDocumentVersion {
  id: string
  version_number: number
  title: string
  description?: string
  markup_count: number
  change_summary?: string
  created_at: string
  updated_at: string
  created_by: string
  is_latest_version: boolean
  profiles?: {
    id: string
    full_name: string
    email: string
  }
}

interface MarkupDocumentHistory {
  id: string
  document_id: string
  version_number: number
  title: string
  description?: string
  markup_count: number
  change_type: 'created' | 'updated' | 'restored' | 'deleted'
  change_summary?: string
  changed_by: string
  changed_at: string
  profiles?: {
    id: string
    full_name: string
    email: string
  }
}

interface MarkupDocumentVersionModalProps {
  documentId: string
  isOpen: boolean
  onClose: () => void
  onVersionRestore?: (versionId: string) => void
}

export default function MarkupDocumentVersionModal({
  documentId,
  isOpen,
  onClose,
  onVersionRestore,
}: MarkupDocumentVersionModalProps) {
  const { confirm } = useConfirm()
  const { toast } = useToast()
  const [versions, setVersions] = useState<MarkupDocumentVersion[]>([])
  const [history, setHistory] = useState<MarkupDocumentHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'versions' | 'history'>('versions')

  const supabase = createClient()

  const fetchVersions = async () => {
    try {
      setLoading(true)

      // 현재 문서와 연결된 모든 버전 조회
      const { data, error } = await supabase
        .from('markup_documents')
        .select(
          `
          *,
          profiles!markup_documents_created_by_fkey(id, full_name, email)
        `
        )
        .or(`id.eq.${documentId},parent_document_id.eq.${documentId}`)
        .eq('is_deleted', false)
        .order('version_number', { ascending: false })

      if (error) throw error
      setVersions(data || [])
    } catch (error) {
      console.error('Error fetching document versions:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('markup_document_history')
        .select(
          `
          *,
          profiles!markup_document_history_changed_by_fkey(id, full_name, email)
        `
        )
        .eq('document_id', documentId)
        .order('changed_at', { ascending: false })

      if (error) throw error
      setHistory(data || [])
    } catch (error) {
      console.error('Error fetching document history:', error)
    }
  }

  const handleRestoreVersion = async (historyId: string) => {
    const ok = await confirm({
      title: '버전 복원',
      description: '이 버전으로 복원하시겠습니까? 새로운 버전이 생성됩니다.',
      confirmText: '복원',
      cancelText: '취소',
    })
    if (!ok) return

    try {
      const { data, error } = await supabase.rpc('restore_markup_document_version', {
        history_id: historyId,
      })

      if (error) throw error

      toast({ variant: 'success', title: '복원 완료' })
      await fetchVersions()
      await fetchHistory()
      onVersionRestore?.(data)
    } catch (error) {
      console.error('Error restoring version:', error)
      toast({ variant: 'destructive', title: '오류', description: '버전 복원에 실패했습니다.' })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getChangeTypeColor = (changeType: string) => {
    switch (changeType) {
      case 'created':
        return 'bg-green-100 text-green-800'
      case 'updated':
        return 'bg-blue-100 text-blue-800'
      case 'restored':
        return 'bg-orange-100 text-orange-800'
      case 'deleted':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getChangeTypeText = (changeType: string) => {
    switch (changeType) {
      case 'created':
        return '생성'
      case 'updated':
        return '수정'
      case 'restored':
        return '복원'
      case 'deleted':
        return '삭제'
      default:
        return changeType
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchVersions()
      fetchHistory()
    }
  }, [isOpen, documentId])

  if (!isOpen) return null

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
            <h3 className="text-lg font-medium text-gray-900">도면 버전 관리 및 이력</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* 탭 네비게이션 */}
          <div className="flex space-x-8 mt-4 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('versions')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'versions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <GitBranch className="inline-block w-4 h-4 mr-2" />
              버전 목록
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'history'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Clock className="inline-block w-4 h-4 mr-2" />
              변경 이력
            </button>
          </div>

          {/* 컨텐츠 영역 */}
          <div className="mt-6">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">로딩 중...</span>
              </div>
            ) : (
              <>
                {activeTab === 'versions' && (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {versions.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">버전 정보가 없습니다.</p>
                    ) : (
                      versions.map(version => (
                        <div
                          key={version.id}
                          className={`p-4 rounded-lg border ${
                            version.is_latest_version
                              ? 'border-blue-200 bg-blue-50'
                              : 'border-gray-200 bg-gray-50'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium text-gray-900">
                                  v{version.version_number}
                                </span>
                                {version.is_latest_version && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    최신
                                  </span>
                                )}
                              </div>

                              <h4 className="text-base font-medium text-gray-900 mt-1">
                                {version.title}
                              </h4>

                              {version.description && (
                                <p className="text-sm text-gray-600 mt-1">{version.description}</p>
                              )}

                              {version.change_summary && (
                                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                                  <strong>변경 내용:</strong> {version.change_summary}
                                </div>
                              )}

                              <div className="flex items-center space-x-4 mt-3 text-xs text-gray-500">
                                <div className="flex items-center">
                                  <User className="w-3 h-3 mr-1" />
                                  {version.profiles?.full_name || '알 수 없음'}
                                </div>
                                <div className="flex items-center">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {formatDate(version.created_at)}
                                </div>
                                <div className="flex items-center">
                                  <FileText className="w-3 h-3 mr-1" />
                                  {version.markup_count}개 마킹
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2 ml-4">
                              <button
                                onClick={() =>
                                  window.open(`/markup-editor?document=${version.id}`, '_blank')
                                }
                                className="text-blue-600 hover:text-blue-900 p-1 rounded"
                                title="미리보기"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {!version.is_latest_version && (
                                <button
                                  onClick={() => handleRestoreVersion(version.id)}
                                  className="text-orange-600 hover:text-orange-900 p-1 rounded"
                                  title="이 버전으로 복원"
                                >
                                  <RotateCcw className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'history' && (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {history.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">변경 이력이 없습니다.</p>
                    ) : (
                      history.map(record => (
                        <div
                          key={record.id}
                          className="flex items-start space-x-4 p-3 border border-gray-200 rounded-lg"
                        >
                          <div className="flex-shrink-0 mt-1">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getChangeTypeColor(record.change_type)}`}
                            >
                              {getChangeTypeText(record.change_type)}
                            </span>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-gray-900">
                                v{record.version_number} - {record.title}
                              </span>
                            </div>

                            {record.change_summary && (
                              <p className="text-sm text-gray-600 mt-1">{record.change_summary}</p>
                            )}

                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                              <div className="flex items-center">
                                <User className="w-3 h-3 mr-1" />
                                {record.profiles?.full_name || '알 수 없음'}
                              </div>
                              <div className="flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {formatDate(record.changed_at)}
                              </div>
                              <div className="flex items-center">
                                <FileText className="w-3 h-3 mr-1" />
                                {record.markup_count}개 마킹
                              </div>
                            </div>
                          </div>

                          <div className="flex-shrink-0">
                            <button
                              onClick={() => handleRestoreVersion(record.id)}
                              className="text-orange-600 hover:text-orange-900 p-1 rounded"
                              title="이 버전으로 복원"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* 푸터 */}
          <div className="flex justify-end space-x-3 pt-4 mt-6 border-t border-gray-200">
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
