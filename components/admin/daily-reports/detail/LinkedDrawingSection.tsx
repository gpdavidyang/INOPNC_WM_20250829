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
    <Card className="flex flex-col rounded-2xl border bg-card shadow-sm overflow-hidden">
      <CardHeader className="border-b border-gray-100 bg-gray-50/50 px-5 py-4">
        <CardTitle className="text-base font-black text-foreground tracking-tight">
          연동 도면 현황
        </CardTitle>
        <CardDescription className="text-[11px] font-black uppercase tracking-tighter text-muted-foreground/30 pt-0.5">
          공유함 및 마킹 연동 도면 내역
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        {linkedDrawings.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {linkedDrawings.map(att => {
              const preview = att.url
              const meta = (
                att.metadata && typeof att.metadata === 'object' ? att.metadata : {}
              ) as any
              const markupHref = getMarkupLink(att)
              const snapshotPdfUrl = meta?.snapshot_pdf_url || meta?.pdf_url

              return (
                <div key={att.id} className="group px-5 py-4 transition-colors hover:bg-gray-50/30">
                  <div className="flex flex-col gap-3">
                    <div className="flex gap-4">
                      <div
                        className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg border border-gray-100 bg-gray-50 cursor-zoom-in group-hover:border-blue-200 transition-all shadow-sm"
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
                          <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground/30 font-bold">
                            미리보기 없음
                          </div>
                        )}
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col justify-center">
                        <div className="truncate text-sm font-bold text-gray-900" title={att.name}>
                          {att.name}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {markupHref && (
                        <Button
                          asChild
                          size="xs"
                          className="h-8 rounded-lg font-medium bg-[#1A254F] hover:bg-black text-white px-3 whitespace-nowrap shadow-none"
                        >
                          <a href={markupHref}>마킹 도면</a>
                        </Button>
                      )}
                      <Button
                        size="xs"
                        variant="outline"
                        className="h-8 rounded-lg font-medium gap-1.5 border-gray-200 px-3 text-muted-foreground hover:bg-gray-50 whitespace-nowrap"
                        onClick={() => onDownload(att.url, att.name || 'document')}
                      >
                        <Download className="h-3.5 w-3.5" />
                        다운로드
                      </Button>
                      {snapshotPdfUrl && (
                        <Button
                          asChild
                          size="xs"
                          variant="outline"
                          className="h-8 rounded-lg font-medium px-3 border-gray-200 whitespace-nowrap text-muted-foreground"
                        >
                          <a href={snapshotPdfUrl} target="_blank" rel="noreferrer">
                            PDF 스냅샷
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="flex h-32 items-center justify-center text-xs text-muted-foreground/30 font-medium italic">
            연결된 도면이 없습니다.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
