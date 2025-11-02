'use client'

import React, { useMemo, useRef, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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

type StageKey = 'start' | 'progress' | 'completion'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  siteId: string
  docType: string
  docTypeLabel: string
  defaultStage?: StageKey
  organizationId?: string | null
  onUploaded?: () => void
}

export default function InvoiceUploadDialog({
  open,
  onOpenChange,
  siteId,
  docType,
  docTypeLabel,
  defaultStage = 'start',
  organizationId,
  onUploaded,
}: Props) {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [stage, setStage] = useState<StageKey>(defaultStage)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const stageOptions: Array<{ key: StageKey; label: string }> = useMemo(
    () => [
      { key: 'start', label: '착수 단계' },
      { key: 'progress', label: '진행 단계' },
      { key: 'completion', label: '완료 단계' },
    ],
    []
  )

  const resetState = () => {
    setStage(defaultStage)
    setTitle('')
    setDescription('')
    setSelectedFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleClose = (next: boolean) => {
    if (!next) {
      resetState()
    }
    onOpenChange(next)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile) {
      toast({ title: '파일을 선택하세요.', variant: 'destructive' })
      return
    }
    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('site_id', siteId)
      formData.append('doc_type', docType)
      formData.append('stage', stage)
      formData.append('file', selectedFile)
      if (title) formData.append('title', title)
      if (description) formData.append('description', description)
      if (organizationId) formData.append('organization_id', organizationId)

      const res = await fetch('/api/invoice/upload', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || '업로드에 실패했습니다.')
      }

      toast({ title: '업로드 완료' })
      if (onUploaded) onUploaded()
      handleClose(false)
    } catch (error: any) {
      toast({
        title: '업로드 실패',
        description: error?.message || '문제가 발생했습니다.',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{docTypeLabel} 업로드</DialogTitle>
          <DialogDescription>
            현장에 공유할 {docTypeLabel} 문서를 업로드합니다. 파일은 기존 문서 위에 버전으로
            쌓입니다.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>단계</Label>
            <Select value={stage} onValueChange={value => setStage(value as StageKey)}>
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

          <div className="space-y-2">
            <Label htmlFor="invoice-title">문서 제목</Label>
            <Input
              id="invoice-title"
              placeholder={`${docTypeLabel} 제목`}
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="invoice-description">설명 (선택)</Label>
            <Textarea
              id="invoice-description"
              placeholder="관리자 참고용 메모를 입력하세요."
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>파일</Label>
            <Input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.gif,.webp,.txt"
              onChange={e => {
                const file = e.target.files?.[0]
                setSelectedFile(file ?? null)
              }}
              className="cursor-pointer"
            />
            <p className={cn('text-xs text-muted-foreground')}>
              허용 확장자: PDF, Office 문서, 이미지 (최대 50MB)
            </p>
            {selectedFile ? (
              <p className="text-xs text-foreground">
                선택된 파일: <strong>{selectedFile.name}</strong>
              </p>
            ) : null}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleClose(false)}>
              취소
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? '업로드 중…' : '업로드'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
