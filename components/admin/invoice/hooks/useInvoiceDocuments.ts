'use client'

import { useToast } from '@/components/ui/use-toast'
import { DEFAULT_INVOICE_DOC_TYPES } from '@/lib/invoice/doc-types'
import { useCallback, useEffect, useState } from 'react'

export type StageKey = 'start' | 'progress' | 'completion'

export interface InvoiceDocType {
  code: string
  label: string
  required: { start: boolean; progress: boolean; completion: boolean }
  allowMultipleVersions: boolean
  sortOrder: number
  isActive: boolean
}

export interface InvoiceDocument {
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
    .map(item => ({ ...item, createdAt: item?.createdAt ?? item?.created_at ?? null }))
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())

export function useInvoiceDocuments(siteId: string) {
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

  const getDocsForType = useCallback((docsMap: Record<string, InvoiceDocument[]>, code: string) => {
    const canonical = toCanonicalDocType(code)
    return (
      docsMap[canonical] ||
      docsMap[code] ||
      Object.values(docsMap).find(
        (v, k) => toCanonicalDocType(Object.keys(docsMap)[k]) === canonical
      )
    )
  }, [])

  const computeProgress = useCallback(
    (docsMap: Record<string, InvoiceDocument[]>, types: InvoiceDocType[]) => {
      const acc: InvoiceStageProgress = {
        start: { required: 0, fulfilled: 0 },
        progress: { required: 0, fulfilled: 0 },
        completion: { required: 0, fulfilled: 0 },
      }
      types
        .filter(t => t.isActive)
        .forEach(type => {
          const list = docsMap[toCanonicalDocType(type.code)] || docsMap[type.code]
          const hasDoc = Array.isArray(list) && list.length > 0
          if (type.required.start) {
            acc.start.required++
            if (hasDoc) acc.start.fulfilled++
          }
          if (type.required.progress) {
            acc.progress.required++
            if (hasDoc) acc.progress.fulfilled++
          }
          if (type.required.completion) {
            acc.completion.required++
            if (hasDoc) acc.completion.fulfilled++
          }
        })
      return acc
    },
    []
  )

  const fetchData = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true)
      else setRefreshing(true)

      try {
        const res = await fetch(`/api/invoice/site/${siteId}?include_history=false`)
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Failed to fetch site invoice data')

        const data = json.data || {}
        const types = data.docTypes || DEFAULT_INVOICE_DOC_TYPES
        const docsMap = data.documents || {}
        const progressData = data.progress || {
          start: { required: 0, fulfilled: 0 },
          progress: { required: 0, fulfilled: 0 },
          completion: { required: 0, fulfilled: 0 },
        }

        setDocTypes(types)
        setDocuments(docsMap)
        setProgress(progressData)
      } catch (e: any) {
        toast({ title: 'Error', description: e.message, variant: 'destructive' })
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [siteId, toast]
  )

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    loading,
    refreshing,
    docTypes,
    documents,
    progress,
    fetchData,
    setDocuments,
    setProgress,
    computeProgress,
  }
}
