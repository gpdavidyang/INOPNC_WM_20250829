'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { cn } from '@/lib/utils'
import { RefreshCw } from 'lucide-react'
import React, { useMemo } from 'react'

import { fetchSignedUrlForRecord, openFileRecordInNewTab } from '@/lib/files/preview'
import { useInvoiceDocuments } from './hooks/useInvoiceDocuments'
import { InvoiceDocumentEntry } from './parts/InvoiceDocumentEntry'
import { InvoiceProgressSummary } from './parts/InvoiceProgressSummary'

interface InvoiceDocumentsManagerProps {
  siteId: string
  siteName?: string | null
  organizationId?: string | null
  onProgressUpdate?: (progress: any) => void
}

export default function InvoiceDocumentsManager({
  siteId,
  siteName,
  organizationId,
  onProgressUpdate,
}: InvoiceDocumentsManagerProps) {
  const p = useInvoiceDocuments(siteId, organizationId)

  // Sync progress back to parent
  React.useEffect(() => {
    if (onProgressUpdate) onProgressUpdate(p.progress)
  }, [p.progress, onProgressUpdate])

  const stageBuckets = useMemo(() => {
    const buckets: Record<string, any[]> = { start: [], progress: [], completion: [], other: [] }
    p.docTypes
      .filter(t => t.isActive)
      .forEach(type => {
        if (type.required.start) buckets.start.push(type)
        if (type.required.progress) buckets.progress.push(type)
        if (type.required.completion) buckets.completion.push(type)
        if (!type.required.start && !type.required.progress && !type.required.completion)
          buckets.other.push(type)
      })
    return buckets
  }, [p.docTypes])

  const handlePreview = async (doc: any) => {
    try {
      await openFileRecordInNewTab({
        file_url: doc.file_url,
        storage_bucket: doc.storage_bucket,
        storage_path: doc.storage_path,
        file_name: doc.file_name,
        title: doc.title,
      })
    } catch (e) {
      console.error(e)
    }
  }

  const handleDownload = async (doc: any) => {
    try {
      const signedUrl = await fetchSignedUrlForRecord({
        file_url: doc.file_url,
        storage_bucket: doc.storage_bucket,
        storage_path: doc.storage_path,
        file_name: doc.file_name,
        title: doc.title,
      })
      const a = document.createElement('a')
      a.href = signedUrl
      a.download = doc.file_name || doc.title
      a.click()
    } catch (e) {
      console.error(e)
    }
  }

  const handleDelete = async (docType: string, doc: any) => {
    if (!window.confirm('정말로 삭제하시겠습니까?')) return
    try {
      const res = await fetch(`/api/invoice/documents/${doc.id}`, { method: 'DELETE' })
      if (res.ok) {
        p.fetchData(true)
      }
    } catch (e) {
      console.error(e)
    }
  }

  if (p.loading && Object.keys(p.documents).length === 0) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-4">
        <LoadingSpinner />
        <p className="text-sm font-bold text-muted-foreground animate-pulse">
          기성 문서 정보를 구성 중입니다...
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-10 mt-6">
      {/* 1. Progress Overview */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-black text-foreground uppercase tracking-tight">
            기성 진행 현황
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => p.fetchData(true)}
            className="rounded-xl h-9 px-4 font-bold border"
          >
            <RefreshCw className={cn('w-4 h-4 mr-2', p.refreshing && 'animate-spin')} />
            업데이트
          </Button>
        </div>
        <InvoiceProgressSummary progress={p.progress} />
      </section>

      {/* 2. Document Stages */}
      {[
        { key: 'start', label: '착수 단계 서류', color: 'blue' },
        { key: 'progress', label: '진행 단계 서류', color: 'amber' },
        { key: 'completion', label: '완료 단계 서류', color: 'emerald' },
        { key: 'other', label: '기타 추가 내역', color: 'gray' },
      ].map(stage => {
        const types = stageBuckets[stage.key]
        if (types.length === 0) return null

        return (
          <section key={stage.key} className="space-y-4">
            <div className="flex items-center gap-3 pb-2 border-b-2">
              <h3 className="text-lg font-black text-foreground uppercase tracking-tight">
                {stage.label}
              </h3>
              <Badge variant="outline" className="text-[10px] font-black">
                {types.length} Types
              </Badge>
            </div>

            <div className="grid gap-4">
              {types.map(type => (
                <InvoiceDocumentEntry
                  key={type.code}
                  type={type}
                  docs={p.documents[type.code] || []}
                  siteId={siteId}
                  organizationId={organizationId}
                  onRefresh={() => p.fetchData(true)}
                  onPreview={handlePreview}
                  onDownload={handleDownload}
                  onDelete={doc => handleDelete(type.code, doc)}
                />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
