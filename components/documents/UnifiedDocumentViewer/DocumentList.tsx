'use client'

import React from 'react'
import type { UnifiedDocument } from '@/hooks/use-unified-documents'

interface DocumentListProps {
  documents: UnifiedDocument[]
}

export default function DocumentList({ documents }: DocumentListProps) {
  return (
    <div className="space-y-2">
      {documents.map((doc) => (
        <div key={doc.id} className="p-4 border rounded">
          <h3 className="font-medium">{doc.title}</h3>
          <p className="text-sm text-gray-500">{doc.description}</p>
        </div>
      ))}
    </div>
  )
}