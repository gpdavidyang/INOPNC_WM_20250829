'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Download, Printer, X } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface PhotoGridPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  photoGrid: any
}

export default function PhotoGridPreviewModal({
  isOpen,
  onClose,
  photoGrid,
}: PhotoGridPreviewModalProps) {
  const [loading, setLoading] = useState(false)

  if (!photoGrid) return null

  const handleDownload = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/photo-grids/${photoGrid.id}/download`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `사진대지_${photoGrid.component_name}_${photoGrid.work_date}.pdf`
        a.click()
        window.URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Failed to download PDF:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/photo-grids/${photoGrid.id}/download`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        
        // Open PDF in new window for printing
        const printWindow = window.open(url, '_blank')
        if (printWindow) {
          printWindow.addEventListener('load', () => {
            printWindow.print()
          })
        }
        
        // Clean up after a delay
        setTimeout(() => {
          window.URL.revokeObjectURL(url)
        }, 10000)
      }
    } catch (error) {
      console.error('Failed to print PDF:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            사진대지 미리보기
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Document Info */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
            <h3 className="font-semibold mb-3">문서 정보</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">현장명:</span>
                <span className="ml-2 font-medium">{photoGrid.site?.name || '-'}</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">작업일자:</span>
                <span className="ml-2 font-medium">{photoGrid.work_date || '-'}</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">부재명:</span>
                <span className="ml-2 font-medium">{photoGrid.component_name || '-'}</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">작업공정:</span>
                <span className="ml-2 font-medium">{photoGrid.work_process || '-'}</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">작업구간:</span>
                <span className="ml-2 font-medium">{photoGrid.work_section || '-'}</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">작성자:</span>
                <span className="ml-2 font-medium">{photoGrid.creator?.full_name || '-'}</span>
              </div>
            </div>
          </div>

          {/* Photo Preview */}
          <div className="space-y-4">
            <h3 className="font-semibold">사진 미리보기</h3>
            
            <div className="grid grid-cols-2 gap-6">
              {/* Before Photo */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-600">작업 전</h4>
                <div className="border rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                  {photoGrid.before_photo_url ? (
                    <img
                      src={photoGrid.before_photo_url}
                      alt="작업 전 사진"
                      className="w-full h-64 object-contain"
                    />
                  ) : (
                    <div className="w-full h-64 flex items-center justify-center text-gray-400">
                      사진 없음
                    </div>
                  )}
                </div>
              </div>

              {/* After Photo */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-600">작업 후</h4>
                <div className="border rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                  {photoGrid.after_photo_url ? (
                    <img
                      src={photoGrid.after_photo_url}
                      alt="작업 후 사진"
                      className="w-full h-64 object-contain"
                    />
                  ) : (
                    <div className="w-full h-64 flex items-center justify-center text-gray-400">
                      사진 없음
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="text-sm text-gray-500">
            <p>작성일: {photoGrid.created_at ? format(new Date(photoGrid.created_at), 'yyyy년 MM월 dd일 HH:mm', { locale: ko }) : '-'}</p>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            <X className="mr-2 h-4 w-4" />
            닫기
          </Button>
          <Button
            variant="outline"
            onClick={handlePrint}
            disabled={loading}
          >
            <Printer className="mr-2 h-4 w-4" />
            인쇄
          </Button>
          <Button
            onClick={handleDownload}
            disabled={loading}
          >
            <Download className="mr-2 h-4 w-4" />
            PDF 다운로드
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}