'use client'

import React, { useEffect, useMemo, useState } from 'react'

interface Props {
  date: string
}

type PartnerCompany = { id: string; company_name?: string | null }

export const PartnerHomeSiteInfo: React.FC<Props> = ({ date }) => {
  const [company, setCompany] = useState<PartnerCompany | null>(null)
  const [site, setSite] = useState<{ id: string; name: string } | null>(null)
  const [workers, setWorkers] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const prettyDate = useMemo(() => {
    if (!date) return ''
    const d = new Date(date)
    if (Number.isNaN(d.getTime())) return date
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'] as const
    const w = weekdays[d.getDay()]
    return `${y}.${m}.${day}(${w})`
  }, [date])

  // Weather display removed per spec

  useEffect(() => {
    let alive = true
    async function run() {
      setLoading(true)
      setError(null)
      try {
        // 1) Profile
        const meRes = await fetch('/api/auth/me', { cache: 'no-store' })
        const me = (await meRes.json().catch(() => null)) || {}
        const profile = me?.profile || null
        const partnerId = profile?.partner_company_id || profile?.organization_id || null

        // 2) Company name (public endpoint)
        if (partnerId) {
          const cRes = await fetch('/api/partner-companies', { cache: 'no-store' })
          const list = (await cRes.json().catch(() => ({})))?.data || []
          const found = Array.isArray(list) ? list.find((c: any) => c?.id === partnerId) : null
          if (found) setCompany(found)
        }

        // 3) Pick top site for the day
        const qs = new URLSearchParams({ start_date: date, end_date: date, period: 'daily' })
        const byDay = await fetch(`/api/partner/labor/by-site?${qs.toString()}`, {
          cache: 'no-store',
        })
        const payload = await byDay.json().catch(() => ({}))
        const sites = Array.isArray(payload?.sites) ? payload.sites : []
        const top = sites[0] ? { id: sites[0].id, name: sites[0].name } : null
        if (!top) {
          // fallback: any monthly site
          const monthly = await fetch('/api/partner/labor/by-site?period=monthly', {
            cache: 'no-store',
          })
          const pj = await monthly.json().catch(() => ({}))
          const arr = Array.isArray(pj?.sites) ? pj.sites : []
          if (arr[0]) setSite({ id: arr[0].id, name: arr[0].name })
        } else {
          setSite(top)
        }

        // 4) Worker count for chosen site at date
        const targetSite = top || null
        if (targetSite) {
          const p = new URLSearchParams({
            site_id: targetSite.id,
            start_date: date,
            end_date: date,
          })
          const rep = await fetch(`/api/mobile/daily-reports?${p.toString()}`, {
            cache: 'no-store',
          })
          const jr = await rep.json().catch(() => ({}))
          const reports = Array.isArray(jr?.data?.reports) ? jr.data.reports : []
          let count = 0
          reports.forEach((r: any) => {
            const wa = Array.isArray(r?.worker_assignments) ? r.worker_assignments : []
            count += wa.length
          })
          setWorkers(count)
        } else {
          setWorkers(null)
        }
      } catch (e: any) {
        setError(e?.message || '현장 정보 로드 오류')
      } finally {
        if (alive) setLoading(false)
      }
    }
    run()
    return () => {
      alive = false
    }
  }, [date])

  return (
    <section className="mt-3">
      <div className="ph-card p-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="ph-section-title">현장 정보</h3>
          <a
            className="ph-site-detail-btn"
            href={site ? `/mobile/sites?site_id=${encodeURIComponent(site.id)}` : '/mobile/sites'}
          >
            상세
          </a>
        </div>
        <div className="space-y-1 text-sm">
          <div className="flex items-center justify-between">
            <div className="text-gray-600">소속</div>
            <div className="font-medium">{company?.company_name || '-'}</div>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-gray-600">현장명</div>
            <div className="font-semibold">{site?.name || '-'}</div>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-gray-600">작업일</div>
            <div className="font-medium">{prettyDate}</div>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-gray-600">출입인원</div>
            <div className="font-medium">{workers != null ? `${workers}명` : '-'}</div>
          </div>
        </div>
      </div>
      {!!error && <div className="mt-2 text-xs text-red-600">{error}</div>}
    </section>
  )
}

export default PartnerHomeSiteInfo
