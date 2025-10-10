/* eslint-disable */
'use client'

import * as React from 'react'
import type { ReactNode } from 'react'

interface SortableTableProps {
  children?: ReactNode
}

export function SortableTable({ children }: SortableTableProps) {
  return <div className="overflow-hidden rounded border border-gray-200 bg-white">{children}</div>
}
