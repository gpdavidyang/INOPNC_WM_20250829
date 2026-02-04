'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import { fetchSignedUrlForRecord, openFileRecordInNewTab } from '@/lib/files/preview'
import { parseSupabaseStorageUrl } from '@/lib/storage/paths'
import { cn } from '@/lib/utils'
import { History } from 'lucide-react'
import { useEffect, useState } from 'react'

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
    if (docs[code] && Array.isArray(docs[code]) && docs[code].length > 0) {
      return docs[code]
    }
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
    if (!window.confirm('이 문서를 영구적으로 삭제하시겠습니까?')) return
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
      <DialogContent className="max-w-2xl rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
        <DialogHeader className="bg-[#1A254F] px-6 py-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <History className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl font-black text-white tracking-tight">
                문서 이력 및 버전 관리
              </DialogTitle>
              <p className="text-xs font-medium text-white/50 mt-1 uppercase tracking-wider">
                {siteName || siteId} · {docType}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-bold text-slate-400">버전 정보를 불러오고 있습니다...</p>
            </div>
          ) : versions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/30">
              <p className="text-slate-400 font-bold">등록된 버전이 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              {versions.map((v, idx) => {
                const isCurrent = Boolean(v?.metadata?.is_current)
                return (
                  <div
                    key={v.id}
                    className={cn(
                      'group flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border p-4 transition-all duration-300',
                      isCurrent
                        ? 'bg-blue-50/50 border-blue-200 shadow-sm'
                        : 'bg-white border-slate-100 hover:border-slate-200'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          'mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-black italic shadow-sm',
                          isCurrent ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'
                        )}
                      >
                        v{v.version ?? versions.length - idx}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={cn(
                              'font-bold truncate text-sm',
                              isCurrent ? 'text-blue-900' : 'text-slate-900'
                            )}
                          >
                            {v.title || v.file_name || '파일명 미상'}
                          </span>
                          {isCurrent && (
                            <Badge className="bg-blue-600 hover:bg-blue-700 font-black text-[10px] h-5 rounded-md border-none uppercase tracking-tighter">
                              현재 버전
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-[11px] font-medium text-slate-400">
                          {v.created_at ? (
                            <span className="flex items-center gap-1">
                              {new Date(v.created_at).toLocaleString('ko-KR')}
                            </span>
                          ) : null}
                          {v.mime_type && (
                            <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-500 font-bold uppercase tracking-tight">
                              {v.mime_type.split('/')[1] || v.mime_type}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant="outline"
                        size="xs"
                        className="h-8 rounded-lg font-bold border-slate-200 text-slate-600 hover:text-blue-600 hover:bg-blue-50 whitespace-nowrap transition-all px-3"
                        onClick={() => preview(v)}
                      >
                        미리보기
                      </Button>
                      <Button
                        variant="outline"
                        size="xs"
                        className="h-8 rounded-lg font-bold border-slate-200 text-slate-600 hover:text-blue-600 hover:bg-blue-50 whitespace-nowrap transition-all px-3"
                        onClick={() => download(v)}
                      >
                        다운로드
                      </Button>

                      {!isCurrent && (
                        <Button
                          variant="outline"
                          size="xs"
                          className="h-8 rounded-lg font-bold border-emerald-200 text-emerald-600 hover:bg-emerald-50 whitespace-nowrap transition-all px-3"
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
                              // trigger reload in parent or local
                              window.location.reload()
                              toast({ title: '현재 버전으로 지정되었습니다' })
                            } catch {
                              toast({ title: '지정 실패', variant: 'destructive' })
                            }
                          }}
                        >
                          지정
                        </Button>
                      )}

                      <Button
                        variant="outline"
                        size="xs"
                        className="h-8 rounded-lg font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-100 shadow-sm px-3"
                        onClick={() => remove(v.id)}
                      >
                        삭제
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="h-10 rounded-xl font-bold text-slate-500 hover:text-slate-900"
          >
            닫기
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
