'use client'

import { cn } from '@/lib/utils'
import { CalendarRange, ExternalLink, FileText, HelpCircle, MapPin, UserCheck } from 'lucide-react'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'

interface QuickMenuItem {
  href: string
  icon: React.ReactNode
  label: string
  color: string
  external?: boolean
}

export function PremiumQuickMenu() {
  const [outputHref, setOutputHref] = useState('/mobile/attendance')

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(j => {
        const role = j?.profile?.role
        if (role === 'partner' || role === 'customer_manager')
          setOutputHref('/mobile/partner/output')
      })
      .catch(() => {})
  }, [])

  const menuItems: QuickMenuItem[] = [
    {
      href: '/mobile/sites',
      icon: <MapPin className="w-5 h-5" />,
      label: '현장정보',
      color: 'bg-blue-500',
    },
    {
      href: '/mobile/worklog',
      icon: <CalendarRange className="w-5 h-5" />,
      label: '작업일지',
      color: 'bg-emerald-500',
    },
    {
      href: outputHref,
      icon: <UserCheck className="w-5 h-5" />,
      label: '출력정보',
      color: 'bg-indigo-500',
    },
    {
      href: '/mobile/documents',
      icon: <FileText className="w-5 h-5" />,
      label: '문서함',
      color: 'bg-amber-500',
    },
    {
      href: 'https://open.kakao.com/o/g6r8yDRh',
      icon: <HelpCircle className="w-5 h-5" />,
      label: '본사요청',
      color: 'bg-rose-500',
      external: true,
    },
  ]

  return (
    <section className="px-1">
      <div className="flex items-center gap-2 mb-4 px-2">
        <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
        <h3 className="text-sm font-black text-foreground uppercase tracking-widest">빠른 메뉴</h3>
      </div>
      <div className="grid grid-cols-5 gap-3">
        {menuItems.map((item, idx) => {
          const isExternal = item.external
          const CardWrap = isExternal ? 'a' : Link
          return (
            <CardWrap
              key={idx}
              href={item.href}
              {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              className="flex flex-col items-center gap-2 group"
            >
              <div
                className={cn(
                  'w-12 h-12 rounded-2xl flex items-center justify-center text-white transition-all group-active:scale-90 shadow-lg shadow-gray-200',
                  item.color
                )}
              >
                {item.icon}
              </div>
              <span className="text-[10px] font-black text-muted-foreground tracking-tight text-center truncate w-full">
                {item.label}
                {isExternal && <ExternalLink className="w-2 h-2 inline ml-0.5 opacity-50" />}
              </span>
            </CardWrap>
          )
        })}
      </div>
    </section>
  )
}
