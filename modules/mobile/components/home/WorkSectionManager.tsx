'use client'

import React from 'react'
import { WorkSection } from '@/types/worklog'
import LocationInput from './LocationInput'

interface WorkSectionManagerProps {
  sections: WorkSection[]
  onChange: (sections: WorkSection[]) => void
  className?: string
}

export const WorkSectionManager: React.FC<WorkSectionManagerProps> = ({
  sections,
  onChange,
  className = ''
}) => {
  const addSection = () => {
    const newSection: WorkSection = {
      id: `section_${Date.now()}`,
      type: '',
      name: '',
      location: { block: '', dong: '', unit: '' }
    }
    onChange([...sections, newSection])
  }

  const removeSection = (id: string) => {
    onChange(sections.filter(section => section.id !== id))
  }

  const updateSection = (id: string, updates: Partial<WorkSection>) => {
    onChange(sections.map(section => 
      section.id === id ? { ...section, ...updates } : section
    ))
  }

  return (
    <div className={`work-section-manager ${className}`}>
      <div className="section-header">
        <h3 className="section-title">작업구간</h3>
        <button 
          type="button"
          className="add-btn"
          onClick={addSection}
        >
          추가
        </button>
      </div>

      {sections.map((section) => (
        <div key={section.id} className="work-section-item">
          <div className="section-header">
            <h4 className="section-subtitle">작업구간</h4>
            <button
              type="button"
              className="delete-tag-btn"
              onClick={() => removeSection(section.id)}
            >
              삭제
            </button>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">작업 유형</label>
              <select
                className="form-select"
                value={section.type}
                onChange={(e) => updateSection(section.id, { type: e.target.value })}
              >
                <option value="">선택</option>
                <option value="concrete">콘크리트 타설</option>
                <option value="rebar">철근 작업</option>
                <option value="form">거푸집 작업</option>
                <option value="waterproof">방수 작업</option>
                <option value="finish">마감 작업</option>
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">작업명</label>
              <input
                type="text"
                className="form-input"
                placeholder="작업명 입력"
                value={section.name}
                onChange={(e) => updateSection(section.id, { name: e.target.value })}
              />
            </div>
          </div>

          <LocationInput
            location={section.location}
            onChange={(location) => updateSection(section.id, { location })}
          />
        </div>
      ))}

      {sections.length === 0 && (
        <div className="empty-state">
          <p className="text-muted">작업구간을 추가해주세요</p>
        </div>
      )}
    </div>
  )
}

export default WorkSectionManager