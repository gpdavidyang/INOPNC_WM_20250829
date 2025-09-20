import type { ReactNode } from 'react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface AdminPlaceholderProps {
  title: string
  description?: string
  children?: ReactNode
}

export function AdminPlaceholder({ title, description, children }: AdminPlaceholderProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      {children ? (
        <CardContent className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          {children}
        </CardContent>
      ) : null}
    </Card>
  )
}
