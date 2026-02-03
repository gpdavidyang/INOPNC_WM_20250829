'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { UnifiedAttachment } from '@/types/daily-reports'
import { ChevronDown, ChevronUp, Download, FileText } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

interface UploadedDrawingsSectionProps {
  className?: string
  drawings: UnifiedAttachment[]
  managementHref: string
  onPreview: (url: string) => void
  onDownload: (url: string, filename: string) => void
  isExpanded: boolean
  onToggle: () => void
}

export function UploadedDrawingsSection({
  className,
  drawings,
  managementHref,
  onPreview,
  onDownload,
  isExpanded,
  onToggle,
}: UploadedDrawingsSectionProps) {
  const drawingCount = drawings.length

  return (
    <Card className={`flex flex-col border shadow-sm p-0 ${className ?? ''}`}>
      <CardHeader className="border-b bg-white px-3 py-2.5">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-sm font-semibold text-gray-900">
            <span className="inline-flex items-center gap-2">
              <span className="rounded bg-[#F3F7FA] p-1.5">
                <FileText className="h-4 w-4 text-[#5F7AB9]" />
              </span>
              업로드 된 도면
              <Badge variant="secondary" className="h-5 rounded-full px-2 text-[10px] font-bold">
                {drawingCount}
              </Badge>
            </span>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              asChild
              size="sm"
              className="h-9 bg-[#1A254F] px-4 text-xs font-bold text-white hover:bg-[#111836]"
            >
              <Link href={managementHref}>도면마킹 관리</Link>
            </Button>
            <button
              type="button"
              onClick={onToggle}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-[#F3F7FA] dark:hover:bg-gray-700"
              aria-label={isExpanded ? '접기' : '펼치기'}
            >
              {isExpanded ? (
                <ChevronUp className="h-3 w-3 text-gray-600 dark:text-gray-400" />
              ) : (
                <ChevronDown className="h-3 w-3 text-gray-600 dark:text-gray-400" />
              )}
            </button>
          </div>
        </div>
        <CardDescription className="hidden" />
      </CardHeader>

      {isExpanded && (
        <CardContent className="flex-1 p-0">
          {drawings.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {drawings.map(att => {
                const preview = att.url
                const meta = (
                  att.metadata && typeof att.metadata === 'object' ? att.metadata : {}
                ) as any
                const snapshotPdfUrl = meta?.snapshot_pdf_url || meta?.pdf_url
                const downloadUrl = meta?.original_url || att.url
                const canDownload = Boolean(downloadUrl)

                return (
                  <div key={att.id} className="group p-4 transition-colors hover:bg-slate-50">
                    <div className="flex gap-4">
                      <div
                        className="relative h-14 w-20 shrink-0 overflow-hidden rounded-md border bg-slate-100 shadow-sm cursor-zoom-in group-hover:border-blue-200"
                        onClick={() => preview && onPreview(preview)}
                      >
                        {preview ? (
                          <Image
                            src={preview}
                            alt={att.name || 'drawing'}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[10px] text-slate-400">
                            No Preview
                          </div>
                        )}
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col justify-center">
                        <div className="flex items-center justify-between gap-3">
                          <div
                            className="truncate text-sm font-bold text-slate-900"
                            title={att.name}
                          >
                            {att.name}
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-9 gap-1.5 border-slate-300 px-3 text-xs font-bold text-slate-700 hover:bg-slate-50"
                              disabled={!canDownload}
                              onClick={() => {
                                if (!downloadUrl) return
                                onDownload(String(downloadUrl), att.name || 'document')
                              }}
                            >
                              <Download className="h-4 w-4" />
                              다운로드
                            </Button>
                            {snapshotPdfUrl && (
                              <Button
                                asChild
                                size="sm"
                                variant="outline"
                                className="h-9 px-3 text-xs font-semibold"
                              >
                                <a href={snapshotPdfUrl} target="_blank" rel="noreferrer">
                                  PDF
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex h-24 items-center justify-center text-xs text-slate-400">
              업로드 된 도면 없음
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}
