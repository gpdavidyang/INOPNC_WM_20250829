'use client'

import React from 'react'
import { fetchSignedUrlForRecord, type FileRecordLike } from '@/lib/files/preview'
import { useToast } from '@/components/ui/use-toast'

interface Props {
  endpoint?: string
  record?: FileRecordLike | null
  label?: string
  className?: string
}

export default function DownloadLinkButton({
  endpoint,
  record,
  label = '다운로드',
  className,
}: Props) {
  const [loading, setLoading] = React.useState(false)
  const { toast } = useToast()

  const openWithAnchor = React.useCallback((url: string, downloadName?: string | null) => {
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.target = '_blank'
    anchor.rel = 'noopener,noreferrer'
    if (downloadName) anchor.download = downloadName
    anchor.click()
  }, [])

  const onClick = async () => {
    if (loading) return
    setLoading(true)
    try {
      if (record) {
        const signedUrl = await fetchSignedUrlForRecord(record, {
          downloadName: record.file_name || record.title || undefined,
        })
        openWithAnchor(signedUrl, record.file_name || record.title || undefined)
        return
      }
      if (endpoint) {
        window.open(endpoint, '_blank', 'noopener,noreferrer')
        return
      }
      throw new Error('다운로드 정보를 찾을 수 없습니다.')
    } catch (error) {
      console.error('[DownloadLinkButton] Download failed', error)
      if (record?.file_url) {
        window.open(record.file_url, '_blank', 'noopener,noreferrer')
      }
      toast({
        variant: 'destructive',
        title: '다운로드 실패',
        description:
          error instanceof Error ? error.message : '파일을 내려받는 중 오류가 발생했습니다.',
      })
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
