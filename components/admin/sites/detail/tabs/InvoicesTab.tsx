'use client'

import InvoiceDocumentsManager from '@/components/admin/invoice/InvoiceDocumentsManager'

interface InvoicesTabProps {
  siteId: string
  siteName?: string
  organizationId?: string
  onProgressUpdate: (progress: any) => void
}

export function InvoicesTab({
  siteId,
  siteName,
  organizationId,
  onProgressUpdate,
}: InvoicesTabProps) {
  return (
    <div className="mt-4">
      <InvoiceDocumentsManager
        siteId={siteId}
        siteName={siteName}
        organizationId={organizationId}
        onProgressUpdate={onProgressUpdate}
      />
    </div>
  )
}
