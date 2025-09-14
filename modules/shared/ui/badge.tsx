'use client'

import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

const badgeVariants = cva('badge-dot', {
  variants: {
    variant: {
      tag1: 'tag1',
      tag2: 'tag2',
      tag3: 'tag3',
      tag4: 'tag4',
    },
  },
  defaultVariants: {
    variant: 'tag1',
  },
})

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <span className={`${badgeVariants({ variant })} ${className || ''}`} ref={ref} {...props} />
    )
  }
)
Badge.displayName = 'Badge'

export interface NotificationBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  count?: number
  show?: boolean
  pulse?: boolean
  bellShake?: boolean
}

const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  count = 0,
  show = true,
  pulse = false,
  bellShake = false,
  className,
  ...props
}) => {
  const [animateCount, setAnimateCount] = React.useState(false)
  const prevCount = React.useRef(count)

  React.useEffect(() => {
    if (count > prevCount.current) {
      setAnimateCount(true)
      const timer = setTimeout(() => setAnimateCount(false), 500)
      return () => clearTimeout(timer)
    }
    prevCount.current = count
  }, [count])

  if (!show || count === 0) {
    return <div className={`notification-badge hidden ${className || ''}`} {...props} />
  }

  return (
    <div
      className={`notification-badge ${pulse ? 'pulse' : ''} ${animateCount ? 'count-up' : ''} ${bellShake ? 'bell-shake' : ''} ${className || ''}`}
      {...props}
    >
      {count > 99 ? '99+' : count}
    </div>
  )
}

export { Badge, NotificationBadge, badgeVariants }
