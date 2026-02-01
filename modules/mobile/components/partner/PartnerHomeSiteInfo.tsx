'use client'

import { useToast } from '@/components/ui/use-toast'
import { useUnifiedAuth } from '@/hooks/use-unified-auth'
import SiteInfoBottomSheet from '@/modules/mobile/components/site/SiteInfoBottomSheet'
import {
  fetchPartnerSiteDetail,
  type PartnerSiteDetailResult,
} from '@/modules/mobile/utils/site-bottomsheet'
import React, { useEffect, useMemo, useState } from 'react'

interface Props {
  date: string
}

type PartnerCompany = { id: string; company_name?: string | null }

const deriveOrganizationLabel = (profile?: any): string => {
  if (!profile) return ''
  const candidates = [
    profile.organization_name,
    profile.organization?.name,
    profile.organization_display_name,
    profile.organization_label,
    profile.organization,
    profile.company_name,
    profile.company?.name,
  ]
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim()
    }
  }
  return ''
}

export const PartnerHomeSiteInfo: React.FC<Props> = ({ date }) => {
  const [company, setCompany] = useState<PartnerCompany | null>(null)
  const [organizationName, setOrganizationName] = useState('')
  const [site, setSite] = useState<{ id: string; name: string } | null>(null)
  const [workers, setWorkers] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [sheetLoading, setSheetLoading] = useState(false)
  const [sheetSite, setSheetSite] = useState<PartnerSiteDetailResult['site'] | null>(null)
  const [sheetWorkerCount, setSheetWorkerCount] = useState<number | null>(null)
  const [sheetDateLabel, setSheetDateLabel] = useState('')
  const { toast } = useToast()
  const { profile } = useUnifiedAuth()

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

  const profileOrgLabel = useMemo(() => deriveOrganizationLabel(profile), [profile])
  const organizationLabel = useMemo(
    () => organizationName || profileOrgLabel || company?.company_name || '',
    [organizationName, profileOrgLabel, company?.company_name]
  )

  useEffect(() => {
    if (profileOrgLabel) {
      setOrganizationName(profileOrgLabel)
      return
    }

    let active = true
    async function loadOrg() {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store', credentials: 'include' })
        if (!res.ok) return
        const payload = await res.json().catch(() => null)
        if (!active) return
        const label = deriveOrganizationLabel(payload?.profile)
        if (label) setOrganizationName(label)
        // Partner 전용: auth/me에 없으면 조직 API로 한 번 더 시도
        if (!label && payload?.profile?.organization_id) {
          const orgRes = await fetch('/api/partner/organization', {
            cache: 'no-store',
            credentials: 'include',
          })
          const orgJson = await orgRes.json().catch(() => null)
          const orgName = orgJson?.organization?.name
          if (orgRes.ok && orgName && active) {
            setOrganizationName(orgName)
          }
        }
      } catch {
        /* ignore */
      }
    }

    loadOrg()
    return () => {
      active = false
    }
  }, [profileOrgLabel])

  // Weather display removed per spec

  useEffect(() => {
    if (!profile) return
    let alive = true
    async function run() {
      setLoading(true)
      setError(null)
      try {
        const partnerId = profile.partner_company_id || profile.organization_id || null

        if (partnerId) {
          const cRes = await fetch('/api/partner-companies', { cache: 'no-store' })
          const list = (await cRes.json().catch(() => ({})))?.data || []
          const found = Array.isArray(list) ? list.find((c: any) => c?.id === partnerId) : null
          if (found) {
            setCompany(found)
          }
        }

        // 3-1) If organization label is still empty, try pulling fresh profile from auth/me
        if (!organizationLabel) {
          try {
            const meRes = await fetch('/api/auth/me', { cache: 'no-store', credentials: 'include' })
            const meJson = await meRes.json().catch(() => null)
            const label = deriveOrganizationLabel(meJson?.profile)
            if (label && alive) setOrganizationName(label)
          } catch {
            /* ignore */
          }
        }

        // 3) Pick top site for the day
        const qs = new URLSearchParams({ start_date: date, end_date: date, period: 'daily' })
        const byDay = await fetch(`/api/partner/labor/by-site?${qs.toString()}`, {
          cache: 'no-store',
        })
        const payload = await byDay.json().catch(() => ({}))
        const sites = Array.isArray(payload?.sites) ? payload.sites : []
        const top = sites[0] ? { id: sites[0].id, name: sites[0].name } : null
        if (!organizationLabel && sites[0]?.organization_name) {
          setOrganizationName(sites[0].organization_name)
        }
        if (!top) {
          // fallback: any monthly site
          const monthly = await fetch('/api/partner/labor/by-site?period=monthly', {
            cache: 'no-store',
          })
          const pj = await monthly.json().catch(() => ({}))
          const arr = Array.isArray(pj?.sites) ? pj.sites : []
          if (arr[0]) {
            setSite({ id: arr[0].id, name: arr[0].name })
            if (!organizationLabel && arr[0]?.organization_name) {
              setOrganizationName(arr[0].organization_name)
            }
            try {
              await fetch('/api/sites/switch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ siteId: arr[0].id }),
              })
            } catch {
              /* ignore switch failure */
            }
          }
        } else {
          setSite(top)
          try {
            await fetch('/api/sites/switch', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ siteId: top.id }),
            })
          } catch {
            /* ignore switch failure; fallback will still render */
          }
        }

        // 3-2) Fallback: if still no site from labor data, try current assigned site
        if (!top) {
          try {
            const curRes = await fetch('/api/sites/current', {
              cache: 'no-store',
              credentials: 'include',
            })
            const curJson = await curRes.json().catch(() => null)
            const curSite = curJson?.data
            if (curSite && curSite.id && alive) {
              setSite({ id: curSite.id, name: curSite.name })
              if (!organizationLabel) {
                const companyName = curSite.customer_company?.company_name
                if (companyName) setOrganizationName(companyName)
              }
            }
          } catch {
            /* ignore */
          }
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
          let totalManpower = 0
          reports.forEach((r: any) => {
            const manpower = Number(r?.total_labor_hours ?? (r?.total_workers || 0) * 8) / 8
            totalManpower += manpower
          })
          setWorkers(totalManpower > 0 ? Math.ceil(totalManpower) : 0)
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
  }, [date, profile])

  const handleOpenDetail = async () => {
    if (!site?.id) {
      // Try to fetch current site on demand before redirecting
      try {
        const curRes = await fetch('/api/sites/current', {
          cache: 'no-store',
          credentials: 'include',
        })
        const curJson = await curRes.json().catch(() => null)
        const curSite = curJson?.data
        if (curSite?.id) {
          setSite({ id: curSite.id, name: curSite.name })
        }
      } catch {
        /* ignore */
      }
      if (!site?.id) {
        window.location.href = '/mobile/sites'
        return
      }
    }

    setSheetLoading(true)
    setSheetDateLabel(prettyDate)
    setSheetWorkerCount(workers)
    setSheetOpen(true)
    setSheetSite({
      id: site.id,
      name: site.name,
      address: { full_address: '' },
      customer_company: organizationLabel ? { company_name: organizationLabel } : null,
      accommodation: null,
      managers: [],
    })
    try {
      const detail = await fetchPartnerSiteDetail(site.id, { date })
      setSheetSite(detail.site)
      setSheetWorkerCount(detail.workerCount)
      setSheetDateLabel(prettyDate || detail.dateLabel)
    } catch (err) {
      console.error('[PartnerHomeSiteInfo] detail fetch error', err)
      toast({ title: '현장 정보를 불러오지 못했습니다.', variant: 'destructive' })
    } finally {
      setSheetLoading(false)
    }
  }

  return (
    <section className="mt-3">
      <div className="ph-card ph-site-card">
        <div className="ph-site-card-header">
          <h3 className="ph-site-card-title">현장 정보</h3>
          <button
            type="button"
            className="ph-site-detail-btn"
            onClick={handleOpenDetail}
            disabled={sheetLoading}
          >
            {sheetLoading ? '불러오는 중...' : '상세'}
          </button>
        </div>
        <div className="ph-site-kv-list" role="list">
          <div className="ph-site-kv" role="listitem">
            <span className="ph-site-kv-label">소속</span>
            <span className="ph-site-kv-value">{organizationLabel || '-'}</span>
          </div>
          <div className="ph-site-kv" role="listitem">
            <span className="ph-site-kv-label">현장명</span>
            <span className="ph-site-kv-value ph-site-kv-value-strong">{site?.name || '-'}</span>
          </div>
          <div className="ph-site-kv" role="listitem">
            <span className="ph-site-kv-label">작업일</span>
            <span className="ph-site-kv-value">{prettyDate}</span>
          </div>
          <div className="ph-site-kv" role="listitem">
            <span className="ph-site-kv-label">출입인원</span>
            <span className="ph-site-kv-value">{workers != null ? `${workers}명` : '-'}</span>
          </div>
        </div>
      </div>
      {!!error && <div className="mt-2 text-xs text-red-600">{error}</div>}
      <SiteInfoBottomSheet
        open={sheetOpen && !!sheetSite}
        site={sheetSite}
        dateLabel={sheetDateLabel || prettyDate}
        workerCount={sheetWorkerCount}
        onClose={() => setSheetOpen(false)}
      />
    </section>
  )
}

export default PartnerHomeSiteInfo
