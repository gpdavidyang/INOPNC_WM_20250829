'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Download, Edit2, Trash2, GitBranch, PenTool, FileText, User, MapPin, Calendar, Eye } from 'lucide-react'

interface MarkupDocument {
  id: string
  title: string
  description?: string
  file_url: string
  file_name: string
  file_size?: number
  mime_type?: string
  category_type: string
  status: string
  created_at: string
  updated_at: string
  uploaded_by: string
  site_id?: string
  metadata?: {
    original_filename?: string
    markup_data?: any[]
    preview_image_url?: string
    location?: 'personal' | 'shared'
    markup_count?: number
    version_number?: number
    is_latest_version?: boolean
    change_summary?: string
    original_blueprint_url?: string
    original_blueprint_filename?: string
  }
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
}

interface Site {
  id: string
  name: string
  address: string
}

export default function MarkupDocumentDetail() {
  const params = useParams()
  const router = useRouter()
  const [document, setDocument] = useState<MarkupDocument | null>(null)
  const [sites, setSites] = useState<Site[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editFormData, setEditFormData] = useState<Partial<MarkupDocument>>({})
  const [isSaving, setIsSaving] = useState(false)

  const supabase = createClient()

  const fetchDocument = async () => {
    if (!params.id) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('unified_document_system')
        .select(`
          *,
          profiles!unified_document_system_uploaded_by_fkey(id, full_name, email),
          sites(id, name, address)
        `)
        .eq('id', params.id)
        .eq('category_type', 'markup')
        .eq('status', 'active')
        .single()

      if (error) throw error
      setDocument(data)
    } catch (error) {
      console.error('Error fetching document:', error)
      router.push('/dashboard/admin/documents')
    } finally {
      setLoading(false)
    }
  }

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

  const handleDeleteDocument = async () => {
    if (!document || !confirm('정말로 이 도면마킹 문서를 삭제하시겠습니까?')) return

    try {
      const { error } = await supabase
        .from('unified_document_system')
        .update({ status: 'deleted' })
        .eq('id', document.id)

      if (error) throw error

      alert('도면마킹 문서가 성공적으로 삭제되었습니다.')
      router.push('/dashboard/admin/documents')
    } catch (error) {
      console.error('Error deleting document:', error)
      alert('도면마킹 문서 삭제에 실패했습니다.')
    }
  }

  const handleDownloadDocument = () => {
    if (document) {
      window.open(document.file_url, '_blank')
    }
  }

  const handleOpenMarkupEditor = () => {
    if (document) {
      window.location.href = `/dashboard/markup-tool?document=${document.id}`
    }
  }

  const startEditMode = () => {
    if (document) {
      setEditFormData({
        title: document.title,
        description: document.description || '',
        site_id: document.site_id
      })
      setIsEditMode(true)
    }
  }

  const cancelEditMode = () => {
    setIsEditMode(false)
    setEditFormData({})
  }

  const saveDocumentChanges = async () => {
    if (!document || !editFormData) return

    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('unified_document_system')
        .update({
          title: editFormData.title,
          description: editFormData.description,
          site_id: editFormData.site_id || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', document.id)

      if (error) throw error

      // 문서 다시 불러오기
      await fetchDocument()
      
      setIsEditMode(false)
      setEditFormData({})
      alert('도면마킹 문서가 성공적으로 수정되었습니다.')
    } catch (error) {
      console.error('Error updating document:', error)
      alert('도면마킹 문서 수정에 실패했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  useEffect(() => {
    fetchDocument()
    fetchSites()
  }, [params.id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!document) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-500 mb-4">문서를 찾을 수 없습니다.</p>
          <button
            onClick={() => router.push('/dashboard/admin/documents')}
            className="text-blue-600 hover:text-blue-800"
          >
            문서 목록으로 돌아가기
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard/admin/documents')}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {isEditMode ? (
                    <input
                      type="text"
                      value={editFormData.title || ''}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="text-2xl font-bold text-gray-900 bg-white border-b-2 border-blue-500 focus:outline-none"
                    />
                  ) : (
                    document.title
                  )}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  {document.metadata?.original_filename || document.file_name}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {isEditMode ? (
                <>
                  <button
                    onClick={cancelEditMode}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                  >
                    취소
                  </button>
                  <button
                    onClick={saveDocumentChanges}
                    disabled={isSaving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isSaving ? '저장 중...' : '저장'}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={startEditMode}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                    title="수정"
                  >
                    <Edit2 className="h-5 w-5" />
                  </button>
                  <button
                    onClick={handleOpenMarkupEditor}
                    className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg"
                    title="도면마킹 편집"
                  >
                    <PenTool className="h-5 w-5" />
                  </button>
                  <button
                    onClick={handleDownloadDocument}
                    className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
                    title="다운로드"
                  >
                    <Download className="h-5 w-5" />
                  </button>
                  <button
                    onClick={handleDeleteDocument}
                    className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
                    title="삭제"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Image Preview */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Eye className="h-5 w-5 mr-2 text-gray-600" />
                도면 미리보기
              </h2>
              <div className="bg-gray-100 rounded-lg overflow-hidden">
                {document.metadata?.preview_image_url || document.file_url ? (
                  <img
                    src={document.metadata?.preview_image_url || document.file_url}
                    alt={document.title}
                    className="w-full h-auto"
                  />
                ) : (
                  <div className="flex items-center justify-center h-96 text-gray-400">
                    <div className="text-center">
                      <FileText className="h-16 w-16 mx-auto mb-4" />
                      <p>미리보기를 사용할 수 없습니다</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Markup Information */}
              {document.metadata?.markup_count && document.metadata.markup_count > 0 && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-900">
                    마킹 정보: {document.metadata.markup_count}개의 마킹이 포함되어 있습니다
                  </p>
                  <button
                    onClick={handleOpenMarkupEditor}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-800 flex items-center"
                  >
                    <PenTool className="h-4 w-4 mr-1" />
                    도면마킹 편집기에서 열기
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Document Information */}
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2 text-gray-600" />
                문서 정보
              </h2>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">설명</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {isEditMode ? (
                      <textarea
                        value={editFormData.description || ''}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full p-2 border border-gray-300 rounded-md resize-none"
                        rows={3}
                        placeholder="문서 설명을 입력하세요"
                      />
                    ) : (
                      document.description || '설명 없음'
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">버전</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    v{document.metadata?.version_number || 1}
                    {document.metadata?.is_latest_version !== false && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        최신
                      </span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">위치</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {document.metadata?.location === 'shared' ? '공유 문서' : '개인 문서'}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Site Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-gray-600" />
                현장 정보
              </h2>
              {isEditMode ? (
                <select
                  value={editFormData.site_id || ''}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, site_id: e.target.value || null }))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">현장 선택 안함</option>
                  {sites.map((site) => (
                    <option key={site.id} value={site.id}>
                      {site.name}
                    </option>
                  ))}
                </select>
              ) : document.sites ? (
                <div>
                  <p className="text-sm font-medium text-gray-900">{document.sites.name}</p>
                  <p className="text-sm text-gray-500 mt-1">{document.sites.address}</p>
                </div>
              ) : (
                <p className="text-sm text-gray-500">현장 미지정</p>
              )}
            </div>

            {/* Author Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <User className="h-5 w-5 mr-2 text-gray-600" />
                작성자 정보
              </h2>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">이름</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {document.profiles?.full_name || '알 수 없음'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">이메일</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {document.profiles?.email || '-'}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Date Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-gray-600" />
                날짜 정보
              </h2>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">생성일</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(document.created_at).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">수정일</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(document.updated_at).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}