'use client'

import { FileText, UploadCloud } from 'lucide-react'
import { useState } from 'react'

import { MyDoc } from '../doc-hub-data'
import { DocCard } from './DocCard'
// Using dynamic import for actions in the handler to match previous pattern, or direct import if fine.
// Direct import is fine for client components calling server actions usually.

// Simple cn utility
const cn = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(' ')

interface MyDocsTabProps {
  docs: MyDoc[]
  selectedIds: Set<string>
  onToggleSelection: (id: string) => void
  onRefresh: () => Promise<void>
  loading: boolean
  onDirectUpload: (doc: MyDoc) => void
  setSelectedIds: (ids: Set<string>) => void
}

export function MyDocsTab({
  docs,
  selectedIds,
  onToggleSelection,
  onRefresh,
  loading,
  onDirectUpload,
  setSelectedIds,
}: MyDocsTabProps) {
  const [isUploading, setIsUploading] = useState(false)

  /* Bulk Actions Helpers */
  const getSelectedDocs = () => {
    return docs.filter(d => selectedIds.has(d.id))
  }

  const downloadFile = (url: string, filename?: string) => {
    const a = document.createElement('a')
    a.href = url
    a.download = filename || 'document'
    a.target = '_blank'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  /* Bulk Handlers */
  /* Bulk Handlers */
  const handleBulkDelete = async () => {
    const selected = getSelectedDocs()

    // Filter out placeholders (IDs starting with 'req-')
    const realSubmissions = selected.filter(d => !d.id.startsWith('req-'))

    if (realSubmissions.length === 0) {
      if (selected.length > 0) {
        alert('제출되지 않은 문서는 삭제할 수 없습니다.')
      }
      return
    }

    if (!confirm(`${realSubmissions.length}개의 문서를 삭제하시겠습니까?`)) return

    try {
      setIsUploading(true)
      // Dynamic import to avoid server action issues if any
      const { deleteUserDocumentsAction } = await import('../actions')
      const result = await deleteUserDocumentsAction(realSubmissions.map(d => d.id))

      if (result.success) {
        alert(result.message || '삭제되었습니다.')
        setSelectedIds(new Set())
        await onRefresh()
      } else {
        alert(result.error || '삭제 실패')
      }
    } catch (e: any) {
      console.error(e)
      alert(`삭제 중 오류가 발생했습니다: ${e.message}`)
    } finally {
      setIsUploading(false)
    }
  }

  const handleBulkDownload = async () => {
    const selected = getSelectedDocs().filter(d => d.fileUrl)
    if (selected.length === 0) {
      alert('다운로드할 파일이 없습니다.')
      return
    }

    if (
      selected.length > 5 &&
      !confirm(`${selected.length}개의 파일을 다운로드합니다. 계속하시겠습니까?`)
    )
      return

    let count = 0
    for (const doc of selected) {
      if (doc.fileUrl) {
        setTimeout(() => {
          downloadFile(doc.fileUrl!, doc.title)
        }, count * 500)
        count++
      }
    }
  }

  const handleBulkShare = async () => {
    const selected = getSelectedDocs().filter(d => d.fileUrl)
    if (selected.length === 0) {
      alert('공유할 파일이 없습니다.')
      return
    }

    if (navigator.share) {
      try {
        const urls = selected.map(d => `${d.title}: ${d.fileUrl}`).join('\n')
        await navigator.share({
          title: '문서 공유',
          text: `${selected.length}개의 문서 링크입니다.\n${urls}`,
        })
      } catch (err) {
        console.log('Share canceled or failed', err)
      }
    } else {
      const urls = selected.map(d => `${d.title}: ${d.fileUrl}`).join('\n')
      try {
        await navigator.clipboard.writeText(urls)
        alert('문서 링크가 클립보드에 복사되었습니다.')
      } catch (err) {
        alert('공유 기능을 지원하지 않는 브라우저입니다.')
      }
    }
  }

  /* Rendering */
  if (loading) return <div className="p-8 text-center text-slate-500">로딩중...</div>
  if (docs.length === 0)
    return <div className="p-8 text-center text-slate-500">문서가 없습니다.</div>

  return (
    <>
      <div className="doc-list pb-24">
        {docs.map((doc: any) => {
          const isSelected = selectedIds.has(doc.id)
          const hasFile = doc.hasFile
          const myThumbUrl = doc.fileUrl && doc.hasFile ? doc.fileUrl : ''
          const status = doc.status

          let statusClass = 'status-none'
          let statusLabel = '미제출'

          let canUpload = true
          let canPreview = Boolean(doc.fileUrl)

          if (status === 'approved') {
            statusClass = 'status-approved'
            statusLabel = '승인완료'
            canUpload = false
          } else if (status === 'pending') {
            statusClass = 'status-pending'
            statusLabel = '심사중'
            canUpload = true
          } else if (status === 'rejected') {
            statusClass = 'status-rejected'
            statusLabel = '반려됨'
            canUpload = true
          } else {
            statusClass = 'status-none'
            statusLabel = '미제출'
            canUpload = true
            canPreview = false
          }

          return (
            <DocCard
              key={doc.id}
              id={doc.id}
              title={doc.title}
              desc={doc.desc}
              author={doc.author}
              date={doc.date}
              fileName={doc.fileName}
              thumbUrl={hasFile ? doc.fileUrl : undefined}
              hasFile={hasFile}
              isSelected={isSelected}
              statusLabel={statusLabel}
              statusClass={statusClass}
              onToggleSelection={onToggleSelection}
            >
              <div className="flex gap-2 mt-3">
                <button
                  className={cn('action-btn', !canPreview && 'opacity-50 cursor-not-allowed')}
                  disabled={!canPreview}
                  onClick={e => {
                    e.stopPropagation()
                    if (canPreview && doc.fileUrl) {
                      try {
                        const newWindow = window.open(doc.fileUrl, '_blank')
                        if (!newWindow) {
                          alert('팝업 차단이 설정되어 있습니다. 팝업을 허용해주세요.')
                          window.location.href = doc.fileUrl
                        }
                      } catch (err) {
                        console.error('Preview error:', err)
                        window.location.href = doc.fileUrl
                      }
                    } else {
                      alert('미리보기할 문서가 없습니다.')
                    }
                  }}
                >
                  <FileText size={16} />
                  <span>미리보기</span>
                </button>

                <button
                  className={cn(
                    'action-btn primary',
                    !canUpload && 'opacity-50 cursor-not-allowed'
                  )}
                  disabled={!canUpload}
                  onClick={e => {
                    e.stopPropagation()
                    if (canUpload) {
                      onDirectUpload(doc)
                    }
                  }}
                  style={{ marginLeft: 'auto' }}
                >
                  <UploadCloud size={16} />
                  <span>{hasFile ? '변경' : '업로드'}</span>
                </button>
              </div>
            </DocCard>
          )
        })}
      </div>
    </>
  )
}
