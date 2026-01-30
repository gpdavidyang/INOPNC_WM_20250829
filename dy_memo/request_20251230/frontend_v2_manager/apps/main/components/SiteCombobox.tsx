import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Search, X } from 'lucide-react'
import { REGION_SITES } from '../constants'
import { Site } from '../types'

interface SiteComboboxProps {
  selectedSiteId: string
  onSelect: (siteId: string) => void
  className?: string
  options?: Site[] // Allow passing specific options
  showAllOption?: boolean // Toggle "All Sites" option
  placeholder?: string
}

const SiteCombobox: React.FC<SiteComboboxProps> = ({
  selectedSiteId,
  onSelect,
  className,
  options,
  showAllOption = true,
  placeholder = '전체 현장',
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Flatten all sites from regions or use provided options
  const sourceOptions = options || Object.values(REGION_SITES).flat()
  const selectedSite = sourceOptions.find((s: Site) => s.value === selectedSiteId)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredSites = sourceOptions.filter((site: Site) =>
    site.text.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className={`relative ${className}`} ref={wrapperRef}>
      <div
        className={`w-full h-[54px] bg-[var(--bg-surface)] border rounded-xl px-4 flex items-center justify-between cursor-pointer transition-all ${isOpen ? 'border-primary ring-1 ring-primary shadow-sm' : 'border-[var(--border)] hover:border-slate-300'}`}
        onClick={() => {
          setIsOpen(!isOpen)
          if (!isOpen) setSearchTerm('')
        }}
      >
        <span
          className={`text-[17px] font-medium truncate pr-2 ${selectedSite ? 'text-text-main' : 'text-text-sub'}`}
        >
          {selectedSite ? selectedSite.text : placeholder}
        </span>
        <ChevronDown
          className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </div>

      {isOpen && (
        <div className="absolute top-[60px] left-0 right-0 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in">
          <div className="p-2 border-b border-[var(--border)]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="현장 검색..."
                className="w-full h-10 bg-[var(--bg-input)] rounded-lg pl-9 pr-3 text-[15px] outline-none border border-transparent focus:border-primary focus:bg-[var(--bg-surface)] transition-colors"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                autoFocus
              />
              {searchTerm && (
                <button
                  onClick={e => {
                    e.stopPropagation()
                    setSearchTerm('')
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-[var(--bg-hover)] rounded-full transition"
                >
                  <X className="w-3 h-3 text-slate-400" />
                </button>
              )}
            </div>
          </div>
          <div className="max-h-[240px] overflow-y-auto custom-scrollbar">
            {showAllOption && (
              <div
                className={`p-3 text-[16px] hover:bg-[var(--bg-hover)] cursor-pointer border-b border-dashed border-[var(--border)] ${selectedSiteId === 'all' ? 'text-primary font-bold bg-[var(--bg-input)]' : 'text-text-main'}`}
                onClick={() => {
                  onSelect('all')
                  setIsOpen(false)
                }}
              >
                전체 현장
              </div>
            )}
            {filteredSites.map((site: Site) => (
              <div
                key={site.value}
                className={`p-3 text-[16px] hover:bg-[var(--bg-hover)] cursor-pointer flex justify-between items-center ${selectedSiteId === site.value ? 'text-primary font-bold bg-[var(--bg-input)]' : 'text-text-main'}`}
                onClick={() => {
                  onSelect(site.value)
                  setIsOpen(false)
                }}
              >
                <span>{site.text}</span>
                {selectedSiteId === site.value && (
                  <div className="w-2 h-2 rounded-full bg-primary" />
                )}
              </div>
            ))}
            {filteredSites.length === 0 && (
              <div className="p-6 text-center text-text-sub text-sm">검색 결과가 없습니다.</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default SiteCombobox
