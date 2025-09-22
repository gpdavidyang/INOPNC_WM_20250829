'use client'

export function PartnerHeader({ title = 'Partner Portal' }: { title?: string }) {
  return (
    <header className="border-b bg-white px-6 py-4">
      <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
    </header>
  )
}
