'use client'

import * as React from 'react'
import Link from 'next/link'
import type { ReactNode } from 'react'

type BottomNavigationItem = {
  label: string
  href: string
  icon?: ReactNode
  active?: boolean
}

interface BottomNavigationProps {
  items: Array<BottomNavigationItem>
}

export function BottomNavigation({ items }: BottomNavigationProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 border-t bg-white/90 dark:bg-[#11151b]/90 border-gray-200 dark:border-gray-700 backdrop-blur">
      <ul className="flex items-center justify-around px-4 py-2 text-xs">
        {items.map(item => {
          const isActive = !!item.active
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={
                  `flex flex-col items-center gap-1 px-2 py-1 transition-colors ` +
                  (isActive
                    ? 'text-[--brand-700] dark:text-white font-medium'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200')
                }
              >
                {item.icon ? <span className="h-5 w-5">{item.icon}</span> : null}
                <span>{item.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
