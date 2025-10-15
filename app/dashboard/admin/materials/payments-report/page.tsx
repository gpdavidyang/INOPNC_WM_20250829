import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/page-header'
import { Input } from '@/components/ui/input'
import { buttonVariants } from '@/components/ui/button'
import StatsCard from '@/components/ui/stats-card'

export const metadata: Metadata = { title: '결제 리포트' }

export default async function PaymentsReportPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>
}) {
  await requireAdminProfile()
  const supabase = createClient()

  const date_from = ((searchParams?.date_from as string) || '').trim() || ''
  const date_to = ((searchParams?.date_to as string) || '').trim() || ''

  let query = supabase
    .from('material_shipments')
    .select(
      `
      id,
      shipment_date,
      total_amount,
      sites(name),
      payments:material_payments(amount, paid_at)
    `
    )
    .order('shipment_date', { ascending: false })

  if (date_from) query = query.gte('shipment_date', date_from)
  if (date_to) query = query.lte('shipment_date', date_to)

  const { data: rows } = await query
  const shipments = Array.isArray(rows) ? rows : []

  // Aggregate
  const overall = shipments.reduce(
    (acc, s: any) => {
      const total = Number(s.total_amount || 0)
      const paid = (Array.isArray(s.payments) ? s.payments : [])
        .filter(p => {
          if (!date_from && !date_to) return true
          const d = p?.paid_at ? String(p.paid_at).slice(0, 10) : ''
          if (date_from && d < date_from) return false
          if (date_to && d > date_to) return false
          return true
        })
        .reduce((a: number, p: any) => a + Number(p?.amount || 0), 0)
      acc.total += total
      acc.paid += paid
      acc.count += 1
      return acc
    },
    { total: 0, paid: 0, count: 0 }
  )

  const perSite = new Map<string, { total: number; paid: number; count: number }>()
  shipments.forEach((s: any) => {
    const site = s.sites?.name || '-'
    const total = Number(s.total_amount || 0)
    const paid = (Array.isArray(s.payments) ? s.payments : [])
      .filter(p => {
        if (!date_from && !date_to) return true
        const d = p?.paid_at ? String(p.paid_at).slice(0, 10) : ''
        if (date_from && d < date_from) return false
        if (date_to && d > date_to) return false
        return true
      })
      .reduce((a: number, p: any) => a + Number(p?.amount || 0), 0)
    const cur = perSite.get(site) || { total: 0, paid: 0, count: 0 }
    cur.total += total
    cur.paid += paid
    cur.count += 1
    perSite.set(site, cur)
  })

  const siteRows = Array.from(perSite.entries())
    .map(([site, v]) => ({
      site,
      count: v.count,
      total: Math.round(v.total),
      paid: Math.round(v.paid),
      outstanding: Math.max(0, Math.round(v.total - v.paid)),
    }))
    .sort((a, b) => a.site.localeCompare(b.site))

  const buildQuery = (overrides: Record<string, string>) => {
    const params = new URLSearchParams()
    if (date_from) params.set('date_from', date_from)
    if (date_to) params.set('date_to', date_to)
    Object.entries(overrides).forEach(([k, v]) => params.set(k, v))
    const qs = params.toString()
    return qs ? `?${qs}` : ''
  }

  return (
    <div className="px-0 pb-8">
      <PageHeader
        title="결제 리포트"
        description="기간/현장별 수금·미수 현황을 확인합니다."
        breadcrumbs={[
          { label: '대시보드', href: '/dashboard/admin' },
          { label: '자재 관리', href: '/dashboard/admin/materials' },
          { label: '결제 리포트' },
        ]}
      />

      <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Filters */}
        <form method="GET" className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
          <div>
            <label className="block text-sm text-muted-foreground mb-1">시작일</label>
            <Input type="date" name="date_from" defaultValue={date_from} />
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1">종료일</label>
            <Input type="date" name="date_to" defaultValue={date_to} />
          </div>
          <div className="md:col-span-3 flex gap-2">
            <button className={buttonVariants({ variant: 'outline', size: 'standard' })}>
              적용
            </button>
            <a
              href={buildQuery({ date_from: '', date_to: '' })}
              className={buttonVariants({ variant: 'outline', size: 'standard' })}
            >
              초기화
            </a>
          </div>
        </form>

        {/* Overall summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatsCard label="출고건수" value={overall.count} unit="건" />
          <StatsCard label="총액" value={overall.total} unit="KRW" />
          <StatsCard label="수금" value={overall.paid} unit="KRW" />
          <StatsCard label="미수" value={Math.max(0, overall.total - overall.paid)} unit="KRW" />
        </div>

        {/* Per-site table */}
        <div className="rounded-lg border bg-card p-4 shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left">
                <th className="py-2">현장</th>
                <th className="py-2">출고건수</th>
                <th className="py-2">총액(KRW)</th>
                <th className="py-2">수금(KRW)</th>
                <th className="py-2">미수(KRW)</th>
              </tr>
            </thead>
            <tbody>
              {siteRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground">
                    표시할 데이터가 없습니다.
                  </td>
                </tr>
              ) : (
                siteRows.map(r => (
                  <tr key={r.site} className="border-t">
                    <td className="py-2 font-medium text-foreground">{r.site}</td>
                    <td className="py-2">{r.count}</td>
                    <td className="py-2">{r.total.toLocaleString('ko-KR')}</td>
                    <td className="py-2">{r.paid.toLocaleString('ko-KR')}</td>
                    <td className="py-2">{r.outstanding.toLocaleString('ko-KR')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
