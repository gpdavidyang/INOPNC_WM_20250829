'use client'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { AlertCircle, Loader2, RotateCcw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { useRolePermissions } from '../CollapsibleSection'

interface FormFooterProps {
  mode: 'create' | 'edit'
  reportData?: any
  error: string | null
  loading: boolean
  loadingType: 'draft' | 'submit' | null
  approvalLoading: boolean
  rejecting: boolean
  setRejecting: (val: boolean) => void
  rejectionReason: string
  setRejectionReason: (val: string) => void
  handleStatusChange: (action: 'approve' | 'revert' | 'reject', reason?: string) => void
  handleSubmit: (isDraft: boolean) => void
  getBreadcrumb: () => string
  permissions: ReturnType<typeof useRolePermissions>
}

export const FormFooter = ({
  mode,
  reportData,
  error,
  loading,
  loadingType,
  approvalLoading,
  rejecting,
  setRejecting,
  rejectionReason,
  setRejectionReason,
  handleStatusChange,
  handleSubmit,
  getBreadcrumb,
  permissions,
}: FormFooterProps) => {
  const router = useRouter()

  return (
    <div className="mt-8 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm shadow-slate-100/50">
      {/* Error Display */}
      {error && (
        <div className="mb-6 bg-rose-50 border border-rose-200 px-4 py-3 rounded-2xl flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-rose-500" />
          <p className="text-rose-700 text-[13px] font-bold tracking-tight">{error}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col gap-6">
        {rejecting && (
          <div className="mb-2 p-6 border border-rose-100 rounded-2xl bg-rose-50/20 animate-in fade-in slide-in-from-top-2">
            <Label className="text-[11px] font-black text-rose-700 uppercase tracking-tighter opacity-70 mb-2 block ml-1">
              반려 사유 입력
            </Label>
            <Textarea
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              placeholder="상세 반려 사유를 입력하세요..."
              className="bg-white rounded-xl border-rose-200/50 focus:border-rose-400 focus:ring-rose-500/20 mb-4 h-32 text-sm"
            />
            <div className="flex justify-end gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setRejecting(false)
                  setRejectionReason('')
                }}
                className="h-9 rounded-xl px-6 whitespace-nowrap font-bold border-rose-200 text-rose-600 hover:bg-white hover:text-rose-700"
              >
                취소
              </Button>
              <Button
                size="sm"
                variant="destructive"
                disabled={!rejectionReason.trim() || approvalLoading}
                onClick={() => handleStatusChange('reject', rejectionReason)}
                className="h-9 rounded-xl px-8 whitespace-nowrap font-bold bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-100"
              >
                {approvalLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                반려
              </Button>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-6 pt-4 border-t border-slate-50">
          <div className="flex items-center gap-3">
            {permissions.isAdmin && mode === 'edit' && (
              <>
                {(reportData?.status === 'submitted' || reportData?.status === 'rejected') && (
                  <Button
                    type="button"
                    className="h-10 rounded-xl px-8 whitespace-nowrap font-black text-sm bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-100"
                    disabled={approvalLoading || rejecting}
                    onClick={() => handleStatusChange('approve')}
                  >
                    {approvalLoading && !rejecting && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    승인
                  </Button>
                )}
                {reportData?.status === 'submitted' && !rejecting && (
                  <Button
                    type="button"
                    variant="destructive"
                    className="h-10 rounded-xl px-8 whitespace-nowrap font-black text-sm bg-rose-600 hover:bg-rose-700 shadow-sm shadow-rose-100"
                    disabled={approvalLoading}
                    onClick={() => setRejecting(true)}
                  >
                    반려
                  </Button>
                )}
                {(reportData?.status === 'approved' || reportData?.status === 'rejected') && (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 rounded-xl px-6 whitespace-nowrap font-bold text-sm border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                    disabled={approvalLoading}
                    onClick={() => handleStatusChange('revert')}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    상태 초기화
                  </Button>
                )}
              </>
            )}
          </div>

          <div className="flex flex-wrap justify-end gap-3 flex-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(getBreadcrumb())}
              disabled={loading}
              className="h-10 rounded-xl px-6 whitespace-nowrap font-bold text-sm border-slate-200 text-slate-500 hover:bg-slate-50"
            >
              취소
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSubmit(true)}
              disabled={loading}
              className="h-10 rounded-xl px-8 whitespace-nowrap font-bold text-sm border-amber-200 text-amber-700 hover:bg-amber-50"
            >
              {loading && loadingType === 'draft' ? '저장 중...' : '임시 저장'}
            </Button>
            <Button
              type="button"
              onClick={() => handleSubmit(false)}
              disabled={loading || approvalLoading}
              className={cn(
                'h-10 px-10 rounded-xl whitespace-nowrap font-black text-sm text-white shadow-md transition-all',
                permissions.isAdmin
                  ? 'bg-[#1A254F] hover:bg-[#151D3F] shadow-blue-100/50'
                  : 'bg-blue-600 hover:bg-blue-700 shadow-blue-100/50'
              )}
            >
              {loading && loadingType === 'submit'
                ? '처리 중...'
                : mode === 'create'
                  ? '작업일지 최종 제출'
                  : '변경사항 최종 저장'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
