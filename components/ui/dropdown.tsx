import React from 'react'

export function Dropdown({ children, ...props }: any) {
  return <div className="relative inline-block" {...props}>{children}</div>
}