'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Download, Printer, Calendar, Building2, User, Wrench, MapPin } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { useToast } from '@/components/ui/use-toast'

interface PhotoGridPreviewPageProps {
  photoGridId: string
}

export default function PhotoGridPreviewPage({ photoGridId }: PhotoGridPreviewPageProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [photoGrid, setPhotoGrid] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    fetchPhotoGrid()
  }, [photoGridId])

  const fetchPhotoGrid = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/photo-grids/${photoGridId}`)
      if (response.ok) {
        const data = await response.json()
        setPhotoGrid(data)
      } else {
        toast({
          title: '오류',
          description: '사진대지 문서를 찾을 수 없습니다.',
          variant: 'destructive'
        })
        router.back()
      }
    } catch (error) {
      console.error('Failed to fetch photo grid:', error)
      toast({
        title: '오류',
        description: '사진대지 문서를 불러오는데 실패했습니다.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const response = await fetch(`/api/photo-grids/${photoGridId}/download`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `사진대지_${photoGrid.component_name}_${photoGrid.work_date}.pdf`
        a.click()
        window.URL.revokeObjectURL(url)
        
        toast({
          title: '다운로드 완료',
          description: 'PDF 파일이 다운로드되었습니다.',
        })
      }
    } catch (error) {
      console.error('Failed to download PDF:', error)
      toast({
        title: '오류',
        description: 'PDF 다운로드에 실패했습니다.',
        variant: 'destructive'
      })
    } finally {
      setDownloading(false)
    }
  }

  const handlePrint = async () => {
    try {
      const response = await fetch(`/api/photo-grids/${photoGridId}/download`)
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
      toast({
        title: '오류',
        description: '인쇄 준비에 실패했습니다.',
        variant: 'destructive'
      })
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">로딩 중...</div>
        </div>
      </div>
    )
  }

  if (!photoGrid) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-500">문서를 찾을 수 없습니다.</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header with Actions */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            size="sm"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            뒤로
          </Button>
          <h1 className="text-2xl font-bold">사진대지 미리보기</h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handlePrint}
            size="standard"
          >
            <Printer className="mr-2 h-4 w-4" />
            인쇄
          </Button>
          <Button
            onClick={handleDownload}
            disabled={downloading}
            size="standard"
          >
            <Download className="mr-2 h-4 w-4" />
            PDF 다운로드
          </Button>
        </div>
      </div>

      {/* Document Information Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>문서 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <Building2 className="h-5 w-5 text-gray-500 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">현장명</p>
                <p className="font-medium">{photoGrid.site?.name || '-'}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-gray-500 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">작업일자</p>
                <p className="font-medium">{photoGrid.work_date || '-'}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Wrench className="h-5 w-5 text-gray-500 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">부재명</p>
                <p className="font-medium">{photoGrid.component_name || '-'}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Wrench className="h-5 w-5 text-gray-500 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">작업공정</p>
                <p className="font-medium">{photoGrid.work_process || '-'}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-gray-500 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">작업구간</p>
                <p className="font-medium">{photoGrid.work_section || '-'}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-gray-500 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">작성자</p>
                <p className="font-medium">{photoGrid.creator?.full_name || '-'}</p>
              </div>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-gray-500">
              작성일: {photoGrid.created_at ? format(new Date(photoGrid.created_at), 'yyyy년 MM월 dd일 HH:mm', { locale: ko }) : '-'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Photo Display */}
      <Card>
        <CardHeader>
          <CardTitle>작업 사진</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Before Photo */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-sm">작업 전</span>
              </h3>
              <div className="border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                {photoGrid.before_photo_url ? (
                  <img
                    src={photoGrid.before_photo_url}
                    alt="작업 전 사진"
                    className="w-full h-auto max-h-[600px] object-contain"
                  />
                ) : (
                  <div className="w-full h-96 flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <div className="text-6xl mb-2">📷</div>
                      <p>사진 없음</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* After Photo */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">작업 후</span>
              </h3>
              <div className="border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                {photoGrid.after_photo_url ? (
                  <img
                    src={photoGrid.after_photo_url}
                    alt="작업 후 사진"
                    className="w-full h-auto max-h-[600px] object-contain"
                  />
                ) : (
                  <div className="w-full h-96 flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <div className="text-6xl mb-2">📷</div>
                      <p>사진 없음</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Photo Comparison Notes */}
          {photoGrid.notes && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-medium text-yellow-800 mb-2">작업 메모</h4>
              <p className="text-sm text-yellow-700">{photoGrid.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons at Bottom */}
      <div className="flex justify-center gap-4 mt-8">
        <Button
          variant="outline"
          onClick={() => router.back()}
          size="standard"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          목록으로 돌아가기
        </Button>
        <Button
          onClick={handleDownload}
          disabled={downloading}
          size="standard"
        >
          <Download className="mr-2 h-4 w-4" />
          PDF 다운로드
        </Button>
      </div>
    </div>
  )
}