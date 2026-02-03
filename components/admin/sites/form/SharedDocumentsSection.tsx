'use client'

import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { matchesSharedDocCategory } from '@/lib/documents/shared-documents'
import { FileCheck, FileText, Share2, Upload } from 'lucide-react'
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

  const renderCard = (
    title: string,
    icon: React.ReactNode,
    docs: any[],
    category: 'ptw' | 'general'
  ) => (
    <div className="bg-white dark:bg-gray-800/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-lg font-black text-gray-900 dark:text-gray-100">{title}</h3>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-10 px-4 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all font-bold text-xs shadow-sm"
          onClick={() => handleUpload(category, title)}
          disabled={!!actionLoading}
        >
          {actionLoading === category ? (
            <LoadingSpinner size="sm" className="mr-2" />
          ) : (
            <Upload className="h-3.5 w-3.5 mr-2" />
          )}
          문서 등록
        </Button>
      </div>

      {docs.length === 0 ? (
        <div className="p-10 text-center border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-2xl text-gray-400 text-xs font-bold leading-relaxed">
          등록된 {title}가 없습니다.
          <br />
          우측 상단 버튼을 통해 파일을 업로드하세요.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {docs.map(doc => (
            <div
              key={doc.id}
              className="group flex items-center justify-between p-4 bg-gray-50/30 hover:bg-white dark:bg-gray-900/30 dark:hover:bg-gray-900 rounded-xl border border-transparent hover:border-gray-100 dark:hover:border-gray-800 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-50 dark:border-gray-700">
                  <FileText className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100 line-clamp-1">
                    {doc.title || doc.file_name}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {new Date(doc.created_at).toLocaleDateString()} ·{' '}
                    {doc.profiles?.full_name || '관리자'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 rounded-lg border-gray-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all text-[11px] font-bold"
                  onClick={() => downloadDocument(doc)}
                  disabled={actionLoading === doc.id}
                >
                  다운로드
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 rounded-lg border-gray-200 text-red-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all text-[11px] font-bold"
                  onClick={() => deleteDocument(doc.id)}
                  disabled={actionLoading === doc.id}
                >
                  삭제
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800/50 p-12 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col items-center justify-center gap-4">
        <LoadingSpinner />
        <p className="text-xs font-bold text-gray-400 animate-pulse">자료를 불러오고 있습니다...</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {renderCard(
        '작업허가서 (PTW)',
        <FileCheck className="w-5 h-5 text-emerald-500" />,
        ptwDocs,
        'ptw'
      )}
      {renderCard(
        '일반 공유 문서',
        <Share2 className="w-5 h-5 text-blue-500" />,
        generalDocs,
        'general'
      )}
    </div>
  )
}
