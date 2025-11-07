import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/page-header'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import EmptyState from '@/components/ui/empty-state'

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
  { title: string; description: string; placeholder: string }
> = {
  billing: {
    title: '청구방식',
    description: '즉시청구, 월말청구 등 출고 금액 청구 방식을 관리합니다.',
    placeholder: '예: 분기청구',
  },
  shipping: {
    title: '배송방식',
    description: '택배, 화물, 직접 등 배송 방식을 관리합니다.',
    placeholder: '예: 퀵서비스',
  },
  freight: {
    title: '선불/착불 방식',
    description: '운임 결제 방식을 관리합니다.',
    placeholder: '예: 부분선불',
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
    <div className="px-0 pb-8">
      <PageHeader
        title="배송결제방식 관리"
        breadcrumbs={[
          { label: '대시보드', href: '/dashboard/admin' },
          { label: '자재 관리', href: '/dashboard/admin/materials' },
          { label: '설정', href: '/dashboard/admin/materials/settings' },
          { label: '배송결제방식 관리' },
        ]}
        showBackButton
        backButtonHref="/dashboard/admin/materials/settings"
      />

      <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {categories.map(category => {
          const meta = CATEGORY_META[category]
          const items = sortMethods(grouped.get(category) || [])
          return (
            <section key={category} className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">{meta.title}</h2>
                <p className="text-sm text-muted-foreground">{meta.description}</p>
              </div>

              <form
                action={createTermAction.bind(null, category)}
                className="flex flex-wrap items-center gap-2"
              >
                <input
                  name="name"
                  placeholder={meta.placeholder}
                  className="w-full md:w-64 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[--focus] focus:ring-offset-2"
                  required
                />
                <input type="hidden" name="sort_order" value={items.length * 10 + 10} />
                <button
                  type="submit"
                  className="inline-flex items-center rounded-md bg-[--brand-600] px-3 py-1.5 text-sm font-semibold text-white shadow-button transition-colors hover:bg-[--brand-700]"
                >
                  추가
                </button>
              </form>

              <div className="rounded-lg border bg-card p-4 shadow-sm overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[240px]">이름</TableHead>
                      <TableHead className="w-[100px]">사용</TableHead>
                      <TableHead className="w-[200px]">동작</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} className="py-10">
                          <EmptyState description="등록된 항목이 없습니다." />
                        </TableCell>
                      </TableRow>
                    )}
                    {items.map(item => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <form
                            action={updateTermAction.bind(null, category)}
                            className="flex flex-wrap items-center gap-2"
                          >
                            <input type="hidden" name="id" value={item.id} />
                            <input
                              name="name"
                              defaultValue={item.name}
                              className="w-full md:w-64 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[--focus] focus:ring-offset-2"
                              required
                            />
                            <button
                              type="submit"
                              className="inline-flex items-center rounded-md border border-[--brand-300] bg-white px-3 py-1.5 text-sm font-semibold text-[--brand-700] shadow-sm transition-colors hover:bg-[--neutral-50]"
                            >
                              수정
                            </button>
                          </form>
                        </TableCell>
                        <TableCell>{item.is_active ? '사용' : '중지'}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap items-center gap-2">
                            <form action={toggleTermAction.bind(null, category)}>
                              <input type="hidden" name="id" value={item.id} />
                              <input
                                type="hidden"
                                name="next"
                                value={item.is_active ? 'false' : 'true'}
                              />
                              <button
                                type="submit"
                                className="inline-flex items-center rounded-md border border-[--brand-400] px-3 py-1.5 text-sm font-semibold text-[--brand-700] transition-colors hover:bg-[--brand-300]/15"
                              >
                                {item.is_active ? '사용 중지' : '사용'}
                              </button>
                            </form>
                            <form action={deleteTermAction.bind(null, category)}>
                              <input type="hidden" name="id" value={item.id} />
                              <button
                                type="submit"
                                className="inline-flex items-center rounded-md bg-[--accent-600] px-3 py-1.5 text-sm font-semibold text-white shadow-button transition-colors hover:brightness-95"
                              >
                                삭제
                              </button>
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
      </div>
    </div>
  )
}
