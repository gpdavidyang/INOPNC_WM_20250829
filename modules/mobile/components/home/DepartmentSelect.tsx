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

        const supabase = createClient()
        console.log('Fetching partner companies...')

        const { data, error } = await supabase
          .from('partner_companies')
          .select('id, company_name')
          .eq('status', 'active')
          .order('company_name')

        console.log('Partner companies response:', { data, error })

        if (error) {
          console.error('파트너사 조회 실패:', error)
          setError('파트너사 목록을 불러올 수 없습니다.')
          setPartners([])
        } else {
          console.log('Setting partners:', data?.length || 0, 'companies')
          setPartners(data || [])
        }
      } catch (err) {
        console.error('파트너사 조회 오류:', err)
        setError('파트너사 목록을 불러올 수 없습니다.')
        setPartners([])
      } finally {
        setLoading(false)
      }
    }

    fetchPartners()
  }, [])

  return (
    <div className={`department-select-container ${className}`}>
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
              <CustomSelectItem key={partner.id} value={partner.id}>
                {partner.company_name}
              </CustomSelectItem>
            ))
          ) : (
            <CustomSelectItem value="" disabled>
              소속 데이터가 없습니다
            </CustomSelectItem>
          )}
        </CustomSelectContent>
      </CustomSelect>
      {error && <div className="text-red-500 text-sm mt-1">{error}</div>}
    </div>
  )
}

export default DepartmentSelect
