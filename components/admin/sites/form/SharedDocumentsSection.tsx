'use client'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { matchesSharedDocCategory } from '@/lib/documents/shared-documents'
import { CheckCircle2, Download, FileText, Trash2, Upload } from 'lucide-react'
import { useSharedDocuments } from '../hooks/useSharedDocuments'

interface SharedDocumentsSectionProps {
  siteId: string
}

export const SharedDocumentsSection = ({ siteId }: SharedDocumentsSectionProps) => {
  const { documents, loading, actionLoading, uploadDocument, deleteDocument, downloadDocument } =
    useSharedDocuments(siteId)

  const handleUpload = (category: 'ptw' | 'general', label: string) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (file) await uploadDocument(file, category, label)
    }
    input.click()
  }

  const ptwDocs = documents.filter(doc => matchesSharedDocCategory(doc, 'ptw'))
  const generalDocs = documents.filter(doc => {
    if (
      matchesSharedDocCategory(doc, 'ptw') ||
      matchesSharedDocCategory(doc, 'construction') ||
      matchesSharedDocCategory(doc, 'progress')
    )
      return false
    return true
  })

  const renderList = (title: string, docs: any[], category: 'ptw' | 'general') => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-black text-gray-400 uppercase tracking-widest">
          {title}
        </Label>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8 rounded-lg bg-gray-50 border-gray-200"
          onClick={() => handleUpload(category, title)}
          disabled={!!actionLoading}
        >
          {actionLoading === category ? (
            <LoadingSpinner size="sm" className="mr-2" />
          ) : (
            <Upload className="h-3 w-3 mr-1.5" />
          )}
          등록
        </Button>
      </div>

      {docs.length === 0 ? (
        <div className="p-8 text-center border-2 border-dashed border-gray-100 rounded-2xl text-gray-400 text-xs">
          등록된 파일이 없습니다.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2">
          {docs.map(doc => (
            <div
              key={doc.id}
              className="group flex items-center justify-between p-3 bg-gray-50/50 hover:bg-white dark:bg-gray-900/50 rounded-xl border border-transparent hover:border-gray-200 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                  <FileText className="w-4 h-4 text-gray-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100 line-clamp-1">
                    {doc.title || doc.file_name}
                  </p>
                  <p className="text-[10px] text-gray-400">
                    {new Date(doc.created_at).toLocaleDateString()} ·{' '}
                    {doc.profiles?.full_name || '관리자'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={() => downloadDocument(doc)}
                  disabled={actionLoading === doc.id}
                >
                  <Download className="w-3.5 h-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full text-red-500 hover:text-red-600 hover:bg-red-50"
                  onClick={() => deleteDocument(doc.id)}
                  disabled={actionLoading === doc.id}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-8 bg-white dark:bg-gray-800/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm animate-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center gap-2 mb-2">
        <CheckCircle2 className="w-5 h-5 text-blue-500" />
        <h3 className="text-lg font-black text-gray-900 dark:text-gray-100">현장 공유 자료</h3>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {renderList('안전 허가서 (PTW)', ptwDocs, 'ptw')}
          {renderList('일반 공유 문서', generalDocs, 'general')}
        </div>
      )}
    </div>
  )
}
