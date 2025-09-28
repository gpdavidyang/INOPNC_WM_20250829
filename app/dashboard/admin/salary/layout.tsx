'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-4">
      <div className="mb-2">
        <h1 className="text-2xl font-semibold">급여 관리</h1>
        <p className="text-sm text-gray-600 mt-1">월 선택 → 전체 인원 한눈에 확인하고 일괄 처리</p>
      </div>
      <nav className="flex gap-2 border-b">
        {tabs.map(t => {
          const active = pathname?.startsWith(t.href)
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`px-3 py-2 text-sm rounded-t-md border-x border-t ${
                active
                  ? 'bg-white text-blue-600 border-gray-300'
                  : 'bg-gray-50 text-gray-700 border-transparent hover:bg-gray-100'
              }`}
              aria-current={active ? 'page' : undefined}
            >
              {t.label}
            </Link>
          )
        })}
      </nav>
      <div className="rounded-lg border bg-white p-4">{children}</div>
    </div>
  )
}
