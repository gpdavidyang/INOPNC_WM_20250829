'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { MobileLayout as MobileLayoutShell } from '@/modules/mobile/components/layout/MobileLayout'
import { MobileAuthGuard } from '@/modules/mobile/components/auth/mobile-auth-guard'
import { useUnifiedAuth } from '@/hooks/use-unified-auth'
import { payslipGeneratorKorean } from '@/lib/services/payslip-generator-korean'

export default function MobilePayslipPage() {
  return (
    <MobileAuthGuard>
      <PayslipViewer />
    </MobileAuthGuard>
  )
}

const PayslipViewer: React.FC = () => {
  const { profile } = useUnifiedAuth()
  const params = useParams()
  const router = useRouter()
  const { year, month } = params as { year: string; month: string }
  const [htmlContent, setHtmlContent] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const generator = useMemo(() => payslipGeneratorKorean, [])

  useEffect(() => {
    const loadPayslip = async () => {
      try {
        if (!profile?.id) {
          throw new Error('사용자 정보를 불러올 수 없습니다.')
        }

        const workerId = profile.id
        const y = Number(year)
        const m = Number(month)
        if (!Number.isFinite(y) || !Number.isFinite(m)) {
          throw new Error('잘못된 연월입니다.')
        }

        const params = new URLSearchParams({
          year: String(y),
          month: String(m),
          workerId,
        })
        const salaryRes = await fetch(`/api/salary/monthly?${params.toString()}`, {
          cache: 'no-store',
        })
        const salaryJson = await salaryRes.json().catch(() => null)
        if (!salaryRes.ok || !salaryJson?.success) {
          throw new Error(salaryJson?.error || '급여 정보를 계산할 수 없습니다.')
        }

        const salaryPayload = salaryJson.data.salary
        const source = salaryJson?.data?.source === 'snapshot' ? 'snapshot' : 'calculated'
        const snapshotMeta = salaryJson?.data?.snapshot || {}
        const workerProfile = salaryJson?.data?.worker || {}

        const resolvedName =
          workerProfile?.full_name ||
          workerProfile?.name ||
          profile.full_name ||
          profile.name ||
          `ID ${workerId.slice(0, 6)}`
        const workerEmail =
          workerProfile?.email || profile.email || workerProfile?.company_email || ''
        const workerRole = workerProfile?.role || profile.role || 'worker'
        const employmentType =
          salaryJson?.data?.employment_type ||
          workerProfile?.employment_type ||
          profile?.employment_type ||
          'regular_employee'

        let siteId = ''
        let siteName = '미지정'
        try {
          const siteRes = await fetch(
            `/api/users/${encodeURIComponent(workerId)}/sites?activeOnly=true&limit=1`,
            { cache: 'no-store' }
          )
          if (siteRes.ok) {
            const siteJson = await siteRes.json().catch(() => null)
            const firstSite = Array.isArray(siteJson?.data) ? siteJson.data[0] : null
            if (firstSite) {
              siteId = firstSite.id || firstSite.site_id || ''
              siteName = firstSite.name || firstSite.site_name || siteName
            }
          }
        } catch (siteError) {
          console.debug('payslip site fetch failed', siteError)
        }

        const departmentLabel =
          {
            freelancer: '프리랜서',
            daily_worker: '일용직',
            regular_employee: '상용직',
          }[employmentType as 'freelancer' | 'daily_worker' | 'regular_employee'] ||
          employmentType ||
          '직원'

        const html = generator.generateHTML({
          employee: {
            id: workerId,
            name: resolvedName,
            email: workerEmail,
            role: workerRole,
            department: departmentLabel,
            employeeNumber: profile.employee_number || workerProfile.employee_number || undefined,
          },
          company: {
            name: 'INOPNC',
            address: '서울특별시 강남구 테헤란로 123',
            phone: '02-1234-5678',
            registrationNumber: '123-45-67890',
            logoUrl: '/images/inopnc-logo-n.png',
          },
          site: { id: siteId, name: siteName },
          salary: salaryPayload,
          paymentDate: new Date(`${y}-${String(m).padStart(2, '0')}-25`),
          paymentMethod: '계좌이체',
          meta: {
            source,
            status: snapshotMeta.status,
            issuedAt: snapshotMeta.issued_at,
            approvedAt: snapshotMeta.approved_at,
            paidAt: snapshotMeta.paid_at,
          },
        })
        setHtmlContent(html)
      } catch (err) {
        console.error('Mobile payslip load error:', err)
        setError(err instanceof Error ? err.message : '오류가 발생했습니다.')
      } finally {
        setLoading(false)
      }
    }
    loadPayslip()
  }, [profile?.id, year, month])

  return (
    <MobileLayoutShell>
      <div className="payslip-mobile-container">
        <div className="payslip-mobile-toolbar">
          <button
            type="button"
            className="payslip-back-btn"
            onClick={() => router.back()}
            aria-label="이전 화면으로"
          >
            ← 뒤로가기
          </button>
          <div className="payslip-title-block">
            <p className="payslip-period">
              {year}년 {String(month).padStart(2, '0')}월 급여명세서
            </p>
            <h1 className="payslip-mobile-title">{profile?.full_name || '급여명세서'}</h1>
          </div>
        </div>
        <section className="payslip-mobile-body">
          {loading && (
            <div className="payslip-mobile-loading">급여명세서를 불러오는 중입니다...</div>
          )}
          {!loading && error && <div className="payslip-mobile-error">{error}</div>}
          {!loading && !error && (
            <div
              className="payslip-mobile-html"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          )}
        </section>
      </div>
    </MobileLayoutShell>
  )
}
