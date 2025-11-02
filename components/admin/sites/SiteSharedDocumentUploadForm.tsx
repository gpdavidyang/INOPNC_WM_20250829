'use client'

import { useCallback, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'

type SiteSharedDocumentUploadFormProps = {
  siteId: string
  siteName?: string | null
  redirectTo?: string
  onSuccess?: (doc: any) => void
  onCancel?: () => void
}

const SUBCATEGORY_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'general', label: '일반' },
  { value: 'notice', label: '공지' },
  { value: 'safety', label: '안전' },
  { value: 'inspection', label: '점검' },
  { value: 'checklist', label: '체크리스트' },
  { value: 'form', label: '양식' },
  { value: 'reference', label: '자료' },
  { value: 'drawing', label: '도면' },
  { value: 'blueprint', label: '도면(청사진)' },
]

export default function SiteSharedDocumentUploadForm({
  siteId,
  siteName,
  redirectTo,
  onSuccess,
  onCancel,
}: SiteSharedDocumentUploadFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [subCategory, setSubCategory] = useState<string>('general')
  const [tags, setTags] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const uploadHint = onSuccess
    ? '업로드 후 목록이 자동으로 갱신됩니다.'
    : '업로드 후 자동으로 현장 상세 화면으로 이동합니다.'

  const resetForm = useCallback(() => {
    setFile(null)
    setTitle('')
    setDescription('')
    setSubCategory('general')
    setTags('')
    setMessage(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const nextFile = event.target.files?.[0] || null
      setFile(nextFile)
      if (nextFile && !title) {
        const baseName = nextFile.name.replace(/\.[^/.]+$/, '')
        setTitle(baseName)
      }
    },
    [title]
  )

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      if (!file) {
        toast({
          title: '파일이 필요합니다',
          description: '업로드할 파일을 선택해 주세요.',
          variant: 'destructive',
        })
        return
      }

      const formData = new FormData()
      formData.append('file', file)
      formData.append('title', title || file.name)
      if (description.trim()) formData.append('description', description.trim())
      if (subCategory) formData.append('sub_category', subCategory)
      if (tags.trim()) formData.append('tags', tags.trim())

      setBusy(true)
      setMessage(null)
      try {
        const response = await fetch(`/api/admin/sites/${siteId}/documents?category=shared`, {
          method: 'POST',
          body: formData,
          credentials: 'include',
        })
        const json = await response.json().catch(() => ({}))
        if (!response.ok || json?.error) {
          const reason = json?.error || response.statusText || '업로드에 실패했습니다.'
          throw new Error(reason)
        }

        toast({
          title: '업로드 완료',
          description: '공유자료가 추가되었습니다.',
        })
        setMessage('공유자료 업로드가 완료되었습니다.')
        resetForm()
        const uploadedDoc = json?.data
        if (onSuccess) {
          onSuccess(uploadedDoc)
        } else {
          const target = redirectTo || `/dashboard/admin/sites/${siteId}?tab=shared`
          router.push(target)
          router.refresh()
        }
      } catch (error: any) {
        console.error('Shared document upload failed:', error)
        toast({
          title: '업로드 실패',
          description: error?.message || '공유자료 업로드를 완료할 수 없습니다.',
          variant: 'destructive',
        })
        setMessage(error?.message || '업로드 실패')
      } finally {
        setBusy(false)
      }
    },
    [
      description,
      file,
      onSuccess,
      redirectTo,
      resetForm,
      router,
      siteId,
      subCategory,
      tags,
      title,
      toast,
    ]
  )

  const handleCancel = useCallback(() => {
    resetForm()
    if (onCancel) {
      onCancel()
      return
    }
    router.push(redirectTo || `/dashboard/admin/sites/${siteId}?tab=shared`)
  }, [onCancel, redirectTo, resetForm, router, siteId])

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          {siteName ? `${siteName} 공유자료 업로드` : '공유자료 업로드'}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          현장 팀과 공유할 문서, 도면, 체크리스트 등을 업로드하세요. 최대 50MB, PDF/이미지/Office
          문서를 지원합니다.
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">파일</label>
        <Input
          type="file"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,image/*,.txt"
          onChange={handleFileChange}
          ref={fileInputRef}
          disabled={busy}
          required
        />
        <p className="text-xs text-muted-foreground">최대 50MB까지 업로드할 수 있습니다.</p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">제목</label>
        <Input
          value={title}
          onChange={event => setTitle(event.target.value)}
          placeholder="문서 제목"
          maxLength={120}
          disabled={busy}
          required
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">분류</label>
          <select
            value={subCategory}
            onChange={event => setSubCategory(event.target.value)}
            className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
            disabled={busy}
          >
            {SUBCATEGORY_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">태그 (쉼표로 구분)</label>
          <Input
            value={tags}
            onChange={event => setTags(event.target.value)}
            placeholder="예: 안전, 공정, 점검"
            disabled={busy}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">설명</label>
        <Textarea
          value={description}
          onChange={event => setDescription(event.target.value)}
          placeholder="문서에 대한 간단한 설명을 입력하세요."
          rows={4}
          disabled={busy}
        />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-muted-foreground">{message ?? uploadHint}</div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={handleCancel} disabled={busy}>
            취소
          </Button>
          <Button type="submit" disabled={busy || !file}>
            {busy ? '업로드 중…' : '업로드'}
          </Button>
        </div>
      </div>
    </form>
  )
}
