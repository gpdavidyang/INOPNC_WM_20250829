import React from 'react'

export function Header({ children }: { children?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-40 bg-white border-b">
      <div className="container mx-auto px-4 py-3">
        {children || (
          <h1 className="text-xl font-semibold">INOPNC</h1>
        )}
      </div>
    </header>
  )
}