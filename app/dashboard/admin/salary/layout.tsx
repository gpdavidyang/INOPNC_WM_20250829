'use client'

import { usePathname } from 'next/navigation'
import PillTabLinks from '@/components/ui/pill-tab-links'
import React from 'react'

const tabs = [
  { href: '/dashboard/admin/salary/dashboard', label: '대시보드' },
  { href: '/dashboard/admin/salary/preview', label: '미리보기' },
  { href: '/dashboard/admin/salary/personal', label: '개인세율' },
  { href: '/dashboard/admin/salary/defaults', label: '기본세율' },
  { href: '/dashboard/admin/salary/snapshots', label: '스냅샷' },
  { href: '/dashboard/admin/salary/rules', label: '규칙' },
]

export default function SalaryLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const activeKey = tabs.find(t => pathname?.startsWith(t.href))?.label || ''
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-4">
      <div className="mb-2">
        <h1 className="text-2xl font-semibold">급여 관리</h1>
        <p className="text-sm text-gray-600 mt-1">월 선택 → 전체 인원 한눈에 확인하고 일괄 처리</p>
      </div>
      <div>
        <PillTabLinks
          activeKey={activeKey}
          items={tabs.map(t => ({ key: t.label, label: t.label, href: t.href }))}
          fill
          className="w-full"
        />
      </div>
      <div className="rounded-lg border bg-white p-4">{children}</div>
    </div>
  )
}
