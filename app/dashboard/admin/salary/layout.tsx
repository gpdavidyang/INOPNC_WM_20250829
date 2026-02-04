'use client'

import { PageHeader } from '@/components/ui/page-header'
import { LayoutDashboard, ReceiptText, Search, Settings, UserCog } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'

const tabs = [
  { href: '/dashboard/admin/salary/dashboard', label: '대시보드', icon: LayoutDashboard },
  { href: '/dashboard/admin/salary/preview', label: '급여계산 & 발행', icon: ReceiptText },
  { href: '/dashboard/admin/salary/snapshots', label: '명세서 조회', icon: Search },
  { href: '/dashboard/admin/salary/defaults', label: '기본세율', icon: Settings },
  { href: '/dashboard/admin/salary/personal', label: '개인별 설정', icon: UserCog },
]

export default function SalaryLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50/50">
      <div className="flex-none bg-white border-b border-gray-100">
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <PageHeader
            title="급여관리 도구"
            description="전사 급여 현황 모니터링 및 정산·발행 통합 도구"
            breadcrumbs={[{ label: '본사관리', href: '/dashboard/admin' }, { label: '급여관리' }]}
          />
        </div>
      </div>

      <div className="flex-1 px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="sticky top-0 z-10 bg-gradient-to-b from-slate-50 via-slate-50 to-transparent pb-4 -mx-2 px-2">
          <nav className="grid grid-cols-5 w-full h-auto items-center gap-2 bg-gray-50/50 p-1.5 rounded-2xl border border-gray-100 shadow-sm">
            {tabs.map((tab) => {
              const isActive = pathname?.startsWith(tab.href)
              const Icon = tab.icon
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`
                    relative flex h-11 items-center justify-center gap-2.5 rounded-xl px-3 text-sm font-bold transition-all whitespace-nowrap
                    ${isActive 
                      ? 'bg-blue-50 text-blue-700 shadow-md shadow-blue-100/50 border border-blue-100' 
                      : 'text-gray-500 hover:text-gray-900 hover:bg-white/60'
                    }
                  `}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                  <span>{tab.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        <main className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          {children}
        </main>
      </div>
    </div>
  )
}
