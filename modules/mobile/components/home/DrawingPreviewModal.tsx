'use client'

import React, { useState, useRef, useEffect } from 'react'
import { toast } from 'sonner'

interface DrawingPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  imageUrl: string
  title: string
  markupData?: any[]
  onShare?: () => void
}

export const DrawingPreviewModal: React.FC<DrawingPreviewModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  title,
  markupData,
  onShare,
}) => {
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [showControls, setShowControls] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const controlsTimeoutRef = useRef<NodeJS.Timeout>()

  // 줌 레벨 옵션
  const zoomLevels = [0.5, 0.75, 1, 1.5, 2, 3]

  // 컨트롤 자동 숨김
  useEffect(() => {
    if (showControls) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false)
      }, 3000)
    }

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
    }
  }, [showControls])

  // 줌 핸들러
  const handleZoom = (newScale: number) => {
    setScale(newScale)
    setPosition({ x: 0, y: 0 }) // 줌 시 중앙으로 리셋
    setShowControls(true)
  }

  const handleZoomIn = () => {
    const currentIndex = zoomLevels.findIndex(level => level >= scale)
    if (currentIndex < zoomLevels.length - 1) {
      handleZoom(zoomLevels[currentIndex + 1])
    }
  }

  const handleZoomOut = () => {
    const currentIndex = zoomLevels.findIndex(level => level >= scale)
    if (currentIndex > 0) {
      handleZoom(zoomLevels[currentIndex - 1])
    }
  }

  const handleFitToScreen = () => {
    if (!containerRef.current || !imageRef.current) return

    const container = containerRef.current.getBoundingClientRect()
    const image = imageRef.current

    const scaleX = container.width / image.naturalWidth
    const scaleY = container.height / image.naturalHeight
    const newScale = Math.min(scaleX, scaleY) * 0.9 // 90% 여백

    handleZoom(newScale)
  }

  // 드래그 핸들러
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true)
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      })
    }
    setShowControls(true)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // 터치 이벤트 핸들러
  const handleTouchStart = (e: React.TouchEvent) => {
    if (scale > 1 && e.touches.length === 1) {
      setIsDragging(true)
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      })
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging && e.touches.length === 1) {
      setPosition({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y,
      })
    }
    setShowControls(true)
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
  }

  // 키보드 단축키
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      switch (e.key) {
        case 'Escape':
          onClose()
          break
        case '+':
        case '=':
          handleZoomIn()
          break
        case '-':
        case '_':
          handleZoomOut()
          break
        case '0':
          handleFitToScreen()
          break
        case 'ArrowLeft':
          setPosition(prev => ({ ...prev, x: prev.x + 50 }))
          break
        case 'ArrowRight':
          setPosition(prev => ({ ...prev, x: prev.x - 50 }))
          break
        case 'ArrowUp':
          setPosition(prev => ({ ...prev, y: prev.y + 50 }))
          break
        case 'ArrowDown':
          setPosition(prev => ({ ...prev, y: prev.y - 50 }))
          break
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, scale])

  // 마크업 렌더링
  const renderMarkup = () => {
    if (!markupData || markupData.length === 0) return null

    return (
      <svg
        className="preview-markup-layer"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
      >
        {markupData.map((mark, index) => {
          if (mark.type === 'circle') {
            return (
              <circle
                key={index}
                cx={mark.x}
                cy={mark.y}
                r={mark.radius || 20}
                fill="none"
                stroke={mark.color || 'red'}
                strokeWidth="2"
              />
            )
          } else if (mark.type === 'rectangle') {
            return (
              <rect
                key={index}
                x={mark.x}
                y={mark.y}
                width={mark.width}
                height={mark.height}
                fill="none"
                stroke={mark.color || 'blue'}
                strokeWidth="2"
              />
            )
          } else if (mark.type === 'text') {
            return (
              <text key={index} x={mark.x} y={mark.y} fill={mark.color || 'black'} fontSize="16">
                {mark.text}
              </text>
            )
          }
          return null
        })}
      </svg>
    )
  }

  if (!isOpen) return null

  return (
    <div className="preview-modal-overlay">
      <div className="preview-modal-container">
        {/* 헤더 */}
        <div className={`preview-modal-header ${showControls ? 'visible' : ''}`}>
          <h3 className="preview-title">{title}</h3>
          <div className="preview-header-actions">
            {onShare && (
              <button className="preview-action-btn" onClick={onShare} title="공유">
                <span className="action-icon">🔗</span>
              </button>
            )}
            <button className="preview-action-btn preview-close-btn" onClick={onClose} title="닫기">
              <span className="action-icon">✕</span>
            </button>
          </div>
        </div>

        {/* 이미지 뷰어 */}
        <div
          ref={containerRef}
          className="preview-viewport"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ cursor: isDragging ? 'grabbing' : scale > 1 ? 'grab' : 'default' }}
        >
          <div
            className="preview-image-wrapper"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              transition: isDragging ? 'none' : 'transform 0.3s ease',
            }}
          >
            <img
              ref={imageRef}
              src={imageUrl}
              alt={title}
              className="preview-image"
              draggable={false}
            />
            {renderMarkup()}
          </div>
        </div>

        {/* 줌 컨트롤 */}
        <div className={`preview-controls ${showControls ? 'visible' : ''}`}>
          <div className="zoom-controls">
            <button
              className="zoom-btn"
              onClick={handleZoomOut}
              disabled={scale <= zoomLevels[0]}
              title="축소 (-)"
            >
              <span>−</span>
            </button>

            <div className="zoom-indicator">
              <span>{Math.round(scale * 100)}%</span>
            </div>

            <button
              className="zoom-btn"
              onClick={handleZoomIn}
              disabled={scale >= zoomLevels[zoomLevels.length - 1]}
              title="확대 (+)"
            >
              <span>+</span>
            </button>

            <button className="zoom-btn fit-btn" onClick={handleFitToScreen} title="화면 맞춤 (0)">
              <span>⊡</span>
            </button>
          </div>

          {/* 줌 프리셋 */}
          <div className="zoom-presets">
            {zoomLevels.map(level => (
              <button
                key={level}
                className={`preset-btn ${Math.abs(scale - level) < 0.01 ? 'active' : ''}`}
                onClick={() => handleZoom(level)}
              >
                {Math.round(level * 100)}%
              </button>
            ))}
          </div>
        </div>

        {/* 키보드 단축키 안내 */}
        <div className={`preview-shortcuts ${showControls ? 'visible' : ''}`}>
          <span className="shortcut-item">ESC: 닫기</span>
          <span className="shortcut-item">+/-: 줌</span>
          <span className="shortcut-item">0: 화면맞춤</span>
          <span className="shortcut-item">방향키: 이동</span>
        </div>
      </div>
    </div>
  )
}

export default DrawingPreviewModal
