import React from 'react'
import { ManpowerItem, WorkSet, MaterialItem } from '../../../types'
interface WorkReportModalProps {
  isOpen: boolean
  onClose: () => void
  siteName: string
  manpowerList: ManpowerItem[]
  workSets: WorkSet[]
  materials: MaterialItem[]
}
declare const WorkReportModal: React.FC<WorkReportModalProps>
export default WorkReportModal
//# sourceMappingURL=WorkReportModal.d.ts.map
