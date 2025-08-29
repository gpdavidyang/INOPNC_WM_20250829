'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
// Using regular HTML select for compatibility
import {
  Download,
  FileSpreadsheet,
  FileText,
  Calendar,
  Filter,
  CheckCircle,
  AlertCircle,
  Loader2,
  Building2,
  X
} from 'lucide-react'
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns'
import { ExcelExporter } from '@/lib/export/excel-exporter'
import { PDFExporter } from '@/lib/export/pdf-exporter'
import { CSVExporter } from '@/lib/export/csv-exporter'
import { prepareExportData, getExportFormats, logExportActivity } from '@/app/actions/export'
import type { ExportFormat, ExportOptions } from '@/lib/export/types'
import type { Site } from '@/types'
import { toast } from 'sonner'

interface ExportDialogProps {
  sites: Site[]
  trigger?: React.ReactNode
}

export function ExportDialog({ sites, trigger }: ExportDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('excel')
  const [dateRange, setDateRange] = useState({
    start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    end: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  })
  const [selectedSites, setSelectedSites] = useState<string[]>([])
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
  const [includePhotos, setIncludePhotos] = useState(false)
  const [includeDrawings, setIncludeDrawings] = useState(false)
  const [includeReceipts, setIncludeReceipts] = useState(false)
  const [exportFormats, setExportFormats] = useState<any[]>([])

  useEffect(() => {
    loadExportFormats()
  }, [])

  const loadExportFormats = async () => {
    try {
      const result = await getExportFormats()
      if (result.success && result.data) {
        setExportFormats(result.data)
      }
    } catch (error) {
      console.error('Failed to load export formats:', error)
    }
  }

  const handleExport = async () => {
    setLoading(true)
    try {
      // Prepare export options
      const options: ExportOptions = {
        format: selectedFormat,
        dateRange: {
          start: dateRange.start,
          end: dateRange.end
        },
        siteIds: selectedSites.length > 0 ? selectedSites : undefined,
        status: selectedStatuses.length > 0 ? selectedStatuses : undefined,
        includePhotos,
        includeDrawings,
        includeReceipts
      }

      // Get data from server
      const dataResult = await prepareExportData(options)
      
      if (!dataResult.success || !dataResult.data) {
        toast.error(dataResult.error || '데이터를 불러오는데 실패했습니다.')
        return
      }

      const { reports, sites: sitesData } = dataResult.data

      if (reports.length === 0) {
        toast.warning('내보낼 데이터가 없습니다.')
        return
      }

      // Export based on format
      let result
      const fileName = `일일보고서_${format(new Date(), 'yyyy-MM-dd_HHmm')}`

      switch (selectedFormat) {
        case 'excel':
          result = await ExcelExporter.exportDailyReports(reports as any, sitesData as any, {
            includePhotos,
            includeDrawings,
            fileName: `${fileName}.xlsx`
          })
          break
        case 'pdf':
          result = await PDFExporter.exportDailyReports(reports as any, sitesData as any, {
            includePhotos,
            includeDrawings,
            fileName: `${fileName}.pdf`,
            title: '일일보고서'
          })
          break
        case 'csv':
          result = await CSVExporter.exportDailyReports(reports as any, sitesData as any, {
            fileName: `${fileName}.csv`
          })
          break
        default:
          throw new Error('지원하지 않는 내보내기 형식입니다.')
      }

      if (result.success) {
        toast.success(`${reports.length}건의 데이터가 ${result.fileName}로 내보내졌습니다.`)
        
        // Log export activity
        await logExportActivity(selectedFormat, reports.length, options)
        
        // Close dialog
        setOpen(false)
      } else {
        toast.error(result.error || '내보내기에 실패했습니다.')
      }
    } catch (error) {
      console.error('Export error:', error)
      toast.error('내보내기 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleSiteToggle = (siteId: string) => {
    setSelectedSites(prev => 
      prev.includes(siteId) 
        ? prev.filter(id => id !== siteId)
        : [...prev, siteId]
    )
  }

  const handleStatusToggle = (status: string) => {
    setSelectedStatuses(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status)
        : [...prev, status]
    )
  }

  const setDateRangePreset = (preset: string) => {
    const today = new Date()
    switch (preset) {
      case 'today':
        setDateRange({
          start: format(today, 'yyyy-MM-dd'),
          end: format(today, 'yyyy-MM-dd')
        })
        break
      case 'week':
        setDateRange({
          start: format(subDays(today, 7), 'yyyy-MM-dd'),
          end: format(today, 'yyyy-MM-dd')
        })
        break
      case 'month':
        setDateRange({
          start: format(startOfMonth(today), 'yyyy-MM-dd'),
          end: format(endOfMonth(today), 'yyyy-MM-dd')
        })
        break
    }
  }

  const getFormatIcon = (format: ExportFormat) => {
    switch (format) {
      case 'excel': return <FileSpreadsheet className="w-5 h-5" />
      case 'pdf': return <FileText className="w-5 h-5" />
      case 'csv': return <Download className="w-5 h-5" />
      default: return <Download className="w-5 h-5" />
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="compact">
            <Download className="w-4 h-4 mr-2" />
            내보내기
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent 
        className="sm:max-w-2xl"
        style={{
          position: 'fixed',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: '90vw',
          maxWidth: '42rem',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          gap: 0,
          overflow: 'hidden'
        }}
      >
        <DialogHeader className="px-6 py-4 border-b border-gray-200 dark:border-gray-700" style={{ flexShrink: 0 }}>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            데이터 내보내기
          </DialogTitle>
          <DialogDescription>
            일일보고서 데이터를 다양한 형식으로 내보낼 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-4" style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          <div className="space-y-6">
          {/* Export Format Selection */}
          <div>
            <Label className="text-sm font-medium mb-3 block">내보내기 형식</Label>
            <div className="grid gap-3">
              {exportFormats.map((formatInfo: any) => (
                <Card 
                  key={formatInfo.format}
                  className={`p-4 cursor-pointer transition-all ${
                    selectedFormat === formatInfo.format 
                      ? 'ring-2 ring-blue-500 bg-blue-50' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedFormat(formatInfo.format)}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {getFormatIcon(formatInfo.format)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">{formatInfo.label}</h3>
                        {selectedFormat === formatInfo.format && (
                          <CheckCircle className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{formatInfo.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {formatInfo.features.map((feature: string, index: number) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div>
            <Label className="text-sm font-medium mb-3 block flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              기간 선택
            </Label>
            <div className="space-y-3">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="compact"
                  onClick={() => setDateRangePreset('today')}
                >
                  오늘
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="compact"
                  onClick={() => setDateRangePreset('week')}
                >
                  최근 7일
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="compact"
                  onClick={() => setDateRangePreset('month')}
                >
                  이번 달
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-gray-600">시작일</Label>
                  <Input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-600">종료일</Label>
                  <Input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Site Filter */}
          <div>
            <Label className="text-sm font-medium mb-3 block flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              현장 선택 (선택 안함 = 전체)
            </Label>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {sites.map((site: any) => (
                <div key={site.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`site-${site.id}`}
                    checked={selectedSites.includes(site.id)}
                    onChange={() => handleSiteToggle(site.id)}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor={`site-${site.id}`} className="text-sm flex-1">
                    {site.name}
                  </Label>
                </div>
              ))}
            </div>
            {selectedSites.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {selectedSites.map(siteId => {
                  const site = sites.find(s => s.id === siteId)
                  return (
                    <Badge key={siteId} variant="secondary" className="text-xs">
                      {site?.name}
                      <button
                        onClick={() => handleSiteToggle(siteId)}
                        className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  )
                })}
              </div>
            )}
          </div>

          {/* Status Filter */}
          <div>
            <Label className="text-sm font-medium mb-3 block flex items-center gap-2">
              <Filter className="w-4 h-4" />
              상태 선택 (선택 안함 = 전체)
            </Label>
            <div className="space-y-2">
              {[
                { value: 'draft', label: '임시저장' },
                { value: 'submitted', label: '제출됨' },
                { value: 'approved', label: '승인됨' },
                { value: 'rejected', label: '반려됨' }
              ].map((status: any) => (
                <div key={status.value} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`status-${status.value}`}
                    checked={selectedStatuses.includes(status.value)}
                    onChange={() => handleStatusToggle(status.value)}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor={`status-${status.value}`} className="text-sm">
                    {status.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Additional Options */}
          <div>
            <Label className="text-sm font-medium mb-3 block">추가 옵션</Label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="include-photos"
                  checked={includePhotos}
                  onChange={(e) => setIncludePhotos(e.target.checked)}
                  className="rounded border-gray-300"
                  disabled={selectedFormat === 'csv'}
                />
                <Label htmlFor="include-photos" className="text-sm">
                  사진 포함 (Excel, PDF만)
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="include-drawings"
                  checked={includeDrawings}
                  onChange={(e) => setIncludeDrawings(e.target.checked)}
                  className="rounded border-gray-300"
                  disabled={selectedFormat === 'csv'}
                />
                <Label htmlFor="include-drawings" className="text-sm">
                  도면 포함 (Excel, PDF만)
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="include-receipts"
                  checked={includeReceipts}
                  onChange={(e) => setIncludeReceipts(e.target.checked)}
                  className="rounded border-gray-300"
                  disabled={selectedFormat === 'csv'}
                />
                <Label htmlFor="include-receipts" className="text-sm">
                  영수증 포함 (Excel, PDF만)
                </Label>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
              className="flex-1"
            >
              취소
            </Button>
            <Button
              onClick={handleExport}
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  내보내는 중...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  내보내기
                </>
              )}
            </Button>
          </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}