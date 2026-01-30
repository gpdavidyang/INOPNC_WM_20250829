import React from 'react'
interface DrawingModalProps {
  isOpen: boolean
  onClose: () => void
  imageSrc: string | null
  onSave: (dataUrl: string) => void
}
declare const DrawingModal: React.FC<DrawingModalProps>
export default DrawingModal
//# sourceMappingURL=DrawingModal.d.ts.map
