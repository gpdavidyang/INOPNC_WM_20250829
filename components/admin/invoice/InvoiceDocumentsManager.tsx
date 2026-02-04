'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { cn } from '@/lib/utils'
import { BarChart3, CheckCircle2, FileCheck, FileText, LayoutGrid, RefreshCw } from 'lucide-react'
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
  const p = useInvoiceDocuments(siteId)

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
        <p className="text-sm font-bold text-slate-400 animate-pulse">
          기성 문서 정보를 최신화하고 있습니다...
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      {/* 1. Progress Overview */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#1A254F] opacity-40" />
            <h3 className="text-xl font-black text-[#1A254F] uppercase tracking-tight">
              기성 준비 진척도
            </h3>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => p.fetchData(true)}
            className="rounded-xl h-10 px-5 font-bold border-slate-200 text-slate-600 hover:text-[#1A254F] hover:bg-slate-50 transition-all gap-2"
          >
            <RefreshCw className={cn('w-4 h-4', p.refreshing && 'animate-spin')} />
            새로고침
          </Button>
        </div>
        <InvoiceProgressSummary progress={p.progress} />
      </section>

      {/* 2. Document Stages */}
      {[
        { key: 'start', label: '착수 단계 필수 서류', color: 'blue', icon: FileCheck },
        { key: 'progress', label: '진행 단계 필수 서류', color: 'amber', icon: FileText },
        { key: 'completion', label: '완료 단계 최종 서류', color: 'emerald', icon: CheckCircle2 },
        { key: 'other', label: '기타 보조/추가 내역', color: 'gray', icon: LayoutGrid },
      ].map(stage => {
        const types = stageBuckets[stage.key]
        if (types.length === 0) return null

        return (
          <section key={stage.key} className="space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div
                className={cn(
                  'p-2 rounded-xl',
                  stage.color === 'blue'
                    ? 'bg-blue-50 text-blue-600'
                    : stage.color === 'amber'
                      ? 'bg-amber-50 text-amber-600'
                      : stage.color === 'emerald'
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-slate-50 text-slate-500'
                )}
              >
                <stage.icon className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-black text-[#1A254F] uppercase tracking-tight">
                {stage.label}
              </h3>
              <Badge
                variant="secondary"
                className="bg-slate-50 text-[#1A254F] border-slate-100 font-black text-[10px] h-6 rounded-lg px-2 shadow-sm"
              >
                {types.length} 항목
              </Badge>
            </div>

            <div className="grid gap-6">
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
