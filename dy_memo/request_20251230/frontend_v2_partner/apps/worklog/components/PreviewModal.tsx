import React, { useState, useRef, useEffect } from 'react'
import { X, ZoomIn, ZoomOut, Hand, Download, Share2 } from 'lucide-react'

interface PreviewModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  type: 'image' | 'pdf' | 'drawing'
  src: string
  details?: {
    site?: string
    member?: string
    process?: string
    content?: string
  }
}

const PreviewModal: React.FC<PreviewModalProps> = ({
  isOpen,
  onClose,
  title,
  type,
  src,
  details,
}) => {
  const [zoom, setZoom] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [isPanningMode, setIsPanningMode] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      // Default zoom: 0.6 for drawings (A3), 0.45 for photos (A4 portrait) to fit screens better
      setZoom(type === 'drawing' ? 0.6 : 0.45)
      setPosition({ x: 0, y: 0 })
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  }, [isOpen, type])

  if (!isOpen) return null

  const handleZoom = (delta: number) => {
    setZoom(prev => Math.max(0.2, Math.min(prev + delta, 4)))
  }

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isPanningMode) return
    setIsDragging(true)
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY
    setDragStart({ x: clientX - position.x, y: clientY - position.y })
  }

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || !isPanningMode) return
    e.preventDefault()
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY
    setPosition({ x: clientX - dragStart.x, y: clientY - dragStart.y })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Cursor style based on mode
  const cursorStyle = isPanningMode
    ? isDragging
      ? 'cursor-grabbing'
      : 'cursor-grab'
    : 'cursor-default'

  return (
    <div className="fixed inset-0 z-[9999] bg-[#121212] flex flex-col text-white font-sans overflow-hidden select-none">
      {/* Header */}
      <header className="h-14 bg-black/50 flex items-center justify-between px-3 border-b border-gray-800 z-50">
        <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-800 transition">
          <X className="w-6 h-6 text-white" />
        </button>
        <div className="text-[17px] font-bold truncate max-w-[60%]">{title}</div>
        <button className="p-2 rounded-full hover:bg-gray-800 transition">
          <Download className="w-5 h-5 text-white" />
        </button>
      </header>

      {/* Viewport */}
      <div
        className={`flex-1 relative overflow-hidden flex items-center justify-center bg-[#121212] ${cursorStyle}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchMove={handleMouseMove}
        onTouchEnd={handleMouseUp}
      >
        <div
          ref={contentRef}
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
            transition: isDragging ? 'none' : 'transform 0.1s ease-out',
          }}
          className="flex items-center justify-center p-10"
        >
          {type === 'drawing' ? (
            // A3 Landscape Simulation
            <div
              className="bg-white shadow-2xl relative"
              style={{ width: '842px', height: '595px', padding: '40px' }}
            >
              <div className="border-4 border-black h-full flex flex-col relative">
                <div className="absolute top-0 right-0 border-l-2 border-b-2 border-black p-2 bg-yellow-50 text-black text-xs font-bold">
                  A3 LANDSCAPE - {title}
                </div>
                <img src={src} className="w-full h-full object-contain" alt="Drawing" />
              </div>
            </div>
          ) : (
            // @photoex A4 Portrait 2 Columns x 3 Rows Style
            <div
              className="bg-white shadow-2xl text-black flex flex-col box-border"
              style={{
                width: '794px', // A4 width @ 96dpi
                height: '1123px', // A4 height @ 96dpi
                padding: '40px',
                backgroundColor: 'white',
              }}
            >
              {/* Header */}
              <div className="mb-4 text-xl font-bold border-b-2 border-black pb-2 text-left">
                공사명: {details?.site || '현장명 미지정'}
              </div>

              {/* Grid: 2 Columns, 3 Rows */}
              <div className="flex-1 border-t-2 border-l-2 border-black grid grid-cols-2 grid-rows-3">
                {/* Render 6 cells. Fill the first one with data. */}
                {[0, 1, 2, 3, 4, 5].map(index => (
                  <div key={index} className="border-r-2 border-b-2 border-black flex flex-col p-3">
                    {index === 0 ? (
                      <>
                        {/* Photo Area */}
                        <div className="flex-1 flex items-center justify-center overflow-hidden bg-gray-50 mb-2 border border-gray-200">
                          <img
                            src={src}
                            className="max-w-full max-h-full object-contain"
                            alt="Work"
                          />
                        </div>
                        {/* Info Table */}
                        <div className="border border-black text-sm">
                          <div className="flex border-b border-black">
                            <div className="w-[80px] bg-gray-100 border-r border-black flex items-center justify-center font-bold py-1">
                              부재명
                            </div>
                            <div className="flex-1 flex items-center justify-center font-medium py-1">
                              {details?.member || '-'}
                            </div>
                          </div>
                          <div className="flex border-b border-black">
                            <div className="w-[80px] bg-gray-100 border-r border-black flex items-center justify-center font-bold py-1">
                              공 정
                            </div>
                            <div className="flex-1 flex items-center justify-center font-medium py-1">
                              {details?.process || '-'}
                            </div>
                          </div>
                          <div className="flex">
                            <div className="w-[80px] bg-gray-100 border-r border-black flex items-center justify-center font-bold py-1">
                              내 용
                            </div>
                            <div className="flex-1 flex items-center justify-center font-medium py-1">
                              {details?.content || '보수후'}
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Empty Placeholder */}
                        <div className="flex-1 mb-2"></div>
                        {/* Empty Info Table */}
                        <div className="border border-black text-sm opacity-30">
                          <div className="flex border-b border-black h-[29px]">
                            <div className="w-[80px] bg-gray-100 border-r border-black flex items-center justify-center font-bold">
                              부재명
                            </div>
                            <div className="flex-1"></div>
                          </div>
                          <div className="flex border-b border-black h-[29px]">
                            <div className="w-[80px] bg-gray-100 border-r border-black flex items-center justify-center font-bold">
                              공 정
                            </div>
                            <div className="flex-1"></div>
                          </div>
                          <div className="flex h-[29px]">
                            <div className="w-[80px] bg-gray-100 border-r border-black flex items-center justify-center font-bold">
                              내 용
                            </div>
                            <div className="flex-1"></div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-[#222] border border-[#333] rounded-full px-6 py-2 flex items-center gap-6 shadow-2xl z-50">
        <button
          onClick={() => handleZoom(-0.2)}
          className="flex flex-col items-center gap-1 opacity-70 hover:opacity-100 transition"
        >
          <ZoomOut className="w-5 h-5 text-white" />
          <span className="text-[10px] font-medium">축소</span>
        </button>

        <button
          onClick={() => setIsPanningMode(!isPanningMode)}
          className={`flex flex-col items-center gap-1 transition ${isPanningMode ? 'text-primary opacity-100' : 'text-white opacity-70 hover:opacity-100'}`}
        >
          <Hand className="w-5 h-5" />
          <span className="text-[10px] font-medium">이동</span>
        </button>

        <button
          onClick={() => handleZoom(0.2)}
          className="flex flex-col items-center gap-1 opacity-70 hover:opacity-100 transition"
        >
          <ZoomIn className="w-5 h-5 text-white" />
          <span className="text-[10px] font-medium">확대</span>
        </button>

        <button className="flex flex-col items-center gap-1 opacity-70 hover:opacity-100 transition">
          <Share2 className="w-5 h-5 text-white" />
          <span className="text-[10px] font-medium">공유</span>
        </button>
      </div>
    </div>
  )
}

export default PreviewModal
