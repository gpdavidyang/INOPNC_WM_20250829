'use client'

import { useState, useEffect } from 'react'
import { Profile } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { Search, Eye, Download, Calendar, Building2, Camera, FileImage } from 'lucide-react'
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
  const [statistics, setStatistics] = useState({
    total: 0,
    thisMonth: 0,
    bySite: {} as Record<string, number>
  })

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
        
        // Calculate statistics
        const currentMonth = new Date().getMonth()
        const currentYear = new Date().getFullYear()
        const thisMonthDocs = docs.filter((doc: any) => {
          const docDate = new Date(doc.created_at)
          return docDate.getMonth() === currentMonth && docDate.getFullYear() === currentYear
        })
        
        const bySite = docs.reduce((acc: Record<string, number>, doc: any) => {
          const siteName = doc.site?.name || 'Unknown'
          acc[siteName] = (acc[siteName] || 0) + 1
          return acc
        }, {})
        
        setStatistics({
          total: docs.length,
          thisMonth: thisMonthDocs.length,
          bySite
        })
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
          const a = document.createElement('a')
          a.href = url
          a.download = `${doc.title || '사진대지'}.pdf`
          a.click()
          window.URL.revokeObjectURL(url)
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
      <Card>
        <CardContent className="p-6">
          <div className="text-center">로딩 중...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileImage className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">전체 문서</p>
                <p className="text-xl font-bold">{statistics.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Calendar className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">이번 달 생성</p>
                <p className="text-xl font-bold">{statistics.thisMonth}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Building2 className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">활성 현장</p>
                <p className="text-xl font-bold">{Object.keys(statistics.bySite).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedSite} onValueChange={setSelectedSite}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="현장 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 현장</SelectItem>
                {sites.map(site => (
                  <SelectItem key={site.id} value={site.id}>
                    {site.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Documents Table */}
          <div className="overflow-x-auto">
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
                {filteredDocuments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      사진대지 문서가 없습니다
                    </td>
                  </tr>
                ) : (
                  filteredDocuments.map((doc) => {
                    const metadata = doc.metadata || {}
                    return (
                      <tr key={doc.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-12 w-12">
                              <div className="h-12 w-12 rounded-lg bg-gray-200 flex items-center justify-center">
                                <Camera className="h-6 w-6 text-gray-400" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{doc.title}</div>
                              <div className="text-sm text-gray-500">{doc.file_name || doc.original_filename}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{doc.sites?.name || doc.site?.name || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{doc.uploader?.full_name || doc.profiles?.full_name || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {format(new Date(doc.created_at), 'yyyy-MM-dd HH:mm', { locale: ko })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {doc.file_size ? `${(doc.file_size / 1024 / 1024).toFixed(1)} MB` : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center space-x-2 justify-end">
                            <button
                              onClick={() => handlePreview(doc)}
                              className="text-blue-600 hover:text-blue-900 p-1 rounded"
                              title="미리보기"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDownload(doc)}
                              className="text-green-600 hover:text-green-900 p-1 rounded"
                              title="다운로드"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}