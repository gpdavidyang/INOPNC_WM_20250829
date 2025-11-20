'use client'

import React, { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { openFileRecordInNewTab, fetchSignedUrlForRecord } from '@/lib/files/preview'
import { parseSupabaseStorageUrl } from '@/lib/storage/paths'

interface Version {
  id: string
  title?: string
  file_url?: string
  file_name?: string
  mime_type?: string
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
  const toCanonicalDocType = (value: string | null | undefined): string => {
    if (!value) return ''
    return value
      .toString()
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
  }
  const normalizeDocumentList = (list: any[]): Version[] =>
    (Array.isArray(list) ? list : [])
      .map(item => {
        const createdAt = item?.createdAt ?? item?.created_at ?? null
        return { ...item, createdAt }
      })
      .sort((a, b) => {
        const aTime = new Date(a?.createdAt || a?.created_at || 0).getTime()
        const bTime = new Date(b?.createdAt || b?.created_at || 0).getTime()
        return bTime - aTime
      })

  const indexDocumentsByType = (docs: Record<string, Version[]> | undefined | null) => {
    const result: Record<string, Version[]> = {}
    if (!docs) return result
    for (const [key, value] of Object.entries(docs)) {
      if (!key) continue
      const normalizedList = normalizeDocumentList(value)
      result[key] = normalizedList
      const canonicalKey = toCanonicalDocType(key)
      if (canonicalKey && canonicalKey !== key) {
        result[canonicalKey] = normalizedList
      }
    }
    return result
  }

  const getDocsForType = (docs: Record<string, Version[]>, code: string): Version[] | undefined => {
    if (!code) return undefined
    const canonical = toCanonicalDocType(code)
    if (canonical && Array.isArray(docs[canonical]) && docs[canonical].length > 0) {
      return docs[canonical]
    }
    if (Array.isArray(docs[code]) && docs[code].length > 0) {
      return docs[code]
    }
    if (!canonical) return undefined
    for (const [key, value] of Object.entries(docs)) {
      if (toCanonicalDocType(key) === canonical && Array.isArray(value) && value.length > 0) {
        return value
      }
    }
    return undefined
  }

  useEffect(() => {
    const load = async () => {
      if (!open || !siteId || !docType) return
      setLoading(true)
      try {
        const res = await fetch(
          `/api/invoice/site/${encodeURIComponent(siteId)}?include_history=true`
        )
        const j = await res.json()
        const index = indexDocumentsByType(j?.data?.documents)
        const list = getDocsForType(index, docType || '') ?? []
        setVersions(Array.isArray(list) ? list : [])
      } catch {
        setVersions([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [open, siteId, docType])

  const buildFileRecord = (version: Version) => ({
    file_url: version.file_url,
    storage_bucket:
      version.metadata?.storage_bucket ||
      version.metadata?.storageBucket ||
      parseSupabaseStorageUrl(version.file_url || undefined)?.bucket ||
      undefined,
    storage_path: version.metadata?.storage_path || version.metadata?.storagePath || undefined,
    file_name: version.file_name,
    title: version.title || version.file_name,
  })

  const preview = async (version: Version) => {
    try {
      await openFileRecordInNewTab(buildFileRecord(version))
    } catch (error) {
      console.error('Preview failed', error)
      toast({ title: '미리보기 실패', variant: 'destructive' })
    }
  }

  const download = async (version: Version) => {
    try {
      const url = await fetchSignedUrlForRecord(buildFileRecord(version), {
        downloadName: version.file_name,
      })
      const anchor = window.document.createElement('a')
      anchor.href = url
      anchor.download = version.file_name || ''
      window.document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
    } catch (error) {
      console.error('Download failed', error)
      toast({ title: '다운로드 실패', variant: 'destructive' })
    }
  }

  const remove = async (id: string) => {
    try {
      const res = await fetch(`/api/invoice/documents/${encodeURIComponent(id)}`, {
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
                    v{v.version ?? 1} · {v.title || v.file_name || '-'}{' '}
                    {v?.metadata?.is_current ? (
                      <span className="ml-2 text-xs text-green-700">(현재)</span>
                    ) : null}
                  </div>
                  <div className="text-xs text-gray-500">
                    {v.created_at ? new Date(v.created_at).toLocaleString('ko-KR') : ''}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => preview(v)}>
                    보기
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => download(v)}>
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
                            `/api/invoice/site/${encodeURIComponent(String(siteId))}?include_history=true`
                          )
                          const j = await r.json()
                          const index = indexDocumentsByType(j?.data?.documents)
                          const list = getDocsForType(index, docType || '') ?? []
                          setVersions(Array.isArray(list) ? list : [])
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
