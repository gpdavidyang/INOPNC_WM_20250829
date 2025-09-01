'use client'

import { useState, useEffect } from 'react'
import { Profile } from '@/types'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Search, Eye, Download, Camera } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { useRouter } from 'next/navigation'

interface PhotoGridDocumentsTabProps {
  profile: Profile
}

export default function PhotoGridDocumentsTab({ profile }: PhotoGridDocumentsTabProps) {
  const router = useRouter()
  const [documents, setDocuments] = useState<any[]>([])
  const [filteredDocuments, setFilteredDocuments] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSite, setSelectedSite] = useState<string>('all')
  const [sites, setSites] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDocuments()
    fetchSites()
  }, [])

  useEffect(() => {
    filterDocuments()
  }, [searchTerm, selectedSite, documents])

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      // Fetch from unified document system instead of photo_grids directly
      const response = await fetch('/api/unified-documents?category_type=photo_grid')
      
      if (response.ok) {
        const data = await response.json()
        const docs = data.documents || []
        setDocuments(docs)
      } else {
        console.error('Failed to fetch photo grid documents: API response not OK')
        setDocuments([])
      }
    } catch (error) {
      console.error('Failed to fetch photo grid documents:', error)
      setDocuments([])
    } finally {
      setLoading(false)
    }
  }

  const fetchSites = async () => {
    try {
      const response = await fetch('/api/sites')
      if (response.ok) {
        const data = await response.json()
        setSites(Array.isArray(data) ? data : [])
      } else {
        setSites([])
      }
    } catch (error) {
      console.error('Failed to fetch sites:', error)
      setSites([])
    }
  }

  const filterDocuments = () => {
    let filtered = [...documents]

    if (selectedSite !== 'all') {
      filtered = filtered.filter(doc => doc.site_id === selectedSite)
    }

    if (searchTerm) {
      filtered = filtered.filter(doc => {
        const metadata = doc.metadata || {}
        return doc.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
               doc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
               metadata.component_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
               metadata.work_process?.toLowerCase().includes(searchTerm.toLowerCase()) ||
               metadata.work_section?.toLowerCase().includes(searchTerm.toLowerCase()) ||
               doc.site?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      })
    }

    setFilteredDocuments(filtered)
  }

  const handleDownload = async (doc: any) => {
    try {
      const metadata = doc.metadata || {}
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

  const handlePreview = (doc: any) => {
    const metadata = doc.metadata || {}
    const photoGridId = metadata.photo_grid_id
    if (photoGridId) {
      router.push(`/dashboard/admin/tools/photo-grids/preview/${photoGridId}`)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="ml-3 text-sm text-gray-500 dark:text-gray-400">사진대지 문서를 불러오는 중...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with Search and Filters - Same layout as SharedDocumentsTab */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-medium text-gray-700 dark:text-gray-300">사진대지문서함</h2>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-2 top-1.5 h-3 w-3 text-gray-400" />
            <input
              type="text"
              placeholder="파일명 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-7 pr-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex flex-wrap gap-1">
            {/* Site Filter */}
            <Select value={selectedSite} onValueChange={setSelectedSite}>
              <SelectTrigger className="w-[100px] h-7 px-2 py-1 text-xs font-medium bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors">
                <SelectValue placeholder="현장" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg">
                <SelectItem value="all">전체 현장</SelectItem>
                {sites.map(site => (
                  <SelectItem 
                    key={site.id} 
                    value={site.id}
                    className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-blue-50 dark:focus:bg-blue-900/20 focus:text-blue-600 dark:focus:text-blue-400 cursor-pointer"
                  >
                    {site.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Documents List - Same layout as SharedDocumentsTab */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {filteredDocuments.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Camera className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">문서가 없습니다</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {searchTerm ? '검색 조건에 맞는 문서가 없습니다.' : '아직 사진대지 문서가 등록되지 않았습니다.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredDocuments.map((doc) => {
              const metadata = doc.metadata || {}
              return (
                <div
                  key={doc.id}
                  className="bg-white dark:bg-gray-800 border rounded-lg p-3 hover:shadow-md transition-all duration-200 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600"
                >
                  <div className="flex items-center gap-3">
                    {/* File Type Badge */}
                    <div className="flex-shrink-0">
                      <span className="inline-block px-1.5 py-0.5 text-xs font-medium rounded-md bg-purple-100 text-purple-700 border-purple-200">
                        사진대지
                      </span>
                    </div>
                    
                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate mb-1">
                            {doc.title}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <span>{doc.sites?.name || doc.site?.name || '전체 현장'}</span>
                            <span>•</span>
                            <span>{doc.uploader?.full_name || doc.profiles?.full_name || '-'}</span>
                            <span>•</span>
                            <span>
                              {format(new Date(doc.created_at), 'MM/dd', { locale: ko })}
                            </span>
                            {doc.file_size && (
                              <>
                                <span>•</span>
                                <span>{(doc.file_size / 1024 / 1024).toFixed(1)} MB</span>
                              </>
                            )}
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex items-center gap-1 ml-3">
                          <button
                            onClick={() => handlePreview(doc)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="미리보기"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDownload(doc)}
                            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                            title="다운로드"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}