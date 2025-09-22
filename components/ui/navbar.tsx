'use client'

import Link from 'next/link'

interface NavbarLink {
  label: string
  href: string
}

interface NavbarProps {
  links?: NavbarLink[]
}

export function Navbar({ links = [] }: NavbarProps) {
  return (
    <header className="border-b bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-semibold text-gray-900">
          INOPNC
        </Link>
        <nav className="flex items-center gap-4 text-sm text-gray-600">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-gray-900">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}
