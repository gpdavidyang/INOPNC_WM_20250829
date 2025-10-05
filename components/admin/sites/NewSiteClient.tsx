'use client'

import { useRouter } from 'next/navigation'
import SiteForm from '@/components/admin/sites/SiteForm'
import type { Site } from '@/types'

export default function NewSiteClient() {
  const router = useRouter()

  const handleSuccess = (site?: Site) => {
    if (site?.id) {
      router.push(`/dashboard/admin/sites/${site.id}`)
    } else {
      router.push('/dashboard/admin/sites')
    }
  }

  return <SiteForm mode="create" onSuccess={handleSuccess} />
}
