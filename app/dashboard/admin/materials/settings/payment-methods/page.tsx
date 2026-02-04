import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import EmptyState from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/ui/page-header'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { createClient } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'
import { CreditCard, Plus, Power, Receipt, Trash2, Truck } from 'lucide-react'
import type { Metadata } from 'next'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'

export const metadata: Metadata = { title: '배송결제방식 관리' }

type PaymentCategory = 'billing' | 'shipping' | 'freight'

type PaymentMethod = {
  id: string
  name: string
  is_active: boolean | null
  sort_order: number | null
  legacy_name?: string
}

const LEGACY_DEFAULT_CATEGORY: Record<string, PaymentCategory> = {
  즉시청구: 'billing',
  월말청구: 'billing',
  택배: 'shipping',
  화물: 'shipping',
  직접: 'shipping',
  선불: 'freight',
  착불: 'freight',
}

function encodeLegacyName(category: PaymentCategory, name: string) {
  return `${category.toUpperCase()}::${name}`
}

function decodeLegacyName(raw: string): { category: PaymentCategory; name: string } {
  const markerIndex = raw.indexOf('::')
  if (markerIndex > 0) {
    const prefix = raw.slice(0, markerIndex).toLowerCase() as PaymentCategory
    const label = raw.slice(markerIndex + 2)
    if (prefix === 'billing' || prefix === 'shipping' || prefix === 'freight') {
      return { category: prefix, name: label }
    }
  }
  const inferred = LEGACY_DEFAULT_CATEGORY[raw] ?? 'billing'
  return { category: inferred, name: raw }
}

function isMissingCategoryError(error: any): boolean {
  const message = error?.message?.toLowerCase?.()
  return (
    typeof message === 'string' &&
    message.includes('category') &&
    message.includes('payment_methods')
  )
}

async function upsertLegacyTerm(
  supabase: ReturnType<typeof createClient>,
  category: PaymentCategory,
  name: string,
  makeActive = true
) {
  const encoded = encodeLegacyName(category, name)
  const { data: existing, error: selectError } = await supabase
    .from('payment_methods')
    .select('id')
    .eq('name', encoded)
    .maybeSingle()

  if (selectError && selectError.message) {
    throw new Error(selectError.message)
  }

  if (existing) {
    const { error: updateError } = await supabase
      .from('payment_methods')
      .update({ is_active: makeActive } as any)
      .eq('id', existing.id)
    if (updateError) {
      throw new Error(updateError.message)
    }
  } else {
    const { error: insertError } = await supabase
      .from('payment_methods')
      .insert({ name: encoded, is_active: makeActive } as any)
    if (insertError) {
      throw new Error(insertError.message)
    }
  }
}

async function createTermAction(category: PaymentCategory, formData: FormData) {
  'use server'
  const name = (formData.get('name') as string)?.trim()
  if (!name) {
    revalidatePath('/dashboard/admin/materials/settings/payment-methods')
    return
  }
  const supabase = createClient()
  const sortOrder = Number(formData.get('sort_order') || 0) || 0

  const { error } = await supabase.from('payment_methods').upsert(
    {
      name,
      category,
      is_active: true,
      sort_order: sortOrder,
    } as any,
    { onConflict: 'name,category' }
  )

  if (error) {
    if (isMissingCategoryError(error)) {
      try {
        await upsertLegacyTerm(supabase, category, name)
      } catch (legacyError) {
        console.error('[payment-methods] createTermAction legacy error:', legacyError)
        throw legacyError
      }
    } else {
      console.error('[payment-methods] createTermAction error:', error)
      throw new Error(error.message)
    }
  }
  revalidatePath('/dashboard/admin/materials/settings/payment-methods')
}

