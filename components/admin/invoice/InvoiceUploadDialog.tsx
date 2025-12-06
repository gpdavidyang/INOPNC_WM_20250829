'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'

export type StageKey = 'start' | 'progress' | 'completion'

interface FieldVisibilityOptions {
  enableStageSelection?: boolean
  showTitleField?: boolean
  showDescriptionField?: boolean
}

export interface UploadedInvoiceDocument {
  id: string
  title: string
  file_url: string
  file_name: string
  mime_type: string
  uploaded_by: string | null
  uploader_name: string | null
  created_at: string
  stage: StageKey | null
  metadata?: Record<string, any> | null
}

export interface UploadSuccessPayload {
  docType: string
  document: UploadedInvoiceDocument
}

export interface InvoiceUploadFormProps extends FieldVisibilityOptions {
  siteId: string
  docType: string
  docTypeLabel: string
  initialStage?: StageKey | null
  lockedStage?: StageKey | null
  organizationId?: string | null
  onUploaded?: (payload: UploadSuccessPayload) => void | Promise<void>
  onCancel?: () => void
  className?: string
  variant?: 'default' | 'compact'
  autoUpload?: boolean
}

export function InvoiceUploadForm({
  siteId,
  docType,
  docTypeLabel,
  initialStage = 'start',
  lockedStage,
  organizationId,
  onUploaded,
  onCancel,
  className,
  enableStageSelection = true,
  showTitleField = true,
  showDescriptionField = true,
  variant = 'default',
  autoUpload,
}: InvoiceUploadFormProps) {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const effectiveInitialStage = useMemo(
    () => lockedStage ?? initialStage ?? null,
    [lockedStage, initialStage]
  )
  const [stage, setStage] = useState<StageKey | ''>(effectiveInitialStage ?? '')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [lastFileName, setLastFileName] = useState<string | null>(null)
  const isCompact = variant === 'compact'
  const autoUploadEnabled = autoUpload ?? isCompact

  const stageOptions: Array<{ key: StageKey; label: string }> = useMemo(
    () => [
      { key: 'start', label: '착수 단계' },
      { key: 'progress', label: '진행 단계' },
      { key: 'completion', label: '완료 단계' },
    ],
    []
  )

  const fileInputId = useMemo(() => {
    const safeKey = `${docType}-${siteId}`.replace(/[^a-zA-Z0-9_-]/g, '_')
    return `invoice-file-${safeKey}`
  }, [docType, siteId])

  const resetState = useCallback(
    (nextStage?: StageKey | null) => {
      const resolvedStage = nextStage ?? effectiveInitialStage
      setStage(resolvedStage ?? '')
      setTitle('')
      setDescription('')
      setSelectedFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    },
    [effectiveInitialStage]
  )

  const clearFileSelection = useCallback(() => {
    setSelectedFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  useEffect(() => {
    resetState(effectiveInitialStage)
    setStatus('idle')
    setStatusMessage(null)
    setLastFileName(null)
  }, [docType, effectiveInitialStage, resetState])

  const submitUpload = useCallback(
    async (file: File) => {
      setSubmitting(true)
      setStatus('uploading')
      setStatusMessage(null)
      setLastFileName(file.name)
      try {
        const formData = new FormData()
        formData.append('site_id', siteId)
        formData.append('doc_type', docType)
        const effectiveStageValue = (lockedStage ?? stage) || ''
        if (effectiveStageValue) {
          formData.append('stage', effectiveStageValue)
        }
        formData.append('file', file)
        if (title) formData.append('title', title)
        if (description) formData.append('description', description)
        if (organizationId) formData.append('organization_id', organizationId)

        const res = await fetch('/api/invoice/upload', {
          method: 'POST',
          body: formData,
        })

        const payload = await res.json().catch(() => ({}))
        if (!res.ok) {
          throw new Error(payload?.error || '업로드에 실패했습니다.')
        }

        toast({ title: '업로드 완료' })
        setStatus('success')
        setStatusMessage('업로드 완료')
        const inserted = payload?.data ?? null
        const stageCandidate =
          inserted?.metadata?.stage || inserted?.sub_category || effectiveStageValue
        const resolvedStage: StageKey | null =
          stageCandidate === 'start' ||
          stageCandidate === 'progress' ||
          stageCandidate === 'completion'
            ? stageCandidate
            : null
        const normalized: UploadedInvoiceDocument = {
          id: inserted?.id || `${docType}-${Date.now()}`,
          title: inserted?.title || inserted?.file_name || file.name,
          file_url: inserted?.file_url || '',
          file_name: inserted?.file_name || file.name,
          mime_type: inserted?.mime_type || file.type,
          uploaded_by: inserted?.uploaded_by || null,
          uploader_name: inserted?.uploader?.full_name || null,
          created_at: inserted?.created_at || new Date().toISOString(),
          stage: resolvedStage,
          metadata: inserted?.metadata || {
            doc_type: docType,
            document_type: docType,
            ...(resolvedStage ? { stage: resolvedStage } : {}),
          },
        }
        if (onUploaded) {
          await onUploaded({ docType, document: normalized })
        }
        resetState(effectiveInitialStage)
      } catch (error: any) {
        const message = error?.message || '문제가 발생했습니다.'
        toast({
          title: '업로드 실패',
          description: message,
          variant: 'destructive',
        })
        setStatus('error')
        setStatusMessage(message)
        clearFileSelection()
      } finally {
        setSubmitting(false)
      }
    },
    [
      clearFileSelection,
      description,
      docType,
      effectiveInitialStage,
      lockedStage,
      onUploaded,
      organizationId,
      resetState,
      siteId,
      stage,
      title,
      toast,
    ]
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile) {
      const message = '파일이 선택되지 않았습니다.'
      setStatus('error')
      setStatusMessage(message)
      toast({ title: '업로드 실패', description: message, variant: 'destructive' })
      return
    }
    await submitUpload(selectedFile)
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null
    setSelectedFile(file)
    if (!file) {
      if (autoUploadEnabled) {
        setStatus('idle')
        setStatusMessage(null)
        setLastFileName(null)
      }
      return
    }
    setStatus('idle')
    setStatusMessage(null)
    if (autoUploadEnabled) {
      void submitUpload(file)
    }
  }

  const handleCancel = () => {
    resetState(effectiveInitialStage)
    setStatus('idle')
    setStatusMessage(null)
    setLastFileName(null)
    onCancel?.()
  }

  if (isCompact) {
    return (
      <div className={cn('flex flex-wrap items-center gap-2 sm:gap-3', className)}>
        <Label htmlFor={fileInputId} className="sr-only">
          {docTypeLabel} 파일 선택
        </Label>
        <Input
          id={fileInputId}
          ref={fileInputRef}
          type="file"
          accept="*/*"
          onChange={handleFileChange}
          className="w-full sm:w-64 cursor-pointer"
          disabled={submitting}
        />
        <div className="flex items-center gap-2 text-xs min-h-[1.5rem]">
          {status === 'uploading' ? (
            <span className="flex items-center gap-1 text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              업로드 중…
            </span>
          ) : null}
          {status === 'success' && lastFileName ? (
            <span className="text-emerald-600">{lastFileName} 업로드 완료</span>
          ) : null}
          {status === 'error' && statusMessage ? (
            <span className="text-destructive">{statusMessage}</span>
          ) : null}
          {status === 'idle' ? (
            <span className="text-muted-foreground">파일 선택 시 자동 업로드됩니다.</span>
          ) : null}
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-4', className)}>
      {enableStageSelection ? (
        <div className="space-y-2">
          <Label>단계</Label>
          <Select value={stage || undefined} onValueChange={value => setStage(value as StageKey)}>
            <SelectTrigger>
              <SelectValue placeholder="단계를 선택하세요" />
            </SelectTrigger>
            <SelectContent>
              {stageOptions.map(opt => (
                <SelectItem key={opt.key} value={opt.key}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      {showTitleField ? (
        <div className="space-y-2">
          <Label htmlFor={`invoice-title-${docType}`}>문서 제목</Label>
          <Input
            id={`invoice-title-${docType}`}
            placeholder={`${docTypeLabel} 제목`}
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
        </div>
      ) : null}

      {showDescriptionField ? (
        <div className="space-y-2">
          <Label htmlFor={`invoice-description-${docType}`}>설명 (선택)</Label>
          <Textarea
            id={`invoice-description-${docType}`}
            placeholder="관리자 참고용 메모를 입력하세요."
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
          />
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor={fileInputId}>파일</Label>
        <Input
          id={fileInputId}
          ref={fileInputRef}
          type="file"
          accept="*/*"
          onChange={handleFileChange}
          className="cursor-pointer"
          disabled={submitting}
        />
        <p className="text-xs text-muted-foreground">
          허용 확장자: PDF, Office 문서, 이미지 (최대 50MB)
        </p>
        {selectedFile ? (
          <p className="text-xs text-foreground">
            선택된 파일: <strong>{selectedFile.name}</strong>
          </p>
        ) : null}
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:space-x-2">
        {onCancel ? (
          <Button type="button" variant="outline" onClick={handleCancel}>
            취소
          </Button>
        ) : null}
        <Button type="submit" disabled={submitting || !selectedFile}>
          {submitting ? '업로드 중…' : '업로드'}
        </Button>
      </div>

      {status !== 'idle' ? (
        <div className="text-xs text-muted-foreground">
          {status === 'uploading' ? (
            <span className="flex items-center gap-1">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              업로드 중…
            </span>
          ) : null}
          {status === 'success' && lastFileName ? (
            <span className="text-emerald-600">{lastFileName} 업로드 완료</span>
          ) : null}
          {status === 'error' && statusMessage ? (
            <span className="text-destructive">{statusMessage}</span>
          ) : null}
        </div>
      ) : null}
    </form>
  )
}

type DialogProps = Omit<InvoiceUploadFormProps, 'onCancel' | 'className'> & {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function InvoiceUploadDialog({
  open,
  onOpenChange,
  siteId,
  docType,
  docTypeLabel,
  initialStage = 'start',
  lockedStage,
  organizationId,
  onUploaded,
  variant,
  autoUpload,
}: DialogProps) {
  const handleOpenChange = (next: boolean) => {
    onOpenChange(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{docTypeLabel} 업로드</DialogTitle>
          <DialogDescription>
            현장에 공유할 {docTypeLabel} 문서를 업로드합니다. 파일은 기존 문서 위에 버전으로
            쌓입니다.
          </DialogDescription>
        </DialogHeader>
        <InvoiceUploadForm
          siteId={siteId}
          docType={docType}
          docTypeLabel={docTypeLabel}
          initialStage={initialStage}
          lockedStage={lockedStage}
          organizationId={organizationId}
          onUploaded={async payload => {
            if (onUploaded) await onUploaded(payload)
            onOpenChange(false)
          }}
          onCancel={() => onOpenChange(false)}
          className="pt-4"
          variant={variant}
          autoUpload={autoUpload}
        />
      </DialogContent>
    </Dialog>
  )
}
