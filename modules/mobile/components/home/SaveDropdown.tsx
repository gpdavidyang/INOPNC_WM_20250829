'use client'

import React, { useState, useRef, useEffect } from 'react'
import { toast } from 'sonner'

interface SaveOption {
  id: string
  label: string
  type: 'shared' | 'local' | 'gallery' | 'temporary'
  icon: string
  description?: string
}

interface SaveDropdownProps {
  onSave: (type: SaveOption['type']) => Promise<void>
  disabled?: boolean
  isLoading?: boolean
}

export const SaveDropdown: React.FC<SaveDropdownProps> = ({
  onSave,
  disabled = false,
  isLoading = false,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [savingType, setSavingType] = useState<SaveOption['type'] | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const saveOptions: SaveOption[] = [
    {
      id: 'shared',
      label: '공유문서함에 저장',
      type: 'shared',
      icon: '🗂️',
      description: '팀원들과 공유할 수 있는 문서함에 저장합니다',
    },
    {
      id: 'local',
      label: '로컬에 다운로드',
      type: 'local',
      icon: '💾',
      description: '파일을 기기에 다운로드합니다',
    },
    {
      id: 'gallery',
      label: '사진첩에 저장',
      type: 'gallery',
      icon: '📱',
      description: '이미지를 사진첩에 저장합니다',
    },
    {
      id: 'temporary',
      label: '임시 저장',
      type: 'temporary',
      icon: '⏳',
      description: '브라우저에 임시로 저장합니다',
    },
  ]

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleSave = async (option: SaveOption) => {
    setSavingType(option.type)
    setIsOpen(false)

    try {
      await onSave(option.type)
      toast.success(`${option.label} 완료`)
    } catch (error) {
      console.error('Save error:', error)
      toast.error(`${option.label} 실패`)
    } finally {
      setSavingType(null)
    }
  }

  return (
    <div className="save-dropdown-container" ref={dropdownRef}>
      <button
        className={`btn btn-primary save-dropdown-trigger ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled || isLoading}
      >
        <span className="btn-icon">💾</span>
        <span className="btn-text">저장</span>
        <span className="dropdown-arrow">▼</span>
      </button>

      {isOpen && (
        <div className="save-dropdown-menu">
          {saveOptions.map(option => (
            <button
              key={option.id}
              className="save-dropdown-item"
              onClick={() => handleSave(option)}
              disabled={isLoading || savingType === option.type}
            >
              <span className="dropdown-item-icon">{option.icon}</span>
              <div className="dropdown-item-content">
                <span className="dropdown-item-label">{option.label}</span>
                {option.description && (
                  <span className="dropdown-item-description">{option.description}</span>
                )}
              </div>
              {savingType === option.type && <span className="dropdown-item-loading">⌛</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default SaveDropdown
