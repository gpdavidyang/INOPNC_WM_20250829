'use client'

import { useConfirm } from '@/components/ui/use-confirm'
import { useToast } from '@/components/ui/use-toast'

interface RequiredDocumentType {
  id: string
  code: string
  name_ko: string
  name_en?: string
  description?: string
  file_types: string[]
  max_file_size: number
  is_active: boolean
  sort_order: number
  role_mappings?: Array<{
    role_type: string
    is_required: boolean
  }>
  site_customizations?: Array<{
    site_id: string
    is_required: boolean
    due_days?: number
    notes?: string
    sites?: { name: string }
  }>
}

interface DocumentTypeFormData {
  code: string
  name_ko: string
  name_en: string
  description: string
  file_types: string[]
  max_file_size: number
  sort_order: number
}

const DEFAULT_FILE_TYPES = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx']

export default function RequiredDocumentTypesAdmin() {
  const [documentTypes, setDocumentTypes] = useState<RequiredDocumentType[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<DocumentTypeFormData>({
    code: '',
    name_ko: '',
    name_en: '',
    description: '',
    file_types: ['pdf', 'jpg', 'jpeg', 'png'],
    max_file_size: 10485760,
    sort_order: 0,
  })

  useEffect(() => {
    fetchDocumentTypes()
  }, [])

  const fetchDocumentTypes = async () => {
    try {
      const response = await fetch('/api/admin/required-document-types?include_inactive=true')
      if (response.ok) {
        const data = await response.json()
        setDocumentTypes(data.document_types || [])
      }
    } catch (error) {
      console.error('Error fetching document types:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = editingId
        ? `/api/admin/required-document-types/${editingId}`
        : '/api/admin/required-document-types'

      const method = editingId ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        await fetchDocumentTypes()
        setShowModal(false)
        resetForm()
      }
    } catch (error) {
      console.error('Error saving document type:', error)
    }
  }

  const handleEdit = (documentType: RequiredDocumentType) => {
    setEditingId(documentType.id)
    setFormData({
      code: documentType.code,
      name_ko: documentType.name_ko,
      name_en: documentType.name_en || '',
      description: documentType.description || '',
      file_types: documentType.file_types,
      max_file_size: documentType.max_file_size,
      sort_order: documentType.sort_order,
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: '유형 삭제',
      description: '정말로 삭제하시겠습니까?',
      variant: 'destructive',
      confirmText: '삭제',
      cancelText: '취소',
    })
    if (!ok) return

    try {
      const response = await fetch(`/api/admin/required-document-types/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchDocumentTypes()
        toast({ variant: 'success', title: '삭제 완료' })
      }
    } catch (error) {
      console.error('Error deleting document type:', error)
      toast({ variant: 'destructive', title: '오류', description: '삭제에 실패했습니다.' })
    }
  }

  const toggleActive = async (id: string, currentActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/required-document-types/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentActive }),
      })

      if (response.ok) {
        await fetchDocumentTypes()
      }
    } catch (error) {
      console.error('Error updating document type status:', error)
    }
  }

  const resetForm = () => {
    setEditingId(null)
    setFormData({
      code: '',
      name_ko: '',
      name_en: '',
      description: '',
      file_types: ['pdf', 'jpg', 'jpeg', 'png'],
      max_file_size: 10485760,
      sort_order: 0,
    })
  }

  const formatFileSize = (bytes: number) => {
    return `${(bytes / 1048576).toFixed(1)}MB`
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
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            필수서류 유형 관리
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            시스템에서 사용하는 필수서류 유형을 관리합니다
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />새 서류 유형 추가
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              서류 유형 목록 ({documentTypes.length}개)
            </h4>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              활성: {documentTypes.filter(dt => dt.is_active).length}개, 비활성:{' '}
              {documentTypes.filter(dt => !dt.is_active).length}개
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  서류 유형
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  파일 제한
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {documentTypes.map(docType => (
                <tr key={docType.id} className={!docType.is_active ? 'opacity-50' : ''}>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-blue-500 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {docType.name_ko}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {docType.code}
                        </div>
                        {docType.description && (
                          <div className="text-xs text-gray-400 mt-1 max-w-xs truncate">
                            {docType.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-gray-100">
                      {formatFileSize(docType.max_file_size)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {docType.file_types.join(', ')}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => toggleActive(docType.id, docType.is_active)}
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        docType.is_active
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                      }`}
                    >
                      {docType.is_active ? (
                        <>
                          <Eye className="h-3 w-3 mr-1" />
                          활성
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-3 w-3 mr-1" />
                          비활성
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEdit(docType)}
                        className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 hover:text-blue-800 rounded-md transition-colors"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDelete(docType.id)}
                        className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-700 hover:text-red-800 rounded-md transition-colors"
                      >
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                {editingId ? '서류 유형 수정' : '새 서류 유형 추가'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false)
                  resetForm()
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    코드 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={e => setFormData(prev => ({ ...prev, code: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                    placeholder="safety_certificate"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    한국어 이름 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name_ko}
                    onChange={e => setFormData(prev => ({ ...prev, name_ko: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                    placeholder="안전교육이수증"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  영어 이름
                </label>
                <input
                  type="text"
                  value={formData.name_en}
                  onChange={e => setFormData(prev => ({ ...prev, name_en: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  placeholder="Safety Training Certificate"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  설명
                </label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  placeholder="서류에 대한 설명을 입력하세요"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    허용 파일 형식
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {DEFAULT_FILE_TYPES.map(type => (
                      <label key={type} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.file_types.includes(type)}
                          onChange={e => {
                            if (e.target.checked) {
                              setFormData(prev => ({
                                ...prev,
                                file_types: [...prev.file_types, type],
                              }))
                            } else {
                              setFormData(prev => ({
                                ...prev,
                                file_types: prev.file_types.filter(t => t !== type),
                              }))
                            }
                          }}
                          className="mr-1"
                        />
                        <span className="text-sm">{type.toUpperCase()}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    최대 파일 크기 (MB)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={formData.max_file_size / 1048576}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        max_file_size: parseInt(e.target.value) * 1048576,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  정렬 순서
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.sort_order}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    resetForm()
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  {editingId ? '수정' : '추가'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
const { confirm } = useConfirm()
const { toast } = useToast()
