import type { MarkupObject } from '@/types/markup'

export function hitTest(objects: MarkupObject[], p: { x: number; y: number }): string | null {
  const margin = 8
  for (let i = objects.length - 1; i >= 0; i--) {
    const o = objects[i] as any
    if (o.type === 'box') {
      const x = Number(o.x),
        y = Number(o.y),
        w = Number(o.width),
        h = Number(o.height)
      const shape = o.shape || 'square'

      if (o.label && p.x >= x && p.x <= x + w && p.y >= y - 24 && p.y <= y) return o.id
      if (p.x < x - margin || p.x > x + w + margin || p.y < y - margin || p.y > y + h + margin)
        continue

      if (shape === 'square') return o.id
      if (shape === 'circle') {
        const cx = x + w / 2,
          cy = y + h / 2,
          rx = w / 2 + margin,
          ry = h / 2 + margin
        const dx = p.x - cx,
          dy = p.y - cy
        if ((dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) <= 1) return o.id
      } else if (shape === 'triangle') {
        if (isPointInTriangle(p, { x: x + w / 2, y }, { x: x + w, y: y + h }, { x, y: y + h }))
          return o.id
      } else {
        return o.id
      }
    } else if (o.type === 'pen' || o.type === 'drawing') {
      const path = o.path || []
      for (let j = 1; j < path.length; j++) {
        if (distToSeg(p, path[j - 1], path[j]) <= 8) return o.id
      }
    } else if (o.type === 'stamp') {
      const r = 15 // simplified
      if (Math.hypot(p.x - o.x, p.y - o.y) <= r + margin) return o.id
    } else if (o.type === 'text') {
      const w = Math.max(40, (o.content?.length || 0) * 8)
      const h = o.fontSize || 14
      if (p.x >= o.x && p.x <= o.x + w && p.y >= o.y - h && p.y <= o.y) return o.id
    }
  }
  return null
}

function isPointInTriangle(p: any, a: any, b: any, c: any) {
  const s = (a.x - c.x) * (p.y - c.y) - (a.y - c.y) * (p.x - c.x)
  const t = (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x)
  if (s < 0 !== t < 0 && s !== 0 && t !== 0) return false
  const d = (c.x - b.x) * (p.y - b.y) - (c.y - b.y) * (p.x - b.x)
  return t < 0 === d < 0 || d === 0
}

function distToSeg(p: any, a: any, b: any) {
  const l2 = (b.x - a.x) ** 2 + (b.y - a.y) ** 2
  if (l2 === 0) return Math.hypot(p.x - a.x, p.y - a.y)
  let t = ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / l2
  t = Math.max(0, Math.min(1, t))
  return Math.hypot(p.x - (a.x + t * (b.x - a.x)), p.y - (a.y + t * (b.y - a.y)))
}
