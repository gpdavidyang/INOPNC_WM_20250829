'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/custom-select'
import { MarkupDocument } from '@/types'
import { FileText, Calendar, Edit } from 'lucide-react'

interface OpenDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onOpen: (document: MarkupDocument) => void
}

export function OpenDialog({ open, onOpenChange, onOpen }: OpenDialogProps) {
  const [documents, setDocuments] = useState<MarkupDocument[]>([])
  const [loading, setLoading] = useState(false)
  const [location, setLocation] = useState<'personal' | 'shared'>('personal')

  const fetchDocuments = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/markup-documents?location=${location}&limit=10`)
      const result = await response.json()
      
      if (result.success) {
        setDocuments(result.data)
      } else {
        console.error('Failed to fetch documents:', result.error)
      }
    } catch (error) {
      console.error('Error fetching documents:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      fetchDocuments()
    }
  }, [open, location])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>마킹 도면 열기</DialogTitle>
          <DialogDescription>
            저장된 마킹 도면을 선택하여 열기
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="mb-4">
            <Select 
              value={location} 
              onValueChange={(value) => setLocation(value as 'personal' | 'shared')}
            >
              <SelectTrigger>
                <SelectValue placeholder="문서함 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="personal">내 문서함</SelectItem>
                <SelectItem value="shared">공유 문서함</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2 max-h-64 overflow-y-auto">
            {loading ? (
              <div className="text-center py-4 text-gray-500">로딩 중...</div>
            ) : documents.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                저장된 문서가 없습니다
              </div>
            ) : (
              documents.map((doc: any) => (
                <Button
                  key={doc.id}
                  variant="outline"
                  className="justify-start h-auto p-3"
                  onClick={() => {
                    onOpen(doc)
                    onOpenChange(false)
                  }}
                >
                  <div className="flex items-start gap-3 text-left w-full">
                    <FileText className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{doc.title}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {doc.original_blueprint_filename}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(doc.created_at)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Edit className="h-3 w-3" />
                          {doc.markup_count}개
                        </div>
                      </div>
                    </div>
                  </div>
                </Button>
              ))
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}