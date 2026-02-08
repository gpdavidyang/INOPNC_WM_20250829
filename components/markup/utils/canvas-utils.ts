import type { MarkupObject } from '@/types/markup'

export function hitTest(
  objects: MarkupObject[],
  p: { x: number; y: number },
  margin = 8
): string | null {
  // Iterate backwards to prioritize top-most items
  for (let i = objects.length - 1; i >= 0; i--) {
    const o = objects[i] as any
    const x = parseFloat(String(o.x)) || 0
    const y = parseFloat(String(o.y)) || 0
    let dist = Infinity

    // 1. Box / Image / Text (Treat as Rect for distance)
    if (o.type === 'box' || o.type === 'image' || o.type === 'text') {
      let w = parseFloat(String(o.width)) || 0
      let h = parseFloat(String(o.height)) || 0

      // Special handling for Text width estimation if width is missing
      if (o.type === 'text') {
        const fontSize = parseFloat(String(o.fontSize)) || 14
        if (!w) w = Math.max(20, String(o.content || '').length * fontSize * 0.6)
        if (!h) h = fontSize * 1.2
      }

      // Handle negative dimensions
      let minX = x,
        maxX = x + w,
        minY = y,
        maxY = y + h
      if (w < 0) {
        minX = x + w
        maxX = x
      }
      if (h < 0) {
        minY = y + h
        maxY = y
      }

      // Distance to rectangle (0 if inside)
      // dx is distance from p.x to [minX, maxX] interval
      const dx = Math.max(minX - p.x, 0, p.x - maxX)
      const dy = Math.max(minY - p.y, 0, p.y - maxY)
      dist = Math.sqrt(dx * dx + dy * dy)

      // Special logic for circle shape: check distance to center vs radius
      if (o.shape === 'circle') {
        const cx = minX + Math.abs(w) / 2
        const cy = minY + Math.abs(h) / 2
        const rx = Math.abs(w) / 2
        const ry = Math.abs(h) / 2
        // Normalized distance equation for ellipse is harder, approximate with rect for now as it's easier to click
        // or strictly:
        const normalizedDist = Math.sqrt(
          ((p.x - cx) / (rx + margin)) ** 2 + ((p.y - cy) / (ry + margin)) ** 2
        )
        if (normalizedDist <= 1)
          dist = 0 // Inside enlarged ellipse
        else dist = margin + 1 // Outside
      }
    }

    // 2. Stamp (Point radius)
    else if (o.type === 'stamp') {
      const size = sizeToPixels(o.size || 'medium')
      const r = size / 2
      // dist is distance from edge of circle
      const centerDist = Math.hypot(p.x - x, p.y - y)
      dist = Math.max(0, centerDist - r)
    }

    // 3. Pen (Path)
    else if (o.type === 'pen' || o.type === 'drawing') {
      const path = Array.isArray(o.path) ? o.path : []
      const strokeWidth = parseFloat(String(o.strokeWidth)) || 2
      let minDistToPath = Infinity

      for (let j = 1; j < path.length; j++) {
        const p1 = path[j - 1]
        const p2 = path[j]
        const nP1 = { x: parseFloat(String(p1.x)) || 0, y: parseFloat(String(p1.y)) || 0 }
        const nP2 = { x: parseFloat(String(p2.x)) || 0, y: parseFloat(String(p2.y)) || 0 }
        const d = distToSeg(p, nP1, nP2)
        if (d < minDistToPath) minDistToPath = d
      }
      // dist is distance from 'ink' edge (considering stroke width)
      dist = Math.max(0, minDistToPath - strokeWidth / 2)
    }

    // Check against margin
    if (dist <= margin) {
      return o.id
    }
  }

  return null
}

function distToSeg(
  p: { x: number; y: number },
  a: { x: number; y: number },
  b: { x: number; y: number }
) {
  const l2 = (b.x - a.x) ** 2 + (b.y - a.y) ** 2
  if (l2 === 0) return Math.hypot(p.x - a.x, p.y - a.y)
  let t = ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / l2
  t = Math.max(0, Math.min(1, t))
  return Math.hypot(p.x - (a.x + t * (b.x - a.x)), p.y - (a.y + t * (b.y - a.y)))
}

function sizeToPixels(size: string): number {
  switch (size) {
    case 'small':
      return 24
    case 'medium':
      return 32
    case 'large':
      return 48
    case 'xlarge':
      return 64
    default:
      return 32
  }
}

// Remove unused function if necessary
// function isPointInTriangle...
