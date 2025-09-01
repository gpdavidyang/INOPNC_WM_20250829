'use client'

import { useState, useEffect } from 'react'
import { 
  Edit3, 
  FileImage,
  FolderOpen,
  Plus,
  ArrowLeft,
  FileText,
  Grid3x3,
  List,
  Calendar,
  Clock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MarkupEditor } from '@/components/markup/markup-editor'
import type { Profile } from '@/types'
import type { MarkupDocument } from '@/types/markup'
import { createClient } from '@/lib/supabase/client'

interface AdminMarkupToolProps {
  profile: Profile
}

export default function AdminMarkupTool({ profile }: AdminMarkupToolProps) {
  const [view, setView] = useState<'quick-access' | 'editor'>('quick-access')
  const [selectedDocument, setSelectedDocument] = useState<MarkupDocument | undefined>()
  const [recentDocuments, setRecentDocuments] = useState<MarkupDocument[]>([])
  const [loading, setLoading] = useState(false)
  const [listViewType, setListViewType] = useState<'card' | 'list'>('card')
  const supabase = createClient()

  useEffect(() => {
    fetchRecentDocuments()
  }, [])

  const fetchRecentDocuments = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('markup_documents')
        .select('*')
        .eq('is_deleted', false)
        .order('updated_at', { ascending: false })
        .limit(6)

      if (error) throw error
      setRecentDocuments(data || [])
    } catch (error) {
      console.error('Error fetching recent documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateNew = () => {
    setSelectedDocument(undefined)
    setView('editor')
  }

  const handleOpenDocument = (document: MarkupDocument) => {
    setSelectedDocument(document)
    setView('editor')
  }

  const handleSave = () => {
    fetchRecentDocuments()
    setView('quick-access')
  }

  const handleClose = () => {
    setView('quick-access')
  }

  const handleViewAllDocuments = () => {
    window.location.href = '/dashboard/admin/documents'
  }

  if (view === 'editor') {
    return (
      <div className="h-full flex flex-col">
        <div className="px-4 sm:px-6 lg:px-8 py-4 border-b border-gray-200 dark:border-gray-700">
          <Button
            onClick={handleClose}
            variant="ghost"
            className="mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            돌아가기
          </Button>
        </div>
        <div className="flex-1">
          <MarkupEditor
            initialFile={selectedDocument}
            onSave={handleSave}
            onClose={handleClose}
            profile={profile}
            initialView="editor"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      <div className="px-4 sm:px-6 lg:px-8 py-6 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
              <Edit3 className="h-6 w-6 mr-2 text-purple-600" />
              도면 마킹 도구
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              도면에 마킹을 추가하고 편집할 수 있습니다
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-auto">
        {/* 빠른 시작 섹션 */}
        <div className="max-w-6xl mx-auto space-y-6">
          {/* 새 마킹 생성 카드 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mb-4">
                <Plus className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                새 도면 마킹 시작
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                도면을 업로드하고 마킹 작업을 시작하세요
              </p>
              <Button
                onClick={handleCreateNew}
                size="lg"
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <FileImage className="h-5 w-5 mr-2" />
                도면 업로드 및 마킹 시작
              </Button>
            </div>
          </div>

          {/* 최근 작업 문서 */}
          {recentDocuments.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  최근 작업 문서
                </h3>
                <div className="flex items-center gap-2">
                  {/* View Type Toggle */}
                  <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                    <button
                      onClick={() => setListViewType('card')}
                      className={`p-1.5 rounded transition-colors ${
                        listViewType === 'card'
                          ? 'bg-white dark:bg-gray-600 text-purple-600 dark:text-purple-400 shadow-sm'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                      title="카드 뷰"
                    >
                      <Grid3x3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setListViewType('list')}
                      className={`p-1.5 rounded transition-colors ${
                        listViewType === 'list'
                          ? 'bg-white dark:bg-gray-600 text-purple-600 dark:text-purple-400 shadow-sm'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                      title="리스트 뷰"
                    >
                      <List className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <Button
                    onClick={handleViewAllDocuments}
                    variant="ghost"
                    size="sm"
                  >
                    전체 보기
                    <FolderOpen className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
              
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                </div>
              ) : (
                <>
                  {/* Card View */}
                  {listViewType === 'card' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {recentDocuments.map((doc) => (
                        <div
                          key={doc.id}
                          className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => handleOpenDocument(doc)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <FileText className="h-5 w-5 text-gray-400" />
                            <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                              도면
                            </span>
                          </div>
                          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1 truncate">
                            {doc.title || '제목 없음'}
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                            {doc.original_blueprint_filename}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            {new Date(doc.updated_at || doc.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* List View */}
                  {listViewType === 'list' && (
                    <div className="overflow-hidden border border-gray-200 dark:border-gray-700 rounded-lg">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-900">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              문서명
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              파일명
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              수정일
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              생성일
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                          {recentDocuments.map((doc) => (
                            <tr
                              key={doc.id}
                              className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                              onClick={() => handleOpenDocument(doc)}
                            >
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="flex items-center">
                                  <FileText className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0" />
                                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-xs">
                                    {doc.title || '제목 없음'}
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                                  {doc.original_blueprint_filename || '-'}
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {new Date(doc.updated_at || doc.created_at).toLocaleDateString('ko-KR', {
                                    month: '2-digit',
                                    day: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  {new Date(doc.created_at).toLocaleDateString('ko-KR', {
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit'
                                  })}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* 간소화된 워크플로우 안내 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-start mb-4">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mr-4">
                  <span className="text-purple-600 dark:text-purple-400 font-bold text-lg">1</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">도면 업로드 및 마킹</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    JPG, PNG, PDF 형식의 도면을 업로드하고 바로 다양한 마킹 도구를 사용하여 필요한 표시를 추가하세요
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <FileImage className="h-4 w-4" />
                <span>지원 형식: JPG, PNG, PDF</span>
                <span className="mx-2">|</span>
                <Edit3 className="h-4 w-4" />
                <span>실시간 마킹 편집</span>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-start mb-4">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mr-4">
                  <span className="text-purple-600 dark:text-purple-400 font-bold text-lg">2</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">저장 및 활용</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    완성된 도면마킹을 문서함에 저장하고 작업일지에서 활용하거나 필요시 팀원들과 공유하세요
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <FolderOpen className="h-4 w-4" />
                <span>자동 저장</span>
                <span className="mx-2">|</span>
                <FileText className="h-4 w-4" />
                <span>작업일지 연동</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}