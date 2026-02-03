'use client'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { AlertCircle, Check, Loader2, RotateCcw, X } from 'lucide-react'
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
    <div className="mt-8 bg-white p-6 rounded-lg border shadow-sm">
      {/* Error Display */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">
          <AlertCircle className="h-4 w-4 inline mr-2" />
          {error}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col gap-4">
        {rejecting && (
          <div className="mb-4 p-4 border rounded-lg bg-rose-50/30">
            <Label className="text-rose-700 font-bold mb-2 block">반려 사유 입력</Label>
            <Textarea
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              placeholder="반려 사유를 입력하세요"
              className="bg-white mb-3"
            />
            <div className="flex justify-end gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setRejecting(false)
                  setRejectionReason('')
                }}
              >
                취소
              </Button>
              <Button
                size="sm"
                variant="destructive"
                disabled={!rejectionReason.trim() || approvalLoading}
                onClick={() => handleStatusChange('reject', rejectionReason)}
              >
                반려 처리
              </Button>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {permissions.isAdmin && mode === 'edit' && (
              <>
                {(reportData?.status === 'submitted' || reportData?.status === 'rejected') && (
                  <Button
                    type="button"
                    className="bg-emerald-600 text-white hover:bg-emerald-700 min-w-[100px]"
                    disabled={approvalLoading || rejecting}
                    onClick={() => handleStatusChange('approve')}
                  >
                    {approvalLoading && !rejecting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="mr-2 h-4 w-4" />
                    )}
                    승인
                  </Button>
                )}
                {reportData?.status === 'submitted' && !rejecting && (
                  <Button
                    type="button"
                    variant="destructive"
                    className="min-w-[100px]"
                    disabled={approvalLoading}
                    onClick={() => setRejecting(true)}
                  >
                    <X className="mr-2 h-4 w-4" />
                    반려
                  </Button>
                )}
                {(reportData?.status === 'approved' || reportData?.status === 'rejected') && (
                  <Button
                    type="button"
                    variant="outline"
                    className="min-w-[100px]"
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

          <div className="flex justify-end gap-3 flex-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(getBreadcrumb())}
              disabled={loading}
              className="min-w-[80px]"
            >
              취소
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSubmit(true)}
              disabled={loading}
              className="min-w-[120px] border-[#8DA0CD] text-[#5F7AB9] hover:bg-[#F3F7FA]"
            >
              {loading && loadingType === 'draft' ? '저장 중...' : '임시 저장'}
            </Button>
            <Button
              type="button"
              onClick={() => handleSubmit(false)}
              disabled={loading || approvalLoading}
              className={cn(
                'min-w-[160px] font-semibold text-white',
                permissions.isAdmin
                  ? 'bg-gradient-to-r from-[#1B419C] to-[#15347C] hover:from-[#15347C] hover:to-[#1B419C]'
                  : permissions.isSiteManager
                    ? 'bg-gradient-to-r from-[#FF461C] to-[#E62C00] hover:from-[#E62C00] hover:to-[#FF461C]'
                    : 'bg-gradient-to-r from-[#8DA0CD] to-[#5F7AB9] hover:from-[#5F7AB9] hover:to-[#8DA0CD]'
              )}
            >
              {loading && loadingType === 'submit'
                ? '처리 중...'
                : mode === 'create'
                  ? '작업일지 제출'
                  : '변경사항 저장'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
