'use client'

import Link from 'next/link'

interface PartnerSidebarProps {
  links?: Array<{ label: string; href: string }>
}

export function PartnerSidebar({ links = [] }: PartnerSidebarProps) {
  return (
    <nav className="space-y-2 bg-white p-4">
      {links.map((link) => (
        <Link key={link.href} href={link.href} className="block rounded px-3 py-2 text-sm text-gray-600 hover:bg-gray-100">
          {link.label}
        </Link>
      ))}
    </nav>
  )
}
