'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { matchesSharedDocCategory } from '@/lib/documents/shared-documents'
import { fetchSignedUrlForRecord } from '@/lib/files/preview'
import { ChevronLeft, FileText, X } from 'lucide-react'
import { useEffect, useState } from 'react'

interface PtwPreviewDialogProps {
  open: boolean
  onClose: () => void
  siteId?: string
}

export function PtwPreviewDialog({ open, onClose, siteId }: PtwPreviewDialogProps) {
  const [loading, setLoading] = useState(false)
  const [docs, setDocs] = useState<any[]>([])
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)

  // Fetch Logic
  useEffect(() => {
    if (!open || !siteId) {
      setDocs([])
      setSelectedDoc(null)
      setPreviewUrl(null)
      return
    }

    const fetchDocs = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams({
          category: 'shared',
          limit: '50',
        })
        const res = await fetch(`/api/mobile/sites/${siteId}/documents?${params.toString()}`, {
          cache: 'no-store',
        })
        if (!res.ok) throw new Error('불러오기 실패')
        const json = await res.json()
        const allDocs = (json.data || []).map((d: any) => ({
          ...d,
          storage_bucket: 'documents',
          storage_path: d.metadata?.storage_path || d.metadata?.path || null,
        }))
        const ptwDocs = allDocs.filter((d: any) => matchesSharedDocCategory(d, 'ptw'))

        // Sort by date desc
        ptwDocs.sort(
          (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )

        setDocs(ptwDocs)

        // Auto-select if only one
        if (ptwDocs.length === 1) {
          handleSelectDoc(ptwDocs[0])
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchDocs()
  }, [open, siteId])

  const handleSelectDoc = async (doc: any) => {
    setSelectedDoc(doc)
    setPreviewLoading(true)
    try {
      const url = await fetchSignedUrlForRecord(doc)
      setPreviewUrl(url)
    } catch {
      setPreviewUrl(null)
    } finally {
      setPreviewLoading(false)
    }
  }

  const handleBack = () => {
    setSelectedDoc(null)
    setPreviewUrl(null)
  }

  const isImage = (doc: any) => {
    const type = (
      doc?.mime_type ||
      doc?.file_type ||
      doc?.content_type ||
      doc?.contentType ||
      ''
    ).toLowerCase()
    const name = (doc?.file_name || doc?.title || '').toLowerCase()
    if (
      type.includes('image') ||
      type.includes('jpg') ||
      type.includes('png') ||
      type.includes('jpeg')
    )
      return true
    if (name.endsWith('.jpg') || name.endsWith('.png') || name.endsWith('.jpeg')) return true
    return false
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent
        className="w-screen h-screen max-w-none m-0 rounded-none bg-[#1e1e1e] border-none text-white p-0 flex flex-col overflow-hidden z-[2300]"
        overlayClassName="z-[2300] bg-black/90"
        hideCloseButton
      >
        <DialogHeader className="h-[60px] bg-black border-b border-[#333] flex flex-row items-center justify-between px-4 shrink-0 space-y-0 text-white">
          <div className="flex items-center gap-2 overflow-hidden w-full">
            {selectedDoc ? (
              <button
                onClick={handleBack}
                className="p-2 -ml-2 text-white hover:bg-white/10 rounded-full transition-colors"
              >
                <ChevronLeft size={24} />
              </button>
            ) : (
              <button
                onClick={onClose}
                className="p-2 -ml-2 text-white hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            )}
            <DialogTitle className="text-lg font-bold truncate flex-1 text-white">
              {selectedDoc
                ? selectedDoc.title || selectedDoc.file_name
                : `작업허가서 목록 (${docs.length})`}
            </DialogTitle>
            <DialogDescription className="sr-only">
              작업허가서 미리보기 화면입니다.
            </DialogDescription>
            {selectedDoc && previewUrl && (
              <button
                onClick={() => window.open(previewUrl, '_blank')}
                className="ml-auto text-xs bg-[#333] text-white px-3 py-1.5 rounded-full border border-[#555] hover:bg-[#444] shrink-0 font-medium"
              >
                새창으로 열기
              </button>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto bg-[#1e1e1e] relative w-full">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <LoadingSpinner className="text-white" />
            </div>
          ) : docs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm p-8">
              <FileText className="w-12 h-12 text-gray-600 mb-4" />
              등록된 작업허가서가 없습니다.
            </div>
          ) : selectedDoc ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#1e1e1e]">
              {previewLoading ? (
                <LoadingSpinner className="text-white" />
              ) : previewUrl ? (
                isImage(selectedDoc) ? (
                  <img
                    src={previewUrl}
                    alt="preview"
                    className="object-contain max-w-full max-h-full"
                  />
                ) : (
                  <iframe
                    src={previewUrl}
                    className="w-full h-full border-0 bg-white"
                    title="PDF Preview"
                  />
                )
              ) : (
                <div className="p-4 text-sm text-red-400 font-bold">
                  미리보기를 불러올 수 없습니다.
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 space-y-3 max-w-screen-md mx-auto">
              {docs.map(doc => (
                <button
                  key={doc.id}
                  onClick={() => handleSelectDoc(doc)}
                  className="w-full bg-[#2a2a2a] p-4 rounded-xl border border-[#333] flex items-center gap-3 active:scale-[0.98] transition-all text-left shadow-sm hover:border-[#555]"
                >
                  <div className="w-10 h-10 rounded-lg bg-[#333] flex items-center justify-center shrink-0">
                    <FileText className="text-gray-300 w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-gray-100 truncate text-[16px]">
                      {doc.title || doc.file_name}
                    </div>
                    <div className="text-sm text-gray-400 mt-1 flex items-center gap-1.5">
                      <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                      <span className="w-0.5 h-3 bg-gray-600 inline-block" />
                      <span>{doc.uploader || doc.profiles?.full_name || '관리자'}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
