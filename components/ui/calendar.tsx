'use client'

import * as React from 'react'
import type { HTMLAttributes } from 'react'

export function Calendar(props: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={`flex min-h-[200px] items-center justify-center rounded border border-dashed border-gray-300 bg-gray-50 text-sm text-gray-500 ${props.className ?? ''}`.trim()}
    >
      Calendar component placeholder
    </div>
  )
}
