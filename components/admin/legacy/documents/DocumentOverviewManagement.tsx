'use client'

import React, { useState, useEffect } from 'react'

// Helper function to get typography class
function getTypographyClass(type: string, size: string = 'base', isLargeFont: boolean = false): string {
  return getFullTypographyClass(type, size, isLargeFont)
}

interface Document {
  id: string
  category_type: string
  title: string
  file_name: string
  file_url: string
  description?: string
  site_id?: string
  site?: {
    id: string
    name: string
    address?: string
  }
  uploaded_by: string
  uploader?: {
    id: string
    full_name: string
    role: string
  }
  created_at: string
  file_size?: number
  mime_type?: string
}

interface DocumentStats {
  total_documents: number
  shared_documents: number
  markup_documents: number
  required_documents: number
  invoice_documents: number
  photo_grid_documents: number
}

export default function DocumentOverviewManagement() {
  const { isLargeFont } = useFontSize()
  const { touchMode } = useTouchMode()
  
  const [documents, setDocuments] = useState<Document[]>([])
  const [stats, setStats] = useState<DocumentStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  useEffect(() => {
    loadDocuments()
  }, [])

  const loadDocuments = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/documents/integrated')
      if (response.ok) {
        const data = await response.json()
        
        // Flatten all documents from different categories
        const allDocuments: Document[] = []
        if (data.documents_by_category) {
          Object.values(data.documents_by_category).forEach((categoryDocs: unknown) => {
            allDocuments.push(...categoryDocs)
          })
        }
        
        setDocuments(allDocuments)
        setStats({
          total_documents: data.statistics?.total_documents || 0,
          shared_documents: data.statistics?.shared_documents || 0,
          markup_documents: data.statistics?.markup_documents || 0,
          required_documents: data.statistics?.required_documents || 0,
          invoice_documents: data.statistics?.invoice_documents || 0,
          photo_grid_documents: data.statistics?.photo_grid_documents || 0
        })
      }
    } catch (error) {
      console.error('Error loading documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const getCategoryConfig = (category: string) => {
    const configs = {
      shared: { name: '공유문서함', color: 'blue', icon: FileText },
      markup: { name: '도면마킹문서함', color: 'purple', icon: Image },
      required: { name: '필수제출서류함', color: 'green', icon: Shield },
      invoice: { name: '기성청구문서함', color: 'orange', icon: Package },
      photo_grid: { name: '사진대지함', color: 'teal', icon: Image }
    }
    return configs[category as keyof typeof configs] || configs.shared
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A'
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i]
  }

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = searchTerm === '' || 
      doc.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSearch
  }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`${getTypographyClass('heading', 'lg', isLargeFont)} font-bold text-gray-900 flex items-center`}>
            <BarChart3 className="h-6 w-6 mr-2" />
            전체 개요
          </h2>
          <p className={`${getTypographyClass('body', 'sm', isLargeFont)} text-gray-500 mt-1`}>
            모든 문서함의 통합 현황을 확인합니다.
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <Card className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-gray-100 rounded-lg">
                <FileText className="h-6 w-6 text-gray-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-500">전체 문서</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_documents}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-500">공유문서함</p>
                <p className="text-2xl font-bold text-gray-900">{stats.shared_documents}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Image className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-500">도면마킹문서함</p>
                <p className="text-2xl font-bold text-gray-900">{stats.markup_documents}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-500">필수제출서류함</p>
                <p className="text-2xl font-bold text-gray-900">{stats.required_documents}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Package className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-500">기성청구문서함</p>
                <p className="text-2xl font-bold text-gray-900">{stats.invoice_documents}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Search and View Controls */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="문서 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex border border-gray-200 rounded-md">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'text-gray-400'}`}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'text-gray-400'}`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Recent Documents */}
      <div className="space-y-4">
        <h3 className={`${getTypographyClass('heading', 'base', isLargeFont)} font-semibold text-gray-900`}>
          최근 업로드된 문서 ({filteredDocuments.length}개)
        </h3>

        {filteredDocuments.length === 0 ? (
          <Card className="p-12 text-center">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">문서가 없습니다</h3>
            <p className="text-gray-500">
              {searchTerm ? '검색 결과가 없습니다.' : '업로드된 문서가 없습니다.'}
            </p>
          </Card>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocuments.slice(0, 12).map((doc) => {
              const categoryConfig = getCategoryConfig(doc.category_type)
              const CategoryIcon = categoryConfig.icon
              
              return (
                <Card key={doc.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 bg-${categoryConfig.color}-100 rounded-lg`}>
                      <CategoryIcon className={`h-5 w-5 text-${categoryConfig.color}-600`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {doc.title}
                      </h4>
                      <p className="text-xs text-gray-500 truncate">
                        {doc.file_name}
                      </p>
                      <div className="flex items-center text-xs text-gray-400 mt-1">
                        <span className={`inline-flex px-2 py-1 rounded-full bg-${categoryConfig.color}-50 text-${categoryConfig.color}-700 mr-2`}>
                          {categoryConfig.name}
                        </span>
                      </div>
                      {doc.site?.name && (
                        <div className="flex items-center text-xs text-gray-500 mt-1">
                          <Building2 className="h-3 w-3 mr-1" />
                          {doc.site.name}
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-400">
                          {format(new Date(doc.created_at), 'MM/dd', { locale: ko })}
                        </span>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        ) : (
          <Card>
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      문서
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      분류
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      현장
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      업로드일
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      크기
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      작업
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredDocuments.slice(0, 20).map((doc) => {
                    const categoryConfig = getCategoryConfig(doc.category_type)
                    const CategoryIcon = categoryConfig.icon
                    
                    return (
                      <tr key={doc.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className={`h-8 w-8 bg-${categoryConfig.color}-100 rounded flex items-center justify-center mr-3`}>
                              <CategoryIcon className={`h-4 w-4 text-${categoryConfig.color}-600`} />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {doc.title}
                              </div>
                              <div className="text-sm text-gray-500">
                                {doc.file_name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full bg-${categoryConfig.color}-50 text-${categoryConfig.color}-700`}>
                            {categoryConfig.name}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {doc.site?.name || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {format(new Date(doc.created_at), 'yyyy.MM.dd', { locale: ko })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatFileSize(doc.file_size)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}