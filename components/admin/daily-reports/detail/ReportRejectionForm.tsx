'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, X } from 'lucide-react'

interface ReportRejectionFormProps {
  rejectionReason: string
  setRejectionReason: (val: string) => void
  onCancel: () => void
  onSubmit: (reason: string) => void
  loading: boolean
}

export function ReportRejectionForm({
  rejectionReason,
  setRejectionReason,
  onCancel,
  onSubmit,
  loading,
}: ReportRejectionFormProps) {
  return (
    <Card className="border-rose-200 bg-rose-50 shadow-sm animate-in slide-in-from-top-2 duration-300">
      <CardHeader className="px-4 py-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-rose-900">반려 사유 입력</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-rose-900 hover:bg-rose-100"
            onClick={onCancel}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <textarea
          className="mb-3 w-full rounded-md border-rose-200 bg-white p-3 text-sm focus:border-rose-500 focus:ring-rose-500"
          placeholder="반려 사유를 구체적으로 입력해 주세요 (예: 보수 전/후 사진 누락)"
          rows={3}
          value={rejectionReason}
          onChange={e => setRejectionReason(e.target.value)}
        />
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onCancel} disabled={loading}>
            취소
          </Button>
          <Button
            variant="destructive"
            size="sm"
            disabled={!rejectionReason.trim() || loading}
            onClick={() => onSubmit(rejectionReason)}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                처리 중...
              </>
            ) : (
              '반려 확정'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
