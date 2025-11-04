'use client'

import React from 'react'
import { AdditionalManpower as AdditionalManpowerType, MANPOWER_VALUES } from '@/types/worklog'
import NumberInput from './NumberInput'

interface AdditionalManpowerProps {
  items: AdditionalManpowerType[]
  onChange: (items: AdditionalManpowerType[]) => void
  className?: string
}

// 작업자 목록 (실제로는 API에서 가져와야 함)
const WORKERS = [
  { id: 'worker1', name: '김작업' },
  { id: 'worker2', name: '이작업' },
  { id: 'worker3', name: '박작업' },
  { id: 'worker4', name: '최작업' },
  { id: 'worker5', name: '정작업' },
]

export const AdditionalManpower: React.FC<AdditionalManpowerProps> = ({
  items,
  onChange,
  className = '',
}) => {
  const addManpower = () => {
    const newItem: AdditionalManpowerType = {
      id: `manpower_${Date.now()}`,
      workerId: '',
      workerName: '',
      manpower: 1,
    }
    onChange([...items, newItem])
  }

  const removeManpower = (id: string) => {
    onChange(items.filter(item => item.id !== id))
  }

  const updateManpower = (id: string, updates: Partial<AdditionalManpowerType>) => {
    onChange(
      items.map(item => {
        if (item.id === id) {
          // 작업자 선택 시 이름도 함께 업데이트
          if (updates.workerId) {
            const worker = WORKERS.find(w => w.id === updates.workerId)
            return {
              ...item,
              ...updates,
              workerName: worker?.name || '',
            }
          }
          return { ...item, ...updates }
        }
        return item
      })
    )
  }

  // 전체 공수 계산
  const totalManpower = items.reduce((sum, item) => sum + item.manpower, 0)

  return (
    <div className={`additional-manpower-container ${className}`}>
      <div className="section-header">
        <h3 className="section-title">
          추가 공수
          {items.length > 0 && <span className="total-badge">합계: {totalManpower}일</span>}
        </h3>
        <button type="button" className="add-btn" onClick={addManpower}>
          추가
        </button>
      </div>

      {items.map(item => (
        <div key={item.id} className="additional-manpower-row" data-row-id={item.id}>
          <div className="section-header">
            <h4 className="section-subtitle">공수(일)</h4>
            <button
              type="button"
              className="delete-tag-btn"
              onClick={() => removeManpower(item.id)}
            >
              삭제
            </button>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">작성자</label>
              <select
                className="form-select author-select"
                value={item.workerId}
                onChange={e => updateManpower(item.id, { workerId: e.target.value })}
              >
                <option value="">작성자 선택</option>
                {WORKERS.map(worker => (
                  <option key={worker.id} value={worker.id}>
                    {worker.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <NumberInput
                label="공수"
                value={item.manpower}
                onChange={value => updateManpower(item.id, { manpower: value })}
                values={Array.from(MANPOWER_VALUES)}
              />
            </div>
          </div>
        </div>
      ))}

      {items.length === 0 && (
        <div className="empty-state">
          <p className="text-muted">추가 공수를 입력해주세요</p>
        </div>
      )}
    </div>
  )
}

export default AdditionalManpower
