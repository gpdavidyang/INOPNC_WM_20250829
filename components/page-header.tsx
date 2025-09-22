import React from 'react'

interface PageHeaderProps {
  title?: string
  subtitle?: string
  children?: React.ReactNode
  actions?: React.ReactNode
}

export function PageHeader({ title, subtitle, children, actions }: PageHeaderProps) {
  return (
    <div className="border-b bg-white px-4 py-4">
      <div className="flex items-center justify-between">
        <div>
          {title && <h1 className="text-2xl font-bold">{title}</h1>}
          {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
        </div>
        {actions && <div className="flex gap-2">{actions}</div>}
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