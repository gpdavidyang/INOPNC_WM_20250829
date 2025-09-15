'use client'

import React, { useState } from 'react'

export interface WorkTag {
  id: string
  tag: string
  description: string
}

interface WorkTagManagerProps {
  tags: WorkTag[]
  onChange: (tags: WorkTag[]) => void
  className?: string
}

// 미리 정의된 작업 태그 옵션들
const PREDEFINED_TAGS = [
  '콘크리트 타설',
  '철근 작업',
  '거푸집 설치',
  '방수 작업',
  '마감 작업',
  '도장 작업',
  '타일 작업',
  '배관 작업',
  '전기 작업',
  '단열 작업',
  '석고보드 작업',
  '용접 작업',
  '해체 작업',
  '청소',
  '기타'
]

export const WorkTagManager: React.FC<WorkTagManagerProps> = ({
  tags,
  onChange,
  className = ''
}) => {
  const [selectedTag, setSelectedTag] = useState('')
  const [customTag, setCustomTag] = useState('')
  const [description, setDescription] = useState('')
  const [isCustom, setIsCustom] = useState(false)

  const addTag = () => {
    const tagValue = isCustom ? customTag : selectedTag
    
    if (!tagValue) {
      return
    }

    // 중복 체크
    if (tags.some(t => t.tag === tagValue)) {
      alert('이미 추가된 작업 태그입니다.')
      return
    }

    const newTag: WorkTag = {
      id: `tag_${Date.now()}`,
      tag: tagValue,
      description: description
    }

    onChange([...tags, newTag])
    
    // 폼 초기화
    setSelectedTag('')
    setCustomTag('')
    setDescription('')
    setIsCustom(false)
  }

  const removeTag = (id: string) => {
    onChange(tags.filter(tag => tag.id !== id))
  }

  const updateTag = (id: string, updates: Partial<WorkTag>) => {
    onChange(tags.map(tag => 
      tag.id === id ? { ...tag, ...updates } : tag
    ))
  }

  return (
    <div className={`work-tag-manager ${className}`}>
      <div className="section-header mb-3">
        <h3 className="section-title">작업 태그</h3>
      </div>

      {/* 새 태그 추가 폼 */}
      <div className="tag-add-form mb-3">
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">작업 종류</label>
            <div className="tag-select-wrapper">
              <select
                className="form-select"
                value={isCustom ? 'custom' : selectedTag}
                onChange={(e) => {
                  if (e.target.value === 'custom') {
                    setIsCustom(true)
                    setSelectedTag('')
                  } else {
                    setIsCustom(false)
                    setSelectedTag(e.target.value)
                    setCustomTag('')
                  }
                }}
              >
                <option value="">선택</option>
                {PREDEFINED_TAGS.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
                <option value="custom">직접 입력</option>
              </select>
            </div>
          </div>
          
          {isCustom && (
            <div className="form-group">
              <label className="form-label">작업명</label>
              <input
                type="text"
                className="form-input"
                placeholder="작업명 입력"
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
              />
            </div>
          )}
        </div>

        <div className="form-group mb-3">
          <label className="form-label">상세 설명</label>
          <textarea
            className="form-input"
            rows={2}
            placeholder="작업 상세 내용을 입력하세요"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <button 
          type="button"
          className="add-btn"
          onClick={addTag}
          disabled={!isCustom && !selectedTag && !customTag}
        >
          작업 태그 추가
        </button>
      </div>

      {/* 추가된 태그 목록 */}
      <div className="added-tags-list">
        {tags.map((tag, index) => (
          <div key={tag.id} className="additional-work-row">
            <div className="section-header">
              <h4 className="section-subtitle">작업 {index + 1}</h4>
              <button
                type="button"
                className="delete-tag-btn"
                onClick={() => removeTag(tag.id)}
              >
                삭제
              </button>
            </div>
            
            <div className="tag-content">
              <div className="tag-name-display">
                <span className="work-action-tag">{tag.tag}</span>
              </div>
              
              <div className="form-group">
                <label className="form-label">상세 설명</label>
                <textarea
                  className="form-input"
                  rows={2}
                  placeholder="작업 상세 내용"
                  value={tag.description}
                  onChange={(e) => updateTag(tag.id, { description: e.target.value })}
                />
              </div>
            </div>
          </div>
        ))}

        {tags.length === 0 && (
          <div className="empty-state">
            <p className="text-muted">작업 태그를 추가해주세요</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default WorkTagManager