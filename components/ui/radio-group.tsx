/* eslint-disable */
'use client'

import type { ReactNode } from 'react'

interface RadioGroupProps {
  children?: ReactNode
}

export function RadioGroup({ children }: RadioGroupProps) {
  return <div className="space-y-2">{children}</div>
}

export function RadioGroupItem({ children }: { children?: ReactNode }) {
  return <label className="flex items-center gap-2 text-sm text-gray-600">{children}</label>
}
