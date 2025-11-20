'use client'

import React, { useState, useCallback } from 'react'
import { fetchSignedUrlForRecord, FileRecordLike } from '@/lib/files/preview'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'

type PreviewButtonVariant = 'default' | 'secondary' | 'ghost' | 'unstyled'

export interface FilePreviewButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  document: FileRecordLike
  variant?: PreviewButtonVariant
  onResolvedUrl?: (url: string) => void
}

const variantClassMap: Record<PreviewButtonVariant, string> = {
  default: 'preview-btn',
  secondary: 'preview-btn secondary',
  ghost: 'preview-btn ghost',
  unstyled: '',
}

export function FilePreviewButton({
  document,
  className,
  children,
  disabled,
  variant = 'default',
  onResolvedUrl,
  onClick,
  ...buttonProps
}: FilePreviewButtonProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const handleOpen = useCallback(async () => {
    if (loading || disabled) return
    setLoading(true)
    try {
      const url = await fetchSignedUrlForRecord(document)
      if (onResolvedUrl) {
        onResolvedUrl(url)
      } else {
        window.open(url, '_blank', 'noopener,noreferrer')
      }
    } catch (error: any) {
      toast({
        title: '파일 열기 실패',
        description: error?.message || '파일을 불러오지 못했습니다.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [document, disabled, loading, onResolvedUrl, toast])

  return (
    <button
      type="button"
      {...buttonProps}
      className={cn(variantClassMap[variant], className)}
      onClick={event => {
        onClick?.(event)
        if (event.defaultPrevented) return
        handleOpen()
      }}
      disabled={disabled || loading}
    >
      {children ?? (loading ? '불러오는 중...' : '보기')}
    </button>
  )
}

export default FilePreviewButton
