'use client'

import { useState, useEffect } from 'react'
import { FileText, Image, Shield, Package, Download, Eye, Users } from 'lucide-react'

interface DocumentsByCategory {
  shared?: any[]
  markup?: any[]
  required?: any[]
  invoice?: any[]
}

interface DocumentStatistics {
  total_documents: number
  shared_documents: number
  markup_documents: number
  required_documents: number
  invoice_documents: number
}

interface DocumentsData {
  documents: any[]
  documents_by_category: DocumentsByCategory
  statistics: DocumentStatistics
  permissions: {
    can_view_all: boolean
    can_download_all: boolean
    can_share_all: boolean
    can_edit_all: boolean
    global_access: boolean
  }
}

export default function UnifiedDocumentListView() {
  const [data, setData] = useState<DocumentsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    try {
      const response = await fetch('/api/admin/documents/integrated')
      if (response.ok) {
        const documentsData = await response.json()
        setData(documentsData)
      }
    } catch (error) {
      console.error('Error fetching documents:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">문서 데이터를 불러올 수 없습니다</p>
      </div>
    )
  }

  const categoryConfigs = {
    shared: { 
      name: '공유문서함', 
      icon: FileText, 
      color: 'blue', 
      description: '현장별 공유 문서 - 현장 구성원 모두 접근 가능',
      permission: '현장별 접근'
    },
    markup: { 
      name: '도면마킹문서함', 
      icon: Image, 
      color: 'purple', 
      description: '도면 및 마킹 자료 - 모든 사용자 공개',
      permission: '전체 공개'
    },
    required: { 
      name: '필수제출서류함', 
      icon: Shield, 
      color: 'green', 
      description: '필수 제출 서류 - 작업자, 현장관리자, 본사관리자 공유',
      permission: '역할 기반 공유'
    },
    invoice: { 
      name: '기성청구문서함', 
      icon: Package, 
      color: 'orange', 
      description: '기성 청구 문서 - 파트너사와 본사관리자만 접근',
      permission: '고객사-본사 공유'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">문서함 통합 관리</h3>
        <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
          <Shield className="h-4 w-4" />
          <span>관리자 전체 권한</span>
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {data.statistics.total_documents}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">전체 문서</div>
        </div>
        {Object.entries(categoryConfigs).map(([key, config]) => {
          const Icon = config.icon
          const count = data.statistics[`${key}_documents` as keyof DocumentStatistics] || 0
          return (
            <div key={key} className={`bg-${config.color}-50 dark:bg-${config.color}-900/20 rounded-lg p-4 text-center border border-${config.color}-200 dark:border-${config.color}-700`}>
              <div className={`text-2xl font-bold text-${config.color}-900 dark:text-${config.color}-100`}>
                {count}
              </div>
              <div className={`text-sm text-${config.color}-700 dark:text-${config.color}-300`}>
                {config.name.replace('문서함', '')}
              </div>
            </div>
          )
        })}
      </div>

      {/* Document Categories */}
      {data.documents_by_category && Object.entries(data.documents_by_category).map(([category, docs]) => {
        if (!docs || docs.length === 0) return null
        
        const config = categoryConfigs[category as keyof typeof categoryConfigs]
        if (!config) return null

        const Icon = config.icon

        return (
          <div key={category} className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 bg-${config.color}-100 dark:bg-${config.color}-900/20 rounded-lg`}>
                    <Icon className={`h-5 w-5 text-${config.color}-600 dark:text-${config.color}-400`} />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {config.name} ({docs.length}개)
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{config.description}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full bg-${config.color}-100 text-${config.color}-800 dark:bg-${config.color}-900/20 dark:text-${config.color}-400`}>
                    {config.permission}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    관리자 권한: 전체 접근
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6">
              {docs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {docs.slice(0, 9).map((doc) => (
                    <div key={doc.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          {doc.document_type === 'photo' ? (
                            <Image className={`h-4 w-4 text-${config.color}-500`} />
                          ) : (
                            <FileText className={`h-4 w-4 text-${config.color}-500`} />
                          )}
                          <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                            {doc.document_type || 'document'}
                          </span>
                        </div>
                      </div>
                      
                      <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-1 truncate" title={doc.title || doc.file_name}>
                        {doc.title || doc.file_name}
                      </h5>
                      
                      {doc.title && doc.file_name !== doc.title && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate mb-2" title={doc.file_name}>
                          {doc.file_name}
                        </p>
                      )}

                      {doc.description && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                          {doc.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <div className="flex items-center space-x-1">
                          <Users className="h-3 w-3" />
                          <span>{doc.profiles?.full_name || '알 수 없음'}</span>
                        </div>
                        <span>{new Date(doc.created_at).toLocaleDateString('ko-KR')}</span>
                      </div>

                      <div className="flex items-center space-x-2 mt-3">
                        <button className="flex-1 inline-flex items-center justify-center px-3 py-1 border border-gray-300 dark:border-gray-600 shadow-sm text-xs font-medium rounded text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                          <Eye className="h-3 w-3 mr-1" />
                          보기
                        </button>
                        <button className="flex-1 inline-flex items-center justify-center px-3 py-1 border border-gray-300 dark:border-gray-600 shadow-sm text-xs font-medium rounded text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                          <Download className="h-3 w-3 mr-1" />
                          다운로드
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Icon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">{config.name}에 등록된 문서가 없습니다</p>
                </div>
              )}
              
              {docs.length > 9 && (
                <div className="text-center mt-4">
                  <button className={`text-${config.color}-600 dark:text-${config.color}-400 hover:text-${config.color}-800 dark:hover:text-${config.color}-300 text-sm font-medium`}>
                    {docs.length - 9}개 더 보기 →
                  </button>
                </div>
              )}
            </div>
          </div>
        )
      })}

      {(!data.documents_by_category || Object.keys(data.documents_by_category).length === 0) && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">등록된 문서가 없습니다</p>
        </div>
      )}
    </div>
  )
}