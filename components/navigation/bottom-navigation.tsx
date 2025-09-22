import React from 'react'

export function BottomNavigation({ children }: { children?: React.ReactNode }) {
  return <nav className="fixed bottom-0 w-full border-t bg-white">{children}</nav>
}