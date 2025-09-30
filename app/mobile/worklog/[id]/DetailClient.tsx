'use client'

import { MobileLayout as MobileLayoutShell } from '@/modules/mobile/components/layout/MobileLayout'
import { DiaryDetailViewer } from '@/modules/mobile/components/worklogs'
import type { WorklogDetail } from '@/types/worklog'

export default function DetailClient({ detail }: { detail: WorklogDetail }) {
  return (
    <MobileLayoutShell>
      <DiaryDetailViewer
        open
        worklog={detail}
        onClose={() => {
          if (typeof window !== 'undefined') {
            if (window.history.length > 1) window.history.back()
            else window.location.href = '/mobile/worklog'
          }
        }}
        onDownload={() => {}}
        onOpenDocument={() => {}}
        onOpenMarkup={() => {}}
        onOpenMarkupDoc={() => {}}
      />
    </MobileLayoutShell>
  )
}
