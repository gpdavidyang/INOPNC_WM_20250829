'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'
import { Download, Eye, FileText, RefreshCw, Trash2 } from 'lucide-react'
import {
  InvoiceUploadForm,
  type StageKey,
  type UploadSuccessPayload,
} from '@/components/admin/invoice/InvoiceUploadDialog'
import { DEFAULT_INVOICE_DOC_TYPES } from '@/lib/invoice/doc-types'
import { parseSupabaseStorageUrl } from '@/lib/storage/paths'

interface InvoiceDocType {
  code: string
  label: string
  required: { start: boolean; progress: boolean; completion: boolean }
  allowMultipleVersions: boolean
  sortOrder: number
  isActive: boolean
}

interface InvoiceDocument {
  id: string
  title: string
  file_url?: string
  file_name?: string
  mime_type?: string
  version?: number
  uploaded_by?: string
  uploader_name?: string | null
  created_at?: string
  stage?: StageKey | null
  metadata?: any
  storage_path?: string | null
  storage_bucket?: string | null
}

export interface InvoiceStageProgress {
  start: { required: number; fulfilled: number }
  progress: { required: number; fulfilled: number }
  completion: { required: number; fulfilled: number }
}
const toCanonicalDocType = (value: string | null | undefined): string => {
  if (!value) return ''
  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

const normalizeDocumentList = (list: any[]): InvoiceDocument[] =>
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

const indexDocumentsByType = (
  docs: Record<string, InvoiceDocument[]> | undefined | null
): Record<string, InvoiceDocument[]> => {
  const result: Record<string, InvoiceDocument[]> = {}
  if (!docs) return result
  for (const [key, list] of Object.entries(docs)) {
    if (!key) continue
    const normalized = normalizeDocumentList(list)
    result[key] = normalized
    const canonicalKey = toCanonicalDocType(key)
    if (canonicalKey && canonicalKey !== key) {
      result[canonicalKey] = normalized
    }
  }
  return result
}

const getDocumentsForType = (
  docsMap: Record<string, InvoiceDocument[]>,
  code: string
): InvoiceDocument[] | undefined => {
  if (!code) return undefined
  const canonical = toCanonicalDocType(code)
  if (canonical && Array.isArray(docsMap[canonical]) && docsMap[canonical].length > 0) {
    return docsMap[canonical]
  }
  if (Array.isArray(docsMap[code]) && docsMap[code].length > 0) {
    return docsMap[code]
  }
  if (!canonical) return undefined
  for (const [key, value] of Object.entries(docsMap)) {
    if (toCanonicalDocType(key) === canonical && Array.isArray(value) && value.length > 0) {
      return value
    }
  }
  return undefined
}

const ensureDocumentsForType = (
  docsMap: Record<string, InvoiceDocument[]>,
  code: string,
  docs: InvoiceDocument[]
): Record<string, InvoiceDocument[]> => {
  const next = { ...docsMap }
  const normalized = normalizeDocumentList(docs)
  const canonical = toCanonicalDocType(code)
  const keys = new Set<string>()
  if (code) keys.add(code)
  if (canonical) keys.add(canonical)
  Object.keys(next).forEach(key => {
    if (canonical && toCanonicalDocType(key) === canonical) keys.add(key)
  })
  keys.forEach(key => {
    if (key) next[key] = normalized
  })
  return next
}

const removeDocumentFromMaps = (
  docsMap: Record<string, InvoiceDocument[]>,
  code: string,
  documentId: string
): Record<string, InvoiceDocument[]> => {
  const next = { ...docsMap }
  const canonical = toCanonicalDocType(code)
  const keys = new Set<string>()
  if (code) keys.add(code)
  if (canonical) keys.add(canonical)
  Object.keys(next).forEach(key => {
    if (canonical && toCanonicalDocType(key) === canonical) keys.add(key)
  })
  keys.forEach(key => {
    const filtered = normalizeDocumentList((next[key] || []).filter(item => item.id !== documentId))
    if (filtered.length === 0) {
      delete next[key]
    } else {
      next[key] = filtered
    }
  })
  return next
}

const findDocTypesForDocument = (
  docsMap: Record<string, InvoiceDocument[]>,
  documentId: string
): string[] => {
  const codes = new Set<string>()
  for (const [code, list] of Object.entries(docsMap)) {
    if (!Array.isArray(list)) continue
    if (list.some(item => item?.id === documentId)) {
      codes.add(code)
    }
  }
  return Array.from(codes)
}

const resolveStorageParams = (doc: InvoiceDocument) => {
  const metadata = (
    doc?.metadata && typeof doc.metadata === 'object' ? doc.metadata : {}
  ) as Record<string, any>
  const storagePath = doc.storage_path || metadata?.storage_path || metadata?.storagePath || null
  const storageBucket =
    doc.storage_bucket ||
    metadata?.storage_bucket ||
    metadata?.storageBucket ||
    parseSupabaseStorageUrl(doc.file_url || metadata?.file_url || undefined)?.bucket ||
    null
  return { storagePath, storageBucket }
}

const toInvoiceDocumentFromDetail = (
  detail: Record<string, any>,
  fallback?: InvoiceDocument
): InvoiceDocument => {
  const rawMetadata = (
    detail?.metadata && typeof detail.metadata === 'object' ? detail.metadata : {}
  ) as Record<string, any>
  const fallbackMetadata = (
    fallback?.metadata && typeof fallback.metadata === 'object' ? fallback.metadata : {}
  ) as Record<string, any>
  const mergedMetadata = { ...fallbackMetadata, ...rawMetadata }
  if (mergedMetadata?.source === 'summary') {
    delete mergedMetadata.source
  }

  const stageCandidate =
    (detail?.stage as StageKey | undefined) ??
    (rawMetadata?.stage as StageKey | undefined) ??
    (fallback?.stage as StageKey | undefined) ??
    null

  const createdAt = detail?.created_at || detail?.createdAt || fallback?.created_at || null
  let resolvedCreatedAt = ''
  if (createdAt) {
    const d = new Date(createdAt)
    resolvedCreatedAt = Number.isNaN(d.getTime()) ? '' : d.toISOString()
  }
  const storagePath =
    detail?.storage_path ||
    rawMetadata?.storage_path ||
    rawMetadata?.storagePath ||
    fallback?.storage_path ||
    null
  const storageBucket =
    detail?.storage_bucket ||
    rawMetadata?.storage_bucket ||
    rawMetadata?.storageBucket ||
    fallback?.storage_bucket ||
    parseSupabaseStorageUrl(
      detail?.file_url || rawMetadata?.file_url || fallback?.file_url || undefined
    )?.bucket ||
    null

  return {
    id: detail?.id || fallback?.id || '',
    title:
      detail?.title ||
      rawMetadata?.title ||
      fallback?.title ||
      detail?.file_name ||
      fallback?.file_name ||
      detail?.id ||
      fallback?.id ||
      '',
    file_url: detail?.file_url || rawMetadata?.file_url || fallback?.file_url || '',
    file_name: detail?.file_name || rawMetadata?.file_name || fallback?.file_name || '',
    mime_type: detail?.mime_type || fallback?.mime_type || '',
    uploaded_by: (detail as any)?.uploaded_by ?? fallback?.uploaded_by ?? null,
    uploader_name:
      detail?.uploader_name ??
      (detail as any)?.uploader?.full_name ??
      fallback?.uploader_name ??
      null,
    created_at: resolvedCreatedAt,
    stage: stageCandidate,
    metadata: mergedMetadata,
    storage_path: storagePath,
    storage_bucket: storageBucket,
  }
}

const STAGE_LABELS: Record<StageKey, string> = {
  start: '착수 단계',
  progress: '진행 단계',
  completion: '완료 단계',
}

const STAGE_STYLE: Record<StageKey, string> = {
  start: 'bg-blue-50 border-blue-200',
  progress: 'bg-amber-50 border-amber-200',
  completion: 'bg-emerald-50 border-emerald-200',
}

interface InvoiceDocumentsManagerProps {
  siteId: string
  siteName?: string | null
  organizationId?: string | null
  onProgressUpdate?: (progress: InvoiceStageProgress) => void
}

export default function InvoiceDocumentsManager({
  siteId,
  siteName,
  organizationId,
  onProgressUpdate,
}: InvoiceDocumentsManagerProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [docTypes, setDocTypes] = useState<InvoiceDocType[]>([])
  const [documents, setDocuments] = useState<Record<string, InvoiceDocument[]>>({})
  const [progress, setProgress] = useState<InvoiceStageProgress>({
    start: { required: 0, fulfilled: 0 },
    progress: { required: 0, fulfilled: 0 },
    completion: { required: 0, fulfilled: 0 },
  })
  const refreshTimeout = useRef<number | null>(null)
  const detailCache = useRef<Record<string, any>>({})

  const fetchDocumentDetail = useCallback(async (docId: string) => {
    if (!docId) throw new Error('문서 ID가 없습니다.')
    if (detailCache.current[docId]) return detailCache.current[docId]
    const res = await fetch(`/api/invoice/documents/${encodeURIComponent(docId)}`, {
      cache: 'no-store',
      credentials: 'include',
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok || json?.error) {
      throw new Error(json?.error || '문서 정보를 불러오지 못했습니다.')
    }
    const data = json?.data || {}
    detailCache.current[docId] = data
    return data
  }, [])

  const resolveDocumentDetail = useCallback(
    async (doc: InvoiceDocument) => {
      if (!doc?.id) throw new Error('문서 ID가 없습니다.')
      const detail = await fetchDocumentDetail(doc.id)
      return toInvoiceDocumentFromDetail(detail, doc)
    },
    [fetchDocumentDetail]
  )

  const enrichDocuments = useCallback(
    async (docsMap: Record<string, InvoiceDocument[]>) => {
      const idsToFetch = new Set<string>()
      for (const list of Object.values(docsMap)) {
        if (!Array.isArray(list)) continue
        for (const item of list) {
          if (!item?.id) continue
          const requiresDetail =
            !item.file_url ||
            !item.file_name ||
            !item.title ||
            item.metadata?.source === 'summary' ||
            item.title === item.id
          if (requiresDetail) idsToFetch.add(item.id)
        }
      }
      if (idsToFetch.size === 0) return docsMap

      let nextMap = { ...docsMap }
      const results = await Promise.all(
        Array.from(idsToFetch).map(async id => {
          try {
            const detail = await fetchDocumentDetail(id)
            return { id, detail }
          } catch {
            return null
          }
        })
      )
      for (const result of results) {
        if (!result?.detail) continue
        const { id, detail } = result
        const matchedTypes = findDocTypesForDocument(nextMap, id)
        if (matchedTypes.length === 0) continue
        for (const code of matchedTypes) {
          const existing = getDocumentsForType(nextMap, code) || []
          const fallback = existing.find(item => item.id === id)
          const transformed = toInvoiceDocumentFromDetail(detail, fallback)
          const merged = [transformed, ...existing.filter(item => item.id !== id)]
          nextMap = ensureDocumentsForType(nextMap, code, merged)
        }
      }
      return nextMap
    },
    [fetchDocumentDetail]
  )

  const computeStageProgress = useCallback(
    (docsMap: Record<string, InvoiceDocument[]>, types: InvoiceDocType[]) => {
      const progressAcc: InvoiceStageProgress = {
        start: { required: 0, fulfilled: 0 },
        progress: { required: 0, fulfilled: 0 },
        completion: { required: 0, fulfilled: 0 },
      }
      const sourceTypes = (types.length > 0 ? types : DEFAULT_INVOICE_DOC_TYPES).filter(
        t => t.isActive !== false
      )
      for (const type of sourceTypes) {
        const docsForType = getDocumentsForType(docsMap, type.code)
        const hasDoc = Array.isArray(docsForType) && docsForType.length > 0
        if (type.required.start) {
          progressAcc.start.required += 1
          if (hasDoc) progressAcc.start.fulfilled += 1
        }
        if (type.required.progress) {
          progressAcc.progress.required += 1
          if (hasDoc) progressAcc.progress.fulfilled += 1
        }
        if (type.required.completion) {
          progressAcc.completion.required += 1
          if (hasDoc) progressAcc.completion.fulfilled += 1
        }
      }
      return progressAcc
    },
    []
  )

  const fetchData = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!opts?.silent) {
        setLoading(true)
        detailCache.current = {}
      } else {
        setRefreshing(true)
      }
      try {
        const sitePromise = fetch(
          `/api/invoice/site/${encodeURIComponent(siteId)}?include_history=false`,
          { cache: 'no-store', credentials: 'include' }
        )
        const typesPromise = fetch(`/api/invoice/types`, {
          cache: 'no-store',
          credentials: 'include',
        })
        const summaryParams = new URLSearchParams({ limit: '500' })
        if (organizationId) summaryParams.set('organization_id', String(organizationId))
        const summaryPromise = fetch(`/api/invoice/summary?${summaryParams.toString()}`, {
          cache: 'no-store',
          credentials: 'include',
        })

        const [siteRes, typesRes, summaryRes] = await Promise.allSettled([
          sitePromise,
          typesPromise,
          summaryPromise,
        ])

        if (siteRes.status !== 'fulfilled') {
          throw new Error('기성 문서 데이터를 불러오지 못했습니다.')
        }
        const siteJson = await siteRes.value.json()
        if (!siteRes.value.ok || siteJson?.error) {
          throw new Error(siteJson?.error || '데이터를 불러오지 못했습니다.')
        }

        let settingsTypes: InvoiceDocType[] = []
        if (typesRes.status === 'fulfilled' && typesRes.value.ok) {
          try {
            const typesJson = await typesRes.value.json()
            if (Array.isArray(typesJson?.data)) {
              settingsTypes = typesJson.data.map((item: any) => ({
                code: item.code,
                label: item.label,
                required: item.required || {
                  start: false,
                  progress: false,
                  completion: false,
                },
                allowMultipleVersions: item.allowMultipleVersions !== false,
                sortOrder: Number(item.sortOrder ?? item.sort_order ?? 0),
                isActive: item.isActive !== false,
              }))
            }
          } catch {
            /* ignore settings fetch errors */
          }
        }

        const typesFromSite: InvoiceDocType[] = Array.isArray(siteJson?.data?.docTypes)
          ? siteJson.data.docTypes
          : []

        const effectiveTypesSource =
          settingsTypes.length > 0
            ? settingsTypes
            : typesFromSite.length > 0
              ? typesFromSite
              : DEFAULT_INVOICE_DOC_TYPES

        const effectiveTypes = effectiveTypesSource.map(t => ({
          code: t.code,
          label: t.label,
          required: t.required,
          allowMultipleVersions: t.allowMultipleVersions,
          sortOrder: Number((t as any).sortOrder ?? (t as any).sort_order ?? 0),
          isActive: t.isActive !== false,
        }))

        let docsMap: Record<string, InvoiceDocument[]> = indexDocumentsByType(
          siteJson?.data?.documents
        )

        if (summaryRes.status === 'fulfilled' && summaryRes.value.ok) {
          try {
            const summaryJson = await summaryRes.value.json().catch(() => ({}))
            const summarySites = Array.isArray(summaryJson?.data?.sites)
              ? summaryJson.data.sites
              : []
            const summaryForSite = summarySites.find((s: any) => s?.site_id === siteId)
            if (summaryForSite?.docs) {
              for (const [code, entry] of Object.entries(summaryForSite.docs)) {
                const docEntry = entry as any
                if (!docEntry || !docEntry.id) continue
                const existing = getDocumentsForType(docsMap, String(code))
                if (existing && existing.length > 0) continue
                const createdAtValue = docEntry.createdAt || docEntry.created_at || null
                const placeholder: InvoiceDocument = {
                  id: docEntry.id,
                  title: docEntry.label || docEntry.file_name || docEntry.id,
                  file_url: (docEntry as any).file_url || '',
                  file_name: docEntry.file_name || '',
                  mime_type: '',
                  uploaded_by: null,
                  uploader_name: null,
                  created_at:
                    createdAtValue && !Number.isNaN(new Date(createdAtValue).getTime())
                      ? new Date(createdAtValue).toISOString()
                      : '',
                  stage: null,
                  metadata: { source: 'summary', doc_type: code },
                }
                docsMap = ensureDocumentsForType(docsMap, String(code), [placeholder])
              }
            }
          } catch {
            /* ignore summary fallback errors */
          }
        }

        docsMap = await enrichDocuments(docsMap)

        setDocTypes(effectiveTypes)
        setDocuments(docsMap)
        const progressData: InvoiceStageProgress = computeStageProgress(docsMap, effectiveTypes)
        setProgress(progressData)
        if (onProgressUpdate) onProgressUpdate(progressData)
      } catch (error: any) {
        toast({
          title: '기성 문서 정보를 불러오지 못했습니다.',
          description: error?.message,
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [computeStageProgress, enrichDocuments, onProgressUpdate, organizationId, siteId, toast]
  )

  useEffect(() => {
    void fetchData()
    return () => {
      if (refreshTimeout.current) {
        clearTimeout(refreshTimeout.current)
        refreshTimeout.current = null
      }
    }
  }, [fetchData])

  const stageBuckets = useMemo(() => {
    const bucket: Record<StageKey, InvoiceDocType[]> = {
      start: [],
      progress: [],
      completion: [],
    }
    const other: InvoiceDocType[] = []

    docTypes
      .filter(t => t.isActive !== false)
      .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0))
      .forEach(type => {
        const included: StageKey[] = []
        if (type.required.start) included.push('start')
        if (type.required.progress) included.push('progress')
        if (type.required.completion) included.push('completion')
        if (included.length === 0) {
          other.push(type)
        } else {
          included.forEach(stage => bucket[stage].push(type))
        }
      })

    return { bucket, other }
  }, [docTypes])

  const hasAnyDocTypes = useMemo(() => {
    return (
      stageBuckets.bucket.start.length > 0 ||
      stageBuckets.bucket.progress.length > 0 ||
      stageBuckets.bucket.completion.length > 0 ||
      stageBuckets.other.length > 0
    )
  }, [stageBuckets])

  const handleDelete = async (docType: string, doc: InvoiceDocument) => {
    if (!doc?.id) return
    if (!window.confirm('선택한 문서를 삭제하시겠습니까?')) return
    try {
      const resolved = await resolveDocumentDetail(doc)
      const payload = {
        fileUrl: resolved.file_url || null,
        storagePath:
          (resolved as any)?.metadata?.storage_path &&
          typeof (resolved as any).metadata.storage_path === 'string'
            ? (resolved as any).metadata.storage_path
            : null,
      }
      const res = await fetch(`/api/invoice/documents/${encodeURIComponent(resolved.id)}`, {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json?.error) {
        throw new Error(json?.error || '삭제에 실패했습니다.')
      }
      toast({ title: '삭제 완료' })
      setDocuments(prev => {
        const next = removeDocumentFromMaps(prev, docType, resolved.id)
        if (docTypes.length > 0) setProgress(computeStageProgress(next, docTypes))
        return next
      })
      setTimeout(() => {
        void fetchData({ silent: true })
      }, 200)
    } catch (error: any) {
      toast({
        title: '삭제 실패',
        description: error?.message || '문제가 발생했습니다.',
        variant: 'destructive',
      })
    }
  }

  const handleDownload = async (docType: string, doc: InvoiceDocument) => {
    if (!doc?.id) return
    try {
      const resolved = doc.file_url ? doc : await resolveDocumentDetail(doc)
      const { storagePath, storageBucket } = resolveStorageParams(resolved as InvoiceDocument)
      let signedUrl = resolved.file_url || ''
      try {
        if (!signedUrl && !storagePath) throw new Error('파일 URL이 없습니다.')
        const params = new URLSearchParams()
        if (signedUrl) params.set('url', signedUrl)
        if (storagePath) params.set('path', storagePath)
        if (storageBucket) params.set('bucket', storageBucket)
        if (resolved.file_name) params.set('download', resolved.file_name)
        const qs = params.toString()
        if (qs) {
          const res = await fetch(`/api/files/signed-url?${qs}`, {
            credentials: 'include',
          })
          const json = await res.json()
          if (json?.url) signedUrl = json.url
        }
      } catch {
        /* ignore signed URL failure */
      }
      if (!signedUrl) throw new Error('파일 URL을 찾을 수 없습니다.')
      const anchor = document.createElement('a')
      anchor.href = signedUrl
      if (resolved.file_name) anchor.download = resolved.file_name
      anchor.rel = 'noopener noreferrer'
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      setDocuments(prev => {
        const existing = getDocumentsForType(prev, docType) || []
        const merged = [
          resolved as InvoiceDocument,
          ...existing.filter(item => item.id !== resolved.id),
        ]
        const next = ensureDocumentsForType(prev, docType, merged)
        if (docTypes.length > 0) setProgress(computeStageProgress(next, docTypes))
        return next
      })
    } catch (error: any) {
      toast({
        title: '다운로드 실패',
        description: error?.message || '문서를 다운로드할 수 없습니다.',
        variant: 'destructive',
      })
    }
  }

  const handlePreview = async (docType: string, doc: InvoiceDocument) => {
    if (!doc?.id) return
    try {
      const resolved = doc.file_url ? doc : await resolveDocumentDetail(doc)
      const { storagePath, storageBucket } = resolveStorageParams(resolved as InvoiceDocument)
      let finalUrl = resolved.file_url || ''
      if (!finalUrl && !storagePath) throw new Error('파일 URL을 찾을 수 없습니다.')
      try {
        const params = new URLSearchParams()
        if (finalUrl) params.set('url', finalUrl)
        if (storagePath) params.set('path', storagePath)
        if (storageBucket) params.set('bucket', storageBucket)
        const qs = params.toString()
        if (qs) {
          const res = await fetch(`/api/files/signed-url?${qs}`, {
            credentials: 'include',
          })
          const json = await res.json()
          if (json?.url) finalUrl = json.url
        }
      } catch {
        /* ignore signed URL failure */
      }
      if (!finalUrl) throw new Error('파일 URL을 찾을 수 없습니다.')
      window.open(finalUrl, '_blank', 'noopener,noreferrer')
      setDocuments(prev => {
        const existing = getDocumentsForType(prev, docType) || []
        const merged = [
          resolved as InvoiceDocument,
          ...existing.filter(item => item.id !== resolved.id),
        ]
        const next = ensureDocumentsForType(prev, docType, merged)
        if (docTypes.length > 0) setProgress(computeStageProgress(next, docTypes))
        return next
      })
    } catch (error: any) {
      toast({
        title: '미리보기 실패',
        description: error?.message || '문서를 열 수 없습니다.',
        variant: 'destructive',
      })
    }
  }

  const renderDocEntry = (type: InvoiceDocType, stage: StageKey | null) => {
    const docsForType = getDocumentsForType(documents, type.code)
    const latest = docsForType?.[0] as InvoiceDocument | undefined
    const fulfilled = Array.isArray(docsForType) && docsForType.length > 0
    const fallbackStage: StageKey =
      stage ??
      (type.required.start
        ? 'start'
        : type.required.progress
          ? 'progress'
          : type.required.completion
            ? 'completion'
            : 'start')
    const resolvedStage = (latest?.stage as StageKey | null) ?? fallbackStage
    const requiresStage = type.required.start || type.required.progress || type.required.completion
    const stageForUpload = stage ?? (requiresStage ? resolvedStage : null)

    return (
      <div
        key={`${type.code}-${stage ?? 'other'}`}
        className="rounded-lg border bg-white p-4 shadow-sm"
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
          <div className="min-w-[220px]">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <span className="text-sm font-semibold text-foreground">{type.label}</span>
              <Badge variant={fulfilled ? 'default' : 'outline'} className="text-xs">
                {fulfilled ? '등록됨' : '미등록'}
              </Badge>
            </div>
            {latest?.created_at ? (
              <div className="mt-1 text-xs text-muted-foreground space-x-1">
                {new Date(latest.created_at).toLocaleString('ko-KR')}
                {latest?.uploader_name ? <span>· {latest.uploader_name}</span> : null}
                {latest?.version ? <span>· v{latest.version}</span> : null}
              </div>
            ) : (
              <div className="mt-1 text-xs text-muted-foreground">최근 업로드 내역 없음</div>
            )}
            {latest?.title ? (
              <div className="mt-1 text-sm text-blue-600">{latest.title}</div>
            ) : null}
          </div>
          <div className="flex flex-col gap-2 w-full lg:w-auto lg:items-end">
            <InvoiceUploadForm
              siteId={siteId}
              docType={type.code}
              docTypeLabel={type.label}
              initialStage={stageForUpload}
              lockedStage={stage ?? null}
              organizationId={organizationId}
              onUploaded={async ({ docType, document }: UploadSuccessPayload) => {
                setDocuments(prev => {
                  const existing = getDocumentsForType(prev, docType) || []
                  const merged = [
                    document as InvoiceDocument,
                    ...existing.filter(item => item.id !== document.id),
                  ]
                  const next = ensureDocumentsForType(prev, docType, merged)
                  if (docTypes.length > 0) setProgress(computeStageProgress(next, docTypes))
                  return next
                })
              }}
              enableStageSelection={false}
              showTitleField={false}
              showDescriptionField={false}
              variant="compact"
              autoUpload
              className="w-full lg:w-auto lg:justify-end"
            />
            <div className="flex flex-wrap items-center gap-2 justify-start lg:justify-end">
              {fulfilled ? (
                <>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handlePreview(type.code, latest!)}
                    className="gap-1"
                  >
                    <Eye className="h-4 w-4" />
                    미리보기
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownload(type.code, latest!)}
                    className="gap-1"
                  >
                    <Download className="h-4 w-4" />
                    다운로드
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(type.code, latest!)}
                    className="gap-1"
                  >
                    <Trash2 className="h-4 w-4" />
                    삭제
                  </Button>
                </>
              ) : (
                <span className="text-xs text-muted-foreground">업로드할 파일을 선택하세요.</span>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderStageBlock = (stage: StageKey, items: InvoiceDocType[]) => {
    if (items.length === 0) return null
    const total = items.length
    const fulfilled = progress[stage]?.fulfilled ?? 0
    const required = progress[stage]?.required ?? total
    const completedRatio = required > 0 ? `${fulfilled}/${required}` : `${fulfilled}/${total}`
    return (
      <Card key={stage} className={cn('border transition-colors', STAGE_STYLE[stage])}>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4" />
            {STAGE_LABELS[stage]}
          </CardTitle>
          <Badge variant="secondary" className="bg-white text-xs">
            완료 {completedRatio}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.map(type => renderDocEntry(type, stage))}
        </CardContent>
      </Card>
    )
  }

  const renderOtherBlock = (items: InvoiceDocType[]) => {
    if (items.length === 0) return null
    return (
      <Card className="border border-gray-200">
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4" />
            기타 문서
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.map(type => renderDocEntry(type, null))}
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <div className="grid gap-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground">
            {siteName || '현장'} 기성 문서 관리
          </h3>
          <p className="text-xs text-muted-foreground">
            단계별 필수 문서를 업로드하여 기성 진행 상황을 관리하세요.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1"
          onClick={() => void fetchData({ silent: true })}
          disabled={refreshing}
        >
          <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
          새로고침
        </Button>
      </div>

      <div className="grid gap-4">
        {!hasAnyDocTypes ? (
          <Card className="border-dashed border-gray-300 bg-gray-50">
            <CardContent className="py-6 text-center space-y-2 text-sm text-muted-foreground">
              <p>활성화된 기성 문서 유형이 없습니다.</p>
              <p>
                기성 문서 유형을 설정하려면 관리자 화면 &gt; 기성청구 관리 &gt; 설정 탭에서 유형을
                추가하세요.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {(['start', 'progress', 'completion'] as StageKey[]).map(stage =>
              renderStageBlock(stage, stageBuckets.bucket[stage])
            )}
            {renderOtherBlock(stageBuckets.other)}
          </>
        )}
      </div>
    </>
  )
}
