'use client'

import React from 'react'
import { WorkLogLocation } from '@/types/worklog'

interface LocationInputProps {
  location: WorkLogLocation
  onChange: (location: WorkLogLocation) => void
  className?: string
}

export const LocationInput: React.FC<LocationInputProps> = ({
  location,
  onChange,
  className = '',
}) => {
  const handleBlockChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().slice(0, 2)
    onChange({ ...location, block: value })
  }

  const handleDongChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.slice(0, 2)
    onChange({ ...location, dong: value })
  }

  const handleUnitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.slice(0, 4)
    onChange({ ...location, unit: value })
  }

  return (
    <div className={`location-input-container ${className}`}>
      <label className="form-label">블럭 / 동 / 층</label>
      <div className="location-input-grid">
        <div className="form-group">
          <input
            type="text"
            className="form-input location-field"
            placeholder="블럭"
            value={location.block}
            onChange={handleBlockChange}
            maxLength={2}
            style={{ textAlign: 'center' }}
          />
        </div>
        <div className="form-group">
          <input
            type="text"
            className="form-input location-field"
            placeholder="동"
            value={location.dong}
            onChange={handleDongChange}
            maxLength={2}
            style={{ textAlign: 'center' }}
          />
        </div>
        <div className="form-group">
          <input
            type="text"
            className="form-input location-field"
            placeholder="층"
            value={location.unit}
            onChange={handleUnitChange}
            maxLength={4}
            style={{ textAlign: 'center' }}
          />
        </div>
      </div>
    </div>
  )
}

export default LocationInput
