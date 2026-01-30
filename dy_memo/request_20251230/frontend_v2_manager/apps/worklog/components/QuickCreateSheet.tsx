import React, { useState, useEffect } from 'react'
import { X, Calendar, MapPin, Building2, HardHat, User, ArrowRight } from 'lucide-react'
import { WorkLog } from '@inopnc/shared'
import { SITE_OPTIONS } from '../constants'

interface QuickCreateSheetProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (newLog: WorkLog) => void
  initialSiteId: string
}

const QuickCreateSheet: React.FC<QuickCreateSheetProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialSiteId,
}) => {
  const [formData, setFormData] = useState({
    siteId: initialSiteId === 'all' ? '' : initialSiteId,
    date: new Date().toISOString().split('T')[0],
    affiliation: '본사',
    type: '내부 마감',
    process: '',
    member: '',
    location: '',
  })

  if (!isOpen) return null

  const handleSubmit = () => {
    if (!formData.siteId) return alert('현장을 선택해주세요.')
    if (!formData.process) return alert('공정명을 입력해주세요.')
    if (!formData.member) return alert('부재명을 입력해주세요.')

    const selectedSite = SITE_OPTIONS.find(s => s.id === formData.siteId)

    const newLog: WorkLog = {
      id: Date.now(),
      site: selectedSite ? selectedSite.name : '기타 현장',
      siteId: formData.siteId,
      date: formData.date,
      status: 'draft',
      affiliation: formData.affiliation,
      member: formData.member,
      process: formData.process,
      type: formData.type,
      location: formData.location,
      manpower: [],
      materials: [],
      photos: [],
      drawings: [],
      confirmationFiles: [],
      isDirect: true,
      isPinned: false,
    }

    onSubmit(newLog)
  }

  return (
    <div
      className="fixed inset-0 z-[3000] flex items-end justify-center bg-black/50 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[600px] bg-white rounded-t-3xl p-6 animate-slide-up flex flex-col max-h-[90vh] overflow-y-auto no-scrollbar"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6 sticky top-0 bg-white z-10 pb-2 border-b border-gray-100">
          <h3 className="text-xl font-black text-header-navy">작업일지 간편 등록</h3>
          <button onClick={onClose} className="p-1 -mr-1">
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Info Text */}
        <div className="mb-5 bg-blue-50 border border-blue-100 rounded-xl p-3.5 flex gap-3 items-start">
          <div className="mt-0.5 w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center shrink-0 text-blue-600 font-bold text-xs">
            i
          </div>
          <div className="text-[14px] text-blue-800 font-medium">
            필수 정보만 입력하여 일지를 생성합니다.
            <br />
            <span className="text-blue-600 font-bold">
              사진, 도면 등은 생성 후 등록할 수 있습니다.
            </span>
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-4 mb-8">
          {/* Site */}
          <div>
            <label className="block text-[14px] font-bold text-text-sub mb-1.5 flex items-center gap-1.5">
              <Building2 className="w-4 h-4" /> 현장 선택
            </label>
            <select
              className="w-full h-[52px] px-4 rounded-xl border border-[#e2e8f0] bg-white text-[16px] font-medium focus:border-primary outline-none appearance-none"
              value={formData.siteId}
              onChange={e => setFormData({ ...formData, siteId: e.target.value })}
            >
              <option value="" disabled>
                현장을 선택하세요
              </option>
              {SITE_OPTIONS.map(site => (
                <option key={site.id} value={site.id}>
                  {site.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="block text-[14px] font-bold text-text-sub mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-4 h-4" /> 작업 일자
            </label>
            <input
              type="date"
              className="w-full h-[52px] px-4 rounded-xl border border-[#e2e8f0] bg-white text-[16px] font-medium focus:border-primary outline-none"
              value={formData.date}
              onChange={e => setFormData({ ...formData, date: e.target.value })}
            />
          </div>

          {/* Row: Type & Affiliation */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-[14px] font-bold text-text-sub mb-1.5">소속</label>
              <input
                type="text"
                className="w-full h-[52px] px-4 rounded-xl border border-[#e2e8f0] bg-white text-[16px] font-medium focus:border-primary outline-none placeholder:text-gray-300"
                placeholder="예: 본사"
                value={formData.affiliation}
                onChange={e => setFormData({ ...formData, affiliation: e.target.value })}
              />
            </div>
            <div className="flex-1">
              <label className="block text-[14px] font-bold text-text-sub mb-1.5">작업유형</label>
              <input
                type="text"
                className="w-full h-[52px] px-4 rounded-xl border border-[#e2e8f0] bg-white text-[16px] font-medium focus:border-primary outline-none placeholder:text-gray-300"
                placeholder="예: 마감"
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value })}
              />
            </div>
          </div>

          {/* Process */}
          <div>
            <label className="block text-[14px] font-bold text-text-sub mb-1.5 flex items-center gap-1.5">
              <HardHat className="w-4 h-4" /> 공정명
            </label>
            <input
              type="text"
              className="w-full h-[52px] px-4 rounded-xl border border-[#e2e8f0] bg-white text-[16px] font-medium focus:border-primary outline-none placeholder:text-gray-300"
              placeholder="예: 타일 줄눈 작업"
              value={formData.process}
              onChange={e => setFormData({ ...formData, process: e.target.value })}
            />
          </div>

          {/* Row: Member & Location */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-[14px] font-bold text-text-sub mb-1.5">부재명</label>
              <input
                type="text"
                className="w-full h-[52px] px-4 rounded-xl border border-[#e2e8f0] bg-white text-[16px] font-medium focus:border-primary outline-none placeholder:text-gray-300"
                placeholder="예: 101동"
                value={formData.member}
                onChange={e => setFormData({ ...formData, member: e.target.value })}
              />
            </div>
            <div className="flex-1">
              <label className="block text-[14px] font-bold text-text-sub mb-1.5 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> 위치
              </label>
              <input
                type="text"
                className="w-full h-[52px] px-4 rounded-xl border border-[#e2e8f0] bg-white text-[16px] font-medium focus:border-primary outline-none placeholder:text-gray-300"
                placeholder="예: 101호"
                value={formData.location}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          className="w-full h-[56px] bg-header-navy text-white rounded-xl text-[17px] font-bold flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition mt-auto shadow-lg shadow-blue-900/10"
        >
          일지 생성하기 <ArrowRight className="w-5 h-5" />
        </button>
        <div className="h-[env(safe-area-inset-bottom)]" />
      </div>
    </div>
  )
}

export default QuickCreateSheet
