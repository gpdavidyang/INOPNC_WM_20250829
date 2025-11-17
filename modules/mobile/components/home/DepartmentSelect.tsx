'use client'

import React, { useState, useEffect } from 'react'
import {
  CustomSelect,
  CustomSelectContent,
  CustomSelectItem,
  CustomSelectTrigger,
  CustomSelectValue,
} from '@/components/ui/custom-select'

interface Organization {
  id: string
  name: string
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
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch('/api/mobile/organizations/list', { cache: 'no-store' })

        if (!response.ok) {
          throw new Error(`조직 목록을 불러오는데 실패했습니다. (status: ${response.status})`)
        }

        const result = await response.json()
        if (!result?.success) {
          const message = result?.error || '소속 목록을 불러올 수 없습니다.'
          console.error('소속 조회 실패:', message)
          setError(message)
          setOrganizations([])
        } else {
          const activeOrganizations = Array.isArray(result.data)
            ? result.data
                .filter(org => org?.id && org?.name)
                .sort((a, b) => a.name.localeCompare(b.name, 'ko', { sensitivity: 'base' }))
            : []
          setOrganizations(activeOrganizations)
        }
      } catch (err) {
        console.error('업체 조회 오류:', err)
        setError('소속 목록을 불러올 수 없습니다.')
        setOrganizations([])
      } finally {
        setLoading(false)
      }
    }

    fetchOrganizations()
  }, [])

  return (
    <div className={`form-group department-select-container ${className}`}>
      <label className="form-label">소속 {required && <span className="required">*</span>}</label>
      <CustomSelect
        value={value}
        onValueChange={onChange}
        disabled={loading || organizations.length === 0}
      >
        <CustomSelectTrigger className="form-select">
          <CustomSelectValue
            placeholder={
              loading
                ? '로딩 중...'
                : error
                  ? '소속 목록 불가'
                  : organizations.length === 0
                    ? '소속 데이터 없음'
                    : '소속 선택'
            }
          />
        </CustomSelectTrigger>
        <CustomSelectContent>
          {organizations.length > 0 ? (
            organizations.map(org => (
              <CustomSelectItem key={org.id} value={org.id}>
                {org.name}
              </CustomSelectItem>
            ))
          ) : (
            <CustomSelectItem value="none" disabled>
              소속 데이터 없음
            </CustomSelectItem>
          )}
        </CustomSelectContent>
      </CustomSelect>
      {error && <div className="text-red-500 text-sm mt-1">{error}</div>}
    </div>
  )
}

export default DepartmentSelect
