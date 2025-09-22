import React from 'react'

export function NavBar({ children }: { children?: React.ReactNode }) {
  return <nav className="flex items-center space-x-4">{children}</nav>
}