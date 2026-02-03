'use client'

import { InvoiceUploadForm } from '@/components/admin/invoice/InvoiceUploadDialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { Clock, FileText, User } from 'lucide-react'

interface InvoiceDocumentEntryProps {
  type: any
  docs: any[]
  siteId: string
  organizationId?: string | null
  onRefresh: () => void
  onPreview: (doc: any) => void
  onDownload: (doc: any) => void
  onDelete: (doc: any) => void
}

export function InvoiceDocumentEntry({
  type,
  docs,
  siteId,
  organizationId,
  onRefresh,
  onPreview,
  onDownload,
  onDelete,
}: InvoiceDocumentEntryProps) {
  const latest = docs?.[0]
  const isFulfilled = docs && docs.length > 0

  return (
    <div
      className={cn(
        'group relative rounded-2xl border bg-card p-5 transition-all hover:shadow-md',
        isFulfilled ? 'border-gray-200' : 'border-dashed border-gray-300 bg-gray-50/30'
      )}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Info Area */}
        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'p-2 rounded-xl transition-colors',
                isFulfilled ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-400'
              )}
            >
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-black text-foreground uppercase tracking-tight">
                {type.label}
              </h4>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge
                  variant={isFulfilled ? 'default' : 'outline'}
                  className={cn(
                    'text-[10px] h-5 font-black px-2 rounded-lg',
                    isFulfilled
                      ? 'bg-blue-600 text-white border-none'
                      : 'text-gray-400 border-gray-200'
                  )}
                >
                  {isFulfilled ? '증빙 완료' : '서류 미등록'}
                </Badge>
              </div>
            </div>
          </div>

          {isFulfilled ? (
            <div className="space-y-1.5 pl-11">
              <p
                className="text-sm font-bold text-blue-600 truncate underline decoration-blue-200 underline-offset-4 cursor-pointer"
                onClick={() => onPreview(latest)}
              >
                {latest.title || latest.file_name}
              </p>
              <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />{' '}
                  {latest.created_at
                    ? format(new Date(latest.created_at), 'yyyy-MM-dd HH:mm')
                    : '-'}
                </span>
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" /> {latest.uploader_name || 'System'}
                </span>
                {latest.version && (
                  <span className="bg-gray-100 px-1.5 py-0.5 rounded">v{latest.version}</span>
                )}
              </div>
            </div>
          ) : (
            <div className="pl-11">
              <p className="text-xs font-bold text-muted-foreground opacity-40 italic">
                필수 서류 등록 대기 중...
              </p>
            </div>
          )}
        </div>

        {/* Action Area */}
        <div className="flex items-center gap-2 shrink-0">
          {isFulfilled && (
            <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-gray-800 rounded-xl border border-blue-100 dark:border-blue-900 shadow-sm transition-all">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-3 text-blue-600 hover:bg-blue-50 rounded-lg font-bold text-[11px] transition-colors"
                onClick={() => onPreview(latest)}
              >
                보기
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-3 text-blue-600 hover:bg-blue-50 rounded-lg font-bold text-[11px] transition-colors"
                onClick={() => onDownload(latest)}
              >
                다운로드
              </Button>
              <div className="w-px h-4 bg-gray-100 dark:bg-gray-700 mx-1" />
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-3 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-lg font-bold text-[11px] transition-colors"
                onClick={() => onDelete(latest)}
              >
                삭제
              </Button>
            </div>
          )}

          <div className="flex-1 lg:flex-none">
            <InvoiceUploadForm
              siteId={siteId}
              docType={type.code}
              docTypeLabel={type.label}
              organizationId={organizationId}
              onUploaded={onRefresh}
              variant="compact"
              autoUpload
              className="w-full lg:w-auto"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
