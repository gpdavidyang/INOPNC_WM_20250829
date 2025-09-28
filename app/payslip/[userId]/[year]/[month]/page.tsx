'use client'

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { payslipGeneratorKorean } from '@/lib/services/payslip-generator-korean'

export default function PayslipPage() {
  const params = useParams()
  const { userId, year, month } = params as { userId: string; year: string; month: string }
  const [htmlContent, setHtmlContent] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    async function generatePayslip() {
      try {
        // 유틸: 타임아웃 포함 fetch
        const fetchWithTimeout = async (input: RequestInfo, init?: RequestInit, ms = 12000) => {
          const ac = new AbortController()
          const id = setTimeout(() => ac.abort(), ms)
          try {
            const res = await fetch(input, { ...(init || {}), signal: ac.signal })
            return res
          } finally {
            clearTimeout(id)
          }
        }

        // 1) 사용자 정보 (서버 API)
        const meRes = await fetchWithTimeout('/api/auth/me', { cache: 'no-store' })
        if (!meRes.ok) throw new Error('로그인 정보를 불러올 수 없습니다.')
        const meJson = await meRes.json()
        const profile = meJson?.profile || null
        if (!profile || profile.id !== userId) {
          // 관리자가 타 사용자 열람하는 경우: 최소 필드만 구성
          // 이름이 없으면 ID 앞자리 사용
        }

        const y = Number(year)
        const m = Number(month)
        const ymStart = `${y}-${String(m).padStart(2, '0')}-01`
        const ymEnd = new Date(y, m, 0).toISOString().split('T')[0]

        // 2) 스냅샷 우선 조회 → 실패 시 월 계산 API 폴백
        let salaryPayload: any | null = null
        let metaSource: 'snapshot' | 'calculated' = 'calculated'
        let metaStatus: 'issued' | 'approved' | 'paid' | undefined
        let metaIssuedAt: string | null | undefined
        let metaApprovedAt: string | null | undefined
        let metaPaidAt: string | null | undefined
        try {
          const snapRes = await fetchWithTimeout(
            `/api/salary/snapshot?year=${y}&month=${m}&workerId=${encodeURIComponent(userId)}`,
            { cache: 'no-store' }
          )
          if (snapRes.ok) {
            const snapJson = await snapRes.json()
            if (snapJson?.success && snapJson?.data?.salary) {
              const snap = snapJson.data
              salaryPayload = snap.salary
              metaSource = 'snapshot'
              metaStatus = snap?.status || undefined
              metaIssuedAt = snap?.issued_at || null
              metaApprovedAt = snap?.approved_at || null
              metaPaidAt = snap?.paid_at || null
            }
          }
        } catch {
          // ignore and fallback
        }

        if (!salaryPayload) {
          const res = await fetchWithTimeout(
            `/api/salary/monthly?year=${y}&month=${m}&workerId=${encodeURIComponent(userId)}`,
            { cache: 'no-store' }
          )
          const json = await res.json()
          if (!json?.success) throw new Error(json?.error || '급여 정보를 계산할 수 없습니다.')
          salaryPayload = json.data.salary
          if (json?.data?.source === 'snapshot') metaSource = 'snapshot'
        }

        // 3) 대표 현장명 (서버 API, 실패 시 미지정)
        let siteId = ''
        let siteName = '미지정'
        try {
          const sitesRes = await fetchWithTimeout(
            `/api/users/${encodeURIComponent(userId)}/sites?activeOnly=true&limit=1`,
            { cache: 'no-store' },
            8000
          )
          if (sitesRes.ok) {
            const sitesJson = await sitesRes.json()
            const first = Array.isArray(sitesJson?.data) ? sitesJson.data[0] : null
            if (first) {
              siteId = first.id || first.site_id || ''
              siteName = first.name || first.site_name || siteName
            }
          }
        } catch (e) {
          console.debug('Payslip: site info fetch failed', e)
        }

        // 4) HTML 생성
        const payslipData = {
          employee: {
            id: userId,
            name: profile?.full_name || profile?.name || '',
            email: profile?.email || '',
            role: profile?.role || 'worker',
            department: profile?.employment_type || '일용직',
            employeeNumber: `W-${String(userId).slice(0, 6)}`,
          },
          company: {
            name: 'INOPNC',
            address: '서울특별시 강남구 테헤란로 123',
            phone: '02-1234-5678',
            registrationNumber: '123-45-67890',
            logoLight: '/images/inopnc-logo-n.png',
            logoDark: '/images/inopnc-logo-w.png',
            logoPrint: '/images/inopnc-logo-g.png',
          },
          site: { id: siteId, name: siteName },
          salary: salaryPayload,
          paymentDate: new Date(`${y}-${String(m).padStart(2, '0')}-25`),
          paymentMethod: '계좌이체',
          meta: {
            source: metaSource,
            status: metaStatus,
            issuedAt: metaIssuedAt || undefined,
            approvedAt: metaApprovedAt || undefined,
            paidAt: metaPaidAt || undefined,
          },
        }

        const html = payslipGeneratorKorean.generateHTML(payslipData)
        setHtmlContent(html)
      } catch (err: any) {
        console.error('Payslip generation error:', err)
        setError(err?.message || '급여명세서 생성 중 오류가 발생했습니다.')
      } finally {
        setLoading(false)
      }
    }
    generatePayslip()
  }, [userId, year, month])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">급여명세서를 생성하고 있습니다...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">오류 발생</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => {
              // 창 닫기가 불가하면 뒤로가기
              const closed = window.close()
              setTimeout(() => {
                try {
                  if (window.history.length > 1) window.history.back()
                } catch (e) {
                  console.debug('Payslip: history back failed', e)
                }
              }, 100)
              return closed
            }}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            닫기/뒤로가기
          </button>
        </div>
      </div>
    )
  }

  return <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
}
