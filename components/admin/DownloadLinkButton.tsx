'use client'

import React from 'react'

interface Props {
  endpoint: string
  label?: string
  className?: string
}

export default function DownloadLinkButton({ endpoint, label = '다운로드', className }: Props) {
  const [loading, setLoading] = React.useState(false)

  const onClick = async () => {
    if (loading) return
    setLoading(true)
    try {
      const res = await fetch(endpoint, { cache: 'no-store' })
      const json = await res.json()
      const url: string | undefined = json?.data?.url || json?.data?.signedUrl || json?.url
      if (url) {
        window.open(url, '_blank', 'noopener')
      }
    } catch (e) {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      className={className || 'underline text-blue-600'}
      onClick={onClick}
      disabled={loading}
      aria-busy={loading}
    >
      {loading ? '다운로드 중...' : label}
    </button>
  )
}
