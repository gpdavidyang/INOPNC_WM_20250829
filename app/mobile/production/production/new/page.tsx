import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/ultra-simple'
import { MobileLayoutWithAuth } from '@/modules/mobile/components/layout/MobileLayoutWithAuth'
import { ProductionManagerTabs } from '@/modules/mobile/components/navigation/ProductionManagerTabs'
import { QuantityStepper } from '@/modules/mobile/components/production/QuantityStepper'
// Use no-SSR wrapper for Radix-based select to avoid dev hydration edge-cases
const SelectFieldNoSSR = dynamic(
  () => import('@/modules/mobile/components/production/SelectField').then(m => m.SelectField),
  {
    ssr: false,
    loading: () => <div className="w-full h-11 rounded-xl border border-gray-200 bg-gray-50" />,
  }
)

export const metadata: Metadata = { title: '생산 정보 입력' }

async function submit(formData: FormData) {
  'use server'
  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session?.user) redirect('/auth/login')

  const site_id = (formData.get('site_id') as string) || ''
  const material_id = (formData.get('material_id') as string) || ''
  const production_date = (formData.get('production_date') as string) || ''
  const produced_quantity = Number(formData.get('produced_quantity') || 0)
  const notes = ((formData.get('notes') as string) || '').trim() || null

  // Extended fields (notes JSON merge)
  const order_date = (formData.get('order_date') as string) || ''
  const order_quantity = Number(formData.get('order_quantity') || 0)
  const site_name = (formData.get('site_name') as string) || ''
  const org_id = (formData.get('org_id') as string) || ''
  const org_name = (formData.get('org_name') as string) || ''
  const billing_method = (formData.get('billing_method') as string) || ''
  const shipping_method = (formData.get('shipping_method') as string) || ''
  const freight_pay = (formData.get('freight_pay') as string) || ''
  const receipt = formData.get('receipt') as File | null
  const memo = ((formData.get('memo') as string) || '').trim()

  if (!site_id || !material_id || !production_date || produced_quantity <= 0) {
    redirect('/mobile/production/production/new')
  }

  const extended = {
    order_date,
    order_quantity,
    site_name,
    org_id,
    org_name,
    billing_method,
    shipping_method,
    freight_pay,
    receipt_name: receipt ? receipt.name : undefined,
    memo,
  }

  await supabase.from('material_productions').insert({
    site_id,
    material_id,
    production_date,
    produced_quantity,
    quality_status: 'pending',
    quality_notes: notes ? `${notes}\n${JSON.stringify(extended)}` : JSON.stringify(extended),
    created_by: session.user.id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as any)

  revalidatePath('/dashboard/admin/materials?tab=production')
  redirect('/mobile/production/production')
}

