import React from 'react'

interface DrawingModalProps {
  isOpen: boolean
  onClose: () => void
  imageSrc: string | null
  onSave: (dataUrl: string) => void
}

const DrawingModal: React.FC<DrawingModalProps> = ({ isOpen, onClose, imageSrc, onSave }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-6 max-w-[600px] w-full mx-4">
        <h2 className="text-xl font-bold mb-4">Drawing Modal</h2>
        <p className="text-gray-600 mb-4">Drawing modal placeholder</p>
        <button onClick={onClose} className="w-full h-[50px] bg-gray-200 rounded-xl font-bold">
          닫기
        </button>
      </div>
    </div>
  )
}

export default DrawingModal
