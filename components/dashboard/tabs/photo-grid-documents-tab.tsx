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
      const response = await fetch('/api/photo-grids')
      if (response.ok) {
        const data = await response.json()
        const docs = Array.isArray(data) ? data : []
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
      filtered = filtered.filter(doc =>
        doc.component_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.work_process?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.work_section?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.site?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredDocuments(filtered)
  }

  const handleDownload = async (id: string, name: string) => {
    try {
      const response = await fetch(`/api/photo-grids/${id}/download`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `사진대지_${name}.pdf`
        a.click()
        window.URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Failed to download document:', error)
    }
  }

  const handlePreview = (doc: any) => {
    router.push(`/dashboard/admin/tools/photo-grids/preview/${doc.id}`)
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>작성일</TableHead>
                  <TableHead>현장명</TableHead>
                  <TableHead>부재명</TableHead>
                  <TableHead>작업공정</TableHead>
                  <TableHead>작업구간</TableHead>
                  <TableHead>작업일자</TableHead>
                  <TableHead>작성자</TableHead>
                  <TableHead className="text-right">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-gray-500">
                      사진대지 문서가 없습니다
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDocuments.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell>
                        {format(new Date(doc.created_at), 'yyyy-MM-dd', { locale: ko })}
                      </TableCell>
                      <TableCell>{doc.site?.name || '-'}</TableCell>
                      <TableCell>{doc.component_name || '-'}</TableCell>
                      <TableCell>{doc.work_process || '-'}</TableCell>
                      <TableCell>{doc.work_section || '-'}</TableCell>
                      <TableCell>{doc.work_date || '-'}</TableCell>
                      <TableCell>{doc.creator?.full_name || '-'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePreview(doc)}
                            title="미리보기"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownload(doc.id, doc.component_name)}
                            title="다운로드"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}