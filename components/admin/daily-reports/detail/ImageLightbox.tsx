'use client'

import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import Image from 'next/image'

interface ImageLightboxProps {
  previewImage: string | null
  onClose: () => void
}

export function ImageLightbox({ previewImage, onClose }: ImageLightboxProps) {
  if (!previewImage) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div className="relative h-full w-full max-w-5xl">
        <Button
          variant="ghost"
          size="sm"
          className="absolute -top-10 right-0 text-white hover:bg-white/20"
          onClick={onClose}
        >
          <X className="mr-2 h-4 w-4" />
          닫기
        </Button>
        <div className="relative h-full w-full">
          <Image src={previewImage} alt="Preview" fill className="object-contain" unoptimized />
        </div>
      </div>
    </div>
  )
}
