'use client'

import React, { useState, useEffect } from 'react'

// Helper function to get typography class
function getTypographyClass(type: string, size: string = 'base', isLargeFont: boolean = false): string {
  return getFullTypographyClass(type, size, isLargeFont)
}

interface PhotoGridDocument {
  id: string
  title: string
  fileName: string
  fileSize: number
  uploadDate: string
  uploadedBy: string
  siteId: string
  siteName: string
  thumbnailUrl?: string
  status: 'active' | 'archived'
  tags: string[]
}

export default function PhotoGridDocumentsManagement() {
  const { isLargeFont } = useFontSize()
  const { touchMode } = useTouchMode()
  const router = useRouter()
  
  const [documents, setDocuments] = useState<PhotoGridDocument[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSite, setSelectedSite] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set())

  // Fetch photo grid documents from database
  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    setLoading(true)
    try {
      // 통합 API 사용
      const response = await fetch('/api/unified-documents?category_type=photo_grid&status=active')
      if (response.ok) {
        const result = await response.json()
        const data = result.documents || []
        const formattedDocs = data.map((doc: unknown) => {
          return {
            id: doc.id,
            title: doc.title,
            fileName: doc.file_name || doc.original_filename,
            fileSize: doc.file_size || 0,
            uploadDate: doc.created_at,
            uploadedBy: doc.uploader?.full_name || '알 수 없음',
            siteId: doc.site_id,
            siteName: doc.site?.name || '알 수 없음',
            status: doc.status || 'active',
            tags: ['사진대지', doc.category_type].filter(Boolean),
            fileUrl: doc.file_url,
            metadata: doc.metadata
          }
        })
        setDocuments(formattedDocs)
      }
    } catch (error) {
      console.error('Failed to fetch photo grid documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const handlePreview = (doc: PhotoGridDocument) => {
    // Extract photo_grid_id from the document metadata (same logic as the dashboard tab)
    const metadata = (doc as unknown).metadata || {}
    const photoGridId = metadata.photo_grid_id
    if (photoGridId) {
      router.push(`/dashboard/admin/tools/photo-grids/preview/${photoGridId}`)
    }
  }

  const handleDownload = async (doc: PhotoGridDocument) => {
    try {
      // Extract photo_grid_id from the document metadata (same logic as the dashboard tab) 
      const metadata = (doc as unknown).metadata || {}
      const photoGridId = metadata.photo_grid_id
      if (photoGridId) {
        const response = await fetch(`/api/photo-grids/${photoGridId}/download`)
        if (response.ok) {
          const blob = await response.blob()
          const url = window.URL.createObjectURL(blob)
          
          // Open in new window for printing/saving as PDF
          const printWindow = window.open(url, '_blank')
          
          // Clean up after a delay
          setTimeout(() => {
            window.URL.revokeObjectURL(url)
          }, 10000)
        }
      }
    } catch (error) {
      console.error('Failed to download document:', error)
    }
  }

  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.fileName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`${getTypographyClass('heading', 'lg', isLargeFont)} font-bold text-gray-900`}>
            사진대지문서함 관리
          </h2>
          <p className={`${getTypographyClass('body', 'sm', isLargeFont)} text-gray-500 mt-1`}>
            현장 사진 및 이미지 자료를 관리합니다.
          </p>
        </div>
        
        <Button className="flex items-center gap-2">
          <Upload className="h-4 w-4" />
          사진 업로드
        </Button>
      </div>


      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="파일명, 제목으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <select
              value={selectedSite}
              onChange={(e) => setSelectedSite(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm"
            >
              <option value="all">모든 현장</option>
              <option value="site1">서울 아파트 건설현장</option>
            </select>
            
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              필터
            </Button>
            
            <div className="flex border border-gray-200 rounded-md">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'text-gray-400'}`}
              >
                <Grid3x3 className="h-4 w-4" />
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

      {/* Documents */}
      {loading ? (
        <div className="text-center py-12">
          <div className="text-gray-500">사진을 불러오는 중...</div>
        </div>
      ) : filteredDocuments.length === 0 ? (
        <Card className="p-12 text-center">
          <Image className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">사진이 없습니다</h3>
          <p className="text-gray-500">
            {searchTerm ? '검색 결과가 없습니다.' : '업로드된 사진이 없습니다.'}
          </p>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredDocuments.map((doc) => (
            <Card key={doc.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <div className="aspect-video bg-gray-100 flex items-center justify-center">
                {doc.thumbnailUrl ? (
                  <img 
                    src={doc.thumbnailUrl} 
                    alt={doc.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Image className="h-12 w-12 text-gray-400" />
                )}
              </div>
              
              <div className="p-4">
                <h3 className="font-medium text-gray-900 truncate mb-1">
                  {doc.title}
                </h3>
                <p className="text-sm text-gray-500 truncate mb-2">
                  {doc.fileName}
                </p>
                
                <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                  <span>{formatFileSize(doc.fileSize)}</span>
                  <span>{new Date(doc.uploadDate).toLocaleDateString('ko-KR')}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {doc.tags.slice(0, 2).map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handlePreview(doc)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleDownload(doc)}>
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    사진
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    현장
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    업로더
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
                {filteredDocuments.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-gray-100 rounded flex items-center justify-center mr-4">
                          <Image className="h-6 w-6 text-gray-400" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {doc.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            {doc.fileName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {doc.siteName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {doc.uploadedBy}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(doc.uploadDate).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatFileSize(doc.fileSize)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handlePreview(doc)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDownload(doc)}>
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}