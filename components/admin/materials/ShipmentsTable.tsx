'use client'

import DataTable, { type Column } from '@/components/admin/DataTable'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

type Shipment = {
  id: string
  shipment_number?: string | null
  site_id?: string | null
  partner_company_id?: string | null
  sites?: { name?: string | null }
  status?: string | null
  shipment_date?: string | null
  total_amount?: number | null
  payments?: Array<{ amount?: number | null }>
  shipment_items?: Array<{
    material_id?: string
    quantity?: number
    materials?: { name?: string | null; code?: string | null; unit?: string | null }
    notes?: string | null
    total_price?: number | null
    unit_price?: number | null
  }>
  billing_method?: { name?: string | null }
  shipping_method?: { name?: string | null }
  freight_method?: { name?: string | null }
  display_partner_name?: string | null
  display_site_name?: string | null
  display_material_summary?: string | null
  display_total_quantity?: number | null
  display_item_notes?: string[] | null
  display_billing_label?: string | null
  display_shipping_label?: string | null
  display_freight_label?: string | null
  display_flag_etax?: boolean
  display_flag_statement?: boolean
  display_flag_freight_paid?: boolean
  display_flag_bill_amount?: boolean
  display_total_amount?: number | null
  display_total_paid?: number | null
  display_outstanding_amount?: number | null
  flag_etax?: boolean | null
  flag_statement?: boolean | null
  flag_freight_paid?: boolean | null
  flag_bill_amount?: boolean | null
}

const FLAG_CONFIG = [
  { key: 'display_flag_etax', fallbackKey: 'flag_etax', label: '전자세금계산서' },
  { key: 'display_flag_statement', fallbackKey: 'flag_statement', label: '거래명세서' },
  { key: 'display_flag_freight_paid', fallbackKey: 'flag_freight_paid', label: '운임비 지불' },
  { key: 'display_flag_bill_amount', fallbackKey: 'flag_bill_amount', label: '금액 청구' },
] as const

type FlagConfig = (typeof FLAG_CONFIG)[number]

type PaymentTone = 'primary' | 'muted' | 'warning' | 'success'

const CHIP_STYLES: Record<PaymentTone, string> = {
  primary: 'border-blue-200 bg-blue-50 text-blue-700',
  muted: 'border-slate-200 bg-slate-50 text-slate-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-700',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
}

const formatCurrency = (value?: number | null) =>
  typeof value === 'number' && !Number.isNaN(value) ? value.toLocaleString('ko-KR') : '-'

const formatDate = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString('ko-KR') : '출고일 미입력'

const normalizeLabel = (value?: string | null, fallback = '-') => {
  if (!value) return fallback
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : fallback
}

const resolveFlagValue = (shipment: Shipment, cfg: FlagConfig): boolean => {
  const display = shipment[cfg.key as keyof Shipment]
  if (typeof display === 'boolean') return display
  const fallback = shipment[cfg.fallbackKey as keyof Shipment]
  if (typeof fallback === 'boolean') return fallback
  if (typeof fallback === 'string') {
    return ['true', '1', 'y', 'yes'].includes(fallback.trim().toLowerCase())
  }
  return false
}

const computeItemSummary = (
  shipment: Shipment
): { label: string; quantity: number; notes: string[] } => {
  const items = Array.isArray(shipment.shipment_items) ? shipment.shipment_items : []
  const fallback = (() => {
    if (items.length === 0) return { label: '-', quantity: 0, notes: [] as string[] }
    const primary = items[0]
    const name =
      primary?.materials?.name || primary?.materials?.code || primary?.materials?.unit || '자재'
    const label =
      items.length > 1
        ? `${name} 외 ${items.length - 1}건`
        : `${name}${primary?.materials?.code ? ` (${primary.materials.code})` : ''}`
    const quantity = items.reduce((sum, item) => sum + Number(item?.quantity ?? 0), 0)
    const notes: string[] = []
    const seen = new Set<string>()
    items.forEach(item => {
      if (!item?.notes) return
      const trimmed = String(item.notes).trim()
      if (!trimmed || seen.has(trimmed)) return
      seen.add(trimmed)
      notes.push(trimmed)
    })
    return { label, quantity, notes }
  })()
  const label = shipment.display_material_summary || fallback.label
  const quantity =
    shipment.display_total_quantity != null ? shipment.display_total_quantity : fallback.quantity
  const notes =
    shipment.display_item_notes && shipment.display_item_notes.length > 0
      ? shipment.display_item_notes
      : fallback.notes
  return { label, quantity, notes }
}

