'use client'

import Link from 'next/link'

interface NavbarProps {
  userEmail?: string | null
}

export default function Navbar({ userEmail }: NavbarProps) {
  return (
    <header className="border-b bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-semibold text-gray-900">
          INOPNC
        </Link>
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <span>{userEmail ?? '_guest@inopnc.com'}</span>
          <Link href="/auth/logout" className="text-blue-600 hover:underline">
            로그아웃
          </Link>
        </div>
      </div>
    </header>
  )
}
