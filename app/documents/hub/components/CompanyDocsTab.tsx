'use client'

import { CompanyDoc } from '../doc-hub-data'
import { DocCard } from './DocCard'

interface CompanyDocsTabProps {
  docs: CompanyDoc[]
  selectedIds: Set<string>
  onToggleSelection: (id: string) => void
  loading: boolean
}

export function CompanyDocsTab({
  docs,
  selectedIds,
  onToggleSelection,
  loading,
}: CompanyDocsTabProps) {
  // 회사서류 탭에서는 "미등록"(파일 없음) 상태의 카드가 목록에 노출되면 안됨
  const visibleDocs = docs.filter(doc => typeof doc.url === 'string' && doc.url.trim().length > 0)

  if (loading) return <div className="p-8 text-center text-slate-500">로딩중...</div>
  if (visibleDocs.length === 0)
    return <div className="p-8 text-center text-slate-500">회사 서류가 없습니다.</div>

  return (
    <div className="doc-list pb-24">
      {visibleDocs.map(doc => {
        const isSelected = selectedIds.has(doc.id)
        const hasFile = !!doc.url

        return (
          <DocCard
            key={doc.id}
            id={doc.id}
            title={doc.title}
            desc={doc.category}
            author={doc.author}
            date={doc.date}
            fileName={doc.fileName}
            thumbUrl={doc.url}
            hasFile={hasFile}
            isSelected={isSelected}
            onToggleSelection={onToggleSelection}
          />
        )
      })}
    </div>
  )
}
