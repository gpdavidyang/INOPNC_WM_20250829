'use client'

import Image from 'next/image'
import React, { useEffect, useMemo, useRef, useState } from 'react'
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

type TabKey = 'mine' | 'company' | 'drawings' | 'photos'

type RequiredDocKey =
  | 'pre-employment-checkup'
  | 'safety-training'
  | 'vehicle-insurance'
  | 'vehicle-registration'
  | 'bank-account-copy'
  | 'id-card'
  | 'senior-documents'
  | 'other'

const REQUIRED_LIST: Array<{ key: RequiredDocKey; title: string }> = [
  { key: 'pre-employment-checkup', title: '배치전 검진' },
  { key: 'safety-training', title: '기초안전보건교육' },
  { key: 'vehicle-insurance', title: '차량보험증' },
  { key: 'vehicle-registration', title: '차량등록증' },
  { key: 'bank-account-copy', title: '통장사본' },
  { key: 'id-card', title: '신분증' },
  { key: 'senior-documents', title: '고령자 서류' },
  { key: 'other', title: '기타' },
]

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
            현장공유함(도면 등)
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
        .doc-item {
          border: 1px solid rgba(148, 163, 184, 0.3);
          border-radius: 14px;
          background: #fff;
          padding: 12px 16px;
          display: flex;
          gap: 12px;
          align-items: flex-start;
        }
        @media (max-width: 520px) {
          .doc-item {
            flex-direction: column;
          }
        }
        .doc-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .doc-title-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }
        .doc-item-title {
          font-size: 15px;
          font-weight: 600;
          color: #111827;
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
        .doc-meta-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          font-size: 11px;
          color: #64748b;
        }
        .doc-meta-row .doc-category-badge {
          font-size: 10px;
        }
        .doc-status-row {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .doc-status-pill {
          display: inline-flex;
          align-items: center;
          font-size: 11px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 999px;
          background: rgba(15, 23, 42, 0.05);
          color: #111827;
        }
        .doc-status-pill.pending {
          color: #b45309;
          background: rgba(251, 191, 36, 0.18);
        }
        .doc-actions {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-left: auto;
          flex-wrap: wrap;
        }
        @media (max-width: 520px) {
          .doc-actions {
            width: 100%;
            justify-content: flex-start;
            margin-left: 0;
          }
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
        }
        .upload-btn.uploaded {
          border-color: #16a34a;
          color: #16a34a;
          background: color-mix(in srgb, #16a34a 10%, transparent);
        }
        .doc-actions .btn,
        .foot .btn {
          border: 1px solid var(--line, #e5e7eb);
          background: var(--card, #fff);
          color: var(--text, #1f2937);
        }
        .preview-btn,
        .selection-checkmark {
          border: 1px solid var(--line, #e5e7eb);
          background: var(--card, #fff);
          color: var(--text, #1f2937);
          border-radius: 10px;
          padding: 8px 10px;
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
          padding: 0 16px;
          border-radius: 10px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
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
        .grid-thumbs .thumb {
          background: var(--card, #fff);
          border: 1px solid var(--line, #e5e7eb);
          border-radius: 10px;
          overflow: hidden;
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

function MyDocsTab() {
  const { toast } = useToast()
  const [uploaded, setUploaded] = useState<Record<string, File | null>>({})
  const [requiredTypes, setRequiredTypes] = useState<
    Array<{ id: string; code: string; name_ko?: string }>
  >([])
  const [submissions, setSubmissions] = useState<
    Record<string, { document_id?: string; file_url?: string }>
  >({})
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({})

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
          ? (typesJson.required_documents as Array<any>).map(it => ({
              id: String(it.id),
              code: String(it.code || it.document_type || ''),
            }))
          : []
        setRequiredTypes(list)

        const map: Record<string, { document_id?: string; file_url?: string }> = {}
        if (Array.isArray(subsJson?.data)) {
          for (const s of subsJson.data) {
            const docType = s?.requirement?.document_type || s?.requirement?.documentType || ''
            const key = String(docType)
            const doc = s?.document
            if (key) {
              map[key] = { document_id: doc?.id, file_url: doc?.file_url }
            }
          }
        }
        setSubmissions(map)
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
      if (requirementId && docId) {
        await fetch('/api/user-document-submissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ requirement_id: requirementId, document_id: docId }),
        })
        setSubmissions(prev => ({
          ...prev,
          [k]: { document_id: String(docId), file_url: json?.data?.url },
        }))
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

  const onSave = () => {
    if (selectedFiles.length > 0) {
      for (const f of selectedFiles) {
        const a = document.createElement('a')
        a.href = URL.createObjectURL(f)
        a.download = f.name
        a.click()
        URL.revokeObjectURL(a.href)
      }
    } else if (selectedRemoteUrls.length > 0) {
      for (const url of selectedRemoteUrls) {
        const a = document.createElement('a')
        a.href = url
        a.download = ''
        a.click()
      }
    } else {
      toast({ title: '선택 필요', description: '먼저 파일을 선택해 주세요.', variant: 'warning' })
    }
  }
  const onShare = async () => {
    if (selectedFiles.length === 0 && selectedRemoteUrls.length === 0) {
      toast({ title: '선택 필요', description: '먼저 파일을 선택해 주세요.', variant: 'warning' })
      return
    }
    try {
      const nav: any = navigator as any
      if (!nav.share) {
        toast({
          title: '공유 안내',
          description: 'Web Share 미지원. 저장 후 다른 앱으로 공유하세요.',
          variant: 'info',
        })
        return
      }

      // 우선 파일 공유 시도
      if (selectedFiles.length > 0 && nav.canShare) {
        // 1) 다중 파일 지원 여부 확인
        if (nav.canShare({ files: selectedFiles })) {
          await nav.share({ files: selectedFiles, title: '내문서함 공유' })
          return
        }
        // 2) 단일 파일로 폴백
        const single = selectedFiles[0]
        if (single && nav.canShare({ files: [single] })) {
          if (selectedFiles.length > 1) {
            toast({
              title: '다중 파일 공유 미지원',
              description: `선택한 ${selectedFiles.length}개 중 첫 번째 파일(${single.name})만 공유됩니다. 나머지는 저장 후 개별 공유해 주세요.`,
              variant: 'info',
            })
          }
          await nav.share({ files: [single], title: '내문서함 공유(첫 파일만)' })
          return
        }
        // 3) 파일 공유가 불가한 환경 → 링크 공유로 폴백
      }

      if (selectedRemoteUrls.length > 0) {
        const text = selectedRemoteUrls.join('\n')
        await nav.share({ title: '내문서함 공유', text, url: selectedRemoteUrls[0] })
        return
      }

      toast({
        title: '선택 필요',
        description: '공유할 항목을 선택하거나 저장 후 다시 시도하세요.',
        variant: 'warning',
      })
    } catch (e) {
      const msg = e instanceof Error ? e.message : ''
      toast({
        title: '공유 실패',
        description: msg || '공유 취소 또는 실패',
        variant: 'destructive',
      })
    }
  }

  return (
    <div>
      <div className="section-title">필수제출서류 8종</div>
      <div className="document-cards">
        {REQUIRED_LIST.map(item => {
          const f = uploaded[item.key]
          const remote = submissions[item.key]
          return (
            <div
              key={item.key}
              className={`doc-selection-card ${selected.has(item.key) ? 'active' : ''}`}
            >
              <div className="doc-selection-content">
                <div className="doc-selection-title">{item.title}</div>
              </div>
              <div className="doc-actions">
                <input
                  ref={el => (inputRefs.current[item.key] = el)}
                  type="file"
                  hidden
                  onChange={e => onFile(item.key, e.target.files?.[0] || undefined)}
                />
                <button
                  className={`upload-btn ${f || remote ? 'uploaded' : ''}`}
                  onClick={() => onPick(item.key)}
                >
                  {f || remote ? '완료' : '업로드'}
                </button>
                <button
                  className="preview-btn"
                  disabled={!f && !remote}
                  onClick={async () => {
                    if (remote?.file_url) {
                      try {
                        const r = await fetch(
                          `/api/files/signed-url?url=${encodeURIComponent(remote.file_url)}`
                        )
                        const j = await r.json()
                        const su = j?.url || remote.file_url
                        window.open(su, '_blank')
                      } catch {
                        window.open(remote.file_url, '_blank')
                      }
                    } else if (f) window.open(URL.createObjectURL(f), '_blank')
                  }}
                >
                  보기
                </button>
                <button
                  className={`selection-checkmark ${selected.has(item.key) ? 'active' : ''}`}
                  aria-pressed={selected.has(item.key)}
                  onClick={() => toggle(item.key)}
                >
                  ✓
                </button>
              </div>
            </div>
          )
        })}
      </div>
      <div className="foot equal">
        <button className="btn" onClick={onSave}>
          저장하기
        </button>
        <button className="btn btn-primary" onClick={onShare}>
          공유하기
        </button>
      </div>
    </div>
  )
}

function CompanyTab() {
  const { toast } = useToast()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [docs, setDocs] = useState<Array<{ id: string; title: string; url: string }>>([])
  const [loading, setLoading] = useState(false)
  const [migrateTried, setMigrateTried] = useState(false)
  const filteredDocs = useMemo(() => docs.filter(d => !(d.title || '').includes('공도면')), [docs])

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        const res = await fetch(
          '/api/unified-documents/v2?category_type=shared&status=active&limit=100',
          { credentials: 'include' }
        )
        const json = await res.json()
        if (res.ok && json?.success) {
          const list = Array.isArray(json.data)
            ? json.data.map((d: any) => ({
                id: String(d.id),
                title: d.title || d.file_name || '문서',
                url: String(d.file_url || ''),
              }))
            : []
          setDocs(list)
        }
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  // 자동 마이그레이션 트리거(관리자만 성공, 일반 사용자 403은 무시)
  useEffect(() => {
    ;(async () => {
      if (migrateTried || loading) return
      const hasBlueprintKeyword = docs.some(d => (d.title || '').includes('공도면'))
      if (!hasBlueprintKeyword) return
      try {
        const res = await fetch('/api/admin/documents/migrate-blueprints', {
          method: 'POST',
          credentials: 'include',
        })
        setMigrateTried(true)
        // 성공 또는 권한 부족이어도 무시 후 목록 리프레시 시도
        const reload = await fetch(
          '/api/unified-documents/v2?category_type=shared&status=active&limit=100',
          { credentials: 'include' }
        )
        const j = await reload.json().catch(() => ({}))
        if (reload.ok && j?.success) {
          const list = Array.isArray(j.data)
            ? j.data.map((d: any) => ({
                id: String(d.id),
                title: d.title || d.file_name || '문서',
                url: String(d.file_url || ''),
              }))
            : []
          setDocs(list)
        }
      } catch {
        setMigrateTried(true)
      }
    })()
  }, [docs, loading, migrateTried])

  const toggle = (id: string) =>
    setSelected(prev => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  const selectedUrls = useMemo(
    () =>
      Array.from(selected)
        .map(id => docs.find(d => d.id === id)?.url)
        .filter(Boolean) as string[],
    [selected, docs]
  )

  const onShare = async () => {
    if (selectedUrls.length === 0) {
      toast({ title: '선택 필요', description: '먼저 파일을 선택해 주세요.', variant: 'warning' })
      return
    }
    try {
      if ((navigator as any).share && selectedUrls.length > 0) {
        let url = selectedUrls[0]
        try {
          const r = await fetch(`/api/files/signed-url?url=${encodeURIComponent(url)}`)
          const j = await r.json()
          url = j?.url || url
        } catch {
          /* ignore signing error */
        }
        await (navigator as any).share({ url, title: '회사서류 공유' })
      } else {
        toast({
          title: '공유 안내',
          description: '공유를 지원하지 않는 브라우저입니다.',
          variant: 'info',
        })
      }
    } catch {
      /* ignore initial load error */
    }
  }
  const onSave = async () => {
    if (selectedUrls.length === 0) {
      toast({ title: '선택 필요', description: '먼저 파일을 선택해 주세요.', variant: 'warning' })
      return
    }
    for (let url of selectedUrls) {
      try {
        const r = await fetch(`/api/files/signed-url?url=${encodeURIComponent(url)}`)
        const j = await r.json()
        url = j?.url || url
      } catch {
        /* ignore signing error */
      }
      const a = document.createElement('a')
      a.href = url
      a.download = ''
      a.click()
    }
  }

  return (
    <div>
      <div className="document-cards">
        {loading && <div className="doc-selection-title">불러오는 중...</div>}
        {!loading && filteredDocs.length === 0 && (
          <div className="doc-selection-title">회사서류가 없습니다.</div>
        )}
        {!loading &&
          filteredDocs.map(item => (
            <div
              key={item.id}
              className={`doc-selection-card ${selected.has(item.id) ? 'active' : ''}`}
            >
              <div className="doc-selection-content">
                <div className="doc-selection-title">{item.title}</div>
              </div>
                <div className="doc-actions">
                  <button
                    className="preview-btn"
                    onClick={async () => {
                    if (!item.url) return
                    try {
                      const r = await fetch(
                        `/api/files/signed-url?url=${encodeURIComponent(item.url)}`
                      )
                      const j = await r.json()
                      window.open(j?.url || item.url, '_blank')
                    } catch {
                      window.open(item.url, '_blank')
                    }
                  }}
                >
                  보기
                </button>
                <button
                  className={`selection-checkmark ${selected.has(item.id) ? 'active' : ''}`}
                  onClick={() => toggle(item.id)}
                >
                  ✓
                </button>
              </div>
            </div>
          ))}
      </div>
      {/* 관리자용 버튼 제거됨: 공도면 이전/회사서류 초기화 */}
      <div className="foot equal">
        <button className="btn" onClick={onSave}>
          저장하기
        </button>
        <button className="btn btn-primary" onClick={onShare}>
          공유하기
        </button>
      </div>
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
  const normalized = rawIds
    .map(id => (typeof id === 'string' ? id.trim() : ''))
    .filter(Boolean)
  if (!normalized.length) {
    return { type: 'empty' as const, ids: [] as string[], total: 0, title: '' }
  }
  const readableOnly = normalized.every(isReadableWorklogReference)
  return readableOnly
    ? { type: 'badges' as const, ids: normalized, total: normalized.length, title: normalized.join(', ') }
    : { type: 'summary' as const, ids: [] as string[], total: normalized.length, title: normalized.join(', ') }
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
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
const limit = 24
const [totalPages, setTotalPages] = useState(1)
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
      if (q.trim()) params.set('q', q.trim())
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
  const resolveDocUrl = async (
    doc: {
      url?: string
      previewUrl?: string
      storagePath?: string | null
      storageBucket?: string | null
    },
    options?: { downloadName?: string }
  ) => {
    if (!doc.storagePath && !doc.url && !doc.previewUrl) return null
    const rawUrl =
      typeof doc.previewUrl === 'string' && doc.previewUrl.length > 0
        ? doc.previewUrl
        : typeof doc.url === 'string'
          ? doc.url
          : ''
    const isInlineUrl =
      rawUrl.startsWith('data:') || rawUrl.startsWith('blob:') || rawUrl.length > 1800
    if (isInlineUrl && rawUrl) {
      return rawUrl
    }
    const params = new URLSearchParams()
    if (doc.storagePath) {
      params.set('path', doc.storagePath)
      const bucket = doc.storageBucket || 'documents'
      if (bucket) params.set('bucket', bucket)
    }
    if (rawUrl) {
      params.set('url', rawUrl)
    }
    if (options?.downloadName) params.set('download', options.downloadName)
    try {
      const r = await fetch(`/api/files/signed-url?${params.toString()}`)
      const j = await r.json().catch(() => ({}))
      if (j?.url) return j.url as string
    } catch {
      /* ignore */
    }
    return rawUrl || null
  }
  const openMarkupTool = async () => {
    try {
      // If exactly one drawing is selected, bridge it to the markup tool
      if (selected.size === 1) {
        const id = Array.from(selected)[0]
        const it = items.find(i => i.id === id)
        if (it) {
          const resolvedUrl = await resolveDocUrl(it)
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

        // Fetch site options
        if (restricted && me?.restrictedOrgId) {
          // Partner-only sites
          const r = await fetch(
            `/api/sites/by-partner?partner_company_id=${encodeURIComponent(me.restrictedOrgId)}`,
            { cache: 'no-store', credentials: 'include' }
          )
          const list = await r.json().catch(() => [])
          const opts: Array<{ id: string; name: string }> = Array.isArray(list)
            ? list.map((s: any) => ({ id: String(s.id), name: String(s.name || '현장') }))
            : []
          setSiteOptions(opts)
          // Auto-select first allowed site for partner users
          if (!site && opts.length > 0) setSite(opts[0].id)
        } else {
          // All sites for non-restricted users
          const r = await fetch('/api/mobile/sites/list', { cache: 'no-store' })
          const j = await r.json().catch(() => ({}))
          if (r.ok && j?.success) {
            const opts = (j.data || []).map((s: any) => ({
              id: String(s.id),
              name: String(s.name),
            }))
            setSiteOptions(opts)
          }
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
      {authLoaded && isRestricted && !site && siteOptions.length > 0 && (
        <div className="doc-selection-card" style={{ marginBottom: 8 }}>
          <div className="doc-selection-content">
            <div className="doc-selection-title">현장을 먼저 선택하세요</div>
            <div style={{ fontSize: 12, color: '#6B7280' }}>
              시공업체 사용자는 배정된 현장 선택 후 도면을 조회할 수 있습니다.
            </div>
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
          <div className="filter-row filter-row-search">
            <input
              className="input"
              placeholder="검색"
              value={q}
              onChange={e => setQ(e.target.value)}
            />
            <button
              className="btn search-btn"
              onClick={() => {
                setPage(1)
                fetchList()
              }}
            >
              검색
            </button>
          </div>
          <div className="filter-row">
            <input
              className="input"
              placeholder="작업일지 ID (연결 모드)"
              value={worklogDraft}
              onChange={e => setWorklogDraft(e.target.value)}
            />
            <button
              className="btn"
              onClick={() => setWorklogLinkId(worklogDraft.trim())}
              disabled={!worklogDraft.trim()}
            >
              적용
            </button>
            <button className="btn" onClick={() => setWorklogLinkId('')}>
              해제
            </button>
          </div>
          <div className="filters-divider horizontal" aria-hidden="true" />
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
        {!loading &&
          items.map(it => {
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
            return (
              <div key={it.id} className={`doc-item ${selected.has(it.id) ? 'active' : ''}`}>
                <div className="doc-info">
                  <div className="doc-title-row">
                    <div className="doc-item-title">{it.title || '도면'}</div>
                    {siteLabel ? <span className="doc-item-site">{siteLabel}</span> : null}
                  </div>
                  <div className="doc-meta-row">
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
                    {formattedDate ? <span className="doc-meta-date">{formattedDate}</span> : null}
                  </div>
                  <div className="doc-status-row">
                    <span className={`doc-status-pill ${hasConnections ? '' : 'pending'}`}>
                      {hasConnections
                        ? display.type === 'badges'
                          ? '작업일지 연결'
                          : `연결 ${display.total}건`
                        : '작업일지 미연결'}
                    </span>
                    {hasConnections && display.type === 'badges' ? (
                      <div className="flex flex-wrap items-center gap-1">
                        {display.ids.map(id => (
                          <span key={id} className="doc-meta-date badge-link">
                            {formatReadableWorklogId(id)}
                          </span>
                        ))}
                      </div>
                    ) : !hasConnections ? (
                      <span className="doc-meta-date muted">연결 필요</span>
                    ) : null}
                  </div>
                </div>
                <div className="doc-actions">
                  <button
                    className="preview-btn"
                    onClick={async () => {
                        const markupId = getMarkupDocumentId(it.id)
                        const hasPreview = typeof it.previewUrl === 'string' && it.previewUrl.length > 0
                        if (markupId && !hasPreview) {
                          openMarkupViewer(it)
                          return
                        }
                        const finalUrl = await resolveDocUrl(it)
                        if (!finalUrl) {
                          if (markupId) {
                            openMarkupViewer(it)
                            return
                          }
                          toast({
                            title: '파일 없음',
                            description: '파일을 찾을 수 없습니다. 관리자에게 재업로드를 요청해 주세요.',
                            variant: 'destructive',
                          })
                          return
                        }
                        const isInline = finalUrl.startsWith('data:') || finalUrl.startsWith('blob:')
                        if (!isInline) {
                          try {
                            const chk = await fetch(`/api/files/check?url=${encodeURIComponent(finalUrl)}`)
                            const cj = await chk.json().catch(() => ({}))
                            if (!cj?.exists) {
                              toast({
                                title: '파일 없음',
                                description: '파일을 찾을 수 없습니다. 관리자에게 재업로드를 요청해 주세요.',
                                variant: 'destructive',
                              })
                              return
                            }
                          } catch {
                            /* ignore */
                          }
                        }
                        window.open(finalUrl, '_blank')
                      }}
                    >
                      보기
                    </button>
                    {it.pdfUrl ? (
                      <button className="preview-btn secondary" onClick={() => window.open(it.pdfUrl!, '_blank')}>
                        PDF
                      </button>
                    ) : null}
                    {getMarkupDocumentId(it.id) ? (
                      <button className="preview-btn secondary" onClick={() => openMarkupViewer(it)}>
                        마킹열기
                      </button>
                    ) : null}
                    {worklogLinkId && getMarkupDocumentId(it.id) ? (
                      <button
                        className="preview-btn"
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
                    <button
                      className={`selection-checkmark ${selected.has(it.id) ? 'active' : ''}`}
                      onClick={() => toggle(it.id)}
                    >
                      ✓
                    </button>
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
                description: '먼저 도면을 선택해 주세요.',
                variant: 'warning',
              })
              return
            }
            for (const id of Array.from(selected)) {
              const doc = items.find(it => it.id === id)
              if (!doc) continue
              const downloadSource = doc.pdfUrl || doc.url
              const finalUrl = await resolveDocUrl(
                doc.pdfUrl ? { ...doc, previewUrl: doc.pdfUrl, url: doc.pdfUrl } : doc,
                {
                  downloadName: (doc.title || 'drawing').replace(/\s+/g, '_'),
                }
              )
              if (!finalUrl && downloadSource) {
                const fallback = downloadSource
                const a = document.createElement('a')
                a.href = fallback
                a.download = (doc.title || '').replace(/\s+/g, '_') || 'drawing'
                a.click()
                continue
              }
              if (!finalUrl) continue
              const a = document.createElement('a')
              a.href = finalUrl
              a.download = (doc.title || '').replace(/\s+/g, '_') || 'drawing'
              a.click()
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
                description: '먼저 도면을 선택해 주세요.',
                variant: 'warning',
              })
              return
            }
            const doc = items.find(it => it.id === Array.from(selected)[0])
            if ((navigator as any).share && doc) {
              const finalUrl = await resolveDocUrl(
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
  const [items, setItems] = useState<Array<{ id: string; url: string }>>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const limit = 24
  const [totalPages, setTotalPages] = useState(1)
  const [queue, setQueue] = useState<
    Array<{ file: File; siteId: string; category: 'before' | 'after' | 'other' }>
  >([])
  const [uploadWarning, setUploadWarning] = useState('')
  const siteSelectLabel = useMemo(() => {
    if (!site) return '현장 전체'
    return siteOptions.find(s => s.id === site)?.name || '현장 선택'
  }, [site, siteOptions])
  const handleSiteChange = (value: string) => {
    setSite(value === 'all' ? '' : value)
    setUploadWarning('')
  }

  const onUpload = () => {
    if (!site) {
      setUploadWarning('사진을 업로드할 현장을 먼저 선택하세요.')
      toast({
        title: '현장을 먼저 선택하세요',
        description: '사진을 올릴 현장을 선택한 뒤 다시 시도하세요.',
        variant: 'warning',
      })
      return
    }
    setUploadWarning('')
    inputRef.current?.click()
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

  const fetchList = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (site) params.set('siteId', site)
      if (category) params.set('category', category)
      params.set('limit', String(limit))
      params.set('page', String(page))
      if (q.trim()) params.set('q', q.trim())
      const res = await fetch(`/api/docs/photos?${params.toString()}`)
      const json = await res.json()
      if (res.ok && json?.success) {
        setItems((json.data || []).map((d: any) => ({ id: String(d.id), url: String(d.url) })))
        if (json.pagination) setTotalPages(json.pagination.totalPages || 1)
      } else setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchList()
  }, [site, category, page])
  useEffect(() => {
    ;(async () => {
      const res = await fetch('/api/mobile/sites/list', { cache: 'no-store' })
      const json = await res.json().catch(() => ({}))
      if (res.ok && json?.success)
        setSiteOptions(
          (json.data || []).map((s: any) => ({ id: String(s.id), name: String(s.name) }))
        )
    })()
  }, [])

  return (
    <div>
      <div className="filters">
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
        <select
          className="select"
          value={category}
          onChange={e => setCategory(e.target.value as any)}
        >
          <option value="">상태</option>
          <option value="before">보수 전</option>
          <option value="after">보수 후</option>
          <option value="other">기타</option>
        </select>
        <input
          className="input"
          placeholder="검색"
          value={q}
          onChange={e => setQ(e.target.value)}
        />
        <button
          className="btn"
          onClick={() => {
            setPage(1)
            fetchList()
          }}
        >
          검색
        </button>
        <button className="btn" onClick={onUpload}>
          업로드
        </button>
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
          items.map(it => (
            <div
              key={it.id}
              className="thumb"
              onClick={() => toggle(it.id)}
              style={{ outline: selected.has(it.id) ? '2px solid var(--tag-blue)' : 'none' }}
            >
              <Image
                src={it.url}
                alt={`photo-${it.id}`}
                width={320}
                height={180}
                className="h-full w-full object-cover"
                sizes="(max-width: 768px) 50vw, 320px"
              />
            </div>
          ))}
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