const getPaymentChips = (shipment: Shipment): Array<{ label: string; tone: PaymentTone }> => {
  const billing = normalizeLabel(
    shipment.display_billing_label || shipment.billing_method?.name,
    '청구 미지정'
  )
  const shipping = normalizeLabel(
    shipment.display_shipping_label || shipment.shipping_method?.name,
    '배송 미지정'
  )
  const freight = normalizeLabel(
    shipment.display_freight_label || shipment.freight_method?.name,
    '선불/착불 미지정'
  )

  const billingTone: PaymentTone = billing === '월말청구' ? 'primary' : 'muted'
  const shippingTone: PaymentTone =
    shipping === '화물' ? 'warning' : shipping === '택배' ? 'primary' : 'muted'
  const freightTone: PaymentTone =
    freight === '선불' ? 'success' : freight === '착불' ? 'warning' : 'muted'

  return [
    { label: billing, tone: billingTone },
    { label: shipping, tone: shippingTone },
    { label: freight, tone: freightTone },
  ]
}

const PaymentChip = ({ label, tone }: { label: string; tone: PaymentTone }) => (
  <span
    className={cn(
      'inline-flex items-center rounded-lg border px-2 py-0.5 text-[10px] font-black uppercase tracking-tighter shadow-sm',
      CHIP_STYLES[tone]
    )}
  >
    {label}
  </span>
)

const FlagBadge = ({ label }: { label: string }) => (
  <span className="inline-flex items-center rounded-lg border border-slate-100 bg-slate-50/50 px-2 py-0.5 text-[10px] font-black text-slate-400 uppercase tracking-tighter">
    {label}
  </span>
)

const computeAmountSummary = (
  shipment: Shipment
): { total: number; paid: number; outstanding: number } => {
  const total =
    typeof shipment.display_total_amount === 'number'
      ? shipment.display_total_amount
      : typeof shipment.total_amount === 'number'
        ? shipment.total_amount
        : 0
  const paid =
    typeof shipment.display_total_paid === 'number'
      ? shipment.display_total_paid
      : (shipment.payments || []).reduce((acc, payment) => acc + Number(payment?.amount || 0), 0)
  const outstanding =
    typeof shipment.display_outstanding_amount === 'number'
      ? shipment.display_outstanding_amount
      : Math.max(0, total - paid)
  return { total, paid, outstanding }
}

