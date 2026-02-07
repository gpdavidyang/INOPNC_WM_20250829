'use client'

import { FileDownloadButton, FileShareButton } from '@/components/files/FileActionButtons'
import { FilePreviewButton } from '@/components/files/FilePreviewButton'
import { useToast } from '@/components/ui/use-toast'
import type { CompanyDocumentType } from '@/lib/documents/company-types'
import {
  REQUIRED_DOC_STATUS_LABELS,
  normalizeRequiredDocStatus,
  type RequiredDocStatus,
} from '@/lib/documents/status'
import { fetchSignedUrlForRecord } from '@/lib/files/preview'
import { cn } from '@/lib/utils'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

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

type TabKey = 'mine' | 'company'

export default function DocumentHubPage() {
  const [active, setActive] = useState<TabKey>('mine')
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw-docs.js').catch(() => {})
    }
  }, [])

  // URL 쿼리 파라미터로 초기 탭 선택 지원 (?tab=company)
  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search)
      const tab = (sp.get('tab') || '').trim() as TabKey
      if (tab === 'mine' || tab === 'company') {
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
      </div>

      <div className="tab-content-wrapper" role="region" aria-live="polite">
        {active === 'mine' && <MyDocsTab />}
        {active === 'company' && <CompanyTab />}
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
          gap: 8px;
        }
        :global(.doc-hub .grid-thumbs) {
          display: grid !important;
          grid-template-columns: repeat(1, minmax(0, 1fr)) !important;
          gap: 8px !important;
        }
        @media (min-width: 700px) {
          .grid-thumbs,
          :global(.doc-hub .grid-thumbs) {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 12px !important;
          }
        }
        .grid-thumbs .thumb {
          background: var(--card, #fff);
          border: 1px solid var(--line, #e5e7eb);
          border-radius: 14px;
          overflow: hidden;
          display: block;
          box-shadow: 0 6px 12px rgba(17, 24, 39, 0.08);
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
