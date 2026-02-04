'use client'

import { useToast } from '@/components/ui/use-toast'
import { fetchSignedUrlForRecord, FileRecordLike } from '@/lib/files/preview'
import { cn } from '@/lib/utils'
import { useCallback, useState } from 'react'

type PreviewButtonVariant = 'default' | 'secondary' | 'ghost' | 'unstyled' | 'premium' | 'icon'

export interface FilePreviewButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  document: FileRecordLike
  variant?: PreviewButtonVariant
  onResolvedUrl?: (url: string) => void
}

const baseButtonClass =
  'inline-flex items-center justify-center min-w-[60px] px-2 py-1 text-[11px] font-medium rounded border transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 disabled:opacity-50 disabled:pointer-events-none'

const variantClassMap: Record<PreviewButtonVariant, string> = {
  default: cn(baseButtonClass, 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'),
  secondary: cn(baseButtonClass, 'bg-slate-100 text-slate-900 border-slate-200 hover:bg-slate-200'),
  ghost: cn(baseButtonClass, 'bg-transparent text-slate-600 border-slate-200 hover:bg-slate-50'),
  premium: cn(
    baseButtonClass,
    'bg-indigo-50/50 text-indigo-600 border-indigo-100 hover:bg-indigo-100/50 hover:border-indigo-200 shadow-sm font-bold'
  ),
  icon: 'inline-flex items-center justify-center w-9 h-9 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all',
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
      const url = await fetchSignedUrlForRecord(document, { downloadName: null })
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
