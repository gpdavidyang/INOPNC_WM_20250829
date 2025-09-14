import React from 'react'

export function Text({ 
  children, 
  className = "",
  muted = false 
}: { 
  children?: React.ReactNode
  className?: string
  muted?: boolean 
}) {
  return <p className={`${muted ? 'text-muted-foreground' : ''} ${className}`}>{children}</p>
}