'use client'

import { Button } from '@/components/ui/button'
import CustomSelect, {
  CustomSelectContent,
  CustomSelectItem,
  CustomSelectTrigger,
  CustomSelectValue,
} from '@/components/ui/custom-select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'
import { AlertCircle, CheckCircle2, FileUp, Loader2, X } from 'lucide-react'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

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
      <div className={cn('flex flex-wrap items-center gap-2 group', className)}>
        <input
          id={fileInputId}
          ref={fileInputRef}
          type="file"
          accept="*/*"
          onChange={handleFileChange}
          className="hidden"
          disabled={submitting}
        />
        <Button
          type="button"
          variant="outline"
          size="xs"
          className="h-8 rounded-lg font-bold px-4 whitespace-nowrap bg-white border-slate-200 text-slate-600 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-200 transition-all shadow-sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={submitting}
        >
          {status === 'uploading' ? (
            <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin text-blue-600" />
          ) : null}
          {status === 'uploading' ? '업로드 중' : '문서 등록'}
        </Button>
        <div className="flex items-center gap-2 text-[11px] min-h-[1.5rem] font-bold">
          {status === 'success' && lastFileName ? (
            <span className="text-emerald-600 flex items-center gap-1 animate-in fade-in slide-in-from-left-2">
              <CheckCircle2 className="w-3.5 h-3.5" />
              업로드 완료
            </span>
          ) : null}
          {status === 'error' && statusMessage ? (
            <span className="text-rose-600 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              상세 오류 확인
            </span>
          ) : null}
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-6', className)}>
      <div className="grid gap-6 md:grid-cols-2">
        {enableStageSelection && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 px-1">
              <span className="text-[11px] font-black text-[#1A254F] uppercase tracking-tighter opacity-40">
                투입 단계
              </span>
            </div>
            <CustomSelect value={stage || ''} onValueChange={value => setStage(value as StageKey)}>
              <CustomSelectTrigger className="h-10 rounded-xl bg-slate-50 border-none px-4 text-sm font-bold shadow-sm">
                <CustomSelectValue placeholder="단계 선택" />
              </CustomSelectTrigger>
              <CustomSelectContent>
                {stageOptions.map(opt => (
                  <CustomSelectItem key={opt.key} value={opt.key} className="font-bold">
                    {opt.label}
                  </CustomSelectItem>
                ))}
              </CustomSelectContent>
            </CustomSelect>
          </div>
        )}

        {showTitleField && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 px-1">
              <span className="text-[11px] font-black text-[#1A254F] uppercase tracking-tighter opacity-40">
                문서 제목
              </span>
            </div>
            <Input
              id={`invoice-title-${docType}`}
              placeholder={`${docTypeLabel} 제목 입력`}
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="h-10 rounded-xl bg-slate-50 border-none px-4 text-sm font-bold shadow-sm focus:bg-white transition-all"
            />
          </div>
        )}
      </div>

      {showDescriptionField && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 px-1">
            <span className="text-[11px] font-black text-[#1A254F] uppercase tracking-tighter opacity-40">
              상세 설명 (메모)
            </span>
          </div>
          <Textarea
            id={`invoice-description-${docType}`}
            placeholder="관리자 참고용 비고 사항을 입력하세요."
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            className="rounded-2xl bg-slate-50 border-none p-4 text-sm font-medium shadow-sm focus:bg-white transition-all resize-none"
          />
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center gap-1.5 px-1">
          <span className="text-[11px] font-black text-[#1A254F] uppercase tracking-tighter opacity-40">
            파일 업로드
          </span>
        </div>
        <div
          className={cn(
            'relative border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center gap-3 transition-all',
            selectedFile
              ? 'border-blue-200 bg-blue-50/20'
              : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200'
          )}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            id={fileInputId}
            ref={fileInputRef}
            type="file"
            accept="*/*"
            onChange={handleFileChange}
            className="hidden"
            disabled={submitting}
          />
          <div
            className={cn(
              'p-4 rounded-full shadow-sm',
              selectedFile ? 'bg-blue-600 text-white' : 'bg-white text-slate-300'
            )}
          >
            <FileUp className="w-6 h-6" />
          </div>
          <div className="text-center">
            <p
              className={cn('text-sm font-bold', selectedFile ? 'text-blue-900' : 'text-slate-400')}
            >
              {selectedFile ? selectedFile.name : '파일을 드래그하거나 클릭하여 선택하세요'}
            </p>
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              PDF, 이미지, Office 문서 (최대 50MB)
            </p>
          </div>
          {selectedFile && (
            <button
              onClick={e => {
                e.stopPropagation()
                clearFileSelection()
              }}
              className="absolute top-4 right-4 p-1.5 bg-white rounded-xl shadow-sm border border-slate-100 text-slate-400 hover:text-rose-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-50">
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            onClick={handleCancel}
            className="h-11 rounded-xl font-bold text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all px-6"
          >
            취소
          </Button>
        )}
        <Button
          type="submit"
          disabled={submitting || !selectedFile}
          className="h-11 rounded-xl bg-[#1A254F] hover:bg-[#111836] font-black px-10 shadow-lg shadow-blue-900/10 transition-all uppercase tracking-tighter"
        >
          {submitting ? '처리 중...' : '문서 업로드'}
        </Button>
      </div>

      {status !== 'idle' && (
        <div className="flex items-center justify-center pt-2">
          {status === 'uploading' && (
            <div className="flex items-center gap-2 text-blue-600 font-bold text-sm animate-pulse">
              <Loader2 className="h-4 w-4 animate-spin" />
              서버로 파일을 전송하고 있습니다...
            </div>
          )}
          {status === 'success' && (
            <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
              <CheckCircle2 className="h-4 w-4" />
              업로드 성공! 목록에 자동 반영됩니다.
            </div>
          )}
        </div>
      )}
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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
        <DialogHeader className="bg-[#1A254F] px-8 py-10">
          <div>
            <DialogTitle className="text-2xl font-black text-white tracking-tight">
              {docTypeLabel} 등록
            </DialogTitle>
            <DialogDescription className="text-white/50 font-medium text-sm mt-1">
              파일을 업로드하면 기존 문서에 새로운 버전으로 추가됩니다.
            </DialogDescription>
          </div>
        </DialogHeader>
        <div className="p-8">
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
            variant={variant}
            autoUpload={autoUpload}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
