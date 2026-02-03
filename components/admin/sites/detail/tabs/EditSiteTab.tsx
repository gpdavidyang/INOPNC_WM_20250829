'use client'

import SiteForm from '@/components/admin/sites/SiteForm'

interface EditSiteTabProps {
  site: any
  onSuccess?: () => void
}

export function EditSiteTab({ site, onSuccess }: EditSiteTabProps) {
  return (
    <div className="mt-4">
      <SiteForm site={site} onSuccess={onSuccess} />
    </div>
  )
}
