import React from 'react'
import { PhotoData } from '../../../types'
interface PhotoEditorProps {
  isOpen: boolean
  onClose: () => void
  initialData: PhotoData[]
  onUpdate: (data: PhotoData[]) => void
  meta: {
    site: string
    project: string
    member: string
    process: string
  }
}
declare const PhotoEditor: React.FC<PhotoEditorProps>
export default PhotoEditor
//# sourceMappingURL=PhotoEditor.d.ts.map
