'use client'

import { useMemo } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DEFAULT_INVOICE_DOC_TYPES } from '@/lib/invoice/doc-types'
import type { UnifiedDocument } from '@/hooks/use-unified-documents'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Package, Share2, FileText, Download, Eye, File } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PartnerViewProps {
  documents: UnifiedDocument[]
  loading: boolean
  viewMode: 'list' | 'grid'
  selectedDocuments: string[]
  onSelectionChange: (ids: string[]) => void
  onDocumentAction: (action: string, documentIds: string[]) => void
  onDocumentClick: (document: UnifiedDocument) => void
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  onPageChange: (page: number) => void
  companyId?: string
}

export default function PartnerView({
  documents,
  loading,
  onDocumentAction,
  onDocumentClick,
  pagination,
  onPageChange,
}: PartnerViewProps) {
  const invoiceDocTypes = useMemo(
    () => DEFAULT_INVOICE_DOC_TYPES.filter(t => t.isActive !== false),
    []
  )

  const invoiceDocuments = useMemo(
    () => documents.filter(doc => doc.category_type === 'invoice'),
    [documents]
  )
  const sharedDocuments = useMemo(
    () => documents.filter(doc => doc.category_type === 'shared'),
    [documents]
  )
  const otherDocuments = useMemo(
    () => documents.filter(doc => !['invoice', 'shared'].includes(doc.category_type)),
    [documents]
  )

  const invoiceDocMap = useMemo(() => {
    const map = new Map<string, UnifiedDocument>()
    for (const doc of invoiceDocuments) {
      const key = String(doc.document_type || doc.metadata?.doc_type || '')
        .toLowerCase()
        .trim()
      if (key && !map.has(key)) {
        map.set(key, doc)
      }
    }
    return map
  }, [invoiceDocuments])

  const sections = useMemo(() => {
    return invoiceDocTypes.map(type => ({
      type,
      doc: invoiceDocuments.find(
        doc =>
          (doc.document_type || doc.metadata?.doc_type || '').toLowerCase() ===
          type.code.toLowerCase()
      ),
    }))
  }, [invoiceDocTypes, invoiceDocuments])

  const formatDate = (value?: string | null) => {
    if (!value) return ''
    try {
      return format(new Date(value), 'yyyy-MM-dd', { locale: ko })
    } catch {
      return String(value)
    }
  }

  const renderDocActions = (doc: UnifiedDocument | undefined) => (
    <div className="flex gap-2">
      <Button
        size="sm"
        variant="outline"
        disabled={!doc}
        onClick={() => doc && onDocumentClick(doc)}
        className="gap-1"
      >
        <Eye className="h-4 w-4" />
        보기
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={!doc}
        onClick={() => doc && onDocumentAction('download', [doc.id])}
        className="gap-1"
      >
        <Download className="h-4 w-4" />
        다운로드
      </Button>
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Alert>
        <Package className="h-4 w-4" />
        <AlertDescription>
          기성청구 문서는 관리자에 의해 공유되며, 파트너사는 열람과 다운로드만 가능합니다.
        </AlertDescription>
      </Alert>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Package className="h-5 w-5 text-yellow-600" />
          기성 문서 체크리스트
        </h3>
        {stageSections.map(section =>
          section.types.length === 0 ? null : (
            <Card key={section.stage}>
              <CardHeader className="py-3">
                <CardTitle className="flex items-center justify-between text-sm font-semibold">
                  <span>{section.label}</span>
                  <Badge variant="secondary">
                    완료{' '}
                    {
                      section.types.filter(type => invoiceDocMap.has(type.code.toLowerCase()))
                        .length
                    }
                    /{section.types.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {section.types.map(type => {
                  const doc =
                    invoiceDocMap.get(type.code.toLowerCase()) ?? invoiceDocMap.get(type.code)
                  const isUploaded = !!doc
                  return (
                    <div
                      key={`${section.stage}-${type.code}`}
                      className="flex flex-col gap-2 rounded border px-3 py-3 md:flex-row md:items-center md:justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">{type.label}</span>
                          <Badge
                            variant={isUploaded ? 'default' : 'outline'}
                            className={cn(
                              'text-xs',
                              isUploaded ? 'bg-green-100 text-green-700' : 'text-muted-foreground'
                            )}
                          >
                            {isUploaded ? '등록됨' : '미등록'}
                          </Badge>
                        </div>
                        {doc ? (
                          <div className="mt-1 text-xs text-muted-foreground">
                            {formatDate(doc.created_at)} · {doc.title || doc.file_name || '무제'}
                          </div>
                        ) : (
                          <div className="mt-1 text-xs text-muted-foreground">
                            공유된 문서가 없습니다.
                          </div>
                        )}
                      </div>
                      {renderDocActions(doc)}
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )
        )}
      </section>

      {sharedDocuments.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <Share2 className="h-5 w-5 text-blue-600" />
            공유문서
            <Badge variant="secondary">{sharedDocuments.length}</Badge>
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {sharedDocuments.map(doc => (
              <Card key={doc.id} className="border bg-white shadow-sm">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <span className="truncate">{doc.title || doc.file_name}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">{formatDate(doc.created_at)}</div>
                  {renderDocActions(doc)}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {otherDocuments.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <File className="h-5 w-5 text-gray-600" />
            기타 문서
            <Badge variant="secondary">{otherDocuments.length}</Badge>
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {otherDocuments.map(doc => (
              <Card key={doc.id} className="border bg-white shadow-sm">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <FileText className="h-4 w-4 text-gray-600" />
                    <span className="truncate">{doc.title || doc.file_name}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {doc.category_type?.toUpperCase()}
                  </div>
                  <div className="text-xs text-muted-foreground">{formatDate(doc.created_at)}</div>
                  {renderDocActions(doc)}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {documents.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center space-y-3">
            <Package className="h-12 w-12 text-gray-400 mx-auto" />
            <p className="text-gray-500">등록된 문서가 없습니다.</p>
          </CardContent>
        </Card>
      )}

      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
          >
            이전
          </Button>
          <span className="flex items-center px-3 text-sm">
            {pagination.page} / {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
          >
            다음
          </Button>
        </div>
      )}
    </div>
  )
}
