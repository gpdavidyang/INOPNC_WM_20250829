'use client'

import React from 'react'
import { DataTable } from '@/components/admin/DataTable'

type SiteDocumentsTableProps = {
  docs: any[]
}

export default function SiteDocumentsTable({ docs }: SiteDocumentsTableProps) {
  return (
    <DataTable
      data={docs}
      rowKey="id"
      emptyMessage="기성청구 문서가 없습니다."
      stickyHeader
      columns={[
        {
          key: 'created_at',
          header: '등록일',
          sortable: true,
          accessor: (d: any) => (d?.created_at ? new Date(d.created_at).getTime() : 0),
          render: (d: any) =>
            d?.created_at ? new Date(d.created_at).toLocaleDateString('ko-KR') : '-',
          width: '12%',
        },
        {
          key: 'title',
          header: '문서명 / 기간',
          sortable: true,
          accessor: (d: any) => d?.title || '',
          render: (d: any) => (
            <div className="space-y-1">
              <a
                href={buildInvoiceDocUrl(d)}
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-blue-600 font-medium text-foreground"
              >
                {d?.title || d?.file_name || '-'}
              </a>
              <div className="text-xs text-muted-foreground">
                {formatInvoicePeriod(d) || '기간 미지정'}
              </div>
            </div>
          ),
          width: '32%',
        },
        {
          key: 'partner',
          header: '협력사',
          sortable: true,
          accessor: (d: any) => getInvoicePartner(d),
          render: (d: any) => getInvoicePartner(d) || '-',
          width: '16%',
        },
        {
          key: 'phase',
          header: '기성 단계',
          sortable: true,
          accessor: (d: any) => getInvoicePhaseLabel(d),
          render: (d: any) => getInvoicePhaseLabel(d),
          width: '14%',
        },
        {
          key: 'amount',
          header: '요청 금액',
          sortable: true,
          accessor: (d: any) => Number(getInvoiceAmountValue(d) ?? 0),
          render: (d: any) => formatInvoiceAmount(d),
          align: 'right',
          width: '14%',
        },
        {
          key: 'status',
          header: '상태',
          sortable: true,
          accessor: (d: any) => d?.status || '',
          render: (d: any) => d?.status || '-',
          width: '12%',
        },
      ]}
    />
  )
}

function buildInvoiceDocUrl(doc: any): string {
  if (!doc?.id) return '#'
  return `/dashboard/admin/documents/${doc.id}`
}

function getInvoiceMetadata(doc: any): Record<string, any> {
  const meta = doc?.metadata
  if (meta && typeof meta === 'object') return meta as Record<string, any>
  return {}
}

function getInvoicePartner(doc: any): string {
  const meta = getInvoiceMetadata(doc)
  return (
    meta.partner_name ||
    meta.partner ||
    meta.partner_company ||
    meta.partner_company_name ||
    meta.company_name ||
    meta.organization_name ||
    ''
  )
}

function getInvoicePhaseKey(
  doc: any
): 'pre_contract' | 'in_progress' | 'completion' | 'closed' | 'other' {
  const meta = getInvoiceMetadata(doc)
  const raw = String(
    meta.contract_phase ||
      meta.phase ||
      meta.progress_stage ||
      meta.workflow_stage ||
      doc?.status ||
      ''
  ).toLowerCase()
  if (
    raw.includes('pre') ||
    raw.includes('준비') ||
    raw.includes('initial') ||
    raw.includes('pending') ||
    raw.includes('대기') ||
    raw.includes('draft')
  )
    return 'pre_contract'
  if (
    raw.includes('완료') ||
    raw.includes('completion') ||
    raw.includes('준공') ||
    raw.includes('approved') ||
    raw.includes('승인') ||
    raw.includes('확정')
  )
    return 'completion'
  if (
    raw.includes('종결') ||
    raw.includes('closed') ||
    raw.includes('done') ||
    raw.includes('정산')
  )
    return 'closed'
  if (
    raw.includes('progress') ||
    raw.includes('진행') ||
    raw.includes('중') ||
    raw.includes('ongoing')
  )
    return 'in_progress'
  return 'other'
}

function getInvoicePhaseLabel(doc: any): string {
  const key = getInvoicePhaseKey(doc)
  switch (key) {
    case 'pre_contract':
      return '계약 전'
    case 'in_progress':
      return '진행 중'
    case 'completion':
      return '준공'
    case 'closed':
      return '종결'
    default:
      return '기타'
  }
}

function getInvoiceAmountValue(doc: any): number | null {
  const meta = getInvoiceMetadata(doc)
  const raw =
    meta.request_amount ??
    meta.amount ??
    meta.total_amount ??
    meta.invoice_amount ??
    meta.expected_amount ??
    doc?.amount
  if (raw === undefined || raw === null || raw === '') return null
  const num = Number(raw)
  return Number.isFinite(num) ? num : null
}

function formatInvoiceAmount(doc: any): string {
  const value = getInvoiceAmountValue(doc)
  if (value === null) return '-'
  return `₩${new Intl.NumberFormat('ko-KR').format(value)}`
}

function formatInvoicePeriod(doc: any): string {
  const meta = getInvoiceMetadata(doc)
  const from =
    meta.period_start ||
    meta.start_date ||
    meta.contract_start ||
    meta.from ||
    meta.billing_start ||
    meta.period?.start
  const to =
    meta.period_end ||
    meta.end_date ||
    meta.contract_end ||
    meta.to ||
    meta.billing_end ||
    meta.period?.end
  if (from && to) {
    return `${formatDate(String(from))} ~ ${formatDate(String(to))}`
  }
  const label =
    meta.period || meta.billing_period || meta.statement_period || meta.summary_period || ''
  return label ? String(label) : ''
}

function formatDate(value?: string | null): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('ko-KR')
}
