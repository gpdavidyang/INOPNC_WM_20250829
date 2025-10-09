'use client'

import React from 'react'
import type { MarkupObject } from '@/types/markup'
import type { ViewerState } from '@/types/markup'

interface MarkupCanvasProps {
  backgroundUrl: string
  viewerState: ViewerState
  objects: MarkupObject[]
  selectedIds: string[]
  onPointerDown?: (pt: { x: number; y: number }) => void
  onPointerMove?: (pt: { x: number; y: number }) => void
  onPointerUp?: (pt: { x: number; y: number }) => void
}

export function MarkupCanvas({
  backgroundUrl,
  viewerState,
  objects,
  selectedIds,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: MarkupCanvasProps) {
  const rootRef = React.useRef<HTMLDivElement | null>(null)

  const handle = (cb?: (pt: { x: number; y: number }) => void) => (e: React.PointerEvent) => {
    if (!cb || !rootRef.current) return
    const rect = rootRef.current.getBoundingClientRect()
    cb({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }

  const { zoom, panX, panY, imageWidth, imageHeight } = viewerState

  return (
    <div
      ref={rootRef}
      className="relative h-full w-full overflow-hidden rounded border border-gray-200 bg-white"
      onPointerDown={handle(onPointerDown)}
      onPointerMove={handle(onPointerMove)}
      onPointerUp={handle(onPointerUp)}
    >
      <div
        className="absolute left-0 top-0 origin-top-left"
        style={{ transform: `translate(${panX}px, ${panY}px) scale(${zoom})` }}
      >
        {/* Background image */}
        {backgroundUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={backgroundUrl}
            alt="blueprint"
            width={imageWidth || undefined}
            height={imageHeight || undefined}
          />
        ) : (
          <div className="h-[480px] w-[640px] bg-gray-50" />
        )}

        {/* Overlay SVG */}
        <svg
          width={Math.max(1, imageWidth || 1)}
          height={Math.max(1, imageHeight || 1)}
          className="absolute left-0 top-0"
        >
          {objects.map(renderObject(selectedIds))}
        </svg>
      </div>
    </div>
  )
}

function renderObject(selectedIds: string[]) {
  return (obj: MarkupObject) => {
    const selected = selectedIds.includes(obj.id)
    if (obj.type === 'box') {
      const stroke = obj.color === 'red' ? '#ef4444' : obj.color === 'blue' ? '#3b82f6' : '#6b7280'
      return (
        <g key={obj.id}>
          <rect
            x={obj.x}
            y={obj.y}
            width={(obj as any).width}
            height={(obj as any).height}
            fill={selected ? stroke : 'transparent'}
            fillOpacity={selected ? 0.18 : 1}
            stroke={stroke}
            strokeWidth={selected ? 3 : 2}
          />
          <text x={obj.x + 4} y={obj.y - 4} fontSize={12} fill={stroke}>
            {(obj as any).label}
          </text>
        </g>
      )
    }
    if (obj.type === 'text') {
      return (
        <text
          key={obj.id}
          x={obj.x}
          y={obj.y}
          fontSize={(obj as any).fontSize || 14}
          fill={(obj as any).fontColor || '#111'}
        >
          {(obj as any).content || ''}
        </text>
      )
    }
    if (obj.type === 'drawing') {
      const path = (obj as any).path || []
      const d = path
        .map((p: any, i: number) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
        .join(' ')
      return (
        <path
          key={obj.id}
          d={d}
          stroke={(obj as any).strokeColor || '#ef4444'}
          strokeWidth={(obj as any).strokeWidth || 2}
          fill="none"
        />
      )
    }
    if (obj.type === 'stamp') {
      const color = colorToHex((obj as any).color || '#ef4444')
      const sz = sizeToPixels((obj as any).size || 'medium')
      const r = sz / 2
      if ((obj as any).shape === 'circle')
        return <circle key={obj.id} cx={obj.x} cy={obj.y} r={r} fill={color} opacity={0.85} />
      if ((obj as any).shape === 'square')
        return (
          <rect
            key={obj.id}
            x={obj.x - r}
            y={obj.y - r}
            width={sz}
            height={sz}
            fill={color}
            opacity={0.85}
          />
        )
      if ((obj as any).shape === 'triangle') {
        const points = [
          `${obj.x},${obj.y - r}`,
          `${obj.x - r},${obj.y + r}`,
          `${obj.x + r},${obj.y + r}`,
        ].join(' ')
        return <polygon key={obj.id} points={points} fill={color} opacity={0.85} />
      }
      // star
      const pts = starPoints(obj.x as number, obj.y as number, r, r / 2)
      const d =
        pts.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ') + ' Z'
      return <path key={obj.id} d={d} fill={color} opacity={0.85} />
    }
    return null
  }
}

function starPoints(cx: number, cy: number, outer: number, inner: number) {
  const pts: Array<{ x: number; y: number }> = []
  for (let i = 0; i < 10; i++) {
    const ang = (Math.PI / 5) * i
    const r = i % 2 === 0 ? outer : inner
    pts.push({ x: cx + Math.cos(ang - Math.PI / 2) * r, y: cy + Math.sin(ang - Math.PI / 2) * r })
  }
  return pts
}

function sizeToPixels(size: 'small' | 'medium' | 'large') {
  switch (size) {
    case 'small':
      return 18
    case 'large':
      return 36
    default:
      return 24
  }
}

function colorToHex(c: string) {
  const map: Record<string, string> = { red: '#ef4444', blue: '#3b82f6', gray: '#6b7280' }
  if (c.startsWith('#')) return c
  return map[c] || c
}

export default MarkupCanvas
