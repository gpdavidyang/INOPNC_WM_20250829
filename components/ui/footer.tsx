import React from 'react'

export function Footer({ children }: { children?: React.ReactNode }) {
  return <footer className="mt-auto border-t py-4">{children}</footer>
}

export function SimpleFooter({ children }: { children?: React.ReactNode }) {
  return <footer className="py-4 text-center text-sm text-gray-500">{children}</footer>
}