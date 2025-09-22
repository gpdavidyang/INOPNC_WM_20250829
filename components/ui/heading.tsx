import React from 'react'

export function Heading({ 
  children, 
  size = "lg",
  className = "" 
}: { 
  children?: React.ReactNode
  size?: "sm" | "md" | "lg" | "xl" | "2xl"
  className?: string 
}) {
  const sizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
    xl: "text-xl",
    "2xl": "text-2xl"
  }
  
  return <h2 className={`font-bold ${sizeClasses[size]} ${className}`}>{children}</h2>
}