'use client'

import Image from 'next/image'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  CustomSelect,
  CustomSelectContent,
  CustomSelectItem,
  CustomSelectTrigger,
  CustomSelectValue,
} from '@/components/ui/custom-select'
import { resolveSharedDocCategoryLabel } from '@/lib/documents/shared-documents'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'
import { FilePreviewButton } from '@/components/files/FilePreviewButton'
import { FileDownloadButton, FileShareButton } from '@/components/files/FileActionButtons'
import { fetchSignedUrlForRecord, openFileRecordInNewTab } from '@/lib/files/preview'
import type { CompanyDocumentType } from '@/lib/documents/company-types'
import {
  REQUIRED_DOC_STATUS_LABELS,
  normalizeRequiredDocStatus,
  type RequiredDocStatus,
} from '@/lib/documents/status'

type TabKey = 'mine' | 'company' | 'drawings' | 'photos'

type RequiredDocKey = string

const DEFAULT_REQUIRED_DOCS: Array<{ code: RequiredDocKey; title: string }> = [
  { code: 'pre-employment-checkup', title: '배치전 검진' },
  { code: 'safety-training', title: '기초안전보건교육' },
  { code: 'vehicle-insurance', title: '차량보험증' },
  { code: 'vehicle-registration', title: '차량등록증' },
  { code: 'bank-account-copy', title: '통장사본' },
  { code: 'id-card', title: '신분증' },
  { code: 'senior-documents', title: '고령자 서류' },
  { code: 'other', title: '기타' },
]

const REQUIRED_DOC_COPY_OVERRIDES: Record<
  string,
  {
    title?: string
    description?: string
  }
> = {
  safety_certificate: { description: '필수 안전교육증' },
  health_certificate: { description: '건강적합 증명' },
  insurance_certificate: { description: '보험 가입증명' },
  id_copy: { description: '신분증 사본' },
  license: { description: '자격/면허증' },
  other: { description: '프로젝트 추가서류' },
}

const COMPANY_LIST: Array<{ key: string; title: string }> = [
  { key: 'biz_reg', title: '사업자등록증' },
  { key: 'bankbook', title: '통장사본' },
  { key: 'npc1000_form', title: 'NPC-1000 공급승인서(양식)' },
  { key: 'completion_form', title: '작업완료확인서(양식)' },
]

const DRAWING_CATEGORY_LABELS: Record<string, string> = {
  plan: '공도면',
  progress: '진행도면',
  other: '기타',
}

const DOC_STATUS_BADGE_STYLES: Record<
  RequiredDocStatus,
  { label: string; background: string; color: string }
> = {
  approved: {
    label: REQUIRED_DOC_STATUS_LABELS.approved,
    background: '#dcfce7',
    color: '#166534',
  },
  rejected: {
    label: REQUIRED_DOC_STATUS_LABELS.rejected,
    background: '#fee2e2',
    color: '#b91c1c',
  },
  pending: {
    label: REQUIRED_DOC_STATUS_LABELS.pending,
    background: '#fef3c7',
    color: '#92400e',
  },
  not_submitted: {
    label: REQUIRED_DOC_STATUS_LABELS.not_submitted,
    background: '#fee2e2',
    color: '#9f1239',
  },
}

type CompanyDocRecord = {
  id?: string | number | null
  title?: string | null
  file_name?: string | null
  file_url?: string | null
  url?: string | null
  storage_bucket?: string | null
  storage_path?: string | null
  folder_path?: string | null
  created_at?: string | null
  tags?: string[] | null
  metadata?: Record<string, any> | null
  status?: string | null
}

type CompanyDocWithType = {
  id: string
  title?: string | null
  file_name?: string | null
  file_url?: string | null
  storage_bucket?: string | null
  storage_path?: string | null
  folder_path?: string | null
  created_at?: string | null
  tags?: string[] | null
  metadata?: Record<string, any> | null
  status?: string | null
  typeSlug: string
  typeName: string
}

type CompanyDocTypeWithDocs = CompanyDocumentType & {
  documents?: CompanyDocWithType[]
}

const normalizeCompanyDoc = (
  raw: CompanyDocRecord | null | undefined,
  type?: CompanyDocumentType
): CompanyDocWithType | null => {
  if (!raw) return null
  const metadata =
    raw.metadata && typeof raw.metadata === 'object' && !Array.isArray(raw.metadata)
      ? raw.metadata
      : null
  const fallbackId =
    typeof raw.id === 'string' && raw.id.length > 0
      ? raw.id
      : (() => {
          const base = raw.file_url || raw.url || raw.file_name || type?.slug || 'doc'
          const suffix =
            typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
              ? crypto.randomUUID()
              : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
          return `${base}-${suffix}`
        })()
  const fileUrl =
    raw.file_url || raw.url || metadata?.file_url || metadata?.url || raw.public_url || null
  const storageBucket =
    raw.storage_bucket ?? metadata?.storage_bucket ?? metadata?.bucket ?? raw.bucket ?? null
  const storagePath =
    raw.storage_path ?? raw.folder_path ?? metadata?.storage_path ?? metadata?.path ?? null
  return {
    id: String(fallbackId),
    title: raw.title || raw.file_name || metadata?.display_name || type?.name || '회사 문서',
    file_name: raw.file_name || metadata?.file_name || raw.title || null,
    file_url: fileUrl,
    storage_bucket: storageBucket,
    storage_path: storagePath,
    folder_path: raw.folder_path ?? null,
    created_at: raw.created_at || metadata?.created_at || null,
    tags: Array.isArray(raw.tags)
      ? raw.tags
      : Array.isArray(metadata?.tags)
        ? metadata?.tags
        : null,
    metadata,
    status: raw.status || metadata?.status || null,
    typeSlug: type?.slug || 'unmatched',
    typeName: type?.name || '분류되지 않은 문서',
  }
}

export default function DocumentHubPage() {
  const [active, setActive] = useState<TabKey>('mine')
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw-docs.js').catch(() => {})
    }
  }, [])

  // URL 쿼리 파라미터로 초기 탭 선택 지원 (?tab=drawings|photos|mine|company)
  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search)
      const tab = (sp.get('tab') || '').trim() as TabKey
      if (tab === 'mine' || tab === 'company' || tab === 'drawings' || tab === 'photos') {
        setActive(tab)
      }
    } catch {
      /* no-op */
    }
  }, [])

  return (
    <div className="doc-hub" style={{ padding: 16 }}>
      <div className="document-tabs" aria-label="문서함 탭">
        <div className="tab-row">
          <button
            className={`document-tab ${active === 'mine' ? 'active' : ''}`}
            onClick={() => setActive('mine')}
          >
            내문서함
          </button>
          <button
            className={`document-tab ${active === 'company' ? 'active' : ''}`}
            onClick={() => setActive('company')}
          >
            회사서류함
          </button>
        </div>
        <div className="tab-row">
          <button
            className={`document-tab ${active === 'drawings' ? 'active' : ''}`}
            onClick={() => setActive('drawings')}
          >
            현장도면외
          </button>
          <button
            className={`document-tab ${active === 'photos' ? 'active' : ''}`}
            onClick={() => setActive('photos')}
          >
            사진함
          </button>
        </div>
      </div>

      <div className="tab-content-wrapper" role="region" aria-live="polite">
        {active === 'mine' && <MyDocsTab />}
        {active === 'company' && <CompanyTab />}
        {active === 'drawings' && <DrawingsTab />}
        {active === 'photos' && <PhotosTab />}
      </div>
      <style jsx>{`
        .doc-hub {
          color: var(--text);
          background: var(--bg, #ffffff);
          min-height: 100vh;
        }
        .section-title {
          font-weight: 800;
          margin: 8px 0 10px;
          color: var(--text);
        }
        .document-tabs {
          display: grid;
          gap: 8px;
          margin-bottom: 12px;
        }
        .tab-row {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }
        .document-tab {
          border: 1px solid var(--line, #e5e7eb);
          background: var(--card, #ffffff);
          color: var(--text, #1f2937);
          border-radius: 10px;
          padding: 10px 12px;
          font-weight: 700;
        }
        .document-tab.active {
          border-color: #2f6bff;
          color: #2f6bff;
          background: color-mix(in srgb, #2f6bff 8%, transparent);
        }
        .tab-content-wrapper {
          color: var(--text);
        }
        /* Cards */
        .document-cards {
          border: 1px solid var(--line, #e5e7eb);
          background: var(--card, #ffffff);
          border-radius: 14px;
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .doc-item-site {
          font-size: 11px;
          color: #1d4ed8;
          background: rgba(59, 130, 246, 0.08);
          border: 1px solid rgba(59, 130, 246, 0.2);
          padding: 2px 8px;
          border-radius: 999px;
          white-space: nowrap;
        }
        :global(.doc-hub .drawing-card) {
          border: 1px solid rgba(148, 163, 184, 0.25);
          border-radius: 18px;
          background: rgba(248, 250, 252, 0.9);
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        :global(.doc-hub .drawing-card.selected) {
          border-color: #2563eb;
          background: rgba(219, 234, 254, 0.85);
          box-shadow: 0 12px 24px rgba(37, 99, 235, 0.14);
        }
        :global(.doc-hub .drawing-card__header) {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }
        :global(.doc-hub .drawing-card__title-wrap) {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        :global(.doc-hub .drawing-card__title) {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 15px;
          font-weight: 600;
          color: #0f172a;
        }
        :global(.doc-hub .drawing-card__meta) {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          font-size: 11px;
          color: #6b7280;
        }
        :global(.doc-hub .drawing-card__status) {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        :global(.doc-hub .drawing-card__badge) {
          display: inline-flex;
          align-items: center;
          font-size: 11px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 999px;
          background: rgba(15, 23, 42, 0.05);
          color: #111827;
        }
        :global(.doc-hub .drawing-card__badge.warning) {
          color: #b45309;
          background: rgba(251, 191, 36, 0.18);
        }
        :global(.doc-hub .drawing-card__connections) {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        :global(.doc-hub .drawing-card__actions) {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 8px;
          width: 100%;
        }
        :global(.doc-hub .drawing-card__actions-left),
        :global(.doc-hub .drawing-card__actions-right) {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        :global(.doc-hub .drawing-card__actions-left) {
          margin-right: auto;
        }
        @media (max-width: 520px) {
          :global(.doc-hub .drawing-card__actions) {
            justify-content: flex-end;
          }
        }
        :global(.doc-hub .drawing-card__actions .company-doc-btn) {
          border: 1px solid rgba(148, 163, 184, 0.45);
          background: var(--card, #fff);
          color: #0f172a;
          padding: 6px 14px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 600;
        }
        :global(.doc-hub .drawing-card__actions .company-doc-btn:hover) {
          border-color: #2563eb;
          color: #2563eb;
          background: rgba(37, 99, 235, 0.08);
        }
        .badge-link {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0 6px;
          font-size: 11px;
          font-weight: 600;
          line-height: 1.4;
          color: #1d4ed8;
          background: rgba(37, 99, 235, 0.08);
          border-radius: 999px;
          border: 1px solid rgba(37, 99, 235, 0.2);
        }
        .doc-category-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0 6px;
          font-size: 10px;
          font-weight: 600;
          line-height: 1.2;
          color: #374151;
          background: #f3f4f6;
          border: 1px solid #e5e7eb;
          border-radius: 999px;
        }
        .doc-category-plan {
          color: #374151;
          background: #f3f4f6;
          border-color: #e5e7eb;
        }
        .doc-category-progress {
          color: #7c2d12;
          background: rgba(251, 146, 60, 0.15);
          border-color: rgba(251, 146, 60, 0.35);
        }
        .doc-category-other {
          color: #4338ca;
          background: rgba(165, 180, 252, 0.2);
          border-color: rgba(129, 140, 248, 0.35);
        }
        .doc-meta-date {
          font-size: 11px;
          font-weight: 500;
          color: #6b7280;
        }
        .doc-meta-date.site-label {
          color: #1f2937;
          font-weight: 600;
        }
        .doc-meta-date.muted {
          color: #9ca3af;
        }
        .doc-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          justify-content: flex-end;
        }
        @media (max-width: 639px) {
          .doc-actions {
            width: 100%;
            justify-content: flex-start;
          }
        }
        .upload-actions {
          display: flex;
          gap: 8px;
          align-items: center;
          flex-wrap: wrap;
        }
        .upload-select {
          min-width: 150px;
        }
        .upload-btn {
          border: 1px solid var(--line, #e5e7eb);
          background: var(--card, #fff);
          color: var(--text, #1f2937);
          border-radius: 10px;
          padding: 8px 12px;
          font-weight: 700;
          font-size: 13px;
        }
        .upload-btn.uploaded {
          border-color: #16a34a;
          color: #16a34a;
          background: color-mix(in srgb, #16a34a 10%, transparent);
        }
        .doc-selection-title {
          font-size: 14px;
          font-weight: 700;
          color: #111827;
        }
        .doc-selection-description {
          margin-top: 4px;
          color: #6b7280;
          font-size: 10px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .doc-status-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 10px;
          padding: 2px 10px;
          border-radius: 999px;
          min-width: 60px;
        }
        @media (max-width: 480px) {
          .doc-status-badge {
            font-size: 10px;
            min-width: 48px;
          }
        }
        .doc-status-reason {
          margin-top: 4px;
          font-size: 10px;
          color: #b91c1c;
        }
        .doc-actions .btn,
        .foot .btn {
          border: 1px solid var(--line, #e5e7eb);
          background: var(--card, #fff);
          color: var(--text, #1f2937);
          font-size: 13px;
        }
        .preview-btn,
        .selection-checkmark {
          border: 1px solid var(--line, #e5e7eb);
          background: var(--card, #fff);
          color: var(--text, #1f2937);
          border-radius: 10px;
          padding: 8px 10px;
          font-size: 13px;
        }
        .selection-checkmark.active {
          border-color: #2f6bff;
          color: #2f6bff;
        }
        .btn-primary {
          background: #1a254f;
          color: #fff;
          border: 1px solid #1a254f;
        }
        /* Filters in drawings/photos */
        :global(.doc-hub .filters) {
          width: 100%;
        }
        :global(.doc-hub .filter-section) {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        :global(.doc-hub .filter-row) {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
        }
        :global(.doc-hub .filter-row-search) {
          grid-template-columns: 2fr minmax(100px, 1fr);
        }
        :global(.doc-hub .filters-divider.horizontal) {
          width: 100%;
          height: 1px;
          border-radius: 999px;
          background: #e3e8f5;
          margin: 6px 0;
        }
        :global(.doc-hub .upload-row) {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr;
          gap: 8px;
          align-items: center;
        }
        :global(.doc-hub .filters .select),
        :global(.doc-hub .filters .input) {
          border: 1px solid var(--line, #e5e7eb);
          background: var(--card, #fff);
          color: var(--text, #1f2937);
          border-radius: 10px;
          padding: 8px 10px;
          height: 44px;
        }
        :global(.doc-hub .filters .btn) {
          min-height: 44px;
          padding: 0 12px;
          border-radius: 10px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          white-space: nowrap;
        }
        :global(.doc-hub .filters .doc-filter-trigger),
        :global(.doc-hub .filters .upload-trigger) {
          border: 1px solid var(--line, #e5e7eb);
          background: var(--card, #fff);
          color: var(--text, #1f2937);
          border-radius: 10px;
          min-height: 44px;
          padding: 0 12px;
          font-weight: 600;
          font-size: 14px;
          text-align: left;
        }
        .upload-actions .select,
        .upload-actions .btn,
        .upload-actions .btn + .btn {
          min-height: 44px;
          display: inline-flex;
          align-items: center;
        }
        .upload-actions .btn {
          padding: 0 16px;
          border-radius: 10px;
          font-weight: 600;
        }
        .grid-thumbs {
          display: grid;
          grid-template-columns: repeat(1, minmax(0, 1fr));
          gap: 12px;
        }
        :global(.doc-hub .grid-thumbs) {
          display: grid !important;
          grid-template-columns: repeat(1, minmax(0, 1fr)) !important;
          gap: 12px !important;
        }
        @media (min-width: 700px) {
          .grid-thumbs,
          :global(.doc-hub .grid-thumbs) {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 14px !important;
          }
        }
        .grid-thumbs .thumb {
          background: var(--card, #fff);
          border: 1px solid var(--line, #e5e7eb);
          border-radius: 14px;
          overflow: hidden;
          display: block;
          box-shadow: 0 8px 18px rgba(17, 24, 39, 0.08);
          position: relative;
        }
        .grid-thumbs .thumb:hover {
          transform: none;
          box-shadow: 0 10px 22px rgba(17, 24, 39, 0.1);
        }

        /* Dark mode overrides */
        :global([data-theme='dark']) .doc-hub,
        :global(html.dark) .doc-hub {
          color: #e9eef5 !important;
          background: #0f172a !important;
        }
        :global([data-theme='dark']) .doc-hub .document-tab,
        :global(html.dark) .doc-hub .document-tab {
          border-color: #3a4048 !important;
          background: #11151b !important;
          color: #e9eef5 !important;
        }
        :global([data-theme='dark']) .doc-hub .document-tab.active,
        :global(html.dark) .doc-hub .document-tab.active {
          border-color: #2f6bff !important;
          color: #93c5fd !important;
          background: rgba(47, 107, 255, 0.15) !important;
        }
        :global([data-theme='dark']) .doc-hub .document-cards,
        :global([data-theme='dark']) .doc-hub .doc-selection-card,
        :global(html.dark) .doc-hub .doc-selection-card {
          border-color: #3a4048 !important;
          background: #11151b !important;
        }
        :global([data-theme='dark']) .doc-hub .section-title,
        :global([data-theme='dark']) .doc-hub .doc-selection-title,
        :global(html.dark) .doc-hub .doc-selection-title {
          color: #f8fafc;
        }
        :global([data-theme='dark']) .doc-hub .preview-btn,
        :global([data-theme='dark']) .doc-hub .selection-checkmark,
        :global([data-theme='dark']) .doc-hub .upload-btn,
        :global(html.dark) .doc-hub .preview-btn,
        :global(html.dark) .doc-hub .selection-checkmark,
        :global(html.dark) .doc-hub .upload-btn {
          border-color: #3a4048 !important;
          background: #11151b !important;
          color: #e9eef5 !important;
        }
        :global([data-theme='dark']) .doc-hub .doc-category-badge,
        :global(html.dark) .doc-hub .doc-category-badge {
          border-color: #475569 !important;
          background: #1f2937 !important;
          color: #e2e8f0 !important;
        }
        :global([data-theme='dark']) .doc-hub .doc-category-plan,
        :global(html.dark) .doc-hub .doc-category-plan {
          border-color: #475569 !important;
          background: #1f2937 !important;
          color: #e2e8f0 !important;
        }
        :global([data-theme='dark']) .doc-hub .doc-category-progress,
        :global(html.dark) .doc-hub .doc-category-progress {
          border-color: rgba(249, 115, 22, 0.4) !important;
          background: rgba(249, 115, 22, 0.15) !important;
          color: #ffedd5 !important;
        }
        :global([data-theme='dark']) .doc-hub .doc-category-other,
        :global(html.dark) .doc-hub .doc-category-other {
          border-color: rgba(129, 140, 248, 0.4) !important;
          background: rgba(129, 140, 248, 0.15) !important;
          color: #e0e7ff !important;
        }
        :global([data-theme='dark']) .doc-hub .doc-meta-date,
        :global(html.dark) .doc-hub .doc-meta-date {
          color: #a3b4d7 !important;
        }
        :global([data-theme='dark']) .doc-hub .upload-btn.uploaded,
        :global(html.dark) .doc-hub .upload-btn.uploaded {
          border-color: #22c55e !important;
          color: #86efac !important;
          background: rgba(34, 197, 94, 0.15) !important;
        }
        :global([data-theme='dark']) .doc-hub .selection-checkmark.active,
        :global(html.dark) .doc-hub .selection-checkmark.active {
          border-color: #2f6bff;
          color: #93c5fd;
        }
        :global([data-theme='dark']) .doc-hub .doc-actions .btn,
        :global([data-theme='dark']) .doc-hub .foot .btn,
        :global(html.dark) .doc-hub .doc-actions .btn,
        :global(html.dark) .doc-hub .foot .btn {
          border-color: #3a4048 !important;
          background: #11151b !important;
          color: #e9eef5 !important;
        }
        :global([data-theme='dark']) .doc-hub .btn-primary,
        :global(html.dark) .doc-hub .btn-primary {
          background: #0f3460 !important;
          border-color: #0f3460 !important;
        }
        :global([data-theme='dark']) .doc-hub .filters .select,
        :global([data-theme='dark']) .doc-hub .filters .input,
        :global([data-theme='dark']) .doc-hub .filters .doc-filter-trigger,
        :global([data-theme='dark']) .doc-hub .filters .upload-trigger,
        :global(html.dark) .doc-hub .filters .select,
        :global(html.dark) .doc-hub .filters .input,
        :global(html.dark) .doc-hub .filters .doc-filter-trigger,
        :global(html.dark) .doc-hub .filters .upload-trigger {
          border-color: #3a4048 !important;
          background: #11151b !important;
          color: #f8fafc !important;
        }
        :global([data-theme='dark']) .doc-hub .filters .filters-divider,
        :global(html.dark) .doc-hub .filters .filters-divider {
          background: #3a4048 !important;
        }
        :global([data-theme='dark']) .doc-hub .grid-thumbs .thumb,
        :global(html.dark) .doc-hub .grid-thumbs .thumb {
          background: #11151b !important;
          border-color: #3a4048 !important;
        }
        :global(html.dark) .doc-hub .tab-content-wrapper {
          color: #e9eef5;
        }
      `}</style>
    </div>
  )
}

type RequiredDocType = {
  id: string
  code: string
  title: string
  description?: string
  instructions?: string
}

type SubmissionInfo = {
  document_id?: string
  file_url?: string | null
  file_name?: string | null
  storage_bucket?: string | null
  storage_path?: string | null
  status?: RequiredDocStatus
  rejection_reason?: string | null
  updated_at?: string
}

async function saveBlobToDevice(blob: Blob, suggestedName?: string) {
  const downloadName = suggestedName || 'document'
  const enhancedWindow = window as Window & {
    showSaveFilePicker?: (options?: any) => Promise<any>
  }

  if (typeof enhancedWindow.showSaveFilePicker === 'function') {
    try {
      const handle = await enhancedWindow.showSaveFilePicker({
        suggestedName: downloadName,
        types: [
          {
            description: '문서 파일',
            accept: {
              'application/pdf': ['.pdf'],
              'image/*': ['.png', '.jpg', '.jpeg', '.heic', '.heif'],
              'application/msword': ['.doc'],
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
              'application/zip': ['.zip'],
            },
          },
        ],
      })
      const writable = await handle.createWritable()
      await writable.write(blob)
      await writable.close()
      return
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        throw error
      }
      console.warn('Native save picker failed, falling back to anchor download', error)
    }
  }

  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = downloadName
  anchor.rel = 'noopener'
  document.body.appendChild(anchor)
  anchor.click()
  setTimeout(() => {
    document.body.removeChild(anchor)
    URL.revokeObjectURL(url)
  }, 0)
}

function buildSubmissionMapFromRows(
  rows: any[],
  lookup?: Map<string, string>
): Record<string, SubmissionInfo> {
  const map: Record<string, SubmissionInfo> = {}
  if (!Array.isArray(rows)) return map

  const requirementLookup = lookup ?? new Map<string, string>()

  for (const s of rows) {
    const requirementId = s?.requirement_id || s?.requirement?.id || s?.requirement?.requirement_id
    let docType =
      s?.requirement?.code || s?.requirement?.document_type || s?.requirement?.documentType || ''
    if (!docType && requirementId) {
      docType = requirementLookup.get(String(requirementId)) || ''
    }
    const key = String(docType || '')
    const doc = s?.document
    if (!key) continue
    const rawStatus =
      s?.submission_status || doc?.status || (doc?.file_url ? 'pending' : 'not_submitted')
    const normalizedStatus = normalizeRequiredDocStatus(rawStatus)

    map[key] = {
      document_id: doc?.id,
      file_url: doc?.file_url,
      file_name: doc?.file_name,
      storage_bucket: doc?.storage_bucket ?? null,
      storage_path: doc?.storage_path ?? doc?.folder_path ?? null,
      status: normalizedStatus,
      rejection_reason: s?.rejection_reason,
      updated_at: s?.updated_at,
    }
  }
  return map
}

