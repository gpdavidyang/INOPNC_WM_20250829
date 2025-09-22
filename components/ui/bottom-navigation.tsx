'use client'

import Link from 'next/link'

interface BottomNavigationProps {
  items: Array<{ label: string; href: string }>
}

export function BottomNavigation({ items }: BottomNavigationProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 border-t bg-white/90 backdrop-blur">
      <ul className="flex items-center justify-around px-4 py-3 text-sm">
        {items.map((item) => (
          <li key={item.href}>
            <Link href={item.href} className="text-gray-600 hover:text-gray-900">
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
