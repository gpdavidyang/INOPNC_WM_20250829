'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  CustomSelect,
  CustomSelectContent,
  CustomSelectItem,
  CustomSelectTrigger,
  CustomSelectValue,
} from '@/components/ui/custom-select'

interface Partner {
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
  required = false
}) => {
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPartners = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('partner_companies')
          .select('id, name')
          .order('name')

        if (error) {
          console.error('파트너사 조회 실패:', error)
          setError('파트너사 목록을 불러올 수 없습니다.')
          return
        }

        setPartners(data || [])
      } catch (err) {
        console.error('파트너사 조회 오류:', err)
        setError('파트너사 목록을 불러올 수 없습니다.')
      } finally {
        setLoading(false)
      }
    }

    fetchPartners()
  }, [])

  return (
    <div className={`department-select-container ${className}`}>
      <label className="form-label">
        소속 {required && <span className="required">*</span>}
      </label>
      <CustomSelect
        value={value}
        onValueChange={onChange}
        disabled={loading}
      >
        <CustomSelectTrigger className="form-select">
          <CustomSelectValue placeholder={
            loading ? '로딩 중...' : error ? '소속 선택 불가' : '소속 선택'
          } />
        </CustomSelectTrigger>
        <CustomSelectContent>
          {partners.map((partner) => (
            <CustomSelectItem key={partner.id} value={partner.id}>
              {partner.name}
            </CustomSelectItem>
          ))}
        </CustomSelectContent>
      </CustomSelect>
      {error && (
        <div className="text-red-500 text-sm mt-1">
          {error}
        </div>
      )}
    </div>
  )
}

export default DepartmentSelect