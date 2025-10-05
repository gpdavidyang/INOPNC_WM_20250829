'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactElement, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface DropdownMenuProps {
  trigger: ReactElement
  children?: ReactNode
  className?: string
  align?: 'start' | 'end'
}

export function DropdownMenu({ trigger, children, className, align = 'start' }: DropdownMenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const onDocClick = useCallback((e: MouseEvent) => {
    if (!ref.current) return
    if (!ref.current.contains(e.target as Node)) setOpen(false)
  }, [])

  useEffect(() => {
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [onDocClick])

  // Inject click handler and aria attrs into the provided trigger element
  const triggerEl = React.cloneElement(trigger, {
    onClick: (e: any) => {
      trigger.props.onClick?.(e)
      setOpen((v: boolean) => !v)
    },
    'aria-haspopup': 'menu',
    'aria-expanded': open ? 'true' : 'false',
  })

  return (
    <div ref={ref} className={cn('relative inline-block', className)}>
      {triggerEl}
      {open && children && (
        <div
          role="menu"
          className={cn(
            'absolute z-50 mt-2 min-w-[160px] rounded-md border bg-white p-1 text-sm shadow focus:outline-none',
            align === 'end' ? 'right-0' : 'left-0'
          )}
        >
          {children}
        </div>
      )}
    </div>
  )
}

export function DropdownMenuItem({
  children,
  onClick,
}: {
  children: ReactNode
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className="w-full rounded px-3 py-2 text-left text-sm hover:bg-gray-100"
    >
      {children}
    </button>
  )
}
