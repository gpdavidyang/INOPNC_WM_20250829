'use client'

import { InvoiceUploadForm } from '@/components/admin/invoice/InvoiceUploadDialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { Clock, FileText, History, User } from 'lucide-react'

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
        'group relative rounded-3xl border transition-all duration-300 overflow-hidden',
        isFulfilled
          ? 'bg-white border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200'
          : 'border-dashed border-slate-200 bg-slate-50/30'
      )}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-6">
        {/* Info Area */}
        <div className="flex-1 min-w-0 space-y-4">
          <div className="flex items-center gap-4">
            <div
              className={cn(
                'p-3 rounded-2xl transition-all shadow-sm',
                isFulfilled
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-slate-300 border border-slate-100'
              )}
            >
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-[13px] font-black text-[#1A254F] uppercase tracking-tighter opacity-40 group-hover:opacity-100 transition-opacity">
                {type.label}
              </h4>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  variant={isFulfilled ? 'default' : 'outline'}
                  className={cn(
                    'text-[10px] h-5 font-black px-2.5 rounded-lg border-none tracking-tighter',
                    isFulfilled ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'
                  )}
                >
                  {isFulfilled ? '등록됨' : '미등록'}
                </Badge>
                {docs.length > 1 && (
                  <Badge className="bg-blue-50 text-blue-600 border-none font-black text-[10px] h-5 px-2 rounded-lg">
                    {docs.length}개의 버전
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {isFulfilled ? (
            <div className="space-y-1.5 pl-1.5 border-l-2 border-slate-100 ml-6 pl-8">
              <p
                className="text-sm font-bold text-slate-900 truncate hover:text-blue-600 transition-colors cursor-pointer"
                onClick={() => onPreview(latest)}
              >
                {latest.title || latest.file_name}
              </p>
              <div className="flex flex-wrap items-center gap-4 text-[11px] font-medium text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 opacity-50" />
                  {latest.created_at
                    ? format(new Date(latest.created_at), 'yyyy.MM.dd HH:mm')
                    : '-'}
                </span>
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 opacity-50" />
                  {latest.uploader_name || '관리자'}
                </span>
                {latest.version && (
                  <span className="flex items-center gap-1 text-blue-600 font-black italic">
                    <History className="w-3.5 h-3.5" />v{latest.version}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="ml-6 pl-8 opacity-30">
              <p className="text-xs font-bold text-slate-400 italic">
                필수 증빙 자료를 업로드해주세요.
              </p>
            </div>
          )}
        </div>

        {/* Action Area */}
        <div className="flex items-center gap-3 shrink-0 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-50">
          <div className="flex items-center gap-2">
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

            {isFulfilled && (
              <>
                <Button
                  variant="outline"
                  size="xs"
                  className="h-9 rounded-xl font-bold px-4 border-slate-200 text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-all shadow-sm"
                  onClick={() => onPreview(latest)}
                >
                  미리보기
                </Button>
                <Button
                  variant="outline"
                  size="xs"
                  className="h-9 rounded-xl font-bold px-4 border-slate-200 text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-all shadow-sm"
                  onClick={() => onDownload(latest)}
                >
                  다운로드
                </Button>
                <Button
                  variant="outline"
                  size="xs"
                  className="h-9 rounded-xl font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-4 border-rose-100 shadow-sm"
                  onClick={() => onDelete(latest)}
                >
                  삭제
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
