'use client'

import React from 'react'

export function IconToggle({
  active,
  onClick,
  label,
  children,
  className = '',
}: {
  active?: boolean
  onClick?: () => void
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-lg border transition-all ${
        active
          ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-200 text-blue-600'
          : 'bg-white border-gray-100 text-gray-500 hover:bg-gray-50'
      } ${className}`}
    >
      {children}
    </button>
  )
}

export function ColorChip({
  color,
  active,
  onClick,
  label,
}: {
  color: 'red' | 'blue' | 'gray'
  active?: boolean
  onClick?: () => void
  label: string
}) {
  const colorMap = {
    red: 'bg-red-500',
    blue: 'bg-blue-500',
    gray: 'bg-gray-500',
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-bold transition-all ${
        active
          ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-200'
          : 'bg-white border-gray-100 hover:bg-gray-50 shadow-sm'
      }`}
    >
      <div className={`h-3 w-3 rounded-full ${colorMap[color]}`} />
      <span className="text-gray-700">{label}</span>
    </button>
  )
}

export function SizeChip({
  size,
  active,
  onClick,
}: {
  size: 'small' | 'medium' | 'large'
  active?: boolean
  onClick?: () => void
}) {
  const label = size === 'small' ? 'S' : size === 'large' ? 'L' : 'M'
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-8 w-10 items-center justify-center rounded-md border text-xs font-bold transition-all ${
        active
          ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-200 text-blue-600'
          : 'bg-white border-gray-100 text-gray-500 hover:bg-gray-50'
      }`}
    >
      {label}
    </button>
  )
}

export function ShapeChip({
  shape,
  active,
  onClick,
}: {
  shape: 'circle' | 'triangle' | 'square' | 'star' | 'diagonal'
  active?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-9 w-10 items-center justify-center rounded-md border transition-all ${
        active
          ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-200 text-blue-600'
          : 'bg-white border-gray-100 text-gray-500 hover:bg-gray-50'
      }`}
    >
      {shape === 'circle' && <div className="h-3 w-3 rounded-full bg-current" />}
      {shape === 'square' && <div className="h-3 w-3 bg-current" />}
      {shape === 'triangle' && (
        <svg width="12" height="12" viewBox="0 0 12 12" className="fill-current">
          <polygon points="6,1 11,11 1,11" />
        </svg>
      )}
      {shape === 'star' && (
        <svg width="12" height="12" viewBox="0 0 24 24" className="fill-current">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.9L18.18 22 12 18.77 5.82 22 7 14.17l-5-4.9 6.91-1.01z" />
        </svg>
      )}
      {shape === 'diagonal' && (
        <div className="h-[2px] w-4 rotate-[-45deg] bg-current rounded-full" />
      )}
    </button>
  )
}
export function WidthChip({
  w,
  active,
  onClick,
}: {
  w: 1 | 3 | 5
  active?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-8 w-12 items-center justify-center rounded-md border text-xs font-bold transition-all ${
        active
          ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-200 text-blue-600'
          : 'bg-white border-gray-100 text-gray-500 hover:bg-gray-50'
      }`}
    >
      {w}px
    </button>
  )
}

export function StampColorChip({
  color,
  active,
  onClick,
}: {
  color: 'red' | 'blue' | 'gray'
  active?: boolean
  onClick?: () => void
}) {
  const bg = color === 'red' ? 'bg-red-500' : color === 'blue' ? 'bg-blue-500' : 'bg-gray-500'
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-8 w-8 rounded-full ${bg} transition-all ${
        active ? 'ring-2 ring-blue-500 ring-offset-2 scale-110' : 'hover:scale-105 opacity-80'
      }`}
    />
  )
}
