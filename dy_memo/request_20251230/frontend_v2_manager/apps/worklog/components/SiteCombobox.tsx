import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Search, X } from 'lucide-react'
import { SITE_OPTIONS } from '../constants'

interface SiteComboboxProps {
  selectedSiteId: string
  onSelect: (siteId: string) => void
  className?: string
  options?: typeof SITE_OPTIONS // Allow passing specific options
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

  const sourceOptions = options || SITE_OPTIONS
  const selectedSite = sourceOptions.find(s => s.id === selectedSiteId)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredSites = sourceOptions.filter(site =>
    site.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className={`relative ${className}`} ref={wrapperRef}>
      <div
        className={`w-full h-[54px] bg-white border rounded-xl px-4 flex items-center justify-between cursor-pointer transition-all ${isOpen ? 'border-primary ring-1 ring-primary shadow-sm' : 'border-[#e2e8f0] hover:border-[#cbd5e1]'}`}
        onClick={() => {
          setIsOpen(!isOpen)
          if (!isOpen) setSearchTerm('')
        }}
      >
        <span
          className={`text-[17px] font-medium truncate pr-2 ${selectedSite ? 'text-text-main' : 'text-text-sub'}`}
        >
          {selectedSite ? selectedSite.name : placeholder}
        </span>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </div>

      {isOpen && (
        <div className="absolute top-[60px] left-0 right-0 bg-white border border-[#e2e8f0] rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in">
          <div className="p-2 border-b border-[#f1f5f9]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="현장 검색..."
                className="w-full h-10 bg-[#f8fafc] rounded-lg pl-9 pr-3 text-[15px] outline-none border border-transparent focus:border-primary focus:bg-white transition-colors"
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
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-200 rounded-full transition"
                >
                  <X className="w-3 h-3 text-gray-400" />
                </button>
              )}
            </div>
          </div>
          <div className="max-h-[240px] overflow-y-auto custom-scrollbar">
            {showAllOption && (
              <div
                className={`p-3 text-[16px] hover:bg-[#f1f5f9] cursor-pointer border-b border-dashed border-gray-100 ${selectedSiteId === 'all' ? 'text-primary font-bold bg-[#f8fafc]' : 'text-text-main'}`}
                onClick={() => {
                  onSelect('all')
                  setIsOpen(false)
                }}
              >
                전체 현장
              </div>
            )}
            {filteredSites.map(site => (
              <div
                key={site.id}
                className={`p-3 text-[16px] hover:bg-[#f1f5f9] cursor-pointer flex justify-between items-center ${selectedSiteId === site.id ? 'text-primary font-bold bg-[#f8fafc]' : 'text-text-main'}`}
                onClick={() => {
                  onSelect(site.id)
                  setIsOpen(false)
                }}
              >
                <span>{site.name}</span>
                {selectedSiteId === site.id && <div className="w-2 h-2 rounded-full bg-primary" />}
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
