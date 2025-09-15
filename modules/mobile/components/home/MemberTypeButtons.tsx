'use client'

import React from 'react'
import { MEMBER_TYPES } from '@/types/worklog'

interface MemberTypeButtonsProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

export const MemberTypeButtons: React.FC<MemberTypeButtonsProps> = ({
  value,
  onChange,
  className = ''
}) => {
  return (
    <div className={`member-type-container ${className}`}>
      <label className="form-label">부재명</label>
      <div className="button-group">
        {MEMBER_TYPES.map((type) => (
          <button
            key={type.value}
            type="button"
            className={`option-btn ${value === type.value ? 'active' : ''}`}
            onClick={() => onChange(type.value)}
            data-value={type.value}
          >
            {type.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default MemberTypeButtons