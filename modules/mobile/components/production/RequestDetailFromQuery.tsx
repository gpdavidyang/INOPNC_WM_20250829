'use client'

import React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import RequestDetailSheet from '@/modules/mobile/components/production/RequestDetailSheet'

export default function RequestDetailFromQuery() {
  const sp = useSearchParams()
  const router = useRouter()
  const id = sp.get('request_id') || ''
  const open = Boolean(id)

  const handleClose = () => {
    const url = new URL(window.location.href)
    url.searchParams.delete('request_id')
    router.replace(
      url.pathname + (url.searchParams.toString() ? `?${url.searchParams.toString()}` : '')
    )
  }

  return <RequestDetailSheet open={open} requestId={open ? id : null} onClose={handleClose} />
}
