'use client'

import { useToast } from '@/components/ui/use-toast'
import { DEFAULT_INVOICE_DOC_TYPES } from '@/lib/invoice/doc-types'
import { useCallback, useEffect, useRef, useState } from 'react'

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

export function useInvoiceDocuments(siteId: string, organizationId?: string | null) {
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
  const detailCache = useRef<Record<string, any>>({})

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
        const [siteRes, typesRes, summaryRes] = await Promise.all([
          fetch(`/api/invoice/site/${siteId}?include_history=false`),
          fetch(`/api/invoice/types`),
          fetch(
            `/api/invoice/summary?limit=500${organizationId ? `&organization_id=${organizationId}` : ''}`
          ),
        ])

        const siteJson = await siteRes.json()
        if (!siteRes.ok) throw new Error(siteJson.error || 'Failed to fetch site invoice data')

        let types: InvoiceDocType[] = DEFAULT_INVOICE_DOC_TYPES
        if (typesRes.ok) {
          const typesJson = await typesRes.json()
          if (Array.isArray(typesJson.data)) {
            types = typesJson.data.map((t: any) => ({
              code: t.code,
              label: t.label,
              required: t.required || { start: false, progress: false, completion: false },
              allowMultipleVersions: t.allowMultipleVersions !== false,
              sortOrder: t.sortOrder || 0,
              isActive: t.isActive !== false,
            }))
          }
        }

        const docsMap: Record<string, InvoiceDocument[]> = {}
        if (siteJson.data?.documents) {
          Object.entries(siteJson.data.documents).forEach(([code, list]) => {
            docsMap[toCanonicalDocType(code)] = normalizeDocumentList(list as any[])
            docsMap[code] = docsMap[toCanonicalDocType(code)]
          })
        }

        setDocTypes(types)
        setDocuments(docsMap)
        setProgress(computeProgress(docsMap, types))
      } catch (e: any) {
        toast({ title: 'Error', description: e.message, variant: 'destructive' })
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [siteId, organizationId, computeProgress, toast]
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
