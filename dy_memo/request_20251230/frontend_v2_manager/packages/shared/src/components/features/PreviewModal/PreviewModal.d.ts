import React from 'react'
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
declare const PreviewModal: React.FC<PreviewModalProps>
export default PreviewModal
//# sourceMappingURL=PreviewModal.d.ts.map
