'use client'

import { useState, useEffect } from 'react'
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
import { Search, Filter, Eye, Edit, Trash2, Download } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import PhotoGridPreviewModal from './PhotoGridPreviewModal'

interface PhotoGridListProps {
  onEdit: (document: any) => void
}

export default function PhotoGridList({ onEdit }: PhotoGridListProps) {
  const [documents, setDocuments] = useState<any[]>([])
  const [filteredDocuments, setFilteredDocuments] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSite, setSelectedSite] = useState<string>('all')
  const [sites, setSites] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [previewDocument, setPreviewDocument] = useState<any>(null)
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    fetchDocuments()
    fetchSites()
  }, [])

  useEffect(() => {
    filterDocuments()
  }, [searchTerm, selectedSite, documents])

  const fetchDocuments = async () => {
    try {
      const response = await fetch('/api/photo-grids')
      if (response.ok) {
        const data = await response.json()
        setDocuments(Array.isArray(data) ? data : [])
      } else {
        setDocuments([])
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error)
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
        doc.work_section?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredDocuments(filtered)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('이 문서를 삭제하시겠습니까?')) return

    try {
      const response = await fetch(`/api/photo-grids/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setDocuments(documents.filter(doc => doc.id !== id))
      }
    } catch (error) {
      console.error('Failed to delete document:', error)
    }
  }

  const handleDownload = async (id: string) => {
    try {
      const response = await fetch(`/api/photo-grids/${id}/download`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `photo-grid-${id}.pdf`
        a.click()
        window.URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Failed to download document:', error)
    }
  }

  const handlePreview = (doc: any) => {
    setPreviewDocument(doc)
    setShowPreview(true)
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

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>작성일</TableHead>
                <TableHead>현장명</TableHead>
                <TableHead>부재명</TableHead>
                <TableHead>작업공정</TableHead>
                <TableHead>작업구간</TableHead>
                <TableHead>작성자</TableHead>
                <TableHead className="text-right">작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocuments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500">
                    문서가 없습니다
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
                          onClick={() => handleDownload(doc.id)}
                          title="다운로드"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(doc)}
                          title="수정"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(doc.id)}
                          title="삭제"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Preview Modal */}
        <PhotoGridPreviewModal
          isOpen={showPreview}
          onClose={() => {
            setShowPreview(false)
            setPreviewDocument(null)
          }}
          photoGrid={previewDocument}
        />
      </CardContent>
    </Card>
  )
}