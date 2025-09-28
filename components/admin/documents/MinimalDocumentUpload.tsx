'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function MinimalDocumentUpload() {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('shared')
  const [siteId, setSiteId] = useState('')
  const [status, setStatus] = useState('active')
  const [desc, setDesc] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setMessage(null)
    try {
      if (file) {
        const fd = new FormData()
        fd.append('file', file)
        fd.append('title', title)
        if (desc) fd.append('description', desc)
        if (siteId) fd.append('siteId', siteId)
        fd.append('categoryType', category)
        const res = await fetch('/api/unified-documents/v2/upload', {
          method: 'POST',
          body: fd,
        })
        const json = await res.json()
        if (!res.ok || json?.success === false) {
          throw new Error(json?.error || '업로드 실패')
        }
        setMessage('파일이 업로드되었습니다.')
      } else {
        const payload: any = {
          title,
          category_type: category,
          status,
          description: desc || undefined,
        }
        if (siteId) payload.site_id = siteId

        const res = await fetch('/api/unified-documents/v2', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const json = await res.json()
        if (!res.ok || json?.success === false) {
          throw new Error(json?.error || '생성 실패')
        }
        setMessage('문서가 생성되었습니다.')
      }
      setTitle('')
      setDesc('')
      setFile(null)
    } catch (err: any) {
      setMessage(err?.message || '업로드 실패')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-sm text-muted-foreground mb-1">제목</label>
        <Input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="문서명"
          required
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-sm text-muted-foreground mb-1">카테고리</label>
          <select
            className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={category}
            onChange={e => setCategory(e.target.value)}
          >
            <option value="shared">공유문서</option>
            <option value="markup">도면마킹</option>
            <option value="photo_grid">사진대지</option>
            <option value="invoice">정산문서</option>
            <option value="required">필수서류</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-muted-foreground mb-1">현장 ID(선택)</label>
          <Input value={siteId} onChange={e => setSiteId(e.target.value)} placeholder="site_id" />
        </div>
        <div>
          <label className="block text-sm text-muted-foreground mb-1">상태</label>
          <select
            className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={status}
            onChange={e => setStatus(e.target.value)}
          >
            <option value="active">active</option>
            <option value="draft">draft</option>
            <option value="pending">pending</option>
            <option value="archived">archived</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm text-muted-foreground mb-1">파일(선택)</label>
        <input
          type="file"
          onChange={e => setFile(e.target.files?.[0] || null)}
          className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          aria-label="문서 파일"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          파일을 선택하면 업로드, 미선택 시 메타데이터만 생성합니다.
        </p>
      </div>
      <div>
        <label className="block text-sm text-muted-foreground mb-1">설명(선택)</label>
        <textarea
          className="w-full h-24 rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={desc}
          onChange={e => setDesc(e.target.value)}
          placeholder="짧은 설명"
        />
      </div>
      <div className="flex items-center gap-2">
        <Button type="submit" variant="outline" disabled={busy}>
          {busy ? '처리 중…' : '문서 생성'}
        </Button>
        {message && <span className="text-sm text-muted-foreground">{message}</span>}
      </div>
    </form>
  )
}
