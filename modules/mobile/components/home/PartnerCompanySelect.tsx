'use client'

import React, { useState, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

interface PartnerCompany {
  id: string
  company_name: string
  company_type: string
  representative_name?: string
  contact_person?: string
}

interface PartnerCompanySelectProps {
  value: string
  onChange: (value: string) => void
  required?: boolean
}

export const PartnerCompanySelect: React.FC<PartnerCompanySelectProps> = ({
  value,
  onChange,
  required = false
}) => {
  const [partnerCompanies, setPartnerCompanies] = useState<PartnerCompany[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    fetchPartnerCompanies()
  }, [])

  const fetchPartnerCompanies = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/partner-companies')
      if (!response.ok) {
        throw new Error('파트너사 목록을 불러오는데 실패했습니다')
      }

      const result = await response.json()
      if (result.success) {
        setPartnerCompanies(result.data)
      } else {
        throw new Error(result.error || '파트너사 목록을 불러오는데 실패했습니다')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  const selectedCompany = partnerCompanies.find(company => company.id === value)

  const getCompanyTypeDisplay = (type: string) => {
    const typeMap: { [key: string]: string } = {
      'subcontractor': '하청업체',
      'supplier': '공급업체',
      'consultant': '컨설턴트',
      'partner': '파트너사'
    }
    return typeMap[type] || type
  }

  return (
    <div className="form-group">
      <label className="form-label">
        파트너사 {required && <span className="required">*</span>}
      </label>
      
      <div className="partner-select-container">
        <button
          type="button"
          className={`partner-select-trigger ${isOpen ? 'open' : ''} ${error ? 'error' : ''}`}
          onClick={() => setIsOpen(!isOpen)}
          disabled={loading}
        >
          <span className="partner-select-value">
            {loading ? (
              '로딩 중...'
            ) : selectedCompany ? (
              <>
                {selectedCompany.company_name}
                <span className="company-type">
                  ({getCompanyTypeDisplay(selectedCompany.company_type)})
                </span>
              </>
            ) : (
              '파트너사를 선택하세요'
            )}
          </span>
          <ChevronDown className={`partner-select-icon ${isOpen ? 'rotate' : ''}`} />
        </button>

        {isOpen && (
          <div className="partner-select-dropdown">
            {error ? (
              <div className="partner-select-error">
                {error}
                <button 
                  type="button" 
                  className="retry-btn"
                  onClick={fetchPartnerCompanies}
                >
                  다시 시도
                </button>
              </div>
            ) : partnerCompanies.length === 0 ? (
              <div className="partner-select-empty">
                등록된 파트너사가 없습니다
              </div>
            ) : (
              <div className="partner-select-options">
                {partnerCompanies.map((company) => (
                  <button
                    key={company.id}
                    type="button"
                    className={`partner-select-option ${value === company.id ? 'selected' : ''}`}
                    onClick={() => {
                      onChange(company.id)
                      setIsOpen(false)
                    }}
                  >
                    <div className="company-main">
                      {company.company_name}
                    </div>
                    <div className="company-details">
                      <span className="company-type-badge">
                        {getCompanyTypeDisplay(company.company_type)}
                      </span>
                      {company.representative_name && (
                        <span className="company-representative">
                          대표: {company.representative_name}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Overlay to close dropdown when clicking outside */}
      {isOpen && (
        <div 
          className="partner-select-overlay"
          onClick={() => setIsOpen(false)}
        />
      )}

      <style jsx>{`
        .partner-select-container {
          position: relative;
        }

        .partner-select-trigger {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          background: var(--surface);
          border: 1px solid var(--line);
          border-radius: 14px;
          font-size: 16px;
          color: var(--text);
          cursor: pointer;
          transition: all 0.2s ease;
          min-height: 48px;
        }

        .partner-select-trigger:hover {
          border-color: var(--tag-blue);
        }

        .partner-select-trigger.open {
          border-color: var(--tag-blue);
          border-bottom-left-radius: 4px;
          border-bottom-right-radius: 4px;
        }

        .partner-select-trigger.error {
          border-color: #ef4444;
        }

        .partner-select-trigger:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .partner-select-value {
          flex: 1;
          text-align: left;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .company-type {
          font-size: 14px;
          color: var(--muted-ink);
        }

        .partner-select-icon {
          width: 20px;
          height: 20px;
          transition: transform 0.2s ease;
          color: var(--muted-ink);
        }

        .partner-select-icon.rotate {
          transform: rotate(180deg);
        }

        .partner-select-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: var(--surface);
          border: 1px solid var(--tag-blue);
          border-top: none;
          border-radius: 0 0 14px 14px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          z-index: 1000;
          max-height: 300px;
          overflow-y: auto;
        }

        .partner-select-error {
          padding: 16px;
          text-align: center;
          color: #ef4444;
        }

        .retry-btn {
          margin-top: 8px;
          padding: 6px 12px;
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
        }

        .partner-select-empty {
          padding: 16px;
          text-align: center;
          color: var(--muted-ink);
        }

        .partner-select-options {
          max-height: 300px;
          overflow-y: auto;
        }

        .partner-select-option {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 12px 16px;
          background: transparent;
          border: none;
          border-bottom: 1px solid var(--line);
          cursor: pointer;
          transition: background 0.2s ease;
          text-align: left;
        }

        .partner-select-option:hover {
          background: var(--surface-2);
        }

        .partner-select-option.selected {
          background: var(--tag-blue-20);
          color: var(--tag-blue);
        }

        .partner-select-option:last-child {
          border-bottom: none;
        }

        .company-main {
          font-size: 16px;
          font-weight: 500;
          color: var(--text);
          margin-bottom: 4px;
        }

        .partner-select-option.selected .company-main {
          color: var(--tag-blue);
        }

        .company-details {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
        }

        .company-type-badge {
          padding: 2px 6px;
          background: var(--tag-blue-20);
          color: var(--tag-blue);
          border-radius: 4px;
          font-weight: 500;
        }

        .company-representative {
          color: var(--muted-ink);
        }

        .partner-select-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 999;
        }

        .required {
          color: #ef4444;
        }

        /* 다크모드 지원 */
        [data-theme='dark'] .partner-select-dropdown {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }
      `}</style>
    </div>
  )
}