async function updateTermAction(category: PaymentCategory, formData: FormData) {
  'use server'
  const id = (formData.get('id') as string) || ''
  const name = (formData.get('name') as string)?.trim()
  if (!id || !name) {
    revalidatePath('/dashboard/admin/materials/settings/payment-methods')
    return
  }
  const supabase = createClient()
  const { error } = await supabase
    .from('payment_methods')
    .update({ name } as any)
    .eq('id', id)
    .eq('category', category)

  if (error) {
    if (isMissingCategoryError(error)) {
      try {
        const encoded = encodeLegacyName(category, name)
        const { error: legacyError } = await supabase
          .from('payment_methods')
          .update({ name: encoded } as any)
          .eq('id', id)
        if (legacyError) {
          throw new Error(legacyError.message)
        }
      } catch (legacyError) {
        console.error('[payment-methods] updateTermAction legacy error:', legacyError)
        throw legacyError
      }
    } else {
      console.error('[payment-methods] updateTermAction error:', error)
      throw new Error(error.message)
    }
  }
  revalidatePath('/dashboard/admin/materials/settings/payment-methods')
}

async function toggleTermAction(category: PaymentCategory, formData: FormData) {
  'use server'
  const id = (formData.get('id') as string) || ''
  const next = (formData.get('next') as string) === 'true'
  if (!id) {
    revalidatePath('/dashboard/admin/materials/settings/payment-methods')
    return
  }
  const supabase = createClient()
  const { error } = await supabase
    .from('payment_methods')
    .update({ is_active: next } as any)
    .eq('id', id)
    .eq('category', category)

  if (error) {
    if (isMissingCategoryError(error)) {
      try {
        const { error: legacyError } = await supabase
          .from('payment_methods')
          .update({ is_active: next } as any)
          .eq('id', id)
        if (legacyError) {
          throw new Error(legacyError.message)
        }
      } catch (legacyError) {
        console.error('[payment-methods] toggleTermAction legacy error:', legacyError)
        throw legacyError
      }
    } else {
      console.error('[payment-methods] toggleTermAction error:', error)
      throw new Error(error.message)
    }
  }
  revalidatePath('/dashboard/admin/materials/settings/payment-methods')
}

async function deleteTermAction(category: PaymentCategory, formData: FormData) {
  'use server'
  const id = (formData.get('id') as string) || ''
  if (!id) {
    revalidatePath('/dashboard/admin/materials/settings/payment-methods')
    return
  }
  const supabase = createClient()
  const { error } = await supabase
    .from('payment_methods')
    .delete()
    .eq('id', id)
    .eq('category', category)

  if (error) {
    if (isMissingCategoryError(error)) {
      try {
        const { error: legacyError } = await supabase.from('payment_methods').delete().eq('id', id)
        if (legacyError) {
          throw new Error(legacyError.message)
        }
      } catch (legacyError) {
        console.error('[payment-methods] deleteTermAction legacy error:', legacyError)
        throw legacyError
      }
    } else {
      console.error('[payment-methods] deleteTermAction error:', error)
      throw new Error(error.message)
    }
  }
  revalidatePath('/dashboard/admin/materials/settings/payment-methods')
}

const CATEGORY_META: Record<
  PaymentCategory,
  {
    title: string
    description: string
    placeholder: string
    icon: any
    iconColor: string
    bgColor: string
  }
