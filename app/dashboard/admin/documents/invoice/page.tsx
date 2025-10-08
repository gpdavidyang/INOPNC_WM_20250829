import React from 'react'
import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { PageHeader } from '@/components/ui/page-header'
import InvoiceTabsClient from '@/components/admin/invoice/InvoiceTabsClient'

export const metadata: Metadata = {
  title: '기성청구 관리',
}

export default async function AdminInvoiceDocumentsPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>
}) {
  await requireAdminProfile()

  return (
    <div className="px-0 pb-8">
      <PageHeader
        title="기성청구 관리"
        description="현장별 필수 문서(견적/시공계획/세금계산서/사진대지/계약서/완료확인/진행도면) 준비 현황과 문서 관리"
        breadcrumbs={[{ label: '대시보드', href: '/dashboard/admin' }, { label: '현장작업 관리', href: '/dashboard/admin' }, { label: '기성청구 관리' }]}
      />
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <InvoiceTabsClient />
      </div>
    </div>
  )
}
