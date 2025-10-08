'use client'

import React, { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'

interface Version {
  id: string
  title?: string
  file_url?: string
  file_name?: string
  file_type?: string
  version?: number
  created_at?: string
  metadata?: any
}

export default function DocumentVersionsDialog({
  open,
  onOpenChange,
  siteId,
  docType,
  siteName,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  siteId?: string
  docType?: string
  siteName?: string
}) {
  const { toast } = useToast()
  const [versions, setVersions] = useState<Version[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      if (!open || !siteId || !docType) return
      setLoading(true)
      try {
        const res = await fetch(
          `/api/invoice/site/${encodeURIComponent(siteId)}?doc_type=${encodeURIComponent(docType)}`
        )
        const j = await res.json()
        const list = Array.isArray(j?.data?.[docType]) ? j.data[docType] : []
        setVersions(list)
      } catch {
        setVersions([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [open, siteId, docType])

  const preview = async (url?: string) => {
    if (!url) return
    try {
      let final = url
      try {
        const r = await fetch(`/api/files/signed-url?url=${encodeURIComponent(url)}`)
        const j = await r.json()
        if (j?.url) final = j.url
      } catch {
        /* ignore */
      }
      window.open(final, '_blank')
    } catch {
      toast({ title: '미리보기 실패', variant: 'destructive' })
    }
  }

  const download = async (url?: string) => {
    if (!url) return
    try {
      let final = url
      try {
        const r = await fetch(`/api/files/signed-url?url=${encodeURIComponent(url)}`)
        const j = await r.json()
        if (j?.url) final = j.url
      } catch {
        /* ignore */
      }
      const a = document.createElement('a')
      a.href = final
      a.download = ''
      a.click()
    } catch {
      toast({ title: '다운로드 실패', variant: 'destructive' })
    }
  }

  const remove = async (id: string) => {
    try {
      const res = await fetch(`/api/unified-documents/v2/${encodeURIComponent(id)}?hard=true`, {
        method: 'DELETE',
      })
      const j = await res.json()
      if (!res.ok || j?.error) throw new Error(j?.error || '삭제 실패')
      setVersions(prev => prev.filter(v => v.id !== id))
      toast({ title: '삭제됨' })
    } catch (e: any) {
      toast({ title: '삭제 실패', description: e?.message || '오류', variant: 'destructive' })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {siteName || siteId} · {docType} 버전
          </DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="text-sm text-muted-foreground">불러오는 중…</div>
        ) : versions.length === 0 ? (
          <div className="text-sm text-muted-foreground">버전이 없습니다.</div>
        ) : (
          <div className="space-y-2">
            {versions.map(v => (
              <div key={v.id} className="flex items-center justify-between rounded border p-2">
                <div>
                  <div className="font-medium">
                    v{v.version} · {v.title || v.file_name || '-'}{' '}
                    {v?.metadata?.is_current ? (
                      <span className="ml-2 text-xs text-green-700">(현재)</span>
                    ) : null}
                  </div>
                  <div className="text-xs text-gray-500">
                    {v.created_at ? new Date(v.created_at).toLocaleString('ko-KR') : ''}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => preview(v.file_url)}>
                    보기
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => download(v.file_url)}>
                    다운로드
                  </Button>
                  {!v?.metadata?.is_current && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          const res = await fetch('/api/invoice/current', {
                            method: 'PATCH',
                            headers: { 'content-type': 'application/json' },
                            body: JSON.stringify({
                              site_id: siteId,
                              doc_type: docType,
                              document_id: v.id,
                            }),
                          })
                          if (!res.ok) throw new Error('fail')
                          // reload
                          const r = await fetch(
                            `/api/invoice/site/${encodeURIComponent(String(siteId))}?doc_type=${encodeURIComponent(String(docType))}`
                          )
                          const j = await r.json()
                          const list = Array.isArray(j?.data?.[docType || ''])
                            ? j.data[docType || '']
                            : []
                          setVersions(list)
                          ;(document.activeElement as HTMLElement)?.blur()
                          toast({ title: '현재 버전 지정됨' })
                        } catch {
                          toast({ title: '지정 실패', variant: 'destructive' })
                        }
                      }}
                    >
                      현재로 지정
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => remove(v.id)}>
                    삭제
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
