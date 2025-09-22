/* eslint-disable */

'use client'

import type { ReactNode } from 'react'

interface PageHeaderProps {
  title?: string
  description?: string
  actions?: ReactNode
  children?: ReactNode
}

export function PageHeader({ title = 'Page Title', description, actions, children }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 border-b border-gray-200 bg-white px-6 py-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
          {description && <p className="mt-1 text-sm text-gray-600">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      {children}
    </header>
  )
}
