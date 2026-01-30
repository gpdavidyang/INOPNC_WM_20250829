import React, { useEffect, useRef, useState } from 'react'
import {
  X,
  RotateCcw,
  Save,
  Eraser,
  MousePointer,
  Scan,
  Brush,
  Stamp,
  Type,
  Maximize2,
  ScanEye,
  Download,
  Share2,
  ZoomIn,
  ZoomOut,
  Hand,
  ChevronLeft,
} from 'lucide-react'
import { DrawingObject } from '../../../types'

export interface DrawingModalProps {
  isOpen: boolean
  onClose: () => void
  imageSrc: string | null
  onSave: (dataUrl: string) => void
}

const DrawingModal: React.FC<DrawingModalProps> = ({ isOpen, onClose, imageSrc, onSave }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [imgObj, setImgObj] = useState<HTMLImageElement | null>(null)
  const [drawObjects, setDrawObjects] = useState<DrawingObject[]>([])
  const [currentTool, setCurrentTool] = useState<
    'hand' | 'rect' | 'brush' | 'stamp' | 'text' | 'eraser'
  >('rect')
  const [currentColor, setCurrentColor] = useState('blue')
  const [currentSize, setCurrentSize] = useState(5) // Default optimized for mobile brush
  const [currentStamp, setCurrentStamp] = useState('circle')
  const [camera, setCamera] = useState({ x: 0, y: 0, scale: 1 })
  const [isProcessing, setIsProcessing] = useState(false)

  // Preview Modal State
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewZoom, setPreviewZoom] = useState(1)
  const [previewPan, setPreviewPan] = useState({ x: 0, y: 0 })
  const [isPreviewPanning, setIsPreviewPanning] = useState(false)

  // Text Input State
  const [textInput, setTextInput] = useState<{ x: number; y: number; value: string } | null>(null)

  // State for drawing interaction
  const isDown = useRef(false)
  const currentObj = useRef<DrawingObject | null>(null)
  const lastPos = useRef({ x: 0, y: 0 })
  const previewDragStart = useRef<{ x: number; y: number } | null>(null)

  // State for moving objects
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null)
  const draggingIdxRef = useRef<number | null>(null)

  // Effect to set appropriate default size based on tool
  useEffect(() => {
    if (currentTool === 'brush') setCurrentSize(5)
    else if (currentTool === 'stamp') setCurrentSize(25)
    else if (currentTool === 'rect' || currentTool === 'text') setCurrentSize(30)
  }, [currentTool])

  // Initialize Image
  useEffect(() => {
    if (isOpen && imageSrc) {
      const img = new Image()
      img.src = imageSrc
      img.onload = () => {
        setImgObj(img)
        setDrawObjects([])
        if (containerRef.current) {
          const w = containerRef.current.clientWidth
          const h = containerRef.current.clientHeight
          const scale = Math.min(w / img.width, h / img.height) * 0.9
          setCamera({
            scale,
            x: (w - img.width * scale) / 2,
            y: (h - img.height * scale) / 2,
          })
        }
      }
    }
  }, [isOpen, imageSrc])

  // Redraw Canvas
  const redraw = () => {
    const cvs = canvasRef.current
    const ctx = cvs?.getContext('2d')
    if (!cvs || !ctx || !imgObj) return

    // Clear and Set Transform
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, cvs.width, cvs.height)

    ctx.setTransform(camera.scale, 0, 0, camera.scale, camera.x, camera.y)
    ctx.drawImage(imgObj, 0, 0)

    // Draw Objects
    const drawSingle = (o: DrawingObject) => {
      if (!o) return // Safety check
      if (o.type === 'rect') {
        ctx.lineWidth = o.size / 5
        ctx.strokeStyle = o.stroke
        ctx.fillStyle = o.fill || 'transparent'
        ctx.beginPath()
        ctx.rect(o.x, o.y, o.w || 0, o.h || 0)
        if (o.fill) ctx.fill()
        ctx.stroke()
      } else if (o.type === 'brush' && o.points) {
        ctx.lineWidth = o.size
        ctx.strokeStyle = o.stroke
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.beginPath()
        if (o.points.length > 0) {
          ctx.moveTo(o.points[0].x, o.points[0].y)
          o.points.forEach(p => ctx.lineTo(p.x, p.y))
        }
        ctx.stroke()
      } else if (o.type === 'text' && o.text) {
        const fontSize = o.size + 20
        ctx.font = `bold ${fontSize}px Pretendard`
        ctx.fillStyle = o.stroke
        ctx.fillText(o.text, o.x, o.y)
      } else if (o.type === 'stamp') {
        const s = o.size
        ctx.fillStyle = o.stroke
        ctx.beginPath()
        if (o.shape === 'circle') ctx.arc(o.x, o.y, s, 0, Math.PI * 2)
        else if (o.shape === 'square') ctx.rect(o.x - s, o.y - s, s * 2, s * 2)
        else if (o.shape === 'triangle') {
          ctx.moveTo(o.x, o.y - s)
          ctx.lineTo(o.x + s, o.y + s)
          ctx.lineTo(o.x - s, o.y + s)
          ctx.closePath()
        } else if (o.shape === 'star') {
          let rot = (Math.PI / 2) * 3,
            step = Math.PI / 5,
            outer = s,
            inner = s / 2
          ctx.moveTo(o.x, o.y - outer)
          for (let i = 0; i < 5; i++) {
            ctx.lineTo(o.x + Math.cos(rot) * outer, o.y + Math.sin(rot) * outer)
            rot += step
            ctx.lineTo(o.x + Math.cos(rot) * inner, o.y + Math.sin(rot) * inner)
            rot += step
          }
          ctx.lineTo(o.x, o.y - outer)
          ctx.closePath()
        }
        ctx.fill()
      }
    }

    drawObjects.forEach(drawSingle)
    if (currentObj.current) drawSingle(currentObj.current)
  }

  useEffect(() => {
    redraw()
  }, [drawObjects, camera, imgObj])

  // Helpers
  const getStrokeColor = (c: string) => {
    const map: any = {
      blue: '#31a3fa',
      red: '#ef4444',
      green: '#22c55e',
      orange: '#f97316',
      purple: '#a855f7',
      gray: '#64748b',
    }
    return map[c] || '#31a3fa'
  }
  const getFillColor = (c: string) => {
    const map: any = {
      blue: 'rgba(49,163,250,0.3)',
      red: 'rgba(239,68,68,0.3)',
      green: 'rgba(34,197,94,0.3)',
      orange: 'rgba(249,115,22,0.3)',
      purple: 'rgba(168,85,247,0.3)',
      gray: 'rgba(100,116,139,0.3)',
    }
    return map[c] || 'rgba(49,163,250,0.3)'
  }

  const toWorld = (sx: number, sy: number) => ({
    x: (sx - camera.x) / camera.scale,
    y: (sy - camera.y) / camera.scale,
  })

  // Hit Test
  const isHit = (o: DrawingObject, x: number, y: number) => {
    const pad = 30 // Increased padding for easier mobile selection
    if (o.type === 'rect') {
      return (
        x >= o.x - pad &&
        x <= o.x + (o.w || 0) + pad &&
        y >= o.y - pad &&
        y <= o.y + (o.h || 0) + pad
      )
    }
    if (o.type === 'stamp') {
      const s = o.size + pad
      return x >= o.x - s && x <= o.x + s && y >= o.y - s && y <= o.y + s
    }
    if (o.type === 'text') {
      const fontSize = o.size + 20
      const w = (o.text?.length || 0) * (fontSize * 0.6)
      const h = fontSize
      return x >= o.x && x <= o.x + w && y >= o.y - h && y <= o.y + h * 0.3
    }
    if (o.type === 'brush' && o.points) {
      return o.points.some(pt => Math.hypot(x - pt.x, y - pt.y) < 20)
    }
    return false
  }

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (window.confirm('모두 지우시겠습니까?')) {
      setDrawObjects([])
      currentObj.current = null
      isDown.current = false
      draggingIdxRef.current = null
      setDraggingIdx(null)
      setTextInput(null)
    }
  }

  // Handlers
  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (!canvasRef.current || textInput) return
    const rect = canvasRef.current.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY
    const x = clientX - rect.left
    const y = clientY - rect.top
    const wp = toWorld(x, y)

    isDown.current = true
    lastPos.current = { x, y }

    if (currentTool === 'hand') {
      // Try to find an object to drag first
      const foundIdx = [...drawObjects].reverse().findIndex(o => isHit(o, wp.x, wp.y))
      if (foundIdx !== -1) {
        const realIdx = drawObjects.length - 1 - foundIdx
        setDraggingIdx(realIdx)
        draggingIdxRef.current = realIdx // Sync ref for immediate drag
      } else {
        setDraggingIdx(null)
        draggingIdxRef.current = null
      }
      return
    }

    if (currentTool === 'eraser') {
      const foundIdx = [...drawObjects].reverse().findIndex(o => isHit(o, wp.x, wp.y))
      if (foundIdx !== -1) {
        const realIdx = drawObjects.length - 1 - foundIdx
        const newObjs = [...drawObjects]
        newObjs.splice(realIdx, 1)
        setDrawObjects(newObjs)
      }
      return
    }

    if (currentTool === 'text') {
      setTextInput({ x: wp.x, y: wp.y, value: '' })
      isDown.current = false
      return
    }

    if (currentTool === 'rect') {
      currentObj.current = {
        type: 'rect',
        x: wp.x,
        y: wp.y,
        w: 0,
        h: 0,
        stroke: getStrokeColor(currentColor),
        fill: getFillColor(currentColor),
        size: currentSize,
      }
    } else if (currentTool === 'brush') {
      currentObj.current = {
        type: 'brush',
        points: [{ x: wp.x, y: wp.y }],
        x: 0,
        y: 0,
        stroke: getStrokeColor(currentColor),
        size: currentSize,
      }
    }
  }

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDown.current || !canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY
    const x = clientX - rect.left
    const y = clientY - rect.top
    const wp = toWorld(x, y)

    if (currentTool === 'hand') {
      if (draggingIdxRef.current !== null) {
        // Moving Object logic using ref to avoid state race condition
        const prevWp = toWorld(lastPos.current.x, lastPos.current.y)
        const dx = wp.x - prevWp.x
        const dy = wp.y - prevWp.y

        setDrawObjects(prev => {
          const next = [...prev]
          const idx = draggingIdxRef.current
          if (idx !== null && next[idx]) {
            const obj = { ...next[idx] }
            if (obj.type === 'brush' && obj.points) {
              obj.points = obj.points.map(p => ({ x: p.x + dx, y: p.y + dy }))
            } else {
              obj.x += dx
              obj.y += dy
            }
            next[idx] = obj
          }
          return next
        })
      } else {
        // Panning Camera
        setCamera(prev => ({
          ...prev,
          x: prev.x + (x - lastPos.current.x),
          y: prev.y + (y - lastPos.current.y),
        }))
      }
      lastPos.current = { x, y }
      return
    }

    if (currentTool === 'eraser') {
      const foundIdx = [...drawObjects].reverse().findIndex(o => isHit(o, wp.x, wp.y))
      if (foundIdx !== -1) {
        const realIdx = drawObjects.length - 1 - foundIdx
        const newObjs = [...drawObjects]
        newObjs.splice(realIdx, 1)
        setDrawObjects(newObjs)
      }
      return
    }

    if (currentObj.current) {
      if (currentTool === 'rect') {
        currentObj.current.w = wp.x - currentObj.current.x
        currentObj.current.h = wp.y - currentObj.current.y
      } else if (currentTool === 'brush' && currentObj.current.points) {
        currentObj.current.points.push({ x: wp.x, y: wp.y })
      }
      redraw()
    }
  }

  const handleEnd = (e: React.MouseEvent | React.TouchEvent) => {
    if (currentTool === 'hand') {
      setDraggingIdx(null)
      draggingIdxRef.current = null
    }

    if (currentTool === 'stamp' && isDown.current && !currentObj.current) {
      const rect = canvasRef.current?.getBoundingClientRect()
      if (rect) {
        const clientX =
          'changedTouches' in e ? e.changedTouches[0].clientX : (e as React.MouseEvent).clientX
        const clientY =
          'changedTouches' in e ? e.changedTouches[0].clientY : (e as React.MouseEvent).clientY
        const x = clientX - rect.left
        const y = clientY - rect.top
        const wp = toWorld(x, y)
        setDrawObjects(prev => [
          ...prev,
          {
            type: 'stamp',
            x: wp.x,
            y: wp.y,
            shape: currentStamp,
            stroke: getStrokeColor(currentColor),
            size: currentSize,
          },
        ])
      }
    }

    if (isDown.current && currentObj.current) {
      const obj = currentObj.current
      if (obj.type === 'rect') {
        if ((obj.w || 0) < 0) {
          obj.x += obj.w || 0
          obj.w = Math.abs(obj.w || 0)
        }
        if ((obj.h || 0) < 0) {
          obj.y += obj.h || 0
          obj.h = Math.abs(obj.h || 0)
        }
        if (Math.abs(obj.w || 0) > 5 || Math.abs(obj.h || 0) > 5) {
          setDrawObjects(prev => [...prev, obj])
        }
      } else {
        setDrawObjects(prev => [...prev, obj])
      }
    }
    isDown.current = false
    currentObj.current = null
    redraw()
  }

  const handleTextInputSubmit = () => {
    if (textInput && textInput.value.trim()) {
      setDrawObjects(prev => [
        ...prev,
        {
          type: 'text',
          x: textInput.x,
          y: textInput.y,
          text: textInput.value,
          stroke: getStrokeColor(currentColor),
          size: currentSize,
        },
      ])
    }
    setTextInput(null)
  }

  const generateImage = () => {
    if (!imgObj) return null
    const t = document.createElement('canvas')
    t.width = imgObj.width
    t.height = imgObj.height
    const tx = t.getContext('2d')
    if (tx) {
      tx.drawImage(imgObj, 0, 0)

      const drawSingle = (o: DrawingObject) => {
        if (o.type === 'rect') {
          tx.lineWidth = o.size / 5
          tx.strokeStyle = o.stroke
          tx.fillStyle = o.fill || 'transparent'
          tx.beginPath()
          tx.rect(o.x, o.y, o.w || 0, o.h || 0)
          if (o.fill) tx.fill()
          tx.stroke()
        } else if (o.type === 'brush' && o.points) {
          tx.lineWidth = o.size
          tx.strokeStyle = o.stroke
          tx.lineCap = 'round'
          tx.lineJoin = 'round'
          tx.beginPath()
          if (o.points.length > 0) {
            tx.moveTo(o.points[0].x, o.points[0].y)
            o.points.forEach(p => tx.lineTo(p.x, p.y))
          }
          tx.stroke()
        } else if (o.type === 'text' && o.text) {
          const fontSize = o.size + 20
          tx.font = `bold ${fontSize}px Pretendard`
          tx.fillStyle = o.stroke
          tx.fillText(o.text, o.x, o.y)
        } else if (o.type === 'stamp') {
          const s = o.size
          tx.fillStyle = o.stroke
          tx.beginPath()
          if (o.shape === 'circle') tx.arc(o.x, o.y, s, 0, Math.PI * 2)
          else if (o.shape === 'square') tx.rect(o.x - s, o.y - s, s * 2, s * 2)
          else if (o.shape === 'triangle') {
            tx.moveTo(o.x, o.y - s)
            tx.lineTo(o.x + s, o.y + s)
            tx.lineTo(o.x - s, o.y + s)
            tx.closePath()
          } else if (o.shape === 'star') {
            let rot = (Math.PI / 2) * 3,
              step = Math.PI / 5,
              outer = s,
              inner = s / 2
            tx.moveTo(o.x, o.y - outer)
            for (let i = 0; i < 5; i++) {
              tx.lineTo(o.x + Math.cos(rot) * outer, o.y + Math.sin(rot) * outer)
              rot += step
              tx.lineTo(o.x + Math.cos(rot) * inner, o.y + Math.sin(rot) * inner)
              rot += step
            }
            tx.lineTo(o.x, o.y - outer)
            tx.closePath()
          }
          tx.fill()
        }
      }
      drawObjects.forEach(drawSingle)
    }
    return t.toDataURL('image/png')
  }

  const handlePreview = () => {
    const url = generateImage()
    if (url) {
      setPreviewUrl(url)
      setIsPreviewOpen(true)
      setPreviewZoom(1)
      setPreviewPan({ x: 0, y: 0 })
    }
  }

  const handleSave = () => {
    if (!imgObj) return
    setIsProcessing(true)
    const dataUrl = generateImage()
    if (dataUrl) onSave(dataUrl)
    setIsProcessing(false)
  }

  const handlePreviewDownload = () => {
    if (previewUrl) {
      const link = document.createElement('a')
      link.href = previewUrl
      link.download = `drawing_marking_${Date.now()}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const handlePreviewShare = async () => {
    if (previewUrl && navigator.share) {
      try {
        const blob = await (await fetch(previewUrl)).blob()
        const file = new File([blob], `drawing_marking_${Date.now()}.png`, { type: 'image/png' })
        await navigator.share({
          files: [file],
          title: '도면 마킹',
        })
      } catch (e) {
        console.error(e)
      }
    } else {
      alert('공유를 지원하지 않는 브라우저입니다.')
    }
  }

  // Preview Pan Handlers
  const onPreviewDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isPreviewPanning) return
    const cx = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX
    const cy = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY
    previewDragStart.current = { x: cx - previewPan.x, y: cy - previewPan.y }
  }

  const onPreviewMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isPreviewPanning || !previewDragStart.current) return
    const cx = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX
    const cy = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY
    setPreviewPan({
      x: cx - previewDragStart.current.x,
      y: cy - previewDragStart.current.y,
    })
  }

  const onPreviewUp = () => {
    previewDragStart.current = null
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-[#111827] z-50 flex flex-col">
      <div className="h-[52px] bg-header-navy flex items-center justify-between px-3 text-white border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2">
          <button onClick={onClose}>
            <X className="w-6 h-6" />
          </button>
          <span className="font-bold">도면 마킹</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              if (drawObjects.length) setDrawObjects(p => p.slice(0, -1))
            }}
            className="flex items-center gap-1 px-2 py-1 bg-white/10 rounded-lg text-xs"
          >
            <RotateCcw className="w-3 h-3" /> 취소
          </button>
          <button
            onClick={handleClearAll}
            className="flex items-center gap-1 px-2 py-1 bg-white/10 rounded-lg text-xs"
          >
            <Eraser className="w-3 h-3" /> 지우기
          </button>
          <button
            onClick={handlePreview}
            className="flex items-center gap-1 px-2 py-1 bg-white/10 rounded-lg text-xs"
          >
            <ScanEye className="w-3 h-3" /> 미리보기
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1 px-3 py-1 bg-primary rounded-lg text-sm font-bold"
          >
            <Save className="w-4 h-4" /> 저장
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden bg-[#111827] flex items-center justify-center touch-none"
      >
        <canvas
          ref={canvasRef}
          width={containerRef.current?.clientWidth}
          height={containerRef.current?.clientHeight}
          style={{
            cursor:
              currentTool === 'hand' ? (draggingIdx !== null ? 'grabbing' : 'grab') : 'crosshair',
          }}
          className="block shadow-2xl touch-none"
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
        />

        {textInput && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-40">
            <div className="bg-white p-4 rounded-xl shadow-2xl w-[90%] max-w-sm flex flex-col gap-3">
              <span className="font-bold text-lg text-gray-800">텍스트 입력</span>
              <input
                autoFocus
                className="border p-2 rounded text-lg outline-none focus:border-primary"
                value={textInput.value}
                onChange={e =>
                  setTextInput(prev => (prev ? { ...prev, value: e.target.value } : null))
                }
                placeholder="내용을 입력하세요"
              />
              <div className="flex gap-2 justify-end mt-2">
                <button
                  onClick={() => setTextInput(null)}
                  className="px-4 py-2 bg-gray-100 rounded-lg font-bold text-gray-600"
                >
                  취소
                </button>
                <button
                  onClick={handleTextInputSubmit}
                  className="px-4 py-2 bg-primary text-white rounded-lg font-bold"
                >
                  확인
                </button>
              </div>
            </div>
          </div>
        )}

        {isProcessing && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center text-white">
            처리 중...
          </div>
        )}

        {isPreviewOpen && previewUrl && (
          <div className="absolute inset-0 bg-black flex flex-col z-50">
            <div className="h-[52px] bg-black border-b border-gray-800 flex items-center justify-between px-3 shrink-0 text-white">
              <div className="flex items-center gap-2 overflow-hidden">
                <button onClick={() => setIsPreviewOpen(false)}>
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <span className="font-bold truncate max-w-[200px]">
                  도면 마킹 - {drawObjects.length > 0 ? `Object_${drawObjects.length}` : 'New'}
                </span>
              </div>
              <button onClick={handlePreviewDownload} className="p-2">
                <Download className="w-5 h-5 text-white" />
              </button>
            </div>

            <div
              className={`flex-1 relative overflow-hidden flex items-center justify-center bg-[#111] touch-none ${isPreviewPanning ? 'cursor-grab active:cursor-grabbing' : ''}`}
              onMouseDown={onPreviewDown}
              onMouseMove={onPreviewMove}
              onMouseUp={onPreviewUp}
              onMouseLeave={onPreviewUp}
              onTouchStart={onPreviewDown}
              onTouchMove={onPreviewMove}
              onTouchEnd={onPreviewUp}
            >
              <img
                src={previewUrl}
                style={{
                  transform: `translate(${previewPan.x}px, ${previewPan.y}px) scale(${previewZoom})`,
                }}
                className="max-w-[90%] max-h-[80%] object-contain transition-transform duration-75"
                alt="Preview"
                draggable={false}
              />
            </div>

            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-[#222]/90 backdrop-blur border border-white/10 px-6 py-2.5 rounded-full flex gap-6 shadow-2xl z-50">
              <button
                onClick={() => setPreviewZoom(z => Math.max(0.5, z - 0.2))}
                className="flex flex-col items-center gap-1 text-[10px] text-white/70 hover:text-white transition-colors"
              >
                <ZoomOut size={18} />
                <span>축소</span>
              </button>
              <button
                onClick={() => setIsPreviewPanning(!isPreviewPanning)}
                className={`flex flex-col items-center gap-1 text-[10px] transition-colors ${isPreviewPanning ? 'text-primary' : 'text-white/70 hover:text-white'}`}
              >
                <Hand size={18} />
                <span>이동</span>
              </button>
              <button
                onClick={() => setPreviewZoom(z => Math.min(3, z + 0.2))}
                className="flex flex-col items-center gap-1 text-[10px] text-white/70 hover:text-white transition-colors"
              >
                <ZoomIn size={18} />
                <span>확대</span>
              </button>
              <div className="w-px h-6 bg-white/20 self-center mx-1"></div>
              <button
                onClick={handlePreviewShare}
                className="flex flex-col items-center gap-1 text-[10px] text-white/70 hover:text-white transition-colors"
              >
                <Share2 size={18} />
                <span>공유</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white pb-safe shrink-0">
        <div className="flex justify-around p-2 border-t border-slate-100">
          {[
            { id: 'hand', icon: MousePointer, label: '이동' },
            { id: 'rect', icon: Scan, label: '구역' },
            { id: 'brush', icon: Brush, label: '펜' },
            { id: 'stamp', icon: Stamp, label: '도장' },
            { id: 'text', icon: Type, label: '문자' },
            { id: 'eraser', icon: Eraser, label: '삭제' },
          ].map(tool => (
            <button
              key={tool.id}
              onClick={() => setCurrentTool(tool.id as any)}
              className={`w-11 h-11 rounded-xl border flex flex-col items-center justify-center text-[10px] gap-0.5 transition-colors
                                ${currentTool === tool.id ? 'bg-primary-bg border-primary text-primary font-bold' : 'bg-white border-slate-200 text-slate-500'}
                            `}
            >
              <tool.icon className="w-5 h-5" />
              <span>{tool.label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 px-2 py-2 border-t border-slate-100 overflow-x-auto no-scrollbar">
          <div className="flex gap-2">
            {['blue', 'red', 'gray', 'green', 'orange', 'purple'].map(c => (
              <button
                key={c}
                onClick={() => setCurrentColor(c)}
                className={`w-7 h-7 rounded-full border-2 shrink-0 transition-transform ${currentColor === c ? 'border-white ring-2 ring-slate-800 scale-110' : 'border-slate-200'}`}
                style={{ backgroundColor: getStrokeColor(c) }}
              />
            ))}
          </div>
          <div className="w-px h-6 bg-slate-200 mx-1 shrink-0"></div>
          <input
            type="range"
            min="2"
            max="100"
            value={currentSize}
            onChange={e => setCurrentSize(parseInt(e.target.value))}
            className="w-24 accent-primary"
          />
          <button
            onClick={() => {
              if (containerRef.current && imgObj) {
                const w = containerRef.current.clientWidth
                const h = containerRef.current.clientHeight
                const scale = Math.min(w / imgObj.width, h / imgObj.height) * 0.9
                setCamera({
                  scale,
                  x: (w - imgObj.width * scale) / 2,
                  y: (h - imgObj.height * scale) / 2,
                })
              }
            }}
            className="px-2 py-1 text-xs border rounded flex items-center gap-1 bg-slate-50 text-slate-600"
          >
            <Maximize2 className="w-3 h-3" /> 맞춤
          </button>
        </div>

        {currentTool === 'stamp' && (
          <div className="flex justify-around p-2 bg-slate-50 gap-2 border-t border-slate-100">
            {['circle', 'square', 'triangle', 'star'].map(s => (
              <button
                key={s}
                onClick={() => setCurrentStamp(s)}
                className={`p-2 rounded-lg border ${currentStamp === s ? 'bg-primary-bg border-primary text-primary' : 'bg-white border-slate-200'}`}
              >
                {s === 'circle' && (
                  <div className="w-4 h-4 rounded-full border-2 border-current"></div>
                )}
                {s === 'square' && <div className="w-4 h-4 border-2 border-current"></div>}
                {s === 'triangle' && (
                  <div className="w-0 h-0 border-l-[8px] border-r-[8px] border-b-[16px] border-l-transparent border-r-transparent border-b-current"></div>
                )}
                {s === 'star' && <Stamp className="w-4 h-4" />}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default DrawingModal
