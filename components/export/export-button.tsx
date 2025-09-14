'use client'

import type { ExportFormat, ExportOptions } from '@/lib/export/types'
import type { Site } from '@/types'

interface ExportButtonProps {
  sites: Site[]
  className?: string
}

export function ExportButton({ sites, className }: ExportButtonProps) {
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('excel')
  const [dateRange, setDateRange] = useState({
    start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    end: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  })

  const handleExport = async () => {
    setLoading(true)
    try {
      const options: ExportOptions = {
        format: selectedFormat,
        dateRange: {
          start: dateRange.start,
          end: dateRange.end
        }
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
          result = await ExcelExporter.exportDailyReports(reports as unknown, sitesData as unknown, {
            fileName: `${fileName}.xlsx`
          })
          break
        case 'pdf':
          result = await PDFExporter.exportDailyReports(reports as unknown, sitesData as unknown, {
            fileName: `${fileName}.pdf`,
            title: '일일보고서'
          })
          break
        case 'csv':
          result = await CSVExporter.exportDailyReports(reports as unknown, sitesData as unknown, {
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
        
        // Close modal
        setShowModal(false)
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

  const setDateRangePreset = (preset: string) => {
    const today = new Date()
    switch (preset) {
      case 'month':
        setDateRange({
          start: format(startOfMonth(today), 'yyyy-MM-dd'),
          end: format(endOfMonth(today), 'yyyy-MM-dd')
        })
        break
      case 'last_month':
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
        setDateRange({
          start: format(startOfMonth(lastMonth), 'yyyy-MM-dd'),
          end: format(endOfMonth(lastMonth), 'yyyy-MM-dd')
        })
        break
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="compact"
        onClick={() => setShowModal(true)}
        className={className}
        title="데이터 내보내기"
      >
        <Download className="w-3 h-3" />
      </Button>

      {/* Simple Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Download className="w-5 h-5" />
                  데이터 내보내기
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Format Selection */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">형식 선택</Label>
                  <div className="space-y-2">
                    {[
                      { value: 'excel', label: 'Excel (.xlsx)', icon: FileSpreadsheet, desc: '표 형태로 데이터 정리' },
                      { value: 'pdf', label: 'PDF (.pdf)', icon: FileText, desc: '인쇄용 보고서' },
                      { value: 'csv', label: 'CSV (.csv)', icon: Download, desc: '간단한 표 형태' }
                    ].map((format: unknown) => (
                      <label
                        key={format.value}
                        className={`flex items-center p-3 border rounded cursor-pointer ${
                          selectedFormat === format.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                        }`}
                      >
                        <input
                          type="radio"
                          name="format"
                          value={format.value}
                          checked={selectedFormat === format.value}
                          onChange={(e) => setSelectedFormat(e.target.value as ExportFormat)}
                          className="sr-only"
                        />
                        <format.icon className="w-4 h-4 mr-3" />
                        <div>
                          <div className="font-medium text-sm">{format.label}</div>
                          <div className="text-xs text-gray-600">{format.desc}</div>
                        </div>
                        {selectedFormat === format.value && (
                          <CheckCircle className="w-4 h-4 text-blue-600 ml-auto" />
                        )}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Date Range */}
                <div>
                  <Label className="text-sm font-medium mb-2 block flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    기간 선택
                  </Label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="compact"
                        onClick={() => setDateRangePreset('month')}
                      >
                        이번 달
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="compact"
                        onClick={() => setDateRangePreset('last_month')}
                      >
                        지난 달
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
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

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowModal(false)}
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
          </Card>
        </div>
      )}
    </>
  )
}