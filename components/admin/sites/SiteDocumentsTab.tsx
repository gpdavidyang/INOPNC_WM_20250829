'use client'

import { useState, useEffect } from 'react'
import { 
  FileText, 
  Image, 
  Package, 
  Download, 
  Eye, 
  Upload, 
  Search, 
  Filter,
  Calendar,
  Users,
  FolderOpen
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface Document {
  id: string
  document_type: string
  sub_type?: string
  category_type: string
  file_name: string
  file_url: string
  title?: string
  description?: string
  created_at: string
  uploaded_by: string
  profiles?: {
    full_name: string
    role: string
  }
}

interface SiteDocumentsTabProps {
  siteId: string
  siteName: string
}

export default function SiteDocumentsTab({ siteId, siteName }: SiteDocumentsTabProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'photo' | 'document' | 'receipt'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('shared')

  useEffect(() => {
    fetchDocuments()
  }, [siteId, filter, selectedCategory])

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      let url = `/api/admin/sites/${siteId}/documents`
      const params = new URLSearchParams()
      
      params.append('category', selectedCategory)
      
      if (filter !== 'all') {
        params.append('type', filter)
      }
      
      url += `?${params.toString()}`

      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setDocuments(data.success ? data.data || [] : [])
      }
    } catch (error) {
      console.error('Error fetching documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDocumentIcon = (docType: string) => {
    switch (docType) {
      case 'photo':
        return <Image className="h-5 w-5 text-blue-500" />
      case 'document':
        return <FileText className="h-5 w-5 text-green-500" />
      case 'receipt':
        return <Package className="h-5 w-5 text-orange-500" />
      default:
        return <FileText className="h-5 w-5 text-gray-500" />
    }
  }

  const getDocumentTypeLabel = (type: string) => {
    const labels = {
      photo: '사진',
      document: '문서',
      receipt: '영수증',
      drawing: '도면',
      report: '보고서'
    }
    return labels[type as keyof typeof labels] || type
  }

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = searchTerm === '' || 
      (doc.title || doc.file_name).toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.description || '').toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSearch
  })

  const categories = [
    { 
      key: 'shared', 
      label: '공유문서함', 
      description: '현장 관련 모든 사용자가 접근 가능',
      color: 'red',
      icon: FolderOpen 
    },
    { 
      key: 'markup', 
      label: '도면마킹문서함', 
      description: '현장별 도면 및 마킹 자료',
      color: 'gray',
      icon: Image 
    },
    { 
      key: 'required', 
      label: '필수제출문서함', 
      description: '현장에서 필수로 제출해야 하는 문서',
      color: 'blue',
      icon: FileText 
    },
    { 
      key: 'invoice', 
      label: '기성청구문서함', 
      description: '공사 기성 및 청구 관련 문서',
      color: 'green',
      icon: Package 
    },
    { 
      key: 'photo', 
      label: '사진대지함', 
      description: '현장 사진 및 이미지 파일',
      color: 'yellow',
      icon: Image 
    }
  ]

  const currentCategory = categories.find(cat => cat.key === selectedCategory) || categories[0]
  const CurrentCategoryIcon = currentCategory.icon

  const documentStats = {
    total: documents.length,
    photos: documents.filter(d => d.document_type === 'photo').length,
    documents: documents.filter(d => d.document_type === 'document').length,
    receipts: documents.filter(d => d.document_type === 'receipt').length,
    shared: documents.filter(d => d.category_type === 'shared').length,
    markup: documents.filter(d => d.category_type === 'markup').length,
    required: documents.filter(d => d.category_type === 'required').length,
    invoice: documents.filter(d => d.category_type === 'invoice').length
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
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            문서함 통합 관리
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {siteName} 현장의 공유문서 및 도면마킹 문서를 관리합니다
          </p>
        </div>
        <Link
          href={`/dashboard/admin/documents/shared?site_id=${siteId}`}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          <Upload className="h-4 w-4 mr-2" />
          문서 업로드
        </Link>
      </div>

      {/* 카테고리 선택 */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {categories.map((category) => {
          const CategoryIcon = category.icon
          const isActive = selectedCategory === category.key
          
          const getColorClasses = (color: string, isActive: boolean) => {
            const colorMap = {
              red: isActive ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 hover:border-red-300',
              gray: isActive ? 'border-gray-500 bg-gray-50 text-gray-700' : 'border-gray-200 hover:border-gray-300',
              blue: isActive ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-blue-300',
              green: isActive ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 hover:border-green-300',
              yellow: isActive ? 'border-yellow-500 bg-yellow-50 text-yellow-700' : 'border-gray-200 hover:border-yellow-300',
            }
            return colorMap[color as keyof typeof colorMap] || 'border-gray-200'
          }

          const getIconColorClasses = (color: string, isActive: boolean) => {
            const colorMap = {
              red: isActive ? 'text-red-600 bg-red-100' : 'text-gray-500 bg-gray-100',
              gray: isActive ? 'text-gray-600 bg-gray-100' : 'text-gray-500 bg-gray-100',
              blue: isActive ? 'text-blue-600 bg-blue-100' : 'text-gray-500 bg-gray-100',
              green: isActive ? 'text-green-600 bg-green-100' : 'text-gray-500 bg-gray-100',
              yellow: isActive ? 'text-yellow-600 bg-yellow-100' : 'text-gray-500 bg-gray-100',
            }
            return colorMap[color as keyof typeof colorMap] || 'text-gray-500 bg-gray-100'
          }
          
          return (
            <button
              key={category.key}
              onClick={() => setSelectedCategory(category.key)}
              className={`text-center p-4 rounded-lg border transition-all ${
                getColorClasses(category.color, isActive)
              } ${!isActive ? 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700' : ''}`}
            >
              <div className="flex flex-col items-center gap-2">
                <div className={`p-2 rounded-lg ${getIconColorClasses(category.color, isActive)}`}>
                  <CategoryIcon className="h-5 w-5" />
                </div>
                <div>
                  <h4 className={`font-medium text-sm ${isActive ? '' : 'text-gray-900 dark:text-gray-100'}`}>
                    {category.label}
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                    {category.description}
                  </p>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className={`p-2 rounded-lg ${
              currentCategory.color === 'red' ? 'bg-red-50 dark:bg-red-900/20' :
              currentCategory.color === 'gray' ? 'bg-gray-50 dark:bg-gray-900/20' :
              currentCategory.color === 'blue' ? 'bg-blue-50 dark:bg-blue-900/20' :
              currentCategory.color === 'green' ? 'bg-green-50 dark:bg-green-900/20' :
              currentCategory.color === 'yellow' ? 'bg-yellow-50 dark:bg-yellow-900/20' :
              'bg-gray-50 dark:bg-gray-900/20'
            }`}>
              <CurrentCategoryIcon className={`h-5 w-5 ${
                currentCategory.color === 'red' ? 'text-red-600 dark:text-red-400' :
                currentCategory.color === 'gray' ? 'text-gray-600 dark:text-gray-400' :
                currentCategory.color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
                currentCategory.color === 'green' ? 'text-green-600 dark:text-green-400' :
                currentCategory.color === 'yellow' ? 'text-yellow-600 dark:text-yellow-400' :
                'text-gray-600 dark:text-gray-400'
              }`} />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">전체 문서</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{documentStats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Image className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">사진</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{documentStats.photos}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">문서</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{documentStats.documents}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <Package className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">영수증</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{documentStats.receipts}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 필터 및 검색 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value as any)}
              className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="all">모든 유형</option>
              <option value="photo">사진</option>
              <option value="document">문서</option>
              <option value="receipt">영수증</option>
            </select>
          </div>

          <div className="flex-1 flex items-center gap-2">
            <Search className="h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="문서명 또는 설명 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>
        </div>
      </div>

      {/* 문서 목록 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        {filteredDocuments.length === 0 ? (
          <div className="text-center py-12">
            <CurrentCategoryIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              {currentCategory.label}에 문서가 없습니다
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {searchTerm || filter !== 'all' ? '필터 조건에 맞는 문서가 없습니다.' : '아직 업로드된 문서가 없습니다.'}
            </p>
            <Link
              href={`/dashboard/admin/documents/${selectedCategory}?site_id=${siteId}`}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <Upload className="h-4 w-4 mr-2" />
              첫 번째 문서 업로드
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
            {filteredDocuments.map((document) => (
              <div key={document.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {getDocumentIcon(document.document_type)}
                    <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                      {getDocumentTypeLabel(document.document_type)}
                    </span>
                  </div>
                </div>
                
                {/* 미리보기 (사진의 경우) */}
                {document.document_type === 'photo' && document.file_url && (
                  <div className="w-full h-32 bg-gray-100 dark:bg-gray-700 rounded-lg mb-3 overflow-hidden">
                    <img
                      src={document.file_url}
                      alt={document.title || document.file_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-1 truncate" title={document.title || document.file_name}>
                  {document.title || document.file_name}
                </h5>
                
                {document.title && document.file_name !== document.title && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate mb-2" title={document.file_name}>
                    파일명: {document.file_name}
                  </p>
                )}

                {document.description && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                    {document.description}
                  </p>
                )}

                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
                  <div className="flex items-center space-x-1">
                    <Users className="h-3 w-3" />
                    <span>{document.profiles?.full_name || '알 수 없음'}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3" />
                    <span>{format(new Date(document.created_at), 'MM.dd', { locale: ko })}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
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
        )}
      </div>

      {/* 추가 액션 */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {currentCategory.label}에서 총 {filteredDocuments.length}개의 문서
          {filter !== 'all' && ` (${getDocumentTypeLabel(filter)})`}
        </div>
        
        <Link
          href={`/dashboard/admin/documents/${selectedCategory}?site_id=${siteId}`}
          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
        >
          전체 {currentCategory.label} 관리 →
        </Link>
      </div>
    </div>
  )
}