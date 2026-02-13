'use client'

import { ChevronDown, MapPin } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'
import './work-form.css'

export interface SiteOption {
  value: string
  text: string
  dept: string
}

interface WorkLogInputsProps {
  sites: SiteOption[]
  selectedSiteId: string
  onSiteChange: (site: SiteOption) => void
  workDate: string
  onDateChange: (date: string) => void
  disabled?: boolean
}

export const WorkLogInputs: React.FC<WorkLogInputsProps> = ({
  sites,
  selectedSiteId,
  onSiteChange,
  workDate,
  onDateChange,
  disabled = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedSite = sites.find(s => s.value === selectedSiteId)

  // Initialize search term with selected site name if exists
  useEffect(() => {
    if (selectedSite) {
      setSearchTerm(selectedSite.text)
    }
  }, [selectedSite])

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredSites = sites.filter(site =>
    site.text.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSiteSelect = (site: SiteOption) => {
    if (disabled) return
    onSiteChange(site)
    setSearchTerm(site.text)
    setIsDropdownOpen(false)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Site Selection Card */}
      <div
        className="rounded-2xl p-6 shadow-sm border border-transparent dark:border-slate-700"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
        }}
      >
        <div className="flex justify-between items-center mb-3">
          <div
            className="text-xl font-bold flex items-center gap-2"
            style={{ color: 'var(--header-navy)' }}
          >
            <MapPin className="w-5 h-5" style={{ color: 'var(--header-navy)' }} />
            작업현장 <span style={{ color: 'var(--danger)' }}>*</span>
          </div>
          <span className="bg-red-50 text-red-500 text-[13px] font-bold h-8 px-3.5 rounded-xl flex items-center">
            * 필수 입력
          </span>
        </div>

        <div className="mb-3" ref={dropdownRef}>
          <div className="relative">
            <input
              type="text"
              placeholder={
                disabled ? (selectedSite ? selectedSite.text : '현장 선택') : '현장 선택 또는 검색'
              }
              readOnly={disabled}
              className={`site-search-optimized w-full h-[54px] bg-bg-input dark:bg-slate-900 border border-border dark:border-slate-600 rounded-xl px-4 text-[17px] font-medium outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 ${disabled ? 'cursor-not-allowed text-text-sub opacity-75' : ''}`}
              style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border)',
              }}
              value={searchTerm}
              onChange={e => {
                if (disabled) return
                setSearchTerm(e.target.value)
                setIsDropdownOpen(true)
              }}
              onFocus={() => {
                if (!disabled) setIsDropdownOpen(true)
              }}
            />
            <button
              disabled={disabled}
              onClick={() => {
                if (!disabled) setIsDropdownOpen(!isDropdownOpen)
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronDown className="w-5 h-5" />
            </button>

            {isDropdownOpen && (
              <ul
                className="site-dropdown-optimized absolute z-50 w-full mt-1.5 max-h-60 overflow-auto rounded-xl shadow-xl"
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                }}
              >
                {filteredSites.length > 0 ? (
                  filteredSites.map(site => (
                    <li
                      key={site.value}
                      onClick={() => handleSiteSelect(site)}
                      className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer flex justify-between items-center border-b border-slate-100 last:border-0"
                    >
                      <span className="font-medium text-[15px]">{site.text}</span>
                      <span className="text-xs text-slate-400">{site.dept}</span>
                    </li>
                  ))
                ) : (
                  <li className="px-4 py-3 text-slate-400 text-center text-sm">
                    검색 결과가 없습니다
                  </li>
                )}
              </ul>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              className="block text-[15px] font-bold text-text-sub mb-2"
              style={{ color: 'var(--text-sub)' }}
            >
              소속 <span className="text-[14px] font-medium ml-1">ㅣ 자동연동</span>
            </label>
            <div className="relative">
              <input
                type="text"
                readOnly
                placeholder="자동연동"
                value={selectedSite ? selectedSite.dept : ''}
                className="w-full h-[54px] bg-slate-100 dark:bg-slate-800 border border-border dark:border-slate-600 rounded-xl px-4 text-[17px] font-medium text-text-sub cursor-not-allowed"
                style={{
                  background: '#f1f5f9',
                  border: '1px solid var(--border)',
                  color: 'var(--text-sub)',
                }}
              />
            </div>
          </div>
          <div>
            <label
              className="block text-[15px] font-bold text-text-sub mb-2"
              style={{ color: 'var(--text-sub)' }}
            >
              작업일자
            </label>
            <div className="relative">
              <input
                type="date"
                value={workDate}
                disabled={disabled}
                onChange={e => !disabled && onDateChange(e.target.value)}
                className={`w-full h-[54px] bg-bg-input dark:bg-slate-900 border border-border dark:border-slate-600 rounded-xl px-3 sm:px-4 text-[15px] sm:text-[17px] font-medium outline-none focus:border-[#87CEEB] focus:ring-2 focus:ring-[#87CEEB]/20 transition-all cursor-pointer ${disabled ? 'cursor-not-allowed opacity-75' : ''}`}
                style={{
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border)',
                  position: 'relative',
                  zIndex: 1,
                  fontFamily: 'var(--font-main)',
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
