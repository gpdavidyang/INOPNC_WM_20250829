'use client'
import React from 'react'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface PageHeaderProps {
  title?: string
  subtitle?: string
  description?: string
  breadcrumbs?: BreadcrumbItem[]
  showBackButton?: boolean
  backButtonHref?: string
  children?: React.ReactNode
  actions?: React.ReactNode
}

export function PageHeader(props: PageHeaderProps) {
  const {
    title,
    subtitle,
    description,
    breadcrumbs,
    showBackButton,
    backButtonHref,
    actions,
    children,
  } = props

  return (
    <div className="border-b bg-white px-4 py-4">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="mb-1 text-xs text-muted-foreground">
          {breadcrumbs.map((b, i) => (
            <span key={`${b.label}-${i}`}>
              {b.href ? (
                // eslint-disable-next-line @next/next/no-html-link-for-pages
                <a href={b.href} className="underline">
                  {b.label}
                </a>
              ) : (
                <span>{b.label}</span>
              )}
              {i < breadcrumbs.length - 1 && <span className="mx-1">/</span>}
            </span>
          ))}
        </nav>
      )}
      <div className="flex items-center justify-between">
        <div>
          {title && <h1 className="text-2xl font-bold">{title}</h1>}
          {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
          {description && !subtitle && (
            <p className="text-muted-foreground text-sm">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {showBackButton && (
            // eslint-disable-next-line @next/next/no-html-link-for-pages
            <a
              href={backButtonHref || '#'}
              className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
            >
              뒤로
            </a>
          )}
          {actions}
        </div>
      </div>
      {children}
    </div>
  )
}

export function DashboardPageHeader(props: PageHeaderProps) {
  return <PageHeader {...props} />
}

export function AdminPageHeader(props: PageHeaderProps) {
  return <PageHeader {...props} />
}

export function ReportsPageHeader(props: PageHeaderProps) {
  return <PageHeader {...props} />
}

export function DocumentsPageHeader(props: PageHeaderProps) {
  return <PageHeader {...props} />
}
