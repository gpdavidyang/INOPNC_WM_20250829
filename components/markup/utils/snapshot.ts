import type { MarkupObject } from '@/types/markup'
import { colorToHex } from './color-utils'

export async function renderMarkupSnapshotDataUrl(
  sourceUrl?: string | null,
  markupObjects: MarkupObject[] = []
): Promise<string | undefined> {
  try {
    if (!sourceUrl) return undefined
    if (typeof window === 'undefined') return undefined

    const img = await loadImage(sourceUrl)
    const width = img.naturalWidth || img.width
    const height = img.naturalHeight || img.height
    if (!width || !height) return undefined

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return undefined

    ctx.drawImage(img, 0, 0, width, height)
    drawMarkupObjectsOnCanvas(ctx, markupObjects || [])
    return canvas.toDataURL('image/png', 0.95)
  } catch {
    return undefined
  }
}

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('이미지를 불러올 수 없습니다.'))
    img.src = src
  })

const drawMarkupObjectsOnCanvas = (ctx: CanvasRenderingContext2D, objects: MarkupObject[]) => {
  objects.forEach(obj => {
    if (obj.type === 'box') {
      ctx.save()
      ctx.strokeStyle = colorToHex((obj as any).color || 'gray')
      ctx.lineWidth = getBoxStrokeWidth((obj as any).size)
      ctx.strokeRect(
        Number((obj as any).x),
        Number((obj as any).y),
        Number((obj as any).width) || 0,
        Number((obj as any).height) || 0
      )
      if ((obj as any).label) {
        ctx.font = '12px Pretendard, sans-serif'
        ctx.fillStyle = colorToHex((obj as any).color || 'gray')
        ctx.textBaseline = 'bottom'
        ctx.fillText(
          String((obj as any).label),
          Number((obj as any).x) + 4,
          Math.max(12, Number((obj as any).y) - 4)
        )
      }
      ctx.restore()
      return
    }
    if (obj.type === 'text') {
      const anyObj = obj as any
      ctx.save()
      ctx.font = `${anyObj.fontSize || 14}px Pretendard, sans-serif`
      ctx.fillStyle = anyObj.fontColor || '#111'
      ctx.textBaseline = 'alphabetic'
      ctx.fillText(String(anyObj.content || ''), Number(anyObj.x) || 0, Number(anyObj.y) || 0)
      ctx.restore()
      return
    }
    if (obj.type === 'drawing' || (obj as any).type === 'pen') {
      const anyObj = obj as any
      const path = Array.isArray(anyObj.path) ? anyObj.path : []
      if (path.length > 1) {
        ctx.save()
        ctx.beginPath()
        ctx.moveTo(path[0].x, path[0].y)
        for (let i = 1; i < path.length; i++) ctx.lineTo(path[i].x, path[i].y)
        ctx.strokeStyle = colorToHex(anyObj.strokeColor || '#ef4444')
        ctx.lineWidth = Number(anyObj.strokeWidth) || 2
        ctx.lineJoin = 'round'
        ctx.lineCap = 'round'
        ctx.stroke()
        ctx.restore()
      }
      return
    }
    if (obj.type === 'stamp') {
      drawStamp(ctx, obj)
    }
  })
}

const drawStamp = (ctx: CanvasRenderingContext2D, obj: MarkupObject) => {
  const anyObj = obj as any
  const color = colorToHex(anyObj.color || '#ef4444')
  const size = sizeToPixels(anyObj.size || 'medium')
  const half = size / 2
  ctx.save()
  ctx.fillStyle = color
  ctx.globalAlpha = 0.85
  const x = Number(anyObj.x) || 0
  const y = Number(anyObj.y) || 0
  if (anyObj.shape === 'circle') {
    ctx.beginPath()
    ctx.arc(x, y, half, 0, Math.PI * 2)
    ctx.fill()
  } else if (anyObj.shape === 'square') {
    ctx.fillRect(x - half, y - half, size, size)
  } else if (anyObj.shape === 'triangle') {
    ctx.beginPath()
    ctx.moveTo(x, y - half)
    ctx.lineTo(x - half, y + half)
    ctx.lineTo(x + half, y + half)
    ctx.closePath()
    ctx.fill()
  } else {
    const pts = getStarPoints(x, y, half, half / 2)
    ctx.beginPath()
    ctx.moveTo(pts[0].x, pts[0].y)
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y)
    ctx.closePath()
    ctx.fill()
  }
  ctx.restore()
}

const getStarPoints = (cx: number, cy: number, outer: number, inner: number) => {
  const pts: Array<{ x: number; y: number }> = []
  for (let i = 0; i < 10; i++) {
    const angle = (Math.PI / 5) * i - Math.PI / 2
    const radius = i % 2 === 0 ? outer : inner
    pts.push({ x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius })
  }
  return pts
}

const sizeToPixels = (size: 'small' | 'medium' | 'large') => {
  if (size === 'small') return 18
  if (size === 'large') return 36
  return 24
}

const getBoxStrokeWidth = (size?: 'small' | 'medium' | 'large') => {
  if (size === 'small') return 2
  if (size === 'large') return 4
  return 3
}
