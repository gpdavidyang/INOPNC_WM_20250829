'use client'

import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { openFileRecordInNewTab } from '@/lib/files/preview'
import { MobileLayout as MobileLayoutShell } from '@/modules/mobile/components/layout/MobileLayout'
import { MobileAuthGuard } from '@/modules/mobile/components/auth/mobile-auth-guard'
import { format, addMonths } from 'date-fns'
import { ko } from 'date-fns/locale'
import clsx from 'clsx'
import '@/modules/mobile/styles/attendance.css'

type MonthItem = {
  year: number
  month: number
  label: string
  source: 'snapshot' | 'calculated'
  netPay: number
}

function useOpenPayslip() {
  return useCallback(async (userId: string, y: number, m: number) => {
    const href = `/payslip/${userId}/${y}/${m}`
    const isStandalone =
      typeof window !== 'undefined' &&
      (window.matchMedia?.('(display-mode: standalone)').matches ||
        (navigator as any)?.standalone === true)
    if (isStandalone) {
      window.location.assign(href)
      return
    }
    try {
      await openFileRecordInNewTab({
        file_url: href,
        file_name: `payslip-${y}-${String(m).padStart(2, '0')}.html`,
        title: `급여명세서 ${y}-${m}`,
      })
    } catch (error) {
      console.error('Failed to open payslip', error)
      window.open(href, '_blank', 'noopener,noreferrer')
    }
  }, [])
}

export default function SalaryHistoryPage() {
  return (
    <MobileAuthGuard>
      <SalaryHistoryContent />
    </MobileAuthGuard>
  )
}

function SalaryHistoryContent() {
  const [statusFilter, setStatusFilter] = useState<'all' | 'snapshot' | 'calculated'>('all')
  const [monthsToShow, setMonthsToShow] = useState(6)
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<MonthItem[]>([])
  const openPayslip = useOpenPayslip()

  // 현재 달부터 과거 순으로 monthsToShow 개 생성
  const targetMonths = useMemo(() => {
    const base = new Date()
    const arr: { year: number; month: number; label: string }[] = []
    for (let i = 0; i < monthsToShow; i++) {
      const d = addMonths(base, -i)
      arr.push({
        year: d.getFullYear(),
        month: d.getMonth() + 1,
        label: format(d, 'yyyy년 MM월', { locale: ko }),
      })
    }
    return arr
  }, [monthsToShow])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const chunk = await Promise.all(
          targetMonths.map(async t => {
            const params = new URLSearchParams({ year: String(t.year), month: String(t.month) })
            const res = await fetch(`/api/salary/monthly?${params.toString()}`, {
              cache: 'no-store',
            })
            const json = await res.json().catch(() => null)
            const source = json?.data?.source === 'snapshot' ? 'snapshot' : 'calculated'
            const netPay = Number(json?.data?.salary?.net_pay || 0)
            return { year: t.year, month: t.month, label: t.label, source, netPay } as MonthItem
          })
        )
        if (!cancelled) setItems(chunk)
      } catch (e) {
        if (!cancelled) setItems([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [targetMonths])

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return items
    return items.filter(i => i.source === statusFilter)
  }, [items, statusFilter])

  return (
    <MobileLayoutShell>
      <div className="attendance-page w-full max-w-[480px] mx-auto px-4 pt-3 pb-6 space-y-4">
        <div className="line-tabs single-center" role="tablist" aria-label="급여 내역 필터">
          <button
            type="button"
            className={clsx('line-tab', 'active')}
            onClick={() => setStatusFilter('all')}
          >
            전체
          </button>
        </div>

        <section className="space-y-3" aria-live="polite">
          {loading && <div className="t-cap text-muted-foreground">불러오는 중...</div>}
          {!loading && filtered.length === 0 && (
            <div className="t-cap text-muted-foreground">표시할 급여 내역이 없습니다.</div>
          )}

          {!loading &&
            filtered.map((m, idx) => (
              <div
                key={`${m.year}-${m.month}-${idx}`}
                className="p-3 bg-gray-50 rounded-lg dark:bg-slate-900/40"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="t-body font-medium">{m.label}</div>
                    {/* 보조 라벨(스냅샷/예상치) 제거 */}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="t-body font-semibold">₩{m.netPay.toLocaleString()}</div>
                    <button
                      className="btn btn--outline"
                      onClick={() => {
                        // userId는 서버에서 결정되므로 dummy를 사용하지 않고 현재 URL에서 추출 불가 → /api/auth/me로 보정
                        // 단, payslip 라우트는 본인일 때 workerId 생략 불가하므로, openPayslip에 userId를 전달해야 함
                        // 따라서 아래에서 /api/auth/me 호출로 userId 획득
                        ;(async () => {
                          const me = await fetch('/api/auth/me', { cache: 'no-store' })
                            .then(r => r.json())
                            .catch(() => null)
                          const uid = me?.user?.id || me?.profile?.id
                          if (!uid) return
                          openPayslip(uid, m.year, m.month)
                        })()
                      }}
                    >
                      보기
                    </button>
                  </div>
                </div>
              </div>
            ))}

          <div className="mt-2">
            <button
              className="btn btn--outline w-full"
              onClick={() => setMonthsToShow(prev => prev + 6)}
            >
              더보기
            </button>
          </div>
        </section>
      </div>
    </MobileLayoutShell>
  )
}
