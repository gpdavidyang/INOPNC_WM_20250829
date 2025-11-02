'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'
import { Download, FileText, RefreshCw, Upload, Layers, Trash2 } from 'lucide-react'
import DocumentVersionsDialog from '@/components/admin/invoice/DocumentVersionsDialog'
import InvoiceUploadDialog from '@/components/admin/invoice/InvoiceUploadDialog'
import { DEFAULT_INVOICE_DOC_TYPES } from '@/lib/invoice/doc-types'

type StageKey = 'start' | 'progress' | 'completion'

type UploadTarget = {
  docType: string
  label: string
  defaultStage: StageKey
}

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

  const [uploadTarget, setUploadTarget] = useState<UploadTarget | null>(null)
  const [versionsTarget, setVersionsTarget] = useState<{ docType: string; siteId: string }>({
    docType: '',
    siteId,
  })
  const [versionsOpen, setVersionsOpen] = useState(false)

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
        setDocTypes(effectiveTypes)
        setDocuments(json?.data?.documents || {})
        const progressData: InvoiceStageProgress = json?.data?.progress || {
          start: { required: 0, fulfilled: 0 },
          progress: { required: 0, fulfilled: 0 },
          completion: { required: 0, fulfilled: 0 },
        }
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
    [onProgressUpdate, siteId, toast]
  )

  useEffect(() => {
    void fetchData()
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
      const res = await fetch(`/api/invoice/documents/${encodeURIComponent(doc.id)}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json?.error) {
        throw new Error(json?.error || '삭제에 실패했습니다.')
      }
      toast({ title: '삭제 완료' })
      await fetchData({ silent: true })
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
      const anchor = document.createElement('a')
      anchor.href = finalUrl
      anchor.download = doc?.file_name || ''
      anchor.target = '_blank'
      anchor.rel = 'noopener noreferrer'
      anchor.click()
    } catch {
      toast({ title: '다운로드 실패', variant: 'destructive' })
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
    const defaultStage = (latest?.stage as StageKey | null) ?? fallbackStage

    return (
      <div
        key={`${type.code}-${stage ?? 'other'}`}
        className="rounded-lg border bg-white p-4 shadow-sm space-y-3"
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">{type.label}</span>
              <Badge variant={fulfilled ? 'default' : 'outline'} className="text-xs">
                {fulfilled ? '등록됨' : '미등록'}
              </Badge>
            </div>
            {latest?.created_at ? (
              <div className="mt-1 text-xs text-muted-foreground">
                {new Date(latest.created_at).toLocaleString('ko-KR')}
                {latest?.uploader_name ? ` · ${latest.uploader_name}` : ''}
                {latest?.version ? ` · v${latest.version}` : ''}
              </div>
            ) : (
              <div className="mt-1 text-xs text-muted-foreground">최근 업로드 내역 없음</div>
            )}
            {latest?.title ? (
              <div className="mt-1 text-sm text-blue-600">{latest.title}</div>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setUploadTarget({
                  docType: type.code,
                  label: type.label,
                  defaultStage,
                })
              }}
              className="gap-1"
            >
              <Upload className="h-4 w-4" />
              {fulfilled ? '교체 업로드' : '업로드'}
            </Button>
            {fulfilled ? (
              <>
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
                  variant="outline"
                  onClick={() => {
                    setVersionsTarget({ docType: type.code, siteId })
                    setVersionsOpen(true)
                  }}
                  className="gap-1"
                >
                  <Layers className="h-4 w-4" />
                  이력 보기
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
            ) : null}
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
          onClick={() => fetchData({ silent: true })}
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
      {uploadTarget ? (
        <InvoiceUploadDialog
          open={!!uploadTarget}
          onOpenChange={open => {
            if (!open) {
              setUploadTarget(null)
            }
          }}
          siteId={siteId}
          docType={uploadTarget.docType}
          docTypeLabel={uploadTarget.label}
          defaultStage={uploadTarget.defaultStage}
          organizationId={organizationId}
          onUploaded={async () => {
            await fetchData({ silent: true })
          }}
        />
      ) : null}
    </>
  )
}