export default function ShipmentsTable({ shipments }: { shipments: Shipment[] }) {
  const [savingId, setSavingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const router = useRouter()

  const handleDelete = async (shipmentId: string) => {
    if (typeof window !== 'undefined') {
      const confirmed = window.confirm('선택한 출고 정보를 삭제하시겠습니까?')
      if (!confirmed) return
    }
    setDeletingId(shipmentId)
    try {
      const response = await fetch(`/api/admin/material-shipments/${shipmentId}`, {
        method: 'DELETE',
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || '삭제에 실패했습니다.')
      }
      router.refresh()
    } catch (error: any) {
      if (typeof window !== 'undefined') {
        window.alert(error?.message || '삭제 중 오류가 발생했습니다.')
      }
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <DataTable<Shipment>
      data={shipments}
      rowKey={s => s.id}
      stickyHeader
      columns={
        [
          {
            key: 'shipment_number',
            header: '출고정보',
            sortable: true,
            render: sp => (
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-foreground">
                  {formatDate(sp.shipment_date)}
                </span>
                <span className="text-xs text-muted-foreground">
                  현장: {sp.display_site_name ?? sp.sites?.name ?? '-'}
                </span>
                <span className="text-xs text-muted-foreground">
                  거래처: {sp.display_partner_name ?? '미지정'}
                </span>
              </div>
            ),
          },
          {
            key: 'items',
            header: '출고품목',
            sortable: false,
            render: sp => {
              const summary = computeItemSummary(sp)
              return (
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-foreground">{summary.label}</span>
                  {summary.quantity > 0 && (
                    <span className="text-xs text-muted-foreground">
                      총 {summary.quantity.toLocaleString('ko-KR')} 개
                    </span>
                  )}
                  {summary.notes.length > 0 && (
                    <span className="text-xs text-muted-foreground line-clamp-2">
                      메모: {summary.notes.join(' / ')}
                    </span>
                  )}
                </div>
              )
            },
          },
          {
            key: 'payments',
            header: '청구/배송 정보',
            sortable: false,
            render: sp => {
              const chips = getPaymentChips(sp)
              return (
                <div className="flex flex-wrap gap-1">
                  {chips.map(({ label, tone }, index) => (
                    <PaymentChip key={`${sp.id}-${tone}-${index}`} label={label} tone={tone} />
                  ))}
                </div>
              )
            },
          },
          {
            key: 'flags',
            header: '결제 옵션',
            sortable: false,
            render: sp => {
              const activeFlags = FLAG_CONFIG.filter(cfg => resolveFlagValue(sp, cfg))
              if (activeFlags.length === 0) {
                return <span className="text-xs text-muted-foreground">선택 없음</span>
              }
              return (
                <div className="flex flex-wrap gap-1">
                  {activeFlags.map(cfg => (
                    <FlagBadge key={`${sp.id}-${cfg.label}`} label={cfg.label} />
                  ))}
                </div>
              )
            },
          },
          {
            key: 'total_amount',
            header: '금액 요약',
            sortable: true,
            render: sp => {
              const { total } = computeAmountSummary(sp)
              return (
                <div className="flex flex-col items-end gap-0.5">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                    총 금액
                  </span>
                  <span className="text-base font-black text-[#1A254F] italic tracking-tight">
                    {formatCurrency(total)}
                  </span>
                </div>
              )
            },
          },
          {
            key: 'status',
            header: '상태',
            sortable: true,
            render: sp => {
              const labelMap: Record<string, string> = {
                preparing: '상태 대기',
                shipped: '출고 완료',
                delivered: '최종 인도',
                cancelled: '취소됨',
              }
              const colorMap: Record<string, string> = {
                preparing: 'bg-slate-50 text-slate-400 border-slate-100',
                shipped: 'bg-blue-50 text-blue-600 border-blue-100',
                delivered: 'bg-emerald-50 text-emerald-600 border-emerald-100',
                cancelled: 'bg-rose-50 text-rose-600 border-rose-100',
              }
              const value = String(sp.status || 'preparing').toLowerCase()
              return (
                <span
                  className={cn(
                    'inline-flex items-center rounded-lg border px-2.5 py-1 text-[11px] font-bold shadow-none whitespace-nowrap',
                    colorMap[value] || colorMap.preparing
                  )}
                >
                  {labelMap[value] || '대기'}
                </span>
              )
            },
          },
          {
            key: 'actions',
            header: '작업',
            sortable: false,
            render: sp => (
              <div className="flex flex-wrap gap-2 justify-center">
                <Button
                  asChild
                  variant="outline"
                  size="compact"
                  className="h-8 rounded-md border-amber-200 text-amber-700 hover:bg-amber-50 font-bold px-3 whitespace-nowrap"
                >
                  <Link href={`/dashboard/admin/materials/shipments/${sp.id}/edit`}>수정</Link>
                </Button>
                <Button
                  variant="ghost"
                  size="compact"
                  className="h-8 rounded-md text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 border border-rose-200 font-bold whitespace-nowrap"
                  onClick={() => handleDelete(sp.id)}
                  disabled={deletingId === sp.id}
                >
                  {deletingId === sp.id ? '...' : '삭제'}
                </Button>
              </div>
            ),
          },
        ] as Column<Shipment>[]
      }
    />
  )
}
