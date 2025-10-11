'use client'

import React from 'react'
import { MaterialEntry } from '@/modules/mobile/hooks/use-worklog-mutations'

interface MaterialsInputProps {
  materials: MaterialEntry[]
  onChange: (next: MaterialEntry[]) => void
}

const defaultMaterial: MaterialEntry = {
  material_name: '',
  quantity: 0,
  unit: '개',
}

export const MaterialsInput: React.FC<MaterialsInputProps> = ({ materials, onChange }) => {
  const handleUpdate = (index: number, updates: Partial<MaterialEntry>) => {
    const next = materials.map((item, idx) => (idx === index ? { ...item, ...updates } : item))
    onChange(next)
  }

  const handleAdd = () => {
    onChange([...materials, { ...defaultMaterial }])
  }

  const handleRemove = (index: number) => {
    onChange(materials.filter((_, idx) => idx !== index))
  }

  return (
    <div className="form-section materials-section">
      <div className="section-header">
        <h3 className="section-title">자재 사용 내역</h3>
        <button className="add-btn" type="button" onClick={handleAdd}>
          추가
        </button>
      </div>

      {materials.length === 0 ? (
        <p className="materials-hint mt-2">사용한 자재가 있다면 추가 버튼을 눌러 입력해주세요.</p>
      ) : null}

      {materials.map((material, index) => (
        <div key={index} className="form-row material-row">
          <div className="form-group">
            <label className="form-label">자재명</label>
            <input
              type="text"
              className="form-input"
              value={material.material_name}
              onChange={event => handleUpdate(index, { material_name: event.target.value })}
              placeholder="예: 몰탈"
            />
          </div>
          <div className="form-group">
            <label className="form-label">수량</label>
            <input
              type="number"
              className="form-input"
              value={material.quantity}
              onChange={event => handleUpdate(index, { quantity: Number(event.target.value) })}
              min={0}
              step={0.5}
            />
          </div>
          <div className="form-group">
            <label className="form-label">단위</label>
            <input
              type="text"
              className="form-input"
              value={material.unit}
              onChange={event => handleUpdate(index, { unit: event.target.value })}
              placeholder="예: 포, 봉"
            />
          </div>
          <div className="form-group">
            <label className="form-label">비고</label>
            <input
              type="text"
              className="form-input"
              value={material.notes ?? ''}
              onChange={event => handleUpdate(index, { notes: event.target.value })}
              placeholder="선택 입력"
            />
          </div>
          <div className="form-group material-remove">
            <button className="delete-tag-btn" type="button" onClick={() => handleRemove(index)}>
              삭제
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

export default MaterialsInput
