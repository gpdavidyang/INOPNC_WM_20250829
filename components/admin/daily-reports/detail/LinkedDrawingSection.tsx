'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { UnifiedAttachment } from '@/types/daily-reports'
import { Download } from 'lucide-react'
import Image from 'next/image'

interface LinkedDrawingSectionProps {
  linkedDrawings: UnifiedAttachment[]
  onPreview: (url: string) => void
  onDownload: (url: string, filename: string) => void
  getMarkupLink: (att: UnifiedAttachment) => string | null
}

export function LinkedDrawingSection({
  linkedDrawings,
  onPreview,
  onDownload,
  getMarkupLink,
}: LinkedDrawingSectionProps) {
  return (
    <Card className="flex flex-col border shadow-sm">
      <CardHeader className="border-b bg-slate-50/50 px-5 py-4">
        <CardTitle className="text-base font-bold text-[#1A254F]">연결 된 도면</CardTitle>
        <CardDescription className="text-[11px]">공유함/마킹 연동 도면</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        {linkedDrawings.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {linkedDrawings.map(att => {
              const preview = att.url
              const meta = (
                att.metadata && typeof att.metadata === 'object' ? att.metadata : {}
              ) as any
              const markupHref = getMarkupLink(att)
              const snapshotPdfUrl = meta?.snapshot_pdf_url || meta?.pdf_url

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
                        <div className="truncate text-sm font-bold text-slate-900" title={att.name}>
                          {att.name}
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          {markupHref && (
                            <Button
                              asChild
                              size="sm"
                              className="h-9 bg-[#1A254F] px-4 text-xs font-bold text-white hover:bg-[#111836]"
                            >
                              <a href={markupHref}>마킹열기</a>
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-9 gap-1.5 border-slate-300 px-3 text-xs font-bold text-slate-700 hover:bg-slate-50"
                            onClick={() => onDownload(att.url, att.name || 'document')}
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
          <div className="flex h-32 items-center justify-center text-xs text-slate-400">
            연결된 도면 없음
          </div>
        )}
      </CardContent>
    </Card>
  )
}
