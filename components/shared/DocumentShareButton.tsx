'use client'

import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Share2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DocumentShareButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label?: ReactNode
}

export default function DocumentShareButton({
  label = '공유',
  className,
  ...props
}: DocumentShareButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleClick = async () => {
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <Button
      type="button"
      variant="outline"
      className={cn('inline-flex items-center gap-2', className)}
      onClick={handleClick}
      {...props}
    >
      <Share2 className="h-4 w-4" />
      <span>{copied ? '복사됨!' : label}</span>
    </Button>
  )
}
