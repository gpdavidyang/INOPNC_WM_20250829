'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { TMap } from '@/lib/external-apps'

interface RecentSiteItem {
  id: string
  name: string
  recentWorkDate?: string
}

export const PartnerHomeSiteSearch: React.FC = () => {
  const [query, setQuery] = useState('')
  const [items, setItems] = useState<RecentSiteItem[]>([])
  const [loading, setLoading] = useState(true)
  const [abbr, setAbbr] = useState<string>('')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [currentSite, setCurrentSite] = useState<any | null>(null)
  const [todayHeadcount, setTodayHeadcount] = useState<number>(0)

  const formatDateWithWeekday = (value?: string | null) => {
    if (!value) return ''
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return ''
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'] as const
    const w = weekdays[d.getDay()]
    return `${y}.${m}.${day}(${w})`
  }

  // 시공업체 약어(2글자) 계산: 한글은 2글자, 영문은 그대로 대문자 유지
  const getPartnerAbbr = (raw?: string | null): string => {
    if (!raw) return ''
    let s = String(raw)
      .trim()
      .replace(/^\s*(주식회사|\(주\)|㈜|유한회사|\(유\))\s*/g, '')
      .replace(/[\s\-_.·'"\[\]\(\){}<>]/g, '')

    const suffixes = [
      '종합건설',
      '엔지니어링',
      '건설',
      '산업개발',
      '산업',
      '개발',
      '기술',
      '테크',
      '그룹',
      '홀딩스',
      '코퍼레이션',
      '주식회사',
      '유한회사',
      '㈜',
      '(주)',
      '(유)',
    ]

    let removed = true
    while (removed && s.length > 0) {
      removed = false
      for (const suf of suffixes) {
        if (s.endsWith(suf)) {
          s = s.slice(0, s.length - suf.length)
          removed = true
        }
      }
    }

    if (!s) return ''
    const units = Array.from(s)
    let ab = units.slice(0, 2).join('')
    if (ab.length === 1) ab = ab + ab
    if (ab.length === 0) return ''
    if (/^[A-Za-z]+$/.test(ab)) return ab.toUpperCase()
    return ab
  }

  useEffect(() => {
    let alive = true
    const controller = new AbortController()
    async function run() {
      setLoading(true)
      try {
        const res = await fetch('/api/partner/labor/by-site?period=monthly', {
          cache: 'no-store',
          signal: controller.signal,
        })
        const payload = await res.json().catch(() => ({}))
        const list = Array.isArray(payload?.sites)
          ? payload.sites.map((s: any) => ({
              id: s.id,
              name: s.name,
              recentWorkDate: s.recentWorkDate,
            }))
          : []
        // 정렬: 최근 날짜 우선
        list.sort((a, b) =>
          String(b.recentWorkDate || '').localeCompare(String(a.recentWorkDate || ''))
        )
        if (alive) setItems(list)

        // 현재 사용자 프로필의 시공업체 약어 계산 (p-main 동일 표시: [롯데], [삼성], ...)
        try {
          const meRes = await fetch('/api/auth/me', { cache: 'no-store' })
          const me = (await meRes.json().catch(() => null)) || {}
          const profile = me?.profile || null
          const partnerId = profile?.partner_company_id || profile?.organization_id || null
          if (partnerId) {
            const pcRes = await fetch('/api/partner-companies', { cache: 'no-store' })
            const companies = (await pcRes.json().catch(() => ({})))?.data || []
            const found = Array.isArray(companies)
              ? companies.find((c: any) => c?.id === partnerId)
              : null
            const ab = getPartnerAbbr(found?.company_name || '')
            if (alive) setAbbr(ab)
          }
        } catch (e) {
          // 무시: 약어 없으면 표시만 생략
          if (alive) setAbbr('')
        }
      } finally {
        if (alive) setLoading(false)
      }
    }
    run()
    return () => {
      alive = false
      controller.abort()
    }
  }, [])

  const filtered = useMemo(() => {
    if (!query.trim()) return items
    const q = query.trim().toLowerCase()
    return items.filter(i => i.name?.toLowerCase().includes(q))
  }, [items, query])

  const top3 = filtered.slice(0, 3)

  const handleOpenOtherDocuments = () => {
    setSheetOpen(false)
    window.location.href = '/mobile/documents'
  }
  const handleOpenWorklogList = () => {
    setSheetOpen(false)
    window.location.href = '/mobile/worklog'
  }

  return (
    <section className="mt-3">
      {/* 검색 + 리스트를 하나의 섹션(카드)로 통합 */}
      <div className="ph-card p-2">
        <div className="ph-search-wrap">
          {/* 돋보기 아이콘 */}
          <svg
            className="ph-search-icon"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            className="ph-search-input"
            placeholder="현장명 검색"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>

        {/* 최근 현장 3건 (동일 섹션에 표기) */}
        {loading && <div className="text-xs text-gray-500 p-2">불러오는 중...</div>}
        {!loading && top3.length === 0 && (
          <div className="text-xs text-gray-500 p-2">표시할 현장이 없습니다.</div>
        )}
        {!loading && top3.length > 0 && (
          <ul className="ph-recent-list mt-2">
            {top3.map(item => (
              <li key={item.id} className="ph-recent-item">
                <a
                  className="ph-recent-link"
                  href="#"
                  onClick={async e => {
                    e.preventDefault()
                    try {
                      // Switch current site for consistency with detail view
                      const sw = await fetch('/api/sites/switch', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ siteId: item.id }),
                      }).catch(() => null)

                      // Load current site detail
                      let siteData: any | null = null
                      const res = await fetch('/api/sites/current', { cache: 'no-store' })
                      const data = await res.json().catch(() => ({}))
                      if (res.ok && data?.data) {
                        siteData = data.data
                      }

                      // If mismatch, fall back to summary by selected id to avoid wrong site
                      if (!siteData || String(siteData.id) !== String(item.id)) {
                        const sum = await fetch(
                          `/api/sites/summary/${encodeURIComponent(item.id)}`,
                          {
                            cache: 'no-store',
                          }
                        )
                        const sj = await sum.json().catch(() => ({}))
                        if (sum.ok && sj?.data) {
                          const s = sj.data
                          siteData = {
                            id: s.id,
                            name: s.name,
                            address: { id: s.id, site_id: s.id, full_address: s.address || '' },
                            customer_company: undefined,
                            accommodation: undefined,
                            managers: (Array.isArray(s.managers) ? s.managers : []).map(
                              (m: any) => ({
                                role:
                                  m.role === '안전 관리자'
                                    ? 'safety_manager'
                                    : 'construction_manager',
                                name: '-',
                                phone: m.phone || '',
                              })
                            ),
                            process: {
                              member_name: '미정',
                              work_process: '미정',
                              work_section: '미정',
                            },
                            construction_period: { start_date: s.start_date, end_date: s.end_date },
                            is_active: s.status === 'active',
                          }
                        }
                      }

                      if (siteData) {
                        setCurrentSite(siteData)
                        // Load today's headcount
                        const today = new Date().toISOString().split('T')[0]
                        const p = new URLSearchParams({
                          site_id: item.id,
                          start_date: today,
                          end_date: today,
                        })
                        const rep = await fetch(`/api/mobile/daily-reports?${p.toString()}`, {
                          cache: 'no-store',
                        })
                        const jr = await rep.json().catch(() => ({}))
                        const reports = Array.isArray(jr?.data?.reports) ? jr.data.reports : []
                        let count = 0
                        reports.forEach((r: any) => {
                          const wa = Array.isArray(r?.worker_assignments)
                            ? r.worker_assignments
                            : []
                          count += wa.length
                        })
                        setTodayHeadcount(count)
                        setSheetOpen(true)
                      }
                    } catch (_) {
                      /* ignore */
                    }
                  }}
                >
                  <span className="ph-recent-name">
                    {abbr ? <span className="ph-recent-abbr">[{abbr}]</span> : null} {item.name}
                  </span>
                  <span className="ph-recent-date">
                    {formatDateWithWeekday(item.recentWorkDate)}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        )}

        <div className="flex items-center justify-center mt-1">
          <a className="ph-more-btn" href="/mobile/sites">
            더보기
          </a>
        </div>
      </div>

      {sheetOpen && currentSite && (
        <div className="site-info-bottomsheet" role="dialog" aria-modal="true">
          <div className="site-info-bottomsheet-overlay" onClick={() => setSheetOpen(false)} />
          <div className="site-info-bottomsheet-content">
            <div className="site-info-bottomsheet-header">
              <h3 className="site-info-bottomsheet-title">{currentSite.name}</h3>
              <button
                type="button"
                className="site-info-bottomsheet-close"
                onClick={() => setSheetOpen(false)}
              >
                닫기
              </button>
            </div>

            <div className="site-info-sheet-summary" role="group" aria-label="현장 요약">
              <div className="site-info-sheet-summary-row">
                <span className="site-info-sheet-summary-label">소속</span>
                <span className="site-info-sheet-summary-value">
                  {currentSite.customer_company?.company_name?.trim() || '미배정'}
                </span>
              </div>
              <div className="site-info-sheet-summary-row">
                <span className="site-info-sheet-summary-label">현장명</span>
                <span className="site-info-sheet-summary-value">{currentSite.name}</span>
              </div>
              <div className="site-info-sheet-summary-row">
                <span className="site-info-sheet-summary-label">작업일</span>
                <span className="site-info-sheet-summary-value">
                  {new Date().toISOString().split('T')[0]}
                </span>
              </div>
              <div className="site-info-sheet-summary-row">
                <span className="site-info-sheet-summary-label">출력인원</span>
                <span className="site-info-sheet-summary-value">{todayHeadcount}명</span>
              </div>
            </div>

            {!!currentSite.managers?.length && (
              <div className="site-info-sheet-section" role="group" aria-label="담당자 정보">
                {currentSite.managers.map((m: any, idx: number) => (
                  <div className="site-info-sheet-contact" key={idx}>
                    <div className="site-info-sheet-contact-meta">
                      <span className="site-info-sheet-contact-label">
                        {m.role === 'construction_manager'
                          ? '담당자'
                          : m.role === 'safety_manager'
                            ? '안전'
                            : '담당'}
                      </span>
                      <span className="site-info-sheet-contact-name">{m.name || '-'}</span>
                    </div>
                    <div className="site-info-sheet-contact-actions">
                      <span className="site-info-sheet-contact-phone">{m.phone || '-'}</span>
                      <button
                        type="button"
                        className="site-info-sheet-contact-call"
                        onClick={() => m.phone && (window.location.href = `tel:${m.phone}`)}
                        disabled={!m.phone}
                      >
                        전화
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="site-info-sheet-section" role="group" aria-label="주소 정보">
              <div className="site-info-sheet-address-row">
                <div className="site-info-sheet-address-meta">
                  <span className="site-info-sheet-address-label">주소</span>
                  <span className="site-info-sheet-address-value">
                    {currentSite.address?.full_address || '-'}
                  </span>
                </div>
                <div className="site-info-sheet-address-actions">
                  <button
                    type="button"
                    onClick={() =>
                      currentSite.address?.full_address &&
                      navigator.clipboard?.writeText(currentSite.address.full_address)
                    }
                    disabled={!currentSite.address?.full_address}
                  >
                    복사
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      currentSite.address?.full_address &&
                      TMap.search(currentSite.address.full_address)
                    }
                    disabled={!currentSite.address?.full_address}
                  >
                    T맵
                  </button>
                </div>
              </div>

              <div className="site-info-sheet-address-row">
                <div className="site-info-sheet-address-meta">
                  <span className="site-info-sheet-address-label">숙소</span>
                  <span className="site-info-sheet-address-value">
                    {currentSite.accommodation?.full_address || '미지정'}
                  </span>
                </div>
                <div className="site-info-sheet-address-actions">
                  <button
                    type="button"
                    onClick={() =>
                      currentSite.accommodation?.full_address &&
                      navigator.clipboard?.writeText(currentSite.accommodation.full_address)
                    }
                    disabled={!currentSite.accommodation?.full_address}
                  >
                    복사
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      currentSite.accommodation?.full_address &&
                      TMap.search(currentSite.accommodation.full_address)
                    }
                    disabled={!currentSite.accommodation?.full_address}
                  >
                    T맵
                  </button>
                </div>
              </div>
            </div>

            <div className="site-info-sheet-actions" role="group" aria-label="현장 관련 작업">
              <button type="button" className="ghost" onClick={handleOpenOtherDocuments}>
                기타서류업로드
              </button>
              <button type="button" className="primary" onClick={handleOpenWorklogList}>
                작업일지목록
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        /* Match SiteInfoPage bottomsheet styles exactly */
        .site-info-bottomsheet {
          position: fixed;
          inset: 0;
          z-index: 1300;
          display: flex;
          align-items: flex-end;
          justify-content: center;
        }
        .site-info-bottomsheet-overlay {
          position: absolute;
          inset: 0;
          background: rgba(15, 23, 42, 0.45);
        }
        .site-info-bottomsheet-content {
          position: relative;
          width: min(640px, 100%);
          background: var(--card);
          border-radius: 28px 28px 0 0;
          padding: 28px 24px 32px;
          box-shadow: 0 -18px 48px rgba(15, 23, 42, 0.18);
          max-height: 90vh;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .site-info-bottomsheet-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .site-info-bottomsheet-title {
          font-size: 20px;
          font-weight: 800;
          margin: 0;
          color: #0f172a;
        }
        .site-info-bottomsheet-close {
          border: 1px solid #d8ddef;
          background: #f5f7fb;
          color: #1a254f;
          font-size: 14px;
          font-weight: 700;
          padding: 6px 14px;
          border-radius: 12px;
          cursor: pointer;
          line-height: 1.2;
          transition: all 0.2s ease;
        }

        .site-info-sheet-summary {
          background: #f5f7fb;
          border: 1px solid #e4e8f4;
          border-radius: 18px;
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .site-info-sheet-summary-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          font-size: 15px;
        }
        .site-info-sheet-summary-label {
          color: #6b7280;
          font-weight: 600;
        }
        .site-info-sheet-summary-value {
          color: #111c44;
          font-weight: 700;
          text-align: right;
        }

        .site-info-sheet-section {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .site-info-sheet-contact {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .site-info-sheet-contact-meta {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .site-info-sheet-contact-label {
          font-size: 13px;
          font-weight: 600;
          color: #6b7280;
        }
        .site-info-sheet-contact-name {
          font-size: 15px;
          font-weight: 700;
          color: #111827;
        }
        .site-info-sheet-contact-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .site-info-sheet-contact-phone {
          font-size: 14px;
          font-weight: 600;
          color: #1f2937;
        }
        .site-info-sheet-contact-call {
          border: 1px solid #d8ddef;
          background: #f5f7fb;
          color: #1a254f;
          border-radius: 12px;
          padding: 6px 14px;
          font-weight: 700;
          cursor: pointer;
        }
        .site-info-sheet-contact-call:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .site-info-sheet-address-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
        }
        .site-info-sheet-address-meta {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .site-info-sheet-address-label {
          font-size: 13px;
          font-weight: 600;
          color: #6b7280;
        }
        .site-info-sheet-address-value {
          font-size: 15px;
          font-weight: 600;
          color: #111827;
          line-height: 1.4;
          word-break: keep-all;
        }
        .site-info-sheet-address-actions {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .site-info-sheet-address-actions button {
          border: 1px solid #d8ddef;
          background: #f5f7fb;
          color: #1a254f;
          font-weight: 700;
          padding: 6px 14px;
          border-radius: 12px;
          cursor: pointer;
        }
        .site-info-sheet-address-actions button:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .site-info-sheet-actions {
          display: flex;
          gap: 12px;
          margin-top: 4px;
        }
        .site-info-sheet-actions button {
          flex: 1;
          border-radius: 14px;
          height: 52px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
        }
        .site-info-sheet-actions button.ghost {
          border: 1px solid #d8ddef;
          background: #f5f7fb;
          color: #1a254f;
        }
        .site-info-sheet-actions button.primary {
          border: none;
          background: #1a254f;
          color: #fff;
        }

        @media (max-width: 480px) {
          .site-info-bottomsheet-content {
            padding: 24px 18px 28px;
          }
          .site-info-sheet-address-actions {
            flex-direction: row;
          }
        }

        :global([data-theme='dark'] .site-info-bottomsheet-content) {
          background: rgba(17, 24, 39, 0.95);
          border: 1px solid rgba(148, 163, 184, 0.15);
        }
        :global([data-theme='dark'] .site-info-bottomsheet-title) {
          color: #f1f5f9;
        }
        :global([data-theme='dark'] .site-info-bottomsheet-close) {
          background: rgba(30, 41, 59, 0.55);
          border-color: rgba(148, 163, 184, 0.35);
          color: #e2e8f0;
        }
        :global([data-theme='dark'] .site-info-sheet-summary) {
          background: rgba(30, 41, 59, 0.6);
          border-color: rgba(148, 163, 184, 0.2);
        }
        :global([data-theme='dark'] .site-info-sheet-summary-label) {
          color: #94a3b8;
        }
        :global([data-theme='dark'] .site-info-sheet-summary-value) {
          color: #e2e8f0;
        }
        :global([data-theme='dark'] .site-info-sheet-contact-name) {
          color: #e2e8f0;
        }
        :global([data-theme='dark'] .site-info-sheet-contact-phone) {
          color: #a5b4fc;
        }
        :global([data-theme='dark'] .site-info-sheet-contact-call) {
          border-color: rgba(148, 163, 184, 0.35);
          background: rgba(30, 41, 59, 0.55);
          color: #e2e8f0;
        }
        :global([data-theme='dark'] .site-info-sheet-address-value) {
          color: #f1f5f9;
        }
        :global([data-theme='dark'] .site-info-sheet-address-actions button) {
          border-color: rgba(148, 163, 184, 0.35);
          background: rgba(30, 41, 59, 0.55);
          color: #e2e8f0;
        }
        :global([data-theme='dark'] .site-info-sheet-actions button.ghost) {
          border-color: rgba(148, 163, 184, 0.35);
          background: rgba(30, 41, 59, 0.55);
          color: #e2e8f0;
        }
        :global([data-theme='dark'] .site-info-sheet-actions button.primary) {
          background: #0f3460;
        }
      `}</style>
    </section>
  )
}

export default PartnerHomeSiteSearch
