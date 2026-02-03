'use client'

import { sitesApi } from '@/lib/api/sites'
import { fetchSignedUrlForRecord } from '@/lib/files/preview'
import { useCallback, useEffect, useState } from 'react'

export const useSharedDocuments = (siteId?: string) => {
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null) // category or docId

  const loadDocuments = useCallback(async () => {
    if (!siteId) return
    setLoading(true)
    setError(null)
    try {
      const data = await sitesApi.getSharedDocuments(siteId)
      setDocuments(data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [siteId])

  useEffect(() => {
    loadDocuments()
  }, [loadDocuments])

  const uploadDocument = async (file: File, category: string, label: string) => {
    if (!siteId) return
    setActionLoading(category)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('title', file.name)
      formData.append('sub_category', category)
      formData.append('description', label)

      await sitesApi.uploadSharedDocument(siteId, formData)
      await loadDocuments()
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    } finally {
      setActionLoading(null)
    }
  }

  const deleteDocument = async (docId: string) => {
    if (!siteId) return
    setActionLoading(docId)
    try {
      await sitesApi.deleteSharedDocument(siteId, docId)
      await loadDocuments()
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    } finally {
      setActionLoading(null)
    }
  }

  const downloadDocument = async (doc: any) => {
    setActionLoading(doc.id)
    try {
      const record = {
        file_url: doc.file_url || doc.url,
        storage_bucket: doc.storage_bucket || doc.bucket || doc.document?.storage_bucket,
        storage_path: doc.storage_path || doc.path || doc.document?.storage_path,
        file_name: doc.file_name || doc.title,
        title: doc.title,
      }
      const signedUrl = await fetchSignedUrlForRecord(record, {
        downloadName: record.file_name || undefined,
      })
      const anchor = window.document.createElement('a')
      anchor.href = signedUrl
      anchor.click()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setActionLoading(null)
    }
  }

  return {
    documents,
    loading,
    error,
    actionLoading,
    loadDocuments,
    uploadDocument,
    deleteDocument,
    downloadDocument,
    setError,
  }
}
