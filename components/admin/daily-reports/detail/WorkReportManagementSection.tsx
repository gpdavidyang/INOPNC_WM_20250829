import { Button } from '@/components/ui/button'
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useToast } from '@/components/ui/use-toast'
import { FileText, Loader2, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'

interface WorkReportManagementSectionProps {
  reportId: string
  status: string
  canManage?: boolean
}

interface WorkReportData {
  id: string
  file_url: string
  created_at: string
}

export function WorkReportManagementSection({
  reportId,
  status,
  canManage = false,
}: WorkReportManagementSectionProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [report, setReport] = useState<WorkReportData | null>(null)

  // Fetch existing report status
  const fetchWorkReport = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/work-reports/${reportId}`)
      const data = await res.json()
      if (data.exists) {
        setReport(data.data)
      } else {
        setReport(null)
      }
    } catch (error) {
      console.error('Failed to fetch work report:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWorkReport()
  }, [reportId])

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      console.log('Sending reportId:', reportId)
      const res = await fetch('/api/admin/work-reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId }),
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Failed to generate report')

      toast({
        title: '작업보고서 생성 완료',
        description: 'PDF 작업보고서가 성공적으로 생성되었습니다.',
      })
      await fetchWorkReport()
    } catch (error: any) {
      toast({
        title: '생성 실패',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setGenerating(false)
    }
  }

  const handleDelete = async () => {
    if (!report) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/work-reports/${reportId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete report')

      toast({
        title: '삭제 완료',
        description: '작업보고서가 삭제되었습니다.',
      })
      setReport(null)
    } catch (error: any) {
      toast({
        title: '삭제 실패',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  // Only show if report is approved/completed or if a report already exists
  const isApproved = ['approved', 'completed'].includes(status)

  // If user cannot manage and no report exists, show nothing
  if (!canManage && !report) return null

  // If user can manage but not approved/completed, maybe hide?
  // Requirement says "Approved Daily Reports". Admin can only generate if approved.
  // But if report exists (e.g. approved then status changed back?), we still show it.
  if (!isApproved && !report) return null

  return (
    <section className="rounded-2xl border bg-white shadow-sm overflow-hidden mt-8 animate-in fade-in duration-500">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              작업보고서 {canManage ? '관리' : '보기'}
            </CardTitle>
            <CardDescription>
              {canManage
                ? '본사 보고용 공식 작업보고서(PDF)를 생성하고 관리합니다. (승인된 일지만 가능)'
                : '본사 보고용 공식 작업보고서(PDF)를 확인합니다.'}
            </CardDescription>
          </div>
          {report && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(report.file_url, '_blank')}
                className="gap-2"
              >
                <FileText className="w-4 h-4" />
                미리보기
              </Button>
              {canManage && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="gap-2"
                  onClick={async () => {
                    if (
                      confirm(
                        '작업보고서를 삭제하시겠습니까?\n\n생성된 PDF 파일과 관련 기록이 영구적으로 삭제됩니다.'
                      )
                    ) {
                      await handleDelete()
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                  삭제
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0 pb-6">
        {loading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : !report ? (
          <div className="flex flex-col items-center justify-center py-8 gap-4 bg-slate-50 rounded-xl border border-dashed">
            <p className="text-sm text-muted-foreground">아직 생성된 작업보고서가 없습니다.</p>
            {canManage && (
              <Button onClick={handleGenerate} disabled={generating} className="gap-2">
                {generating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4" />
                )}
                {generating ? '보고서 생성 중...' : '작업보고서(PDF) 생성하기'}
              </Button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-4 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-indigo-900">작업보고서가 생성되었습니다</h4>
              <p className="text-xs text-indigo-700 truncate">
                생성일: {new Date(report.created_at).toLocaleString('ko-KR')}
              </p>
            </div>
            {canManage && (
              <Button variant="secondary" size="sm" onClick={handleGenerate} disabled={generating}>
                {generating ? '재생성 중...' : '업데이트 (재생성)'}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </section>
  )
}
