'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'
import { Download, Eye, FileText, RefreshCw, Trash2 } from 'lucide-react'
import DocumentVersionsDialog from '@/components/admin/invoice/DocumentVersionsDialog'
import {
  InvoiceUploadForm,
  type StageKey,
  type UploadSuccessPayload,
} from '@/components/admin/invoice/InvoiceUploadDialog'
import { DEFAULT_INVOICE_DOC_TYPES } from '@/lib/invoice/doc-types'

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
}

export interface InvoiceStageProgress {
  start: { required: number; fulfilled: number }
  progress: { required: number; fulfilled: number }
  completion: { required: number; fulfilled: number }
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
  const [versionsTarget, setVersionsTarget] = useState<{ docType: string; siteId: string }>({
    docType: '',
    siteId,
  })
  const [versionsOpen, setVersionsOpen] = useState(false)
  const refreshTimeout = useRef<number | null>(null)

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
        const hasDoc = (docsMap[type.code] || []).length > 0
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
      if (!opts?.silent) setLoading(true)
      else setRefreshing(true)
      try {
        const res = await fetch(
          `/api/invoice/site/${encodeURIComponent(siteId)}?include_history=false`,
          {
            cache: 'no-store',
            credentials: 'include',
          }
        )
        const json = await res.json()
        if (!res.ok || json?.error) {
          throw new Error(json?.error || '데이터를 불러오지 못했습니다.')
        }

        const typesFromServer: InvoiceDocType[] = Array.isArray(json?.data?.docTypes)
          ? json.data.docTypes
          : []
        const effectiveTypes = (
          typesFromServer.length > 0 ? typesFromServer : DEFAULT_INVOICE_DOC_TYPES
        ).map(t => ({
          code: t.code,
          label: t.label,
          required: t.required,
          allowMultipleVersions: t.allowMultipleVersions,
          sortOrder: Number((t as any).sortOrder ?? 0),
          isActive: t.isActive !== false,
        }))
        const docsMap: Record<string, InvoiceDocument[]> = json?.data?.documents || {}
        setDocTypes(effectiveTypes)
        setDocuments(docsMap)
        const progressData: InvoiceStageProgress =
          json?.data?.progress || computeStageProgress(docsMap, effectiveTypes)
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
    [computeStageProgress, onProgressUpdate, siteId, toast]
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

  const handleDelete = async (doc: InvoiceDocument) => {
    if (!doc.id) return
    if (!window.confirm('선택한 문서를 삭제하시겠습니까?')) return
    try {
      const payload = {
        fileUrl: doc.file_url || null,
        storagePath:
          (doc as any)?.metadata?.storage_path &&
          typeof (doc as any).metadata.storage_path === 'string'
            ? (doc as any).metadata.storage_path
            : null,
      }
      const res = await fetch(`/api/invoice/documents/${encodeURIComponent(doc.id)}`, {
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
        const next = { ...prev }
        Object.keys(next).forEach(key => {
          next[key] = (next[key] || []).filter(item => item.id !== doc.id)
        })
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

  const handleDownload = async (doc: InvoiceDocument) => {
    if (!doc.file_url) return
    try {
      let signedUrl = doc.file_url
      try {
        const params = new URLSearchParams({ url: doc.file_url })
        if (doc.file_name) params.set('download', doc.file_name)
        const res = await fetch(`/api/files/signed-url?${params.toString()}`, {
          credentials: 'include',
        })
        const json = await res.json()
        if (json?.url) signedUrl = json.url
      } catch {
        /* ignore signed URL failure */
      }
      const anchor = document.createElement('a')
      anchor.href = signedUrl
      if (doc.file_name) anchor.download = doc.file_name
      anchor.rel = 'noopener noreferrer'
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
    } catch (error: any) {
      toast({
        title: '다운로드 실패',
        description: error?.message || '문서를 다운로드할 수 없습니다.',
        variant: 'destructive',
      })
    }
  }

  const handlePreview = async (doc: InvoiceDocument) => {
    if (!doc.file_url) return
    try {
      let finalUrl = doc.file_url
      try {
        const res = await fetch(`/api/files/signed-url?url=${encodeURIComponent(doc.file_url)}`, {
          credentials: 'include',
        })
        const json = await res.json()
        if (json?.url) finalUrl = json.url
      } catch {
        /* ignore signed URL failure */
      }
      window.open(finalUrl, '_blank', 'noopener,noreferrer')
    } catch {
      toast({ title: '미리보기 실패', variant: 'destructive' })
    }
  }

  const renderDocEntry = (type: InvoiceDocType, stage: StageKey | null) => {
    const latest = documents[type.code]?.[0] as InvoiceDocument | undefined
    const fulfilled = !!latest
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
                  const next = { ...prev }
                  const cloned = Array.isArray(next[docType]) ? [...next[docType]] : []
                  const idx = cloned.findIndex(item => item.id === document.id)
                  if (idx >= 0) cloned[idx] = document as InvoiceDocument
                  else cloned.unshift(document as InvoiceDocument)
                  next[docType] = cloned
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
                    onClick={() => handlePreview(latest)}
                    className="gap-1"
                  >
                    <Eye className="h-4 w-4" />
                    미리보기
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownload(latest)}
                    className="gap-1"
                  >
                    <Download className="h-4 w-4" />
                    다운로드
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(latest)}
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

      <DocumentVersionsDialog
        open={versionsOpen}
        onOpenChange={setVersionsOpen}
        siteId={versionsTarget.siteId}
        docType={versionsTarget.docType}
        siteName={siteName ?? undefined}
      />
    </>
  )
}
