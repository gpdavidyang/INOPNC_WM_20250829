'use client'

import { FilePreviewButton } from '@/components/files/FilePreviewButton'
import { useToast } from '@/components/ui/use-toast'
import { fetchSignedUrlForRecord, FileRecordLike } from '@/lib/files/preview'
import { cn } from '@/lib/utils'
import React, { useCallback, useState } from 'react'

type ButtonVariant = 'default' | 'ghost' | 'icon' | 'unstyled' | 'premium'

const baseButtonClass =
  'inline-flex items-center justify-center min-w-[60px] px-2 py-1 text-[11px] font-medium rounded border transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none'

const variantClassMap: Record<ButtonVariant, string> = {
  default: cn(baseButtonClass, 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'),
  ghost: cn(baseButtonClass, 'bg-transparent text-slate-600 border-slate-200 hover:bg-slate-50'),
  premium: cn(
    baseButtonClass,
    'bg-indigo-50/50 text-indigo-600 border-indigo-100 hover:bg-indigo-100/50 hover:border-indigo-200 shadow-sm font-bold'
  ),
  icon: cn(
    'inline-flex items-center justify-center w-9 h-9 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none transition-all'
  ),
  unstyled: '',
}

type FileActionButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  document: FileRecordLike
  variant?: ButtonVariant
}

export function FileDownloadButton({
  document: fileRecord,
  className,
  children,
  disabled,
  variant = 'default',
  ...buttonProps
}: FileActionButtonProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const handleDownload = useCallback(async () => {
    if (loading || disabled) return
    setLoading(true)
    try {
      const url = await fetchSignedUrlForRecord(fileRecord)
      const anchor = window.document.createElement('a')
      anchor.href = url
      anchor.download = fileRecord.file_name || fileRecord.title || 'document'
      anchor.rel = 'noopener noreferrer'
      anchor.target = '_blank'
      anchor.click()
    } catch (error: any) {
      toast({
        title: '다운로드 실패',
        description: error?.message || '파일을 다운로드하지 못했습니다.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [disabled, fileRecord, loading, toast])

  return (
    <button
      type="button"
      {...buttonProps}
      className={cn(variantClassMap[variant], className)}
      disabled={disabled || loading}
      onClick={event => {
        buttonProps.onClick?.(event)
        if (event.defaultPrevented) return
        handleDownload()
      }}
    >
      <span>{children ?? (loading ? '다운로드 중...' : '다운로드')}</span>
    </button>
  )
}

export function FileShareButton({
  document: fileRecord,
  className,
  children,
  disabled,
  variant = 'default',
  ...buttonProps
}: FileActionButtonProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const handleShare = useCallback(async () => {
    if (loading || disabled) return
    setLoading(true)
    try {
      const url = await fetchSignedUrlForRecord(fileRecord)
      const title = fileRecord.title || fileRecord.file_name || '회사 문서'
      if (typeof navigator !== 'undefined' && 'share' in navigator) {
        await (navigator as any).share({ title, url })
        toast({ title: '공유 완료', description: '공유가 완료되었습니다.' })
      } else {
        await navigator.clipboard.writeText(url)
        toast({ title: '링크 복사됨', description: '클립보드에 링크를 복사했습니다.' })
      }
    } catch (error: any) {
      toast({
        title: '공유 실패',
        description: error?.message || '파일 공유 중 오류가 발생했습니다.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [disabled, fileRecord, loading, toast])

  return (
    <button
      type="button"
      {...buttonProps}
      className={cn(variantClassMap[variant], className)}
      disabled={disabled || loading}
      onClick={event => {
        buttonProps.onClick?.(event)
        if (event.defaultPrevented) return
        handleShare()
      }}
    >
      <span>{children ?? (loading ? '공유 중...' : '공유')}</span>
    </button>
  )
}

export type FileActionMenuProps = {
  document: FileRecordLike
  disableShare?: boolean
  disableDownload?: boolean
  className?: string
  buttonVariant?: ButtonVariant
  buttonClassName?: string
  children?: React.ReactNode
}

export function FileActionMenu({
  document: fileRecord,
  disableShare,
  disableDownload,
  className,
  buttonVariant = 'default',
  buttonClassName,
  children,
}: FileActionMenuProps) {
  return (
    <div className={cn('flex items-center gap-1.5 flex-wrap', className)}>
      <FilePreviewButton document={fileRecord} variant={buttonVariant} className={buttonClassName}>
        <span>보기</span>
      </FilePreviewButton>
      {!disableDownload && (
        <FileDownloadButton
          document={fileRecord}
          variant={buttonVariant}
          className={buttonClassName}
        >
          다운로드
        </FileDownloadButton>
      )}
      {!disableShare && (
        <FileShareButton document={fileRecord} variant={buttonVariant} className={buttonClassName}>
          공유
        </FileShareButton>
      )}
      {children}
    </div>
  )
}

export default FileActionMenu