function MyDocsTab() {
  const { toast } = useToast()
  const [uploaded, setUploaded] = useState<Record<string, File | null>>({})
  const [requiredTypes, setRequiredTypes] = useState<RequiredDocType[]>([])
  const [submissions, setSubmissions] = useState<Record<string, SubmissionInfo>>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const typeCodeLookup = useMemo(() => {
    const map = new Map<string, string>()
    requiredTypes.forEach(rt => map.set(String(rt.id), rt.code))
    return map
  }, [requiredTypes])

  const refreshSubmissions = useCallback(async () => {
    try {
      const res = await fetch('/api/user-document-submissions', { credentials: 'include' })
      const subsJson = await res.json().catch(() => ({}))
      if (res.ok && Array.isArray(subsJson?.data)) {
        setSubmissions(buildSubmissionMapFromRows(subsJson.data, typeCodeLookup))
      }
    } catch (error) {
      console.error('Failed to refresh submissions', error)
    }
  }, [typeCodeLookup])

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        const [typesRes, subsRes] = await Promise.all([
          fetch('/api/required-document-types', { credentials: 'include' }),
          fetch('/api/user-document-submissions', { credentials: 'include' }),
        ])
        const typesJson = await typesRes.json().catch(() => ({}))
        const subsJson = await subsRes.json().catch(() => ({}))
        const list = Array.isArray(typesJson?.required_documents)
          ? (typesJson.required_documents as Array<any>)
              .map(it => ({
                id: String(it.id),
                code: String(it.code || it.document_type || ''),
                title: String(it.name_ko || it.name_en || it.code || '필수 서류'),
                description: it.description,
                instructions: it.instructions,
                sort_order: typeof it.sort_order === 'number' ? it.sort_order : 0,
              }))
              .filter(it => !!it.code)
              .sort((a, b) => a.sort_order - b.sort_order)
          : []
        if (list.length > 0) {
          setRequiredTypes(list)
        } else {
          setRequiredTypes(
            DEFAULT_REQUIRED_DOCS.map(doc => ({ id: doc.code, code: doc.code, title: doc.title }))
          )
        }

        const lookup = new Map(list.map(item => [String(item.id), item.code]))
        if (Array.isArray(subsJson?.data)) {
          setSubmissions(buildSubmissionMapFromRows(subsJson.data, lookup))
        } else {
          setSubmissions({})
        }
      } catch (error) {
        console.error('Failed to load required document data', error)
        setRequiredTypes(
          DEFAULT_REQUIRED_DOCS.map(doc => ({ id: doc.code, code: doc.code, title: doc.title }))
        )
        setSubmissions({})
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const toggle = (k: string) => {
    setSelected(prev => {
      const n = new Set(prev)
      if (n.has(k)) n.delete(k)
      else n.add(k)
      return n
    })
  }
  const onPick = (k: string) => {
    inputRefs.current[k]?.click()
  }
  const onFile = async (k: string, f?: File) => {
    if (!f) return
    setUploaded(prev => ({ ...prev, [k]: f }))
    // Find requirementId by code mapping
    const req = requiredTypes.find(rt => rt.code === k)
    const requirementId = req?.id
    try {
      const form = new FormData()
      form.append('file', f)
      form.append('category', 'personal')
      form.append('documentType', 'personal')
      if (requirementId) {
        form.append('isRequired', 'true')
        form.append('requirementId', requirementId)
      }
      const res = await fetch('/api/documents', {
        method: 'POST',
        body: form,
        credentials: 'include',
      })
      const json = await res.json()
      if (!res.ok || json?.error) throw new Error(json?.error || '업로드 실패')
      const docId = json?.data?.id
      if (requirementId) {
        await fetch('/api/user-document-submissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ requirement_id: requirementId, document_id: docId }),
        })
        setSubmissions(prev => ({
          ...prev,
          [k]: {
            document_id: docId ? String(docId) : undefined,
            file_url: json?.data?.url,
            file_name: f.name,
            status: 'pending',
            rejection_reason: undefined,
            updated_at: new Date().toISOString(),
          },
        }))
        await refreshSubmissions()
      }
    } catch (e: any) {
      toast({
        title: '업로드 실패',
        description: e?.message || '업로드 중 오류',
        variant: 'destructive',
      })
    }
  }

  const selectedFiles = useMemo(
    () =>
      Array.from(selected)
        .map(k => uploaded[k])
        .filter(Boolean) as File[],
    [selected, uploaded]
  )
  const selectedRemoteUrls = useMemo(
    () =>
      Array.from(selected)
        .map(k => submissions[k]?.file_url)
        .filter(Boolean) as string[],
    [selected, submissions]
  )
  const selectedRemoteEntries = useMemo(
    () =>
      Array.from(selected)
        .map(k => submissions[k])
        .filter(
          (info): info is SubmissionInfo =>
            !!info && (!!info.file_url || (!!info.storage_bucket && !!info.storage_path))
        ),
    [selected, submissions]
  )

  const resolveRemoteSubmissionAsset = useCallback(async (info: SubmissionInfo) => {
    if (!info) return null
    let downloadUrl = info.file_url || null
    const needsSignedUrl =
      !!info.storage_bucket &&
      !!info.storage_path &&
      (!downloadUrl || /\/object\/sign\//.test(downloadUrl))

    if (needsSignedUrl && info.storage_bucket && info.storage_path) {
      const params = new URLSearchParams()
      params.set('bucket', info.storage_bucket)
      params.set('path', info.storage_path)
      if (info.file_name) params.set('filename', info.file_name)
      if (info.file_url) params.set('url', info.file_url)
      try {
        const res = await fetch(`/api/files/signed-url?${params.toString()}`, {
          credentials: 'include',
        })
        const json = await res.json().catch(() => ({}))
        if (res.ok && json?.url) {
          downloadUrl = json.url
        }
      } catch (error) {
        console.warn('Failed to load signed URL for submission', error)
      }
    }

    if (!downloadUrl && info.storage_bucket && info.storage_path) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
      if (supabaseUrl) {
        const encodedPath = encodeURIComponent(info.storage_path).replace(/%2F/g, '/')
        downloadUrl = `${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/public/${info.storage_bucket}/${encodedPath}`
      }
    }

    if (!downloadUrl) return null
    const response = await fetch(downloadUrl, { credentials: 'include' })
    if (!response.ok) throw new Error('파일을 불러오지 못했습니다.')
    const blob = await response.blob()
    const safeName = info.file_name || `document-${Date.now()}`
    return { blob, fileName: safeName, downloadUrl }
  }, [])

  const shortenDescription = useCallback((text?: string | null, limit = 15) => {
    if (!text) return ''
    const trimmed = text.trim()
    if (!trimmed) return ''
    const effectiveLimit = Math.max(1, limit)
    return trimmed.length <= effectiveLimit ? trimmed : `${trimmed.slice(0, effectiveLimit)}…`
  }, [])

  const onSave = useCallback(async () => {
    if (saving) return
    const hasLocal = selectedFiles.length > 0
    const hasRemote = selectedRemoteEntries.length > 0

    if (!hasLocal && !hasRemote) {
      toast({ title: '선택 필요', description: '먼저 파일을 선택해 주세요.', variant: 'warning' })
      return
    }

    setSaving(true)
    try {
      if (hasLocal) {
        for (const file of selectedFiles) {
          await saveBlobToDevice(file, file.name)
        }
      }
      if (hasRemote) {
        for (const info of selectedRemoteEntries) {
          const resolved = await resolveRemoteSubmissionAsset(info)
          if (!resolved) continue
          await saveBlobToDevice(resolved.blob, resolved.fileName)
        }
      }
      toast({ title: '저장 완료', description: '선택한 문서를 기기에 저장했습니다.' })
    } catch (error: any) {
      if (error?.name !== 'AbortError') {
        console.error('Failed to save selected documents', error)
        toast({
          title: '저장 실패',
          description: error?.message || '파일 저장 중 오류가 발생했습니다.',
          variant: 'destructive',
        })
      }
    } finally {
      setSaving(false)
    }
  }, [saving, selectedFiles, selectedRemoteEntries, resolveRemoteSubmissionAsset, toast])
  const onShare = useCallback(async () => {
    if (sharing) return
    const hasLocal = selectedFiles.length > 0
    const hasRemote = selectedRemoteEntries.length > 0
    if (!hasLocal && !hasRemote) {
      toast({ title: '선택 필요', description: '먼저 파일을 선택해 주세요.', variant: 'warning' })
      return
    }
    const nav: any = navigator as any
    if (typeof nav?.share !== 'function') {
      toast({
        title: '공유 안내',
        description:
          '이 기기는 네이티브 공유 기능을 지원하지 않습니다. 저장 후 다른 앱으로 공유해 주세요.',
        variant: 'info',
      })
      return
    }
    setSharing(true)
    try {
      const shareFiles: File[] = []
      const shareLinks: string[] = []
      if (hasLocal) {
        shareFiles.push(...selectedFiles)
      }
      if (hasRemote) {
        for (const info of selectedRemoteEntries) {
          const resolved = await resolveRemoteSubmissionAsset(info)
          if (!resolved) continue
          shareLinks.push(resolved.downloadUrl)
          const remoteFile = new File([resolved.blob], resolved.fileName, {
            type: resolved.blob.type || 'application/octet-stream',
          })
          shareFiles.push(remoteFile)
        }
      }

      const shareData: any = { title: '내문서함 공유' }
      let canShareFiles = false
      if (shareFiles.length > 0) {
        if (typeof nav.canShare === 'function') {
          if (nav.canShare({ files: shareFiles })) {
            shareData.files = shareFiles
            canShareFiles = true
          } else if (shareFiles.length > 0 && nav.canShare({ files: [shareFiles[0]] })) {
            shareData.files = [shareFiles[0]]
            canShareFiles = true
            if (shareFiles.length > 1) {
              toast({
                title: '다중 파일 공유 미지원',
                description: `선택한 ${shareFiles.length}개 중 첫 번째 파일(${shareFiles[0].name})만 공유됩니다.`,
                variant: 'info',
              })
            }
          }
        } else {
          shareData.files = shareFiles
          canShareFiles = true
        }
      }

      if (!canShareFiles) {
        const fallbackLinks =
          shareLinks.length > 0
            ? shareLinks
            : selectedRemoteUrls.length > 0
              ? selectedRemoteUrls
              : []
        if (fallbackLinks.length === 0) {
          throw new Error('공유할 파일을 준비하지 못했습니다.')
        }
        shareData.text = fallbackLinks.join('\n')
        shareData.url = fallbackLinks[0]
      }

      await nav.share(shareData)
      toast({ title: '공유 완료', description: '선택한 문서를 공유했습니다.' })
    } catch (error: any) {
      if (error?.name !== 'AbortError') {
        console.error('Failed to share documents', error)
        toast({
          title: '공유 실패',
          description: error?.message || '공유 중 오류가 발생했습니다.',
          variant: 'destructive',
        })
      }
    } finally {
      setSharing(false)
    }
  }, [
    sharing,
    selectedFiles,
    selectedRemoteEntries,
    selectedRemoteUrls,
    resolveRemoteSubmissionAsset,
    toast,
  ])

  return (
    <div>
      <div className="section-title">필수제출서류</div>
      {requiredTypes.length === 0 ? (
        <p className="text-sm text-muted-foreground">설정된 필수 서류가 없습니다.</p>
      ) : (
        <div className="document-cards">
          {requiredTypes.map(item => {
            const f = uploaded[item.code]
            const remote = submissions[item.code]
            const hasSubmission = !!remote
            const status = normalizeRequiredDocStatus(
              remote?.status || (hasSubmission ? 'pending' : 'not_submitted')
            )
            const statusInfo = DOC_STATUS_BADGE_STYLES[status] || null
            const overrides = REQUIRED_DOC_COPY_OVERRIDES[item.code] || {}
            const displayTitle = overrides.title ?? item.title ?? item.code
            const truncatedTitle = shortenDescription(displayTitle)
            const displayDescription = overrides.description ?? item.description ?? ''
            const descriptionText = shortenDescription(displayDescription, 40)
            const titleTooltip = overrides.title ? item.title || displayTitle : displayTitle
            const descriptionTooltip = overrides.description
              ? item.description || displayDescription
              : displayDescription
            const previewRecord = remote
              ? {
                  file_url: remote.file_url,
                  storage_bucket: remote.storage_bucket || undefined,
                  storage_path: remote.storage_path || undefined,
                  file_name: remote.file_name || undefined,
                  title: item.title,
                }
              : null
            return (
              <div
                key={item.code}
                className={`doc-selection-card ${selected.has(item.code) ? 'active' : ''}`}
              >
                <div className="doc-selection-content">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="doc-selection-title" title={titleTooltip || undefined}>
                      {truncatedTitle}
                    </div>
                    {statusInfo ? (
                      <span
                        className="doc-status-badge"
                        style={{
                          backgroundColor: statusInfo.background,
                          color: statusInfo.color,
                          fontSize: '10px',
                          lineHeight: '1',
                        }}
                      >
                        {statusInfo.label}
                      </span>
                    ) : null}
                  </div>
                  {descriptionText ? (
                    <p
                      className="doc-selection-description"
                      title={descriptionTooltip || undefined}
                      style={{ fontSize: '10px', lineHeight: '1.4' }}
                    >
                      {descriptionText}
                    </p>
                  ) : null}
                  {remote?.rejection_reason ? (
                    <p className="doc-status-reason">사유: {remote.rejection_reason}</p>
                  ) : null}
                </div>
                <div className="doc-actions">
                  <input
                    ref={el => (inputRefs.current[item.code] = el)}
                    type="file"
                    hidden
                    onChange={e => onFile(item.code, e.target.files?.[0] || undefined)}
                  />
                  <button
                    className={`upload-btn ${hasSubmission ? 'uploaded' : ''}`}
                    onClick={() => onPick(item.code)}
                  >
                    {hasSubmission ? '변경' : '업로드'}
                  </button>
                  {previewRecord ? (
                    <FilePreviewButton document={previewRecord}>보기</FilePreviewButton>
                  ) : (
                    <button
                      className="preview-btn"
                      disabled={!f}
                      onClick={() => {
                        if (f) {
                          window.open(URL.createObjectURL(f), '_blank')
                        }
                      }}
                    >
                      보기
                    </button>
                  )}
                  <button
                    className={`selection-checkmark ${selected.has(item.code) ? 'active' : ''}`}
                    aria-pressed={selected.has(item.code)}
                    onClick={() => toggle(item.code)}
                  >
                    ✓
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
      <div className="foot equal">
        <button className="btn" onClick={onSave} disabled={saving}>
          {saving ? '저장중...' : '저장하기'}
        </button>
        <button className="btn btn-primary" onClick={onShare} disabled={sharing}>
          {sharing ? '공유중...' : '공유하기'}
        </button>
      </div>
    </div>
  )
}

function CompanyTab() {
  const { toast } = useToast()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [types, setTypes] = useState<CompanyDocTypeWithDocs[]>([])
  const [unmatchedDocs, setUnmatchedDocs] = useState<CompanyDocWithType[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadDocTypes = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/company-doc-types?active=true&include_docs=true', {
        credentials: 'include',
      })
      const json = await res.json().catch(() => null)
      if (!res.ok || json?.error) {
        throw new Error(json?.error || '회사 서류를 불러오지 못했습니다.')
      }
      const normalizedTypes: CompanyDocTypeWithDocs[] = Array.isArray(json?.data)
        ? json.data.map((item: any) => {
            const docs = Array.isArray(item?.documents)
              ? (item.documents
                  .map((doc: CompanyDocRecord) => normalizeCompanyDoc(doc, item))
                  .filter(Boolean) as CompanyDocWithType[])
              : []
            return { ...item, documents: docs }
          })
        : []
      setTypes(normalizedTypes)
      const unmatched = Array.isArray(json?.unmatchedDocuments)
        ? (json.unmatchedDocuments
            .map((doc: CompanyDocRecord) => normalizeCompanyDoc(doc))
            .filter(Boolean) as CompanyDocWithType[])
        : []
      setUnmatchedDocs(unmatched)
    } catch (err: any) {
      console.error('회사 서류 불러오기 실패', err)
      setTypes([])
      setUnmatchedDocs([])
      setError(err?.message || '회사 서류를 불러올 수 없습니다.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDocTypes()
  }, [loadDocTypes])

  const docMap = useMemo(() => {
    const map = new Map<string, CompanyDocWithType>()
    types.forEach(type => type.documents?.forEach(doc => map.set(doc.id, doc)))
    unmatchedDocs.forEach(doc => map.set(doc.id, doc))
    return map
  }, [types, unmatchedDocs])

  useEffect(() => {
    setSelected(prev => {
      const next = new Set<string>()
      prev.forEach(id => {
        if (docMap.has(id)) next.add(id)
      })
      return next
    })
  }, [docMap])

  const selectedRecords = useMemo(
    () =>
      Array.from(selected)
        .map(id => docMap.get(id))
        .filter(Boolean) as CompanyDocWithType[],
    [selected, docMap]
  )

  const buildFileRecord = useCallback((doc: CompanyDocWithType) => {
    return {
      file_url: doc.file_url || undefined,
      storage_bucket: doc.storage_bucket || undefined,
      storage_path: doc.storage_path || undefined,
      file_name: doc.file_name || doc.title || doc.typeName,
      title: doc.title || doc.file_name || doc.typeName,
    }
  }, [])

  const toggle = useCallback((id: string) => {
    setSelected(prev => {
      const copy = new Set(prev)
      copy.has(id) ? copy.delete(id) : copy.add(id)
      return copy
    })
  }, [])

  const onShare = useCallback(async () => {
    if (selectedRecords.length === 0) {
      toast({ title: '선택 필요', description: '먼저 파일을 선택해 주세요.', variant: 'warning' })
      return
    }
    try {
      const target = selectedRecords[0]
      const url = await fetchSignedUrlForRecord(buildFileRecord(target))
      if (typeof navigator !== 'undefined' && 'share' in navigator) {
        await (navigator as any).share({
          url,
          title: target.title || target.file_name || '회사 문서',
        })
      } else {
        await navigator.clipboard.writeText(url)
        toast({ title: '링크 복사됨', description: '공유 링크를 클립보드에 복사했습니다.' })
      }
    } catch (err: any) {
      console.error('회사 서류 공유 실패', err)
      toast({
        title: '공유 실패',
        description: err?.message || '파일 공유 중 오류가 발생했습니다.',
        variant: 'destructive',
      })
    }
  }, [buildFileRecord, selectedRecords, toast])

  const onSave = useCallback(async () => {
    if (selectedRecords.length === 0) {
      toast({ title: '선택 필요', description: '먼저 파일을 선택해 주세요.', variant: 'warning' })
      return
    }
    try {
      for (const record of selectedRecords) {
        const url = await fetchSignedUrlForRecord(buildFileRecord(record))
        const anchor = document.createElement('a')
        anchor.href = url
        anchor.download = record.file_name || record.title || record.typeName || 'document'
        anchor.rel = 'noopener noreferrer'
        anchor.target = '_blank'
        anchor.click()
      }
      toast({ title: '다운로드 시작', description: '선택한 파일을 다운로드합니다.' })
    } catch (err: any) {
      console.error('회사 서류 다운로드 실패', err)
      toast({
        title: '다운로드 실패',
        description: err?.message || '파일을 다운로드하지 못했습니다.',
        variant: 'destructive',
      })
    }
  }, [buildFileRecord, selectedRecords, toast])

  const renderDocRow = useCallback(
    (record: CompanyDocWithType) => {
      const isSelected = selected.has(record.id)
      const fileRecord = buildFileRecord(record)
      const createdLabel = record.created_at ? formatDisplayDate(record.created_at) : ''
      return (
        <div
          key={record.id}
          className={cn(
            'flex flex-col gap-2 rounded-xl border border-slate-200/80 bg-white/90 p-3',
            'shadow-sm transition-shadow',
            isSelected && 'border-blue-500/70 shadow-[0_0_0_1px_rgba(37,99,235,0.3)] bg-blue-50/70'
          )}
        >
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div
              className="text-[13px] font-semibold text-slate-900"
              title={record.file_name || record.title || ''}
            >
              {record.file_name || record.title || record.typeName}
            </div>
            {createdLabel ? <div className="text-[11px] text-slate-500">{createdLabel}</div> : null}
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <FilePreviewButton
              document={fileRecord}
              variant="unstyled"
              className="rounded-full border border-slate-200 px-3 py-1 text-[12px] font-semibold text-blue-600"
            >
              보기
            </FilePreviewButton>
            <FileDownloadButton
              document={fileRecord}
              variant="ghost"
              className="rounded-full border border-slate-200 px-3 py-1 text-[12px] font-semibold text-blue-600"
            >
              다운로드
            </FileDownloadButton>
            <FileShareButton
              document={fileRecord}
              variant="ghost"
              className="rounded-full border border-slate-200 px-3 py-1 text-[12px] font-semibold text-blue-600"
            >
              공유
            </FileShareButton>
            <button
              type="button"
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full border border-slate-300 text-sm font-semibold text-slate-400',
                isSelected && 'border-blue-500 text-blue-600 bg-blue-50'
              )}
              aria-pressed={isSelected}
              aria-label="문서 선택"
              onClick={() => toggle(record.id)}
            >
              ✓
            </button>
          </div>
        </div>
      )
    },
    [buildFileRecord, selected, toggle]
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4">
        {loading && <div className="doc-selection-title">불러오는 중...</div>}
        {!loading && error && <div className="doc-selection-title text-red-500">{error}</div>}
        {!loading && !error && types.length === 0 && unmatchedDocs.length === 0 && (
          <div className="doc-selection-title">등록된 회사서류가 없습니다.</div>
        )}
        {types.map(type => (
          <section
            key={type.slug}
            className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_25px_rgba(15,23,42,0.06)]"
          >
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-[15px] font-semibold text-slate-900">
                <span>{type.name}</span>
                {type.is_required && (
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                    필수
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-500">{type.description || type.slug}</span>
            </div>
            <div className="flex flex-col gap-3">
              {(type.documents?.length || 0) === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-3 py-4 text-center text-xs text-slate-400">
                  등록된 문서가 없습니다.
                </div>
              ) : (
                type.documents!.map(record => renderDocRow(record))
              )}
            </div>
          </section>
        ))}
        {unmatchedDocs.length > 0 && (
          <section className="flex flex-col gap-3 rounded-2xl border border-dashed border-slate-200 bg-white p-4">
            <div className="flex flex-col gap-1">
              <div className="text-sm font-semibold text-slate-900">분류되지 않은 문서</div>
              <span className="text-xs text-slate-500">company_slug 태그가 없습니다.</span>
            </div>
            <div className="flex flex-col gap-3">
              {unmatchedDocs.map(record => renderDocRow(record))}
            </div>
          </section>
        )}
      </div>
      <div className="foot equal">
        <button className="btn" onClick={onSave}>
          {selected.size > 0 ? `선택 다운로드 (${selected.size})` : '선택 다운로드'}
        </button>
        <button className="btn btn-primary" onClick={onShare}>
          {selected.size > 0 ? `선택 공유 (${selected.size})` : '선택 공유'}
        </button>
      </div>
      <style jsx>{`
        .company-docs {
          width: 100%;
        }
        .company-type-grid {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .company-doc-card {
          border: 1px solid rgba(148, 163, 184, 0.3);
          border-radius: 16px;
          background: var(--card, #fff);
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          box-shadow: 0 6px 18px rgba(15, 23, 42, 0.05);
        }
        .company-doc-card.unmatched {
          border-style: dashed;
        }
        .company-card-header {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .company-card-title {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .company-card-body {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .company-type-name {
          font-size: 15px;
          font-weight: 700;
          color: #0f172a;
        }
        .company-type-desc {
          font-size: 12px;
          color: #64748b;
        }
        .company-type-chip {
          font-size: 11px;
          padding: 2px 8px;
          border-radius: 999px;
          background: rgba(251, 191, 36, 0.2);
          color: #b45309;
          font-weight: 600;
        }
        .company-doc-empty {
          font-size: 12px;
          color: #94a3b8;
          border: 1px dashed rgba(148, 163, 184, 0.5);
          border-radius: 12px;
          padding: 12px;
          background: rgba(148, 163, 184, 0.08);
        }
        .company-doc-row {
          border: 1px solid rgba(148, 163, 184, 0.25);
          border-radius: 12px;
          padding: 10px 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          background: rgba(248, 250, 252, 0.8);
        }
        .company-doc-row.selected {
          border-color: #2563eb;
          box-shadow: 0 0 0 1px rgba(37, 99, 235, 0.2);
          background: rgba(219, 234, 254, 0.6);
        }
        .company-doc-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          flex-wrap: wrap;
        }
        .company-doc-title {
          font-size: 13px;
          font-weight: 600;
          color: #0f172a;
          flex: 1;
          min-width: 0;
          word-break: break-word;
        }
        .company-doc-date {
          font-size: 11px;
          color: #6b7280;
          white-space: nowrap;
        }
        .company-doc-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          flex-wrap: wrap;
          gap: 6px;
        }
        .company-doc-btn {
          border: 1px solid #e2e8f0;
          background: var(--card, #fff);
          color: #1d4ed8;
          padding: 4px 12px;
          font-size: 12px;
          font-weight: 600;
          border-radius: 999px;
          min-width: auto;
          line-height: 1.2;
        }
        .doc-check {
          border: 1px solid #cbd5f5;
          background: #fff;
          color: #94a3b8;
          border-radius: 999px;
          width: 28px;
          height: 28px;
          font-weight: 700;
        }
        .doc-check.active {
          border-color: #2563eb;
          color: #2563eb;
          background: rgba(37, 99, 235, 0.1);
        }
        .text-error {
          color: #b91c1c;
        }
      `}</style>
    </div>
  )
}

const READABLE_WORKLOG_PATTERNS = [
  /^\d{1,6}$/,
  /^wl[-_ ]?\d{1,6}$/i,
  /^wr[-_ ]?\d{1,6}$/i,
  /^dr[-_ ]?\d{1,6}$/i,
]

const isReadableWorklogReference = (value: string) =>
  READABLE_WORKLOG_PATTERNS.some(pattern => pattern.test(value.trim()))

const buildWorklogConnectionDisplay = (rawIds: string[]) => {
  const normalized = rawIds.map(id => (typeof id === 'string' ? id.trim() : '')).filter(Boolean)
  if (!normalized.length) {
    return { type: 'empty' as const, ids: [] as string[], total: 0, title: '' }
  }
  const readableOnly = normalized.every(isReadableWorklogReference)
  return readableOnly
    ? {
        type: 'badges' as const,
        ids: normalized,
        total: normalized.length,
        title: normalized.join(', '),
      }
    : {
        type: 'summary' as const,
        ids: [] as string[],
        total: normalized.length,
        title: normalized.join(', '),
      }
}

const formatReadableWorklogId = (value: string) => {
  if (/^\d+$/.test(value.trim())) return `#${value.trim()}`
  return value.toUpperCase()
}

const formatDisplayDate = (value?: string) => {
  if (!value) return ''
  try {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    }).format(new Date(value))
  } catch {
    return value
  }
}