> = {
  billing: {
    title: '청구방식 관리',
    description: '즉시청구, 월말청구 등 출고 금액 청구 방식을 관리합니다.',
    placeholder: '예: 분기청구',
    icon: Receipt,
    iconColor: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  shipping: {
    title: '배송방식 관리',
    description: '택배, 화물, 직접 등 배송 방식을 관리합니다.',
    placeholder: '예: 퀵서비스',
    icon: Truck,
    iconColor: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
  },
  freight: {
    title: '선불/착불 방식 관리',
    description: '운임 결제 방식(선불, 착불 등)을 관리합니다.',
    placeholder: '예: 부분선불',
    icon: CreditCard,
    iconColor: 'text-amber-600',
    bgColor: 'bg-amber-50',
  },
}

function sortMethods(items: PaymentMethod[]): PaymentMethod[] {
  return [...items].sort((a, b) => {
    const orderA = a.sort_order ?? 0
    const orderB = b.sort_order ?? 0
    if (orderA === orderB) {
      return a.name.localeCompare(b.name, 'ko')
    }
    return orderA - orderB
  })
}

export default async function PaymentMethodsListPage() {
  await requireAdminProfile()
  const supabase = createClient()
  const categories: PaymentCategory[] = ['billing', 'shipping', 'freight']

  let supportsCategory = true
  let records: any[] = []

  const { data, error } = await supabase
    .from('payment_methods')
    .select('id, name, category, is_active, sort_order')
    .in('category', categories)
    .order('category', { ascending: true })
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })

  if (error) {
    const message = error.message?.toLowerCase() || ''
    if (message.includes('category') && message.includes('payment_methods')) {
      supportsCategory = false
      const legacy = await supabase
        .from('payment_methods')
        .select('id, name, is_active')
        .order('name', { ascending: true })
      records = legacy.data || []
    } else {
      throw error
    }
  } else {
    const rows = data || []
    // Fallback: category column exists but legacy rows have NULL category → use legacy decoding
    const allMissingCategory = rows.length === 0 || rows.every((r: any) => r?.category == null)
    if (allMissingCategory) {
      supportsCategory = false
      const legacy = await supabase
        .from('payment_methods')
        .select('id, name, is_active')
        .order('name', { ascending: true })
      records = legacy.data || []
    } else {
      records = rows
    }
  }

  const grouped = new Map<PaymentCategory, PaymentMethod[]>()
  categories.forEach(cat => grouped.set(cat, []))
  for (const item of records) {
    if (supportsCategory) {
      const list = grouped.get(item.category as PaymentCategory)
      if (list) {
        list.push({
          id: item.id,
          name: item.name,
          is_active: item.is_active,
          sort_order: item.sort_order,
        })
      }
    } else {
      const decoded = decodeLegacyName(item.name)
      const list = grouped.get(decoded.category)
      if (list) {
        list.push({
          id: item.id,
          name: decoded.name,
          legacy_name: item.name,
          is_active: item.is_active,
          sort_order: null,
        })
      }
    }
  }

  return (
    <div className="px-0 pb-12 space-y-6">
      <PageHeader
        title="배송 및 결제 옵션 관리"
        description="출고 업무에 사용되는 청구, 배송, 운임 결제 기준 정보를 통합 관리합니다."
        breadcrumbs={[
          { label: '대시보드', href: '/dashboard/admin' },
          { label: '자재 관리', href: '/dashboard/admin/materials' },
          { label: '설정', href: '/dashboard/admin/materials/settings' },
          { label: '배송결제방식 관리' },
        ]}
      />

      <Card className="rounded-3xl border-gray-200 shadow-sm shadow-gray-200/50 overflow-hidden mx-4 sm:mx-6 lg:mx-8">
        <CardHeader className="border-b border-gray-100 bg-gradient-to-b from-gray-50/50 to-transparent pb-6 px-8 py-10 flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-2xl font-black text-[#1A254F] tracking-tight">
              결제 및 배송 구성
            </CardTitle>
            <CardDescription className="text-sm font-medium text-slate-500 mt-1">
              시스템 전체의 물류 결제 엔진 옵션을 구성합니다.
            </CardDescription>
          </div>
          <Button
            asChild
            variant="outline"
            className="h-10 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 font-bold px-5 transition-all gap-2"
          >
            <Link href="/dashboard/admin/materials/settings">
              <span>뒤로가기</span>
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="p-8 space-y-12">
          {categories.map(category => {
            const meta = CATEGORY_META[category]
            const items = sortMethods(grouped.get(category) || [])
            const Icon = meta.icon

            return (
              <section
                key={category}
                className="rounded-2xl border border-slate-100 bg-slate-50/30 p-6 shadow-sm border-slate-200"
              >
                <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        'w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm',
                        meta.bgColor
                      )}
                    >
                      <Icon className={cn('w-6 h-6', meta.iconColor)} />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-[#1A254F] tracking-tight">
                        {meta.title}
                      </h2>
                      <p className="text-sm font-medium text-slate-400">{meta.description}</p>
                    </div>
                  </div>

                  <form
                    action={createTermAction.bind(null, category)}
                    className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm w-full md:w-auto"
                  >
                    <Input
                      name="name"
                      placeholder={meta.placeholder}
                      className="border-none bg-transparent h-9 px-3 text-sm font-bold focus-visible:ring-0 w-full md:w-48"
                      required
                    />
                    <input type="hidden" name="sort_order" value={items.length * 10 + 10} />
                    <Button
                      type="submit"
                      size="compact"
                      className="h-9 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 gap-2 shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      <span>추가</span>
                    </Button>
                  </form>
                </div>

                <div className="rounded-2xl border border-slate-100 overflow-hidden bg-white shadow-sm">
                  <Table>
                    <TableHeader className="bg-[#8da0cd]">
                      <TableRow className="hover:bg-transparent border-none">
                        <TableHead className="text-white font-bold text-[11px] uppercase tracking-tighter pl-8">
                          항목명
                        </TableHead>
                        <TableHead className="text-white font-bold text-[11px] uppercase tracking-tighter w-[120px] text-center">
                          상태
                        </TableHead>
                        <TableHead className="text-white font-bold text-[11px] uppercase tracking-tighter w-[240px] text-center pr-8">
                          관리 동작
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={3} className="py-20">
                            <EmptyState description="등록된 항목이 없습니다." />
                          </TableCell>
                        </TableRow>
                      )}
                      {items.map(item => (
                        <TableRow key={item.id} className="hover:bg-slate-50/50 transition-colors">
                          <TableCell className="pl-8 py-4">
                            <form
                              action={updateTermAction.bind(null, category)}
                              className="flex items-center gap-2"
                            >
                              <input type="hidden" name="id" value={item.id} />
                              <Input
                                name="name"
                                defaultValue={item.name}
                                className="h-9 border-slate-200 focus:ring-blue-500/20 font-bold text-[#1A254F] w-full md:w-64 rounded-lg px-3"
                                required
                              />
                              <Button
                                type="submit"
                                variant="ghost"
                                size="compact"
                                className="h-9 rounded-lg text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-bold px-3 border border-blue-100"
                              >
                                갱신
                              </Button>
                            </form>
                          </TableCell>
                          <TableCell className="text-center">
                            {item.is_active ? (
                              <Badge className="bg-emerald-50 text-emerald-600 border-none font-bold text-[10px] rounded-lg h-5 px-2 shadow-none">
                                활성
                              </Badge>
                            ) : (
                              <Badge className="bg-slate-50 text-slate-300 border-none font-bold text-[10px] rounded-lg h-5 px-2 shadow-none">
                                비활성
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="pr-8">
                            <div className="flex flex-wrap items-center justify-center gap-2">
                              <form action={toggleTermAction.bind(null, category)}>
                                <input type="hidden" name="id" value={item.id} />
                                <input
                                  type="hidden"
                                  name="next"
                                  value={item.is_active ? 'false' : 'true'}
                                />
                                <Button
                                  type="submit"
                                  variant="ghost"
                                  size="compact"
                                  className={cn(
                                    'h-8 rounded-lg font-bold px-3 border flex gap-2 items-center',
                                    item.is_active
                                      ? 'text-slate-500 border-slate-200 hover:bg-slate-50'
                                      : 'text-emerald-600 border-emerald-100 hover:bg-emerald-50'
                                  )}
                                >
                                  <Power className="w-3.5 h-3.5" />
                                  <span>{item.is_active ? '사용 중지' : '사용'}</span>
                                </Button>
                              </form>
                              <form action={deleteTermAction.bind(null, category)}>
                                <input type="hidden" name="id" value={item.id} />
                                <Button
                                  type="submit"
                                  variant="ghost"
                                  size="compact"
                                  className="h-8 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50 font-bold px-3 border border-rose-100 flex gap-2 items-center"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>삭제</span>
                                </Button>
                              </form>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </section>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