export default async function ProductionCreatePage() {
  await requireAuth('/mobile/production')
  const supabase = createClient()

  const { data: sites } = await supabase.from('sites').select('id, name').order('name')
  const { data: materials } = await supabase
    .from('materials')
    .select('id, name, code, unit, is_active')
    .eq('is_active', true)
    .order('name')

  // 거래처(파트너사) 목록
  let partnerCompanies: Array<{ id: string; company_name: string }> | null = null
  {
    const { data: partners, error: partnerErr } = await supabase
      .from('partner_companies')
      .select('id, company_name, status')
      .order('company_name', { ascending: true })
    partnerCompanies = partnerErr ? null : (partners as any) || null
  }

  return (
    <MobileLayoutWithAuth topTabs={<ProductionManagerTabs active="production" />}>
      <div className="p-5 space-y-5 pb-safe min-h-screen-safe">
        <div className="rounded-lg border p-4 bg-white">
          <div className="flex items-center justify-between mb-3">
            <div className="pm-section-title">생산 정보 입력</div>
            <p className="text-[#31A3FA] font-semibold text-base">필수입력(*)후 저장</p>
          </div>
          <form action={submit} className="pm-form space-y-3">
            {/* 제품명 */}
            <div>
              <label className="block text-sm text-muted-foreground mb-1">
                제품명<span className="req-mark"> *</span>
              </label>
              <SelectFieldNoSSR
                name="material_id"
                required
                placeholder="자재 선택"
                options={(materials || []).map(m => ({
                  value: m.id as string,
                  label: `${m.name || '-'}${m.code ? ` (${m.code})` : ''}`,
                }))}
              />
            </div>

            {/* 생산날짜 + 수량입력 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">
                  생산날짜<span className="req-mark"> *</span>
                </label>
                <input
                  type="date"
                  name="production_date"
                  className="w-full rounded border px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">
                  수량입력<span className="req-mark"> *</span>
                </label>
                <QuantityStepper name="produced_quantity" step={10} min={0} />
              </div>
            </div>

            {/* 주문날짜 + 수량입력 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">주문날짜</label>
                <input type="date" name="order_date" className="w-full rounded border px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">수량입력</label>
                <QuantityStepper name="order_quantity" step={10} min={0} />
              </div>
            </div>

            {/* 현장명 선택 */}
            <div>
              <label className="block text-sm text-muted-foreground mb-1">
                현장명 선택<span className="req-mark"> *</span>
              </label>
              <SelectFieldNoSSR
                name="site_id"
                required
                placeholder="현장 선택"
                options={(sites || []).map(s => ({
                  value: s.id as string,
                  label: (s.name as string) || '-',
                }))}
              />
            </div>
            {/* 거래처 선택 */}
            <div>
              <label className="block text-sm text-muted-foreground mb-1">거래처 선택</label>
              {partnerCompanies && partnerCompanies.length > 0 ? (
                <SelectFieldNoSSR
                  name="org_id"
                  placeholder="거래처 선택"
                  options={partnerCompanies.map(p => ({
                    value: p.id,
                    label: p.company_name || '-',
                  }))}
                />
              ) : (
                <input
                  type="search"
                  name="org_name"
                  placeholder="거래처명을 입력하세요."
                  className="w-full rounded border px-3 py-2"
                />
              )}
            </div>

            {/* 청구/배송/선불·착불: 1행 3열 고정 */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">청구방식</label>
                <SelectFieldNoSSR
                  name="billing_method"
                  placeholder="즉시청구"
                  defaultValue="즉시청구"
                  options={[
                    { value: '즉시청구', label: '즉시청구' },
                    { value: '월말청구', label: '월말청구' },
                  ]}
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">배송방식</label>
                <SelectFieldNoSSR
                  name="shipping_method"
                  placeholder="택배"
                  defaultValue="택배"
                  options={[
                    { value: '택배', label: '택배' },
                    { value: '화물', label: '화물' },
                    { value: '직접', label: '직접' },
                  ]}
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">선불/착불</label>
                <SelectFieldNoSSR
                  name="freight_pay"
                  placeholder="선불"
                  defaultValue="선불"
                  options={[
                    { value: '선불', label: '선불' },
                    { value: '착불', label: '착불' },
                  ]}
                />
              </div>
            </div>

            {/* 영수증 첨부: 별도 1행 (참고 HTML 100% 매칭) */}
            <div>
              <label className="block text-sm text-muted-foreground mb-1">영수증 첨부</label>
              <div className="pm-receipt-upload">
                <input type="file" name="receipt" accept=".pdf" />
                <div className="pm-receipt-label">영수증 업로드</div>
              </div>
            </div>

            {/* 메모: 별도 1행 (참고와 동일하게 크게) */}
            <div>
              <label className="block text-sm text-muted-foreground mb-1">메모</label>
              <textarea
                name="memo"
                placeholder="요청사항을 입력하세요."
                rows={3}
                className="w-full rounded border px-3 py-2 h-20"
              />
            </div>

            <div className="pm-form-actions">
              <button type="reset" className="pm-btn pm-btn-secondary">
                취소하기
              </button>
              <button type="submit" className="pm-btn pm-btn-primary">
                저장하기
              </button>
            </div>
          </form>
        </div>
      </div>
    </MobileLayoutWithAuth>
  )
}
