'use client'

import React, { useState, useEffect } from 'react'
import {
  CustomSelect,
  CustomSelectContent,
  CustomSelectItem,
  CustomSelectTrigger,
  CustomSelectValue,
} from '@/components/ui/custom-select'

interface Partner {
  id: string
  company_name: string
}

interface DepartmentSelectProps {
  value: string
  onChange: (value: string) => void
  className?: string
  required?: boolean
}

export const DepartmentSelect: React.FC<DepartmentSelectProps> = ({
  value,
  onChange,
  className = '',
  required = false,
}) => {
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPartners = async () => {
      try {
        setLoading(true)
        setError(null)

        // Use direct API call instead of Supabase client
        console.log('Fetching companies via API...')

        const response = await fetch('/api/partner-companies?scope=construction')

        if (!response.ok) {
          throw new Error(`API Error: ${response.status}`)
        }

        const result = await response.json()
        console.log('Companies API response:', result)

        if (result.error) {
          console.error('업체 조회 실패:', result.error)
          setError('업체(시공/공급) 목록을 불러올 수 없습니다.')
          setPartners([])
        } else {
          const activePartners = (result.data || [])
            .filter((p: any) => p.status === 'active')
            .sort((a: any, b: any) => a.company_name.localeCompare(b.company_name))

          console.log('Setting companies:', activePartners.length, 'active companies')
          setPartners(activePartners)
        }
      } catch (err) {
        console.error('업체 조회 오류:', err)
        setError('업체(시공/공급) 목록을 불러올 수 없습니다.')
        setPartners([])
      } finally {
        setLoading(false)
      }
    }

    fetchPartners()
  }, [])

  return (
    <div className={`form-group department-select-container ${className}`}>
      <label className="form-label">소속 {required && <span className="required">*</span>}</label>
      <CustomSelect
        value={value}
        onValueChange={onChange}
        disabled={loading || partners.length === 0}
      >
        <CustomSelectTrigger className="form-select">
          <CustomSelectValue
            placeholder={
              loading
                ? '로딩 중...'
                : error
                  ? '소속 선택 불가'
                  : partners.length === 0
                    ? '소속 데이터 없음'
                    : '소속 선택'
            }
          />
        </CustomSelectTrigger>
        <CustomSelectContent>
          {partners.length > 0 ? (
            partners.map(partner => (
              <CustomSelectItem
                key={partner.id}
                value={partner.id || `partner-${partner.company_name}`}
              >
                {partner.company_name}
              </CustomSelectItem>
            ))
          ) : (
            <CustomSelectItem value="none" disabled>
              데이터 없음
            </CustomSelectItem>
          )}
        </CustomSelectContent>
      </CustomSelect>
      {error && <div className="text-red-500 text-sm mt-1">{error}</div>}
    </div>
  )
}

export default DepartmentSelect
