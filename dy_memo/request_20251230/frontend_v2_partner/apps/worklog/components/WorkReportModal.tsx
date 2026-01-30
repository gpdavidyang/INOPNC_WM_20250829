import React from 'react'
import { ManpowerItem, WorkSet, MaterialItem } from '../types'

interface WorkReportModalProps {
  isOpen: boolean
  onClose: () => void
  siteName: string
  manpowerList: ManpowerItem[]
  workSets: WorkSet[]
  materials: MaterialItem[]
}

const WorkReportModal: React.FC<WorkReportModalProps> = ({
  isOpen,
  onClose,
  siteName,
  manpowerList,
  workSets,
  materials,
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-6 max-w-[600px] w-full mx-4">
        <h2 className="text-xl font-bold mb-4">Work Report</h2>
        <p className="text-gray-600 mb-4">Work report modal placeholder</p>
        <button onClick={onClose} className="w-full h-[50px] bg-gray-200 rounded-xl font-bold">
          닫기
        </button>
      </div>
    </div>
  )
}

export default WorkReportModal
