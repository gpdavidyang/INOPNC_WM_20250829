'use client'

import React from 'react'
import { DownloadCloud, ExternalLink } from 'lucide-react'
import { WorklogAttachment } from '@/types/worklog'

export interface AttachmentGalleryProps {
  items: WorklogAttachment[]
  zoom: number // 75 | 100 | 125 | 150
  onOpen?: (item: WorklogAttachment) => void
}

export const AttachmentGallery: React.FC<AttachmentGalleryProps> = ({ items, zoom, onOpen }) => {
  if (!items || items.length === 0) {
    return <p style={{ color: '#94a3b8', fontSize: 13 }}>첨부된 파일이 없습니다.</p>
  }

  const scale = Math.max(75, Math.min(150, zoom)) / 100

  return (
    <div className="attachment-gallery" style={{ ['--thumb-scale' as any]: String(scale) }}>
      {items.map(item => (
        <div key={item.id} className="attachment-card">
          <div className="attachment-card-title">{item.name}</div>
          {item.previewUrl ? (
            <img className="attachment-preview" src={item.previewUrl} alt={item.name} />
          ) : (
            <div className="attachment-preview" aria-hidden="true" />
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button
              type="button"
              className="viewer-action-btn secondary"
              onClick={() => onOpen?.(item)}
            >
              <ExternalLink size={16} aria-hidden="true" />
            </button>
            <a
              className="viewer-action-btn secondary"
              href={item.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <DownloadCloud size={16} aria-hidden="true" />
            </a>
          </div>
        </div>
      ))}
    </div>
  )
}

export default AttachmentGallery
