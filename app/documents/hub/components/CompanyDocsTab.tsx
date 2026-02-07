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
  if (loading) return <div className="p-8 text-center text-slate-500">로딩중...</div>
  if (docs.length === 0)
    return <div className="p-8 text-center text-slate-500">회사 서류가 없습니다.</div>

  return (
    <div className="doc-list pb-24">
      {docs.map(doc => {
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
