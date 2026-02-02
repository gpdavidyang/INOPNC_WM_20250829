'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { UnifiedAttachment } from '@/types/daily-reports'

interface AdditionalAttachmentsSectionProps {
  attachments: (UnifiedAttachment & { __type?: string })[]
  onOpenFile: (item: UnifiedAttachment) => void
  hasFileReference: (item: UnifiedAttachment) => boolean
  formatDate: (date?: string) => string
  extraClass?: string
}

export function AdditionalAttachmentsSection({
  attachments,
  onOpenFile,
  hasFileReference,
  formatDate,
  extraClass,
}: AdditionalAttachmentsSectionProps) {
  return (
    <Card className={`border shadow-sm ${extraClass ?? ''}`}>
      <CardHeader className="px-4 py-3">
        <CardTitle className="text-base">첨부 문서</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {attachments.length === 0 ? (
          <div className="text-sm text-muted-foreground">첨부 문서가 없습니다.</div>
        ) : (
          <div className="space-y-2">
            {attachments.map(item => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded border p-2 text-sm"
              >
                <div className="truncate">
                  <div
                    className="max-w-[340px] truncate font-medium text-foreground"
                    title={item.name}
                  >
                    {item.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {item.uploadedAt ? formatDate(item.uploadedAt) : '업로드 정보 없음'}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onOpenFile(item)}
                  disabled={!hasFileReference(item)}
                >
                  보기
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