function DrawingsTab() {
  const { toast } = useToast()
  const [site, setSite] = useState<string>('')
  const [category, setCategory] = useState<'plan' | 'progress' | 'other' | ''>('')
  const [uploadCategory, setUploadCategory] = useState<'plan' | 'progress' | 'other'>('plan')
  const [siteOptions, setSiteOptions] = useState<Array<{ id: string; name: string }>>([])
  const [items, setItems] = useState<
    Array<{
      id: string
      url: string
      previewUrl?: string
      storagePath?: string | null
      storageBucket?: string | null
      title?: string
      category?: string
      categoryLabel?: string
      createdAt?: string
      siteId?: string
      linkedWorklogId?: string
      linkedWorklogIds?: string[]
      pdfUrl?: string
    }>
  >([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const fileInput = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const limit = 24
  const [totalPages, setTotalPages] = useState(1)
  // 검색 입력 제거
  const [queue, setQueue] = useState<
    Array<{ file: File; siteId: string; category: 'plan' | 'progress' | 'other' }>
  >([])
  const [uploadWarning, setUploadWarning] = useState('')
  // Partner UX: restrict by allowed sites and auto-select first
  const [isRestricted, setIsRestricted] = useState(false)
  const [orgId, setOrgId] = useState<string | null>(null)
  const [authLoaded, setAuthLoaded] = useState(false)
  const siteSelectLabel = useMemo(() => {
    if (!site) return '현장 전체'
    return siteOptions.find(s => s.id === site)?.name || '현장 선택'
  }, [site, siteOptions])
  const siteNameMap = useMemo(() => {
    const map = new Map<string, string>()
    siteOptions.forEach(opt => {
      if (opt.id) map.set(opt.id, opt.name)
    })
    return map
  }, [siteOptions])
  const getMarkupDocumentId = (itemId: string) =>
    itemId.startsWith('markup-') ? itemId.slice('markup-'.length) : null
  const [worklogLinkId, setWorklogLinkId] = useState('')
  const [linking, setLinking] = useState<Record<string, boolean>>({})
  const [worklogDraft, setWorklogDraft] = useState('')
  useEffect(() => {
    setWorklogDraft(worklogLinkId)
  }, [worklogLinkId])
  const openMarkupViewer = (item: { id: string; siteId?: string }) => {
    const markupId = getMarkupDocumentId(item.id)
    if (!markupId || typeof window === 'undefined') return
    const viewerUrl = new URL('/mobile/markup-tool', window.location.origin)
    viewerUrl.searchParams.set('mode', 'start')
    viewerUrl.searchParams.set('docId', markupId)
    if (item.siteId) viewerUrl.searchParams.set('siteId', item.siteId)
    if (worklogLinkId) viewerUrl.searchParams.set('worklogId', worklogLinkId)
    viewerUrl.searchParams.set('source', 'documents')
    window.open(viewerUrl.toString(), '_blank')
  }

  const linkDocToWorklog = async (doc: {
    id: string
    linkedWorklogId?: string
    linkedWorklogIds?: string[]
  }) => {
    const targetWorklogId = worklogLinkId.trim()
    if (!targetWorklogId) {
      toast({
        title: '작업일지를 선택하세요',
        description: 'URL 쿼리(worklogId)를 통해 연결할 작업일지를 지정해 주세요.',
        variant: 'warning',
      })
      return
    }
    const markupId = getMarkupDocumentId(doc.id)
    if (!markupId) {
      toast({
        title: '연결 불가',
        description: '마킹 문서만 작업일지에 연결할 수 있습니다.',
        variant: 'info',
      })
      return
    }
    const normalized = Array.isArray(doc.linkedWorklogIds)
      ? doc.linkedWorklogIds.filter(id => typeof id === 'string' && id.length > 0)
      : doc.linkedWorklogId
        ? [doc.linkedWorklogId]
        : []
    if (normalized.includes(targetWorklogId)) {
      toast({
        title: '이미 연결됨',
        description: `도면이 작업일지 #${targetWorklogId}에 이미 연결되어 있습니다.`,
        variant: 'info',
      })
      return
    }
    const nextLinkedIds = [targetWorklogId, ...normalized]
    setLinking(prev => ({ ...prev, [doc.id]: true }))
    try {
      const res = await fetch(`/api/markup-documents/${markupId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linked_worklog_ids: nextLinkedIds }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(json?.error || '작업일지에 연결하지 못했습니다.')
      }
      setItems(prev =>
        prev.map(it =>
          it.id === doc.id
            ? {
                ...it,
                linkedWorklogId: nextLinkedIds[0],
                linkedWorklogIds: nextLinkedIds,
              }
            : it
        )
      )
      toast({
        title: '연결 완료',
        description: `문서를 작업일지 ${targetWorklogId}에 연결했습니다.`,
      })
    } catch (error: any) {
      toast({
        title: '연결 실패',
        description: error?.message || '작업일지에 연결할 수 없습니다.',
        variant: 'destructive',
      })
    } finally {
      setLinking(prev => {
        const next = { ...prev }
        delete next[doc.id]
        return next
      })
    }
  }
  const handleSiteChange = (value: string) => {
    setSite(value === 'all' ? '' : value)
    setUploadWarning('')
  }

  // URL 프리셋 적용 플래그(한 번만 적용)
  const presetRef = useRef(false)

  // URL 쿼리 프리셋: ?siteId=...&category=plan|progress|other
  useEffect(() => {
    if (presetRef.current) return
    try {
      const sp = new URLSearchParams(window.location.search)
      const siteId = sp.get('siteId') || sp.get('site_id')
      const cat = (sp.get('category') || '').trim()
      const worklogPreset = sp.get('worklogId') || sp.get('worklog_id') || sp.get('worklog') || ''
      if (siteId) setSite(siteId)
      if (cat === 'plan' || cat === 'progress' || cat === 'other') setCategory(cat)
      if (worklogPreset) setWorklogLinkId(worklogPreset)
      presetRef.current = true
    } catch {
      /* ignore */
    }
  }, [])

  const fetchList = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (site) params.set('siteId', site)
      if (category) params.set('category', category)
      params.set('limit', String(limit))
      params.set('page', String(page))
      if (worklogLinkId.trim()) params.set('worklogId', worklogLinkId.trim())
      const res = await fetch(`/api/docs/drawings?${params.toString()}`)
      const json = await res.json()
      if (res.ok && json?.success) {
        setItems(
          (json.data || []).map((d: any) => {
            const metadata =
              d?.metadata && typeof d.metadata === 'object' && !Array.isArray(d.metadata)
                ? (d.metadata as Record<string, any>)
                : {}
            const cat =
              typeof d.category === 'string' && d.category.trim().length > 0
                ? d.category
                : undefined
            const storagePath =
              typeof d.storage_path === 'string' && d.storage_path.length > 0
                ? d.storage_path
                : typeof d.metadata?.storage_path === 'string' && d.metadata.storage_path.length > 0
                  ? d.metadata.storage_path
                  : undefined
            const storageBucket =
              typeof d.storage_bucket === 'string' && d.storage_bucket.length > 0
                ? d.storage_bucket
                : typeof metadata.storage_bucket === 'string' && metadata.storage_bucket.length > 0
                  ? metadata.storage_bucket
                  : storagePath
                    ? 'documents'
                    : undefined
            const url = typeof d.url === 'string' ? d.url : ''
            const previewUrl =
              typeof d.preview_url === 'string' && d.preview_url.length > 0
                ? d.preview_url
                : undefined
            const linkedWorklogIds =
              Array.isArray(d.linked_worklog_ids) && d.linked_worklog_ids.length > 0
                ? d.linked_worklog_ids.filter((id: unknown): id is string => typeof id === 'string')
                : []
            const linkedWorklogId =
              typeof d.linked_worklog_id === 'string' && d.linked_worklog_id.length > 0
                ? d.linked_worklog_id
                : typeof metadata.linked_worklog_id === 'string' &&
                    metadata.linked_worklog_id.length > 0
                  ? metadata.linked_worklog_id
                  : undefined
            const snapshotPdfUrl =
              typeof metadata.snapshot_pdf_url === 'string' && metadata.snapshot_pdf_url.length > 0
                ? metadata.snapshot_pdf_url
                : undefined
            return {
              id: String(d.id),
              url,
              previewUrl,
              storagePath,
              storageBucket,
              title: typeof d.title === 'string' ? d.title : d.file_name || undefined,
              category: cat,
              categoryLabel: cat ? DRAWING_CATEGORY_LABELS[cat] || '기타' : '기타',
              createdAt: typeof d.created_at === 'string' ? d.created_at : undefined,
              siteId: typeof d.site_id === 'string' ? d.site_id : undefined,
              linkedWorklogId,
              linkedWorklogIds: linkedWorklogIds.length
                ? Array.from(new Set([linkedWorklogId, ...linkedWorklogIds].filter(Boolean)))
                : linkedWorklogId
                  ? [linkedWorklogId]
                  : undefined,
              pdfUrl: snapshotPdfUrl,
            }
          })
        )
        if (json.pagination) setTotalPages(json.pagination.totalPages || 1)
      } else {
        setItems([])
      }
      // Fallback: 회사서류함(공유)에서 '공도면' 포함 문서를 그리드에 보조 노출
      try {
        const shared = await fetch(
          '/api/unified-documents/v2?category_type=shared&status=active&limit=200&search=%EA%B3%B5%EB%8F%84%EB%A9%B4',
          { credentials: 'include' }
        )
        const sj = await shared.json()
        if (shared.ok && sj?.success && Array.isArray(sj.data)) {
          const extras = sj.data
            .filter((d: any) => (d.title || d.file_name || '').includes('공도면'))
            .map((d: any) => {
              const metadata =
                d?.metadata && typeof d.metadata === 'object' && !Array.isArray(d.metadata)
                  ? (d.metadata as Record<string, any>)
                  : {}
              const storagePath =
                typeof metadata.storage_path === 'string' && metadata.storage_path.length > 0
                  ? metadata.storage_path
                  : undefined
              const storageBucket =
                typeof metadata.storage_bucket === 'string' && metadata.storage_bucket.length > 0
                  ? metadata.storage_bucket
                  : storagePath
                    ? 'documents'
                    : undefined
              return {
                id: `shared-${d.id}`,
                url: typeof d.file_url === 'string' ? d.file_url : '',
                previewUrl:
                  typeof d.preview_url === 'string' && d.preview_url.length > 0
                    ? d.preview_url
                    : undefined,
                storagePath,
                storageBucket,
                title: String(d.title || d.file_name || '공도면'),
                categoryLabel: resolveSharedDocCategoryLabel(d),
                createdAt: typeof d.created_at === 'string' ? d.created_at : undefined,
                siteId: typeof d.site_id === 'string' ? d.site_id : undefined,
                linkedWorklogId:
                  typeof metadata.linked_worklog_id === 'string' &&
                  metadata.linked_worklog_id.length > 0
                    ? metadata.linked_worklog_id
                    : undefined,
                linkedWorklogIds: (() => {
                  const arr =
                    Array.isArray(metadata.linked_worklog_ids) &&
                    metadata.linked_worklog_ids.length > 0
                      ? metadata.linked_worklog_ids.filter(
                          (id: unknown): id is string => typeof id === 'string'
                        )
                      : []
                  if (arr.length) {
                    return metadata.linked_worklog_id && !arr.includes(metadata.linked_worklog_id)
                      ? [metadata.linked_worklog_id, ...arr]
                      : arr
                  }
                  return typeof metadata.linked_worklog_id === 'string'
                    ? [metadata.linked_worklog_id]
                    : undefined
                })(),
                pdfUrl:
                  typeof metadata.snapshot_pdf_url === 'string' &&
                  metadata.snapshot_pdf_url.length > 0
                    ? metadata.snapshot_pdf_url
                    : undefined,
              }
            })
          setItems(prev => {
            const ids = new Set(prev.map(p => p.id))
            const merged = prev.slice()
            for (const e of extras) if (!ids.has(e.id)) merged.push(e)
            return merged
          })
        }
      } catch {
        /* ignore augmentation failure */
      }
    } finally {
      setLoading(false)
    }
  }

  const onUpload = () => {
    if (!site) {
      setUploadWarning('업로드할 현장을 먼저 선택하세요.')
      toast({
        title: '현장을 먼저 선택하세요',
        description: '업로드할 현장을 선택한 뒤 다시 시도하세요.',
        variant: 'warning',
      })
      return
    }
    setUploadWarning('')
    fileInput.current?.click()
  }
  const buildFileRecordFromDrawing = (doc: any) => ({
    file_url: doc.previewUrl || doc.url || undefined,
    storage_bucket: doc.storageBucket || undefined,
    storage_path: doc.storagePath || undefined,
    file_name: doc.title || doc.file_name || undefined,
  })

  const getSignedUrlForDrawing = useCallback(
    async (doc: any, options?: { downloadName?: string }) => {
      const record = buildFileRecordFromDrawing(doc)
      try {
        return await fetchSignedUrlForRecord(record, {
          downloadName: options?.downloadName || record.file_name || undefined,
        })
      } catch (error) {
        if (record.file_url) {
          return record.file_url
        }
        throw error
      }
    },
    []
  )
  const openMarkupTool = async () => {
    try {
      // If exactly one drawing is selected, bridge it to the markup tool
      if (selected.size === 1) {
        const id = Array.from(selected)[0]
        const it = items.find(i => i.id === id)
        if (it) {
          try {
            const resolvedUrl = await getSignedUrlForDrawing(it)
            if (!resolvedUrl) {
              toast({
                title: '파일을 열 수 없습니다',
                description: '도면 경로를 확인할 수 없습니다.',
                variant: 'destructive',
              })
              return
            }
            try {
              const drawingData = {
                id: String(it.id),
                name: String(it.title || '도면'),
                title: String(it.title || '도면'),
                url: resolvedUrl,
                size: 0,
                type: 'image',
                uploadDate: new Date(),
                isMarked: false,
                source: 'site_documents',
                siteId: site || undefined,
                siteName: siteOptions.find(s => s.id === site)?.name,
              }
              localStorage.setItem('selected_drawing', JSON.stringify(drawingData))
            } catch {
              /* ignore localStorage errors */
            }
            // Also pass selected site context when available
            if (site) {
              try {
                const sn = siteOptions.find(s => s.id === site)?.name || ''
                localStorage.setItem('selected_site', JSON.stringify({ id: site, name: sn }))
              } catch {
                /* ignore */
              }
            }
            window.location.href = '/mobile/markup-tool'
            return
          } catch (error) {
            console.error('Failed to prepare drawing for markup tool', error)
            toast({
              title: '도면을 불러오지 못했습니다',
              description: '네트워크 상태를 확인한 뒤 다시 시도해주세요.',
              variant: 'destructive',
            })
            return
          }
        }
      }

      // If no single selection, open tool with context
      if (site) {
        try {
          const sn = siteOptions.find(s => s.id === site)?.name || ''
          localStorage.setItem('selected_site', JSON.stringify({ id: site, name: sn }))
        } catch {
          /* ignore */
        }
        window.location.href = '/mobile/markup-tool?mode=browse'
      } else {
        const ok = window.confirm(
          '현장이 선택되지 않았습니다. 업로드 모드로 마킹 도구를 여시겠습니까?'
        )
        if (ok) window.location.href = '/mobile/markup-tool?mode=upload'
      }
    } catch {
      // last-resort fallback
      window.location.href = '/mobile/markup-tool'
    }
  }
  const onFiles = async (files: FileList | null) => {
    if (!files) return
    if (!site) {
      toast({ title: '선택 필요', description: '현장을 먼저 선택하세요.', variant: 'warning' })
      return
    }
    const docType =
      uploadCategory === 'plan'
        ? 'blueprint'
        : uploadCategory === 'progress'
          ? 'progress_drawing'
          : 'other'
    const selectedLabel = DRAWING_CATEGORY_LABELS[uploadCategory] || '도면'
    let successCount = 0
    for (const f of Array.from(files)) {
      try {
        const form = new FormData()
        form.append('file', f)
        form.append('siteId', site)
        form.append('documentType', docType)
        const res = await fetch('/api/site-documents/upload', {
          method: 'POST',
          body: form,
          credentials: 'include',
        })
        const json = await res.json().catch(() => ({}))
        if (!res.ok || json?.error) {
          console.error('upload failed', res.status, json)
          throw new Error(json?.error || `업로드 실패 (code: ${res.status})`)
        }
        successCount += 1
      } catch (error: any) {
        const networkFailed =
          navigator.onLine === false ||
          (typeof error?.message === 'string' && error.message.toLowerCase().includes('fetch'))
        if (networkFailed) {
          await addToUploadQueue({
            endpoint: '/api/site-documents/upload',
            fields: { siteId: site, documentType: docType },
            file: f,
          })
          setQueue(prev => [...prev, { file: f, siteId: site, category: uploadCategory }])
        } else {
          toast({
            title: '업로드 실패',
            description: error?.message || '파일을 업로드하지 못했습니다.',
            variant: 'destructive',
          })
        }
      }
    }
    if (successCount > 0) {
      toast({
        title: '업로드 완료',
        description: `${selectedLabel} ${successCount}개 업로드 완료`,
      })
    }
    fetchList()
  }

  const toggle = (id: string) =>
    setSelected(prev => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })

  const deleteSelected = async () => {
    if (selected.size === 0) {
      toast({
        title: '선택 필요',
        description: '삭제할 사진을 먼저 선택하세요.',
        variant: 'warning',
      })
      return
    }
    const ids = Array.from(selected)
    try {
      const res = await fetch('/api/docs/photos', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error || '삭제 실패')
      setSelected(new Set())
      fetchList()
      toast({ title: '삭제 완료', description: `${ids.length}건을 삭제했습니다.` })
    } catch (err: any) {
      toast({
        title: '삭제 실패',
        description: err?.message || '삭제 중 오류가 발생했습니다.',
        variant: 'destructive',
      })
    }
  }

  const editItem = async (id: string) => {
    const current = items.find(it => it.id === id)
    const nextTitle = window.prompt('파일명을 입력하세요', current?.name || '')
    if (!nextTitle) return
    try {
      const res = await fetch('/api/docs/photos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, title: nextTitle }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error || '수정 실패')
      fetchList()
      toast({ title: '수정 완료', description: '파일명이 변경되었습니다.' })
    } catch (err: any) {
      toast({
        title: '수정 실패',
        description: err?.message || '파일명 수정 중 오류가 발생했습니다.',
        variant: 'destructive',
      })
    }
  }

  useEffect(() => {
    fetchList()
  }, [site, category, page, isRestricted, worklogLinkId])

  // Load auth to determine partner restriction and fetch allowed sites accordingly
  useEffect(() => {
    ;(async () => {
      try {
        const meRes = await fetch('/api/auth/me', { cache: 'no-store', credentials: 'include' })
        const me = await meRes.json().catch(() => ({}))
        const restricted = Boolean(me?.isRestricted)
        setIsRestricted(restricted)
        setOrgId(me?.restrictedOrgId || null)
        setUserRole(me?.role || '')

        // Fetch site options
        // Use unified site list (server handles access control)
        const r = await fetch('/api/mobile/sites/list', {
          cache: 'no-store',
          credentials: 'include',
        })
        const j = await r.json().catch(() => ({}))
        if (r.ok && j?.success) {
          const opts = (j.data || []).map((s: any) => ({
            id: String(s.id),
            name: String(s.name),
          }))
          setSiteOptions(opts)
          // Default: keep "전체" (empty) unless 사용자가 직접 선택
        }
      } finally {
        setAuthLoaded(true)
      }
    })()
  }, [])

  return (
    <div>
      {/* Partner UX guidance */}
      {authLoaded && isRestricted && siteOptions.length === 0 && (
        <div className="doc-selection-card" style={{ marginBottom: 8 }}>
          <div className="doc-selection-content">
            <div className="doc-selection-title">할당된 현장이 없습니다</div>
            <div style={{ fontSize: 12, color: '#6B7280' }}>
              관리자에게 업체-현장 매핑을 요청해 주세요.
            </div>
            {uploadWarning ? (
              <p className="my-2 text-xs font-medium text-[--accent-600]">{uploadWarning}</p>
            ) : null}
          </div>
        </div>
      )}
      {worklogLinkId && (
        <div className="doc-selection-card active" style={{ marginBottom: 8 }}>
          <div className="doc-selection-content">
            <div className="doc-selection-title">작업일지 연동 모드</div>
            <div style={{ fontSize: 12, color: '#1D4ED8' }}>
              작업일지 #{worklogLinkId}에 연결할 도면을 선택하거나 새로 업로드해 주세요.
            </div>
          </div>
          <div className="doc-actions">
            <a
              className="preview-btn secondary"
              href={`/mobile/worklog/${worklogLinkId}`}
              target="_blank"
              rel="noreferrer"
            >
              모바일
            </a>
            <a
              className="preview-btn secondary"
              href={`/dashboard/admin/daily-reports/${worklogLinkId}`}
              target="_blank"
              rel="noreferrer"
            >
              관리자
            </a>
            <button className="preview-btn" onClick={() => setWorklogLinkId('')}>
              해제
            </button>
          </div>
        </div>
      )}
      <div className="filters">
        <div className="filter-section">
          <div className="filter-row">
            <CustomSelect value={site || 'all'} onValueChange={handleSiteChange}>
              <CustomSelectTrigger
                className="doc-filter-trigger min-w-[150px]"
                aria-label="현장 선택"
              >
                <CustomSelectValue>{siteSelectLabel}</CustomSelectValue>
              </CustomSelectTrigger>
              <CustomSelectContent>
                <CustomSelectItem value="all">현장 전체</CustomSelectItem>
                {siteOptions.map(s => (
                  <CustomSelectItem key={s.id} value={s.id}>
                    {s.name}
                  </CustomSelectItem>
                ))}
              </CustomSelectContent>
            </CustomSelect>
            <CustomSelect
              value={category || 'all'}
              onValueChange={value =>
                setCategory(value === 'all' ? '' : (value as 'plan' | 'progress' | 'other'))
              }
            >
              <CustomSelectTrigger className="doc-filter-trigger" aria-label="도면 유형">
                <CustomSelectValue>
                  {category === 'plan'
                    ? '공도면'
                    : category === 'progress'
                      ? '진행도면'
                      : category === 'other'
                        ? '기타'
                        : '전체도면'}
                </CustomSelectValue>
              </CustomSelectTrigger>
              <CustomSelectContent>
                <CustomSelectItem value="all">전체도면</CustomSelectItem>
                <CustomSelectItem value="plan">공도면</CustomSelectItem>
                <CustomSelectItem value="progress">진행도면</CustomSelectItem>
                <CustomSelectItem value="other">기타</CustomSelectItem>
              </CustomSelectContent>
            </CustomSelect>
          </div>
          <div className="upload-row">
            <CustomSelect
              value={uploadCategory}
              onValueChange={value => setUploadCategory(value as 'plan' | 'progress' | 'other')}
            >
              <CustomSelectTrigger className="upload-trigger" aria-label="업로드 유형 선택">
                <CustomSelectValue>
                  {uploadCategory === 'plan'
                    ? '공도면 업로드'
                    : uploadCategory === 'progress'
                      ? '진행도면 업로드'
                      : '기타 업로드'}
                </CustomSelectValue>
              </CustomSelectTrigger>
              <CustomSelectContent align="end">
                <CustomSelectItem value="plan">공도면 업로드</CustomSelectItem>
                <CustomSelectItem value="progress">진행도면 업로드</CustomSelectItem>
                <CustomSelectItem value="other">기타 업로드</CustomSelectItem>
              </CustomSelectContent>
            </CustomSelect>
            <button className="btn" onClick={onUpload}>
              업로드
            </button>
            <button className="btn" onClick={() => void openMarkupTool()}>
              마킹 도구
            </button>
          </div>
        </div>
        <input
          ref={fileInput}
          type="file"
          hidden
          multiple
          onChange={e => onFiles(e.target.files)}
        />
      </div>
      {uploadWarning ? (
        <p className="my-2 text-xs font-medium text-[--accent-600]">{uploadWarning}</p>
      ) : null}
      {queue.length > 0 && (
        <div className="doc-selection-card" style={{ marginBottom: 8 }}>
          <div className="doc-selection-content">
            <div className="doc-selection-title">오프라인 대기열 {queue.length}개</div>
          </div>
          <div className="doc-actions">
            <button
              className="btn"
              onClick={async () => {
                const rest: typeof queue = []
                for (const item of queue) {
                  try {
                    const form = new FormData()
                    form.append('file', item.file)
                    form.append('siteId', item.siteId)
                    form.append(
                      'documentType',
                      item.category === 'plan'
                        ? 'blueprint'
                        : item.category === 'other'
                          ? 'other'
                          : 'progress_drawing'
                    )
                    const res = await fetch('/api/site-documents/upload', {
                      method: 'POST',
                      body: form,
                    })
                    if (!res.ok) throw new Error('fail')
                  } catch {
                    rest.push(item)
                  }
                }
                setQueue(rest)
                fetchList()
                // Background Sync 요청
                try {
                  const reg = await navigator.serviceWorker.ready
                  if ('sync' in reg) await reg.sync.register('docs-upload-sync')
                  navigator.serviceWorker.controller?.postMessage('process-queue')
                } catch {
                  /* ignore sync registration error */
                }
              }}
            >
              대기열 업로드
            </button>
          </div>
        </div>
      )}
      <div className="document-cards">
        {loading && <div className="doc-selection-title">불러오는 중...</div>}
        {!loading && (
          <>
            {items.map(it => {
              const linkedIds =
                Array.isArray(it.linkedWorklogIds) && it.linkedWorklogIds.length > 0
                  ? it.linkedWorklogIds
                  : it.linkedWorklogId
                    ? [it.linkedWorklogId]
                    : []
              const hasConnections = linkedIds.length > 0
              const display = buildWorklogConnectionDisplay(linkedIds)
              const formattedDate = formatDisplayDate(it.createdAt)
              const siteLabel = it.siteId ? siteNameMap.get(it.siteId) || null : null
              const isSelected = selected.has(it.id)
              const connectionLabel = hasConnections
                ? display.type === 'badges'
                  ? '작업일지 연결'
                  : `연결 ${display.total}건`
                : '작업일지 미연결'
              return (
                <div key={it.id} className={cn('drawing-card', { selected: isSelected })}>
                  <div className="drawing-card__header">
                    <div className="drawing-card__title-wrap">
                      <div className="drawing-card__title">
                        <span>{it.title || '도면'}</span>
                        {siteLabel ? <span className="doc-item-site">{siteLabel}</span> : null}
                      </div>
                      <div className="drawing-card__meta">
                        {it.categoryLabel ? (
                          <span
                            className={cn(
                              'doc-category-badge',
                              it.category === 'plan'
                                ? 'doc-category-plan'
                                : it.category === 'progress'
                                  ? 'doc-category-progress'
                                  : 'doc-category-other'
                            )}
                          >
                            {it.categoryLabel}
                          </span>
                        ) : null}
                        {formattedDate ? (
                          <span className="doc-meta-date">{formattedDate}</span>
                        ) : null}
                      </div>
                    </div>
                    <button
                      className={cn('doc-check', { active: isSelected })}
                      onClick={() => toggle(it.id)}
                      aria-label={isSelected ? '도면 선택 해제' : '도면 선택'}
                    >
                      ✓
                    </button>
                  </div>
                  <div className="drawing-card__status">
                    <span
                      className={cn('drawing-card__badge', {
                        warning: !hasConnections,
                      })}
                    >
                      {connectionLabel}
                    </span>
                    {hasConnections && display.type === 'badges' ? (
                      <div className="drawing-card__connections">
                        {display.ids.map(id => (
                          <span key={id} className="doc-meta-date badge-link">
                            {formatReadableWorklogId(id)}
                          </span>
                        ))}
                      </div>
                    ) : !hasConnections ? (
                      <span className="doc-meta-date muted">작업일지 연결이 필요합니다.</span>
                    ) : null}
                  </div>
                  <div className="drawing-card__actions">
                    <div className="drawing-card__actions-left">
                      {worklogLinkId && getMarkupDocumentId(it.id) ? (
                        <button
                          className="company-doc-btn"
                          onClick={() => linkDocToWorklog(it)}
                          disabled={
                            linking[it.id] ||
                            (Array.isArray(it.linkedWorklogIds)
                              ? it.linkedWorklogIds.includes(worklogLinkId.trim())
                              : it.linkedWorklogId === worklogLinkId.trim())
                          }
                        >
                          {Array.isArray(it.linkedWorklogIds)
                            ? it.linkedWorklogIds.includes(worklogLinkId.trim())
                              ? '연결됨'
                              : linking[it.id]
                                ? '연결 중...'
                                : '작업일지 연결'
                            : it.linkedWorklogId === worklogLinkId.trim()
                              ? '연결됨'
                              : linking[it.id]
                                ? '연결 중...'
                                : '작업일지 연결'}
                        </button>
                      ) : null}
                    </div>
                    <div className="drawing-card__actions-right">
                      <button
                        className="company-doc-btn"
                        onClick={async () => {
                          const markupId = getMarkupDocumentId(it.id)
                          const hasPreview =
                            typeof it.previewUrl === 'string' && it.previewUrl.length > 0
                          if (markupId && !hasPreview) {
                            openMarkupViewer(it)
                            return
                          }
                          try {
                            await openFileRecordInNewTab(buildFileRecordFromDrawing(it))
                          } catch (error) {
                            console.error('Failed to open drawing', error)
                            toast({
                              title: '파일을 열 수 없습니다',
                              description: '도면 경로를 확인할 수 없습니다.',
                              variant: 'destructive',
                            })
                          }
                        }}
                      >
                        보기
                      </button>
                      {it.pdfUrl ? (
                        <button
                          className="company-doc-btn"
                          onClick={() => window.open(it.pdfUrl!, '_blank')}
                        >
                          PDF
                        </button>
                      ) : null}
                      {getMarkupDocumentId(it.id) ? (
                        <button className="company-doc-btn" onClick={() => openMarkupViewer(it)}>
                          마킹열기
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              )
            })}
          </>
        )}
      </div>
      <div className="foot equal">
        <button
          className="btn"
          onClick={async () => {
            if (selected.size === 0) {
              toast({
                title: '선택 필요',
                description: '먼저 도면을 선택해 주세요.',
                variant: 'warning',
              })
              return
            }
            for (const id of Array.from(selected)) {
              const doc = items.find(it => it.id === id)
              if (!doc) continue
              const target = doc.pdfUrl ? { ...doc, previewUrl: doc.pdfUrl, url: doc.pdfUrl } : doc
              try {
                const finalUrl = await getSignedUrlForDrawing(target, {
                  downloadName: (doc.title || 'drawing').replace(/\s+/g, '_'),
                })
                if (!finalUrl) continue
                const a = document.createElement('a')
                a.href = finalUrl
                a.download = (doc.title || '').replace(/\s+/g, '_') || 'drawing'
                a.click()
              } catch (error) {
                console.error('Failed to download drawing', error)
              }
            }
          }}
        >
          저장하기
        </button>
        <button className="btn" onClick={deleteSelected}>
          삭제하기
        </button>
        <button
          className="btn btn-primary"
          onClick={async () => {
            if (selected.size === 0) {
              toast({
                title: '선택 필요',
                description: '먼저 도면을 선택해 주세요.',
                variant: 'warning',
              })
              return
            }
            const doc = items.find(it => it.id === Array.from(selected)[0])
            if ((navigator as any).share && doc) {
              try {
                const finalUrl = await getSignedUrlForDrawing(
                  doc.pdfUrl ? { ...doc, previewUrl: doc.pdfUrl, url: doc.pdfUrl } : doc
                )
                if (!finalUrl) {
                  toast({
                    title: '파일 공유 실패',
                    description: '도면 경로를 찾을 수 없습니다.',
                    variant: 'destructive',
                  })
                  return
                }
                try {
                  await (navigator as any).share({ url: finalUrl, title: '도면 공유' })
                } catch {
                  await (navigator as any).share({ url: finalUrl, title: '도면 공유' })
                }
              } catch (error) {
                console.error('Failed to share drawing', error)
                toast({
                  title: '파일 공유 실패',
                  description: '도면 경로를 찾을 수 없습니다.',
                  variant: 'destructive',
                })
                return
              }
            } else {
              toast({ title: '공유 안내', description: '브라우저 공유 미지원', variant: 'info' })
            }
          }}
        >
          공유하기
        </button>
      </div>
      <div className="tab-controls" style={{ justifyContent: 'space-between' }}>
        <button
          className="btn"
          disabled={page <= 1}
          onClick={() => setPage(p => Math.max(1, p - 1))}
        >
          이전
        </button>
        <div className="doc-selection-title">
          {page} / {totalPages}
        </div>
        <button className="btn" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
          다음
        </button>
      </div>
    </div>
  )
}

function PhotosTab() {
  const { toast } = useToast()
  const [site, setSite] = useState('')
  const [category, setCategory] = useState<'before' | 'after' | 'other' | ''>('')
  const [siteOptions, setSiteOptions] = useState<Array<{ id: string; name: string }>>([])
  const [isRestricted, setIsRestricted] = useState(false)
  const [userRole, setUserRole] = useState<string>('')
  const [authLoaded, setAuthLoaded] = useState(false)
  const [items, setItems] = useState<
    Array<{
      id: string
      url: string
      name: string
      siteId: string
      siteName: string
      category: 'before' | 'after'
      workDescription: string
      workDate: string
      createdAt: string
    }>
  >([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const limit = 24
  const [totalPages, setTotalPages] = useState(1)
  const [queue, setQueue] = useState<
    Array<{ file: File; siteId: string; category: 'before' | 'after' }>
  >([])
  const [uploadWarning, setUploadWarning] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'submitted' | 'approved'>(
    'all'
  )
  const [preview, setPreview] = useState<{
    url: string
    title: string
    site: string
    work: string
    date: string
  } | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const siteSelectLabel = useMemo(() => {
    if (!site) return '현장 전체'
    return siteOptions.find(s => s.id === site)?.name || '현장 선택'
  }, [site, siteOptions])
  const categorySelectLabel = useMemo(() => {
    if (!category) return '보수 전/후 전체'
    if (category === 'before') return '보수 전'
    if (category === 'after') return '보수 후'
    return '상태 선택'
  }, [category])
  const statusSelectLabel = useMemo(() => {
    if (statusFilter === 'all') return '작업일지 전체'
    if (statusFilter === 'draft') return '임시저장'
    if (statusFilter === 'submitted') return '작성완료'
    return '승인'
  }, [statusFilter])
  const handleSiteChange = (value: string) => {
    setSite(value === 'all' ? '' : value)
    setUploadWarning('')
  }
  const handleCategoryChange = (value: string) => {
    const normalized: '' | 'before' | 'after' = value === 'all' ? '' : (value as 'before' | 'after')
    setCategory(normalized)
  }
  const handleStatusChange = (value: string) => {
    setStatusFilter(value as typeof statusFilter)
  }

  const renderStatusBadge = (status?: string | null) => {
    const key = (status || '').toLowerCase()
    const normalized =
      key === 'approved'
        ? 'approved'
        : key === 'submitted' || key === 'completed'
          ? 'submitted'
          : 'draft'
    const cfg =
      normalized === 'approved'
        ? { bg: '#ecfdf3', text: '#15803d', label: '승인' }
        : normalized === 'submitted'
          ? { bg: '#eff6ff', text: '#2563eb', label: '작성완료' }
          : { bg: '#f3f4f6', text: '#4b5563', label: '임시저장' }
    return (
      <span
        className="inline-flex items-center rounded-full px-2 py-[2px] text-[10px] font-semibold"
        style={{ background: cfg.bg, color: cfg.text }}
      >
        {cfg.label}
      </span>
    )
  }

  const onUpload = () => {
    // 사진·도면 관리 화면으로 이동하여 업로드 진행
    if (typeof window !== 'undefined') {
      window.location.href = '/mobile/media?tab=photo'
    }
  }
  const onFiles = async (files: FileList | null) => {
    if (!files) return
    const arr = Array.from(files)
    if (arr.length > 30) {
      toast({
        title: '업로드 제한',
        description: '최대 30장까지 업로드할 수 있습니다.',
        variant: 'warning',
      })
      return
    }
    if (!site) {
      toast({ title: '선택 필요', description: '현장을 먼저 선택하세요.', variant: 'warning' })
      return
    }
    const cat = (category || 'other') as 'before' | 'after' | 'other'
    for (const f of arr) {
      try {
        const form = new FormData()
        form.append('file', f)
        form.append('siteId', site)
        form.append('category', cat)
        const res = await fetch('/api/docs/photos', { method: 'POST', body: form })
        if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error || '업로드 실패')
      } catch {
        await addToUploadQueue({
          endpoint: '/api/docs/photos',
          fields: { siteId: site, category: cat },
          file: f,
        })
        setQueue(prev => [...prev, { file: f, siteId: site, category: cat }])
      }
    }
    fetchList()
  }
  const toggle = (id: string) =>
    setSelected(prev => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })

  const formatDateLabel = (iso: string) => {
    if (!iso) return ''
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return ''
    const yy = String(d.getFullYear()).slice(2)
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    const weekday = '일월화수목금토'.charAt(d.getDay())
    return `${yy}.${mm}.${dd} (${weekday})`
  }

  const fetchList = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('limit', String(limit))
      params.set('page', String(page))
      if (site) params.set('site_id', site)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      const res = await fetch(`/api/mobile/media/photos?${params.toString()}`, {
        cache: 'no-store',
        credentials: 'include',
      })
      const json = await res.json()
      if (res.ok && json?.success) {
        const photos = json.data?.photos || []
        const mapped =
          photos.map((d: any) => ({
            id: String(d.id),
            url: d.url ? String(d.url) : '',
            name: String(d.name || d.file_name || d.title || `photo-${d.id}`),
            siteId: d.siteId ? String(d.siteId) : d.site_id ? String(d.site_id) : '',
            siteName: d.siteName || d.site_name || '',
            category: d.type === 'after' || d.photo_type === 'after' ? 'after' : 'before',
            workDescription: d.workDescription || d.work_description || '',
            workDate: d.workDate || d.work_date || '',
            createdAt: d.uploadedAt || d.created_at || '',
          })) || []
        setItems(mapped)
        const totalPagesCalc =
          json.data?.total && limit > 0 ? Math.max(1, Math.ceil(json.data.total / limit)) : 1
        setTotalPages(totalPagesCalc)
      } else {
        setItems([])
        // If API blocked due to missing site, try selecting first available site automatically
        if (!site && siteOptions.length > 0) {
          setSite(siteOptions[0].id)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchList()
  }, [site, category, page, isRestricted, userRole])
  useEffect(() => {
    ;(async () => {
      try {
        const meRes = await fetch('/api/auth/me', { cache: 'no-store', credentials: 'include' })
        const me = await meRes.json().catch(() => ({}))
        setIsRestricted(Boolean(me?.isRestricted))
        setUserRole(me?.role || '')
      } catch {
        setIsRestricted(false)
        setUserRole('')
      } finally {
        setAuthLoaded(true)
      }
    })()
  }, [])

  useEffect(() => {
    ;(async () => {
      const res = await fetch('/api/mobile/sites/list', {
        cache: 'no-store',
        credentials: 'include',
      })
      const json = await res.json().catch(() => ({}))
      if (res.ok && json?.success) {
        const opts = (json.data || []).map((s: any) => ({ id: String(s.id), name: String(s.name) }))
        setSiteOptions(opts)
        // Auto-pick first available site to satisfy API requirement for all roles
        if (!site && opts.length > 0) setSite(opts[0].id)
      }
    })()
  }, [isRestricted, userRole])

  return (
    <div>
      <div className="filters filter-section">
        <div className="filter-row">
          <CustomSelect value={site || 'all'} onValueChange={handleSiteChange}>
            <CustomSelectTrigger
              className="doc-filter-trigger min-w-[150px] w-full"
              aria-label="현장 선택"
            >
              <CustomSelectValue>{siteSelectLabel}</CustomSelectValue>
            </CustomSelectTrigger>
            <CustomSelectContent>
              <CustomSelectItem value="all">현장 전체</CustomSelectItem>
              {siteOptions.map(s => (
                <CustomSelectItem key={s.id} value={s.id}>
                  {s.name}
                </CustomSelectItem>
              ))}
            </CustomSelectContent>
          </CustomSelect>
          <CustomSelect value={category || 'all'} onValueChange={handleCategoryChange}>
            <CustomSelectTrigger
              className="doc-filter-trigger min-w-[140px] w-full"
              aria-label="보수 전/후 선택"
            >
              <CustomSelectValue>{categorySelectLabel}</CustomSelectValue>
            </CustomSelectTrigger>
            <CustomSelectContent>
              <CustomSelectItem value="all">보수 전/후 전체</CustomSelectItem>
              <CustomSelectItem value="before">보수 전</CustomSelectItem>
              <CustomSelectItem value="after">보수 후</CustomSelectItem>
              <CustomSelectItem value="other">기타</CustomSelectItem>
            </CustomSelectContent>
          </CustomSelect>
          <CustomSelect value={statusFilter} onValueChange={handleStatusChange}>
            <CustomSelectTrigger
              className="doc-filter-trigger min-w-[140px] w-full"
              aria-label="작업일지 상태 선택"
            >
              <CustomSelectValue>{statusSelectLabel}</CustomSelectValue>
            </CustomSelectTrigger>
            <CustomSelectContent>
              <CustomSelectItem value="all">작업일지 전체</CustomSelectItem>
              <CustomSelectItem value="draft">임시저장</CustomSelectItem>
              <CustomSelectItem value="submitted">작성완료</CustomSelectItem>
              <CustomSelectItem value="approved">승인</CustomSelectItem>
            </CustomSelectContent>
          </CustomSelect>
        </div>
        <div className="flex justify-end">
          <button className="btn btn-primary" onClick={onUpload} style={{ minWidth: 120 }}>
            업로드
          </button>
        </div>
        <input
          ref={inputRef}
          type="file"
          hidden
          accept="image/*"
          multiple
          onChange={e => onFiles(e.target.files)}
        />
      </div>
      {uploadWarning ? (
        <p className="my-2 text-xs font-medium text-[--accent-600]">{uploadWarning}</p>
      ) : null}
      {queue.length > 0 && (
        <div className="doc-selection-card" style={{ marginBottom: 8 }}>
          <div className="doc-selection-content">
            <div className="doc-selection-title">오프라인 대기열 {queue.length}개</div>
          </div>
          <div className="doc-actions">
            <button
              className="btn"
              onClick={async () => {
                const rest: typeof queue = []
                for (const item of queue) {
                  try {
                    const form = new FormData()
                    form.append('file', item.file)
                    form.append('siteId', item.siteId)
                    form.append('category', item.category)
                    const res = await fetch('/api/docs/photos', { method: 'POST', body: form })
                    if (!res.ok) throw new Error('fail')
                  } catch {
                    rest.push(item)
                  }
                }
                setQueue(rest)
                fetchList()
                try {
                  const reg = await navigator.serviceWorker.ready
                  if ('sync' in reg) await reg.sync.register('docs-upload-sync')
                  navigator.serviceWorker.controller?.postMessage('process-queue')
                } catch {
                  /* ignore sync registration error */
                }
              }}
            >
              대기열 업로드
            </button>
          </div>
        </div>
      )}
      <div className="grid-thumbs">
        {loading && <div className="doc-selection-title">불러오는 중...</div>}
        {!loading &&
          items.map(it => {
            const fileName = it.name || it.url?.split('/')?.pop() || ''
            const shortName =
              fileName.length > 18 ? `${fileName.slice(0, 9)}…${fileName.slice(-6)}` : fileName
            const label = shortName || `photo-${it.id}`
            const siteLabel =
              it.siteName ||
              siteOptions.find(s => s.id === it.siteId)?.name ||
              siteSelectLabel ||
              '현장 정보 없음'
            const dateLabel = formatDateLabel(it.workDate || it.createdAt || '')
            const workLabel = it.workDescription || '작업내역 미기재'
            const catKey = it.category || 'other'
            const catStyle =
              catKey === 'before'
                ? { bg: '#e8f0ff', text: '#1d4ed8', border: '#cfdcff', label: '보수 전' }
                : catKey === 'after'
                  ? { bg: '#e9f8ef', text: '#15803d', border: '#c7f3d6', label: '보수 후' }
                  : { bg: '#f3f4f6', text: '#4b5563', border: '#e5e7eb', label: '기타' }

            return (
              <div
                key={it.id}
                className="thumb"
                onClick={() => {
                  setPreview({
                    url: it.url,
                    title: label,
                    site: siteLabel || '현장 정보 없음',
                    work: workLabel || '작업내역 미기재',
                    date: dateLabel || '',
                  })
                  setIsPreviewOpen(true)
                }}
                style={{
                  outline: selected.has(it.id) ? '2px solid var(--tag-blue)' : 'none',
                  borderRadius: 14,
                  overflow: 'hidden',
                  background: '#fff',
                  border: '1px solid #e4e8f5',
                  boxShadow: '0 6px 18px rgba(26, 39, 63, 0.04)',
                }}
              >
                <div className="flex gap-3 p-3">
                  <div className="relative h-20 w-20 overflow-hidden rounded-xl bg-[#f5f7fb] flex-shrink-0">
                    {it.url ? (
                      <Image
                        src={it.url}
                        alt={label}
                        width={160}
                        height={160}
                        className="h-full w-full object-cover"
                        sizes="160px"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[11px] text-[#9aa4c5]">
                        미리보기 없음
                      </div>
                    )}
                    <span
                      className="absolute left-1.5 top-1.5 inline-flex items-center rounded-full px-2 py-[2px] text-[10px] font-semibold"
                      style={{
                        background: catStyle.bg,
                        color: catStyle.text,
                        border: `1px solid ${catStyle.border}`,
                        borderRadius: 9999,
                      }}
                    >
                      {catStyle.label}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col justify-between min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div
                          className="text-[12px] font-semibold text-[#111827] truncate"
                          title={siteLabel}
                        >
                          {siteLabel || '현장 정보 없음'}
                        </div>
                        <div
                          className="text-[11px] text-[#4b5563] leading-snug line-clamp-2"
                          title={workLabel}
                        >
                          {workLabel}
                        </div>
                        <div className="text-[11px] text-[#6b7280] truncate" title={label}>
                          {label}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation()
                          setSelected(new Set([it.id]))
                          deleteSelected()
                        }}
                        className="text-[11px] font-semibold text-[#d14343] px-2 py-1"
                      >
                        삭제
                      </button>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-[#6b7280]">
                      <span>{dateLabel || '날짜 정보 없음'}</span>
                      {renderStatusBadge(it.status)}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
      </div>
      <div className="foot equal">
        <button
          className="btn"
          onClick={async () => {
            if (selected.size === 0) {
              toast({
                title: '선택 필요',
                description: '먼저 사진을 선택해 주세요.',
                variant: 'warning',
              })
              return
            }
            for (const id of Array.from(selected)) {
              const url = items.find(it => it.id === id)?.url
              if (!url) continue
              try {
                const r = await fetch(`/api/files/signed-url?url=${encodeURIComponent(url)}`)
                const j = await r.json()
                const su = j?.url || url
                const a = document.createElement('a')
                a.href = su
                a.download = ''
                a.click()
              } catch {
                const a = document.createElement('a')
                a.href = url
                a.download = ''
                a.click()
              }
            }
          }}
        >
          저장하기
        </button>
        <button
          className="btn btn-primary"
          onClick={async () => {
            if (selected.size === 0) {
              toast({
                title: '선택 필요',
                description: '먼저 사진을 선택해 주세요.',
                variant: 'warning',
              })
              return
            }
            const url = items.find(it => it.id === Array.from(selected)[0])?.url
            if ((navigator as any).share && url) {
              try {
                const r = await fetch(`/api/files/signed-url?url=${encodeURIComponent(url)}`)
                const j = await r.json()
                await (navigator as any).share({ url: j?.url || url, title: '사진 공유' })
              } catch {
                await (navigator as any).share({ url, title: '사진 공유' })
              }
            } else {
              toast({ title: '공유 안내', description: '브라우저 공유 미지원', variant: 'info' })
            }
          }}
        >
          공유하기
        </button>
      </div>
      <div className="tab-controls" style={{ justifyContent: 'space-between' }}>
        <button
          className="btn"
          disabled={page <= 1}
          onClick={() => setPage(p => Math.max(1, p - 1))}
        >
          이전
        </button>
        <div className="doc-selection-title">
          {page} / {totalPages}
        </div>
        <button className="btn" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
          다음
        </button>
      </div>

      {isPreviewOpen && preview?.url && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
          onClick={() => setIsPreviewOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-t-2xl bg-white p-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-[#111827] truncate">
                  {preview.title || '사진'}
                </div>
                <div className="text-[11px] text-[#6b7280]">{preview.site}</div>
                <div className="text-[11px] text-[#4b5563] line-clamp-2">
                  작업내역: {preview.work || '작업내역 미기재'}
                </div>
                <div className="text-[11px] text-[#6b7280]">{preview.date}</div>
              </div>
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="rounded-lg bg-[#f4f7ff] px-3 py-1 text-[12px] font-semibold text-[#1f2942]"
              >
                닫기
              </button>
            </div>
            <div className="overflow-hidden rounded-xl border border-[#e0e6f3] bg-[#f9fbff]">
              <Image
                src={preview.url}
                alt={preview.title || '사진'}
                width={1200}
                height={900}
                className="h-[60vh] w-full object-contain bg-black/5"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
// IndexedDB helper for upload queue
async function openQueueDb() {
  return await new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open('docs-uploads', 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains('queue'))
        db.createObjectStore('queue', { keyPath: 'id', autoIncrement: true })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function addToUploadQueue(opts: {
  endpoint: string
  fields: Record<string, string>
  file: File
}) {
  const db = await openQueueDb()
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('queue', 'readwrite')
      const store = tx.objectStore('queue')
      const payload = {
        endpoint: opts.endpoint,
        fields: opts.fields,
        filename: opts.file.name,
        fileType: opts.file.type,
        fileData: opts.file,
        createdAt: Date.now(),
      }
      const req = store.add(payload)
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
    })
  } finally {
    db.close()
  }
}

async function getQueueCount() {
  const db = await openQueueDb()
  try {
    return await new Promise<number>((resolve, reject) => {
      const tx = db.transaction('queue', 'readonly')
      const store = tx.objectStore('queue')
      const req = store.count()
      req.onsuccess = () => resolve(req.result || 0)
      req.onerror = () => reject(req.error)
    })
  } finally {
    db.close()
  }
}
