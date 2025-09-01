'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Download, Printer, Calendar, Building2, User, Wrench, MapPin } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { useToast } from '@/components/ui/use-toast'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

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
      // Create a temporary container for PDF generation
      const pdfContainer = document.createElement('div')
      pdfContainer.style.position = 'absolute'
      pdfContainer.style.left = '-9999px'
      pdfContainer.style.width = '1200px'
      pdfContainer.style.backgroundColor = 'white'
      pdfContainer.style.padding = '40px'
      
      // Create PDF content HTML
      pdfContainer.innerHTML = `
        <div style="font-family: Arial, sans-serif;">
          <h1 style="text-align: center; font-size: 32px; margin-bottom: 40px; color: #333;">사진대지 미리보기</h1>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
            <h2 style="font-size: 24px; margin-bottom: 20px; color: #333;">문서 정보</h2>
            <table style="width: 100%; font-size: 14px;">
              <tr style="height: 35px;">
                <td style="width: 120px; font-weight: bold; color: #666;">현장명</td>
                <td>${photoGrid?.site?.name || '-'}</td>
                <td style="width: 120px; font-weight: bold; color: #666;">작업일자</td>
                <td>${photoGrid?.work_date || '-'}</td>
              </tr>
              <tr style="height: 35px;">
                <td style="font-weight: bold; color: #666;">부재명</td>
                <td>${photoGrid?.component_name || '-'}</td>
                <td style="font-weight: bold; color: #666;">작업공정</td>
                <td>${photoGrid?.work_process || '-'}</td>
              </tr>
              <tr style="height: 35px;">
                <td style="font-weight: bold; color: #666;">작업구간</td>
                <td>${photoGrid?.work_section || '-'}</td>
                <td style="font-weight: bold; color: #666;">작성자</td>
                <td>${photoGrid?.creator?.full_name || '-'}</td>
              </tr>
            </table>
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #dee2e6; color: #666; font-size: 12px;">
              작성일: ${photoGrid?.created_at ? format(new Date(photoGrid.created_at), 'yyyy년 MM월 dd일 HH:mm', { locale: ko }) : '-'}
            </div>
          </div>
          
          <h2 style="font-size: 24px; margin-bottom: 20px; color: #333;">작업 사진</h2>
          
          <div style="display: flex; gap: 20px; margin-bottom: 30px;">
            <div style="flex: 1;">
              <div style="background: #ff6b35; color: white; padding: 8px 16px; border-radius: 4px; display: inline-block; margin-bottom: 10px; font-weight: bold;">
                작업 전
              </div>
              ${photoGrid?.before_photo_url ? 
                `<img src="${photoGrid.before_photo_url}" style="width: 100%; border: 2px solid #dee2e6; border-radius: 8px;" alt="작업 전">` :
                `<div style="width: 100%; height: 400px; background: #f8f9fa; border: 2px solid #dee2e6; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #999;">
                  <div style="text-align: center;">
                    <div style="font-size: 48px;">📷</div>
                    <div>사진 없음</div>
                  </div>
                </div>`
              }
            </div>
            <div style="flex: 1;">
              <div style="background: #007bff; color: white; padding: 8px 16px; border-radius: 4px; display: inline-block; margin-bottom: 10px; font-weight: bold;">
                작업 후
              </div>
              ${photoGrid?.after_photo_url ? 
                `<img src="${photoGrid.after_photo_url}" style="width: 100%; border: 2px solid #dee2e6; border-radius: 8px;" alt="작업 후">` :
                `<div style="width: 100%; height: 400px; background: #f8f9fa; border: 2px solid #dee2e6; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #999;">
                  <div style="text-align: center;">
                    <div style="font-size: 48px;">📷</div>
                    <div>사진 없음</div>
                  </div>
                </div>`
              }
            </div>
          </div>
          
          ${photoGrid?.notes ? `
            <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 8px;">
              <h3 style="font-size: 16px; margin-bottom: 10px; color: #856404;">작업 메모</h3>
              <p style="color: #856404; font-size: 14px; margin: 0;">${photoGrid.notes}</p>
            </div>
          ` : ''}
          
          <div style="margin-top: 50px; text-align: center; color: #666; font-size: 12px;">
            생성일: ${format(new Date(), 'yyyy년 MM월 dd일 HH:mm', { locale: ko })}
          </div>
        </div>
      `
      
      document.body.appendChild(pdfContainer)
      
      // Wait for images to load
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Generate canvas from HTML
      const canvas = await html2canvas(pdfContainer, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false
      })
      
      // Create PDF
      const imgWidth = 210 // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      const pdf = new jsPDF('p', 'mm', 'a4')
      
      // Add pages if content is too long
      let heightLeft = imgHeight
      let position = 0
      const pageHeight = 295 // A4 height in mm
      
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
      
      while (heightLeft > 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }
      
      // Download PDF
      const fileName = `사진대지_${photoGrid?.work_date || format(new Date(), 'yyyy-MM-dd')}.pdf`
      pdf.save(fileName)
      
      // Clean up
      document.body.removeChild(pdfContainer)
      
      toast({
        title: 'PDF 다운로드 완료',
        description: `${fileName} 파일이 다운로드되었습니다.`,
      })
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