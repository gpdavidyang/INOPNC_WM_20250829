'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { X, ChevronLeft, ChevronRight, Download, Share, RotateCw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Photo {
  id?: string
  file_url: string
  description?: string
  file_name?: string
}

interface PhotoViewerModalProps {
  photos: Photo[]
  initialIndex: number
  isOpen: boolean
  onClose: () => void
  title?: string
}

export default function PhotoViewerModal({ 
  photos, 
  initialIndex, 
  isOpen, 
  onClose, 
  title = "사진 보기" 
}: PhotoViewerModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [rotation, setRotation] = useState(0)
  const [isZoomed, setIsZoomed] = useState(false)

  if (!isOpen || !photos || photos.length === 0) return null

  const currentPhoto = photos[currentIndex]

  const nextPhoto = () => {
    setCurrentIndex((prev) => (prev + 1) % photos.length)
    setRotation(0)
    setIsZoomed(false)
  }

  const prevPhoto = () => {
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length)
    setRotation(0)
    setIsZoomed(false)
  }

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360)
  }

  const handleDownload = async () => {
    try {
      const response = await fetch(currentPhoto.file_url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = currentPhoto.file_name || `photo-${currentIndex + 1}.jpg`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Download failed:', error)
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: currentPhoto.description || '작업 사진',
          text: currentPhoto.description || '작업 사진을 공유합니다',
          url: currentPhoto.file_url
        })
      } catch (error) {
        console.error('Share failed:', error)
      }
    } else {
      // Fallback: copy URL to clipboard
      navigator.clipboard.writeText(currentPhoto.file_url)
      alert('사진 URL이 클립보드에 복사되었습니다')
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/80">
        <div>
          <h2 className="text-white font-semibold text-lg">{title}</h2>
          <p className="text-gray-300 text-sm">
            {currentIndex + 1} / {photos.length}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRotate}
            className="text-white hover:bg-white/20"
          >
            <RotateCw className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            className="text-white hover:bg-white/20"
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShare}
            className="text-white hover:bg-white/20"
          >
            <Share className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Photo Area */}
      <div className="flex-1 relative flex items-center justify-center p-4">
        {/* Navigation Buttons */}
        {photos.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="lg"
              onClick={prevPhoto}
              className="absolute left-4 z-10 text-white hover:bg-white/20 h-12 w-12 rounded-full"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <Button
              variant="ghost"
              size="lg"
              onClick={nextPhoto}
              className="absolute right-4 z-10 text-white hover:bg-white/20 h-12 w-12 rounded-full"
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </>
        )}

        {/* Photo Display */}
        <div 
          className={cn(
            "relative max-w-full max-h-full transition-transform duration-300",
            isZoomed ? "cursor-zoom-out" : "cursor-zoom-in"
          )}
          onClick={() => setIsZoomed(!isZoomed)}
        >
          <img
            src={currentPhoto.file_url}
            alt={currentPhoto.description || `사진 ${currentIndex + 1}`}
            className={cn(
              "max-w-full max-h-full object-contain transition-transform duration-300",
              isZoomed ? "scale-150" : "scale-100"
            )}
            style={{ 
              transform: `rotate(${rotation}deg) ${isZoomed ? 'scale(1.5)' : 'scale(1)'}`,
              maxWidth: '90vw',
              maxHeight: '70vh'
            }}
          />
        </div>
      </div>

      {/* Bottom Info */}
      {currentPhoto.description && (
        <div className="p-4 bg-black/80">
          <p className="text-white text-sm text-center">
            {currentPhoto.description}
          </p>
        </div>
      )}

      {/* Photo Thumbnails */}
      {photos.length > 1 && (
        <div className="p-4 bg-black/80">
          <div className="flex gap-2 justify-center overflow-x-auto">
            {photos.map((photo, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentIndex(index)
                  setRotation(0)
                  setIsZoomed(false)
                }}
                className={cn(
                  "flex-shrink-0 w-12 h-12 rounded border-2 overflow-hidden transition-all",
                  index === currentIndex 
                    ? "border-blue-400 opacity-100" 
                    : "border-gray-600 opacity-60 hover:opacity-80"
                )}
              >
                <img
                  src={photo.file_url}
                  alt={`썸네일 ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}