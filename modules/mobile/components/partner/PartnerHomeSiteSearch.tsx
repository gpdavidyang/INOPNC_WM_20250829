'use client'

import React, { useEffect, useMemo, useState } from 'react'

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

  // 파트너사 약어(2글자) 계산: 한글은 2글자, 영문은 그대로 대문자 유지
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

        // 현재 사용자 프로필의 파트너사 약어 계산 (p-main 동일 표시: [롯데], [삼성], ...)
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
                  href={`/mobile/worklog?site_id=${encodeURIComponent(item.id)}`}
                >
                  <span className="ph-recent-name">
                    {abbr ? <span className="ph-recent-abbr">[{abbr}]</span> : null} {item.name}
                  </span>
                  <span className="ph-recent-date">{item.recentWorkDate || ''}</span>
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
    </section>
  )
}

export default PartnerHomeSiteSearch
