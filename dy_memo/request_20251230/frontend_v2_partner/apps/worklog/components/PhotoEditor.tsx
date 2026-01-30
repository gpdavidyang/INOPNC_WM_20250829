import React from 'react'
import { PhotoData } from '../types'

interface PhotoEditorProps {
  isOpen: boolean
  onClose: () => void
  initialData: PhotoData[]
  onUpdate: (newPhotos: PhotoData[]) => void
  meta: {
    site: string
    project: string
    member: string
    process: string
  }
}

const PhotoEditor: React.FC<PhotoEditorProps> = ({
  isOpen,
  onClose,
  initialData,
  onUpdate,
  meta,
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-6 max-w-[600px] w-full mx-4">
        <h2 className="text-xl font-bold mb-4">Photo Editor</h2>
        <p className="text-gray-600 mb-4">Photo editor placeholder</p>
        <button onClick={onClose} className="w-full h-[50px] bg-gray-200 rounded-xl font-bold">
          닫기
        </button>
      </div>
    </div>
  )
}

export default PhotoEditor
