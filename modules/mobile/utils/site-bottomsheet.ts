'use client'

interface ManagerSummary {
  role?: string | null
  name?: string | null
  phone?: string | null
}

export interface PartnerSiteDetailResult {
  site: {
    id: string
    name: string
    address: { full_address?: string | null }
    customer_company?: { company_name?: string | null } | null
    accommodation?: { full_address?: string | null } | null
    managers?: ManagerSummary[]
  }
  workerCount: number
  dateLabel: string
}

const normalizeManagerRole = (role?: string | null): string => {
  if (!role) return 'construction_manager'
  if (role === 'safety_manager') return 'safety_manager'
  const compact = role.replace(/\s+/g, '').toLowerCase()
  if (compact.includes('safety') || compact.includes('안전')) return 'safety_manager'
  return 'construction_manager'
}

const ensureSitePayload = (site: any): PartnerSiteDetailResult['site'] | null => {
  if (!site) return null
  return {
    id: site.id,
    name: site.name,
    address:
      site.address && typeof site.address === 'object'
        ? { full_address: site.address.full_address ?? site.address.address ?? '' }
        : { full_address: site.address || '' },
    customer_company: site.customer_company ?? null,
    accommodation: site.accommodation ?? null,
    managers: Array.isArray(site.managers)
      ? site.managers.map((m: any) => ({
          role: normalizeManagerRole(m.role),
          name: m.name ?? m.manager_name ?? '-',
          phone: m.phone ?? m.manager_phone ?? '',
        }))
      : [],
  }
}

export async function fetchPartnerSiteDetail(
  siteId: string,
  options?: { date?: string }
): Promise<PartnerSiteDetailResult> {
  if (!siteId) throw new Error('siteId is required')
  const targetDate = options?.date || new Date().toISOString().split('T')[0]
  let detail: PartnerSiteDetailResult['site'] | null = null

  try {
    await fetch('/api/sites/switch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ siteId }),
      credentials: 'include',
    })
  } catch {
    // ignore switch error; we'll try fallback
  }

  try {
    const res = await fetch('/api/sites/current', { cache: 'no-store', credentials: 'include' })
    if (res.ok) {
      const json = await res.json().catch(() => ({}))
      detail = ensureSitePayload(json?.data)
    }
  } catch {
    // ignore
  }

  if (!detail || String(detail.id) !== String(siteId)) {
    try {
      const sumRes = await fetch(`/api/sites/summary/${encodeURIComponent(siteId)}`, {
        cache: 'no-store',
        credentials: 'include',
      })
      if (sumRes.ok) {
        const summary = await sumRes.json().catch(() => ({}))
        if (summary?.data) {
          const managers = Array.isArray(summary.data.managers)
            ? summary.data.managers.map((m: any) => ({
                role: normalizeManagerRole(m.role),
                name: m.name || '-',
                phone: m.phone || '',
              }))
            : []
          detail = {
            id: summary.data.id,
            name: summary.data.name,
            address: { full_address: summary.data.address || '' },
            customer_company: null,
            accommodation: null,
            managers,
          }
        }
      }
    } catch {
      // ignore
    }
  }

  if (!detail) {
    throw new Error('현장 정보를 찾을 수 없습니다.')
  }

  const params = new URLSearchParams({
    site_id: String(siteId),
    start_date: targetDate,
    end_date: targetDate,
  })
  let workerCount = 0
  try {
    const reportRes = await fetch(`/api/mobile/daily-reports?${params.toString()}`, {
      cache: 'no-store',
      credentials: 'include',
    })
    if (reportRes.ok) {
      const reportJson = await reportRes.json().catch(() => ({}))
      const reports = Array.isArray(reportJson?.data?.reports) ? reportJson.data.reports : []
      reports.forEach((report: any) => {
        const assignments = Array.isArray(report?.worker_assignments)
          ? report.worker_assignments
          : []
        workerCount += assignments.length
      })
    }
  } catch {
    // ignore count errors
  }

  return {
    site: detail,
    workerCount,
    dateLabel: targetDate,
  }
}
