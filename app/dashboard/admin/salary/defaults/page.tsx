'use client'

import React, { useEffect, useState } from 'react'

export default function DefaultRatesPage() {
  const [items, setItems] = useState<any[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const res = await fetch('/api/admin/payroll/rates/defaults')
        const json = await res.json()
        if (!res.ok || json?.success === false) throw new Error(json?.error || '조회 실패')
        setItems(json.data || [])
      } catch (e: any) {
        setError(e?.message || '조회 실패')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600">
        고용형태별 기본세율(읽기 전용). 개인세율이 설정되면 기본세율보다 우선합니다.
      </p>
      {loading ? (
        <p className="text-sm text-gray-600">불러오는 중...</p>
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : (
        <div className="overflow-x-auto border rounded-md">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-3 py-2">형태</th>
                <th className="px-3 py-2">소득세(%)</th>
                <th className="px-3 py-2">국민연금(%)</th>
                <th className="px-3 py-2">건강보험(%)</th>
                <th className="px-3 py-2">고용보험(%)</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => (
                <tr key={`${it.employment_type}-${idx}`} className="border-t">
                  <td className="px-3 py-2">{it.employment_type}</td>
                  <td className="px-3 py-2">{it.income_tax_rate}</td>
                  <td className="px-3 py-2">{it.pension_rate}</td>
                  <td className="px-3 py-2">{it.health_insurance_rate}</td>
                  <td className="px-3 py-2">{it.employment_insurance_rate}</td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td className="px-3 py-6 text-center text-gray-500" colSpan={5}>
                    데이터가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
