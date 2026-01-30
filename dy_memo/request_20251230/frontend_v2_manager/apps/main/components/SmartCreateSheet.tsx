import React, { useState } from 'react'
import { WorkLog } from '@inopnc/shared'
import { X, Calendar } from 'lucide-react'
import SiteCombobox from './SiteCombobox'

interface SmartCreateSheetProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (log: WorkLog) => void
  initialSiteId?: string
}

const SmartCreateSheet: React.FC<SmartCreateSheetProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialSiteId,
}) => {
  const [selectedSiteId, setSelectedSiteId] = useState(initialSiteId || '')
  const [workDate, setWorkDate] = useState(new Date().toISOString().slice(0, 10))

  const handleSubmit = () => {
    if (!selectedSiteId || !workDate) {
      alert('현장명과 작업일자를 입력해주세요.')
      return
    }

    const newLog: WorkLog = {
      id: Date.now(),
      siteId: selectedSiteId,
      site: '', // Will be filled by SiteCombobox
      affiliation: '본사',
      date: workDate,
      member: '',
      process: '',
      type: '',
      location: '',
      manpower: [],
      materials: [],
      photos: [],
      drawings: [],
      confirmationFiles: [],
      status: 'draft',
      isPinned: false,
    }

    onSubmit(newLog)
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-[2000] transition-opacity" onClick={onClose} />

      {/* Bottom Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 bg-[var(--bg-surface)] border-t border-[var(--border)] rounded-t-3xl z-[2001] max-w-[600px] mx-auto shadow-2xl transition-transform duration-300"
        style={{ animation: 'slideUp 0.3s ease-out' }}
      >
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-[22px] font-extrabold text-text-main">새 작업일지 등록</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[var(--bg-hover)] rounded-full transition"
            >
              <X className="w-6 h-6 text-text-sub" />
            </button>
          </div>

          {/* Site Selection */}
          <div className="mb-6">
            <label className="block text-[17px] font-bold text-text-sub mb-3">
              현장명 <span className="text-danger">*</span>
            </label>

            <SiteCombobox
              selectedSiteId={selectedSiteId}
              onSelect={setSelectedSiteId}
              showAllOption={false}
              placeholder="현장을 선택하세요"
            />
          </div>

          {/* Work Date */}
          <div className="mb-8">
            <label className="block text-[17px] font-bold text-text-sub mb-3">
              작업일자 <span className="text-danger">*</span>
            </label>
            <div className="relative">
              <input
                type="date"
                value={workDate}
                onChange={e => setWorkDate(e.target.value)}
                className="w-full h-[54px] bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl px-4 pr-12 text-[17px] font-medium outline-none focus:border-primary"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <Calendar size={20} />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            className="w-full h-[60px] bg-header-navy text-white text-[18px] font-bold rounded-xl shadow-lg active:scale-[0.98] transition-transform"
          >
            일지 생성하기
          </button>
        </div>
      </div>
    </>
  )
}

export default SmartCreateSheet
