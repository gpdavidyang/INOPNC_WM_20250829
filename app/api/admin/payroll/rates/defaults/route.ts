import { NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const EMPLOYMENT_TYPES = ['freelancer', 'daily_worker', 'regular_employee'] as const
type EmploymentType = (typeof EMPLOYMENT_TYPES)[number]

const RATE_FIELD_CONFIG = [
  { field: 'income_tax_rate', taxName: '소득세' },
  { field: 'pension_rate', taxName: '국민연금' },
  { field: 'health_insurance_rate', taxName: '건강보험' },
  { field: 'employment_insurance_rate', taxName: '고용보험' },
] as const

type RateField = (typeof RATE_FIELD_CONFIG)[number]['field']

type RateValues = Record<RateField, number>

type NormalizedRate = RateValues & {
  employment_type: EmploymentType
}

const EMPTY_RATE_VALUES: RateValues = {
  income_tax_rate: 0,
  pension_rate: 0,
  health_insurance_rate: 0,
  employment_insurance_rate: 0,
}

const TAX_NAME_ALIASES: Record<string, RateField> = {
  소득세: 'income_tax_rate',
  '소득세(근로자)': 'income_tax_rate',
  income_tax: 'income_tax_rate',
  income_tax_rate: 'income_tax_rate',
  근로소득세: 'income_tax_rate',
  국민연금: 'pension_rate',
  '국민연금(근로자)': 'pension_rate',
  national_pension: 'pension_rate',
  pension: 'pension_rate',
  pension_rate: 'pension_rate',
  건강보험: 'health_insurance_rate',
  '건강보험(근로자)': 'health_insurance_rate',
  health_insurance: 'health_insurance_rate',
  health_insurance_rate: 'health_insurance_rate',
  고용보험: 'employment_insurance_rate',
  employment_insurance: 'employment_insurance_rate',
  employment_insurance_rate: 'employment_insurance_rate',
}

const isValidEmploymentType = (value: any): value is EmploymentType =>
  typeof value === 'string' && (EMPLOYMENT_TYPES as readonly string[]).includes(value)

const toRateNumber = (value: any): number => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const mapTaxNameToField = (taxName: any): RateField | null => {
  if (!taxName) return null
  const raw = String(taxName).trim()
  const alias = TAX_NAME_ALIASES[raw] ?? TAX_NAME_ALIASES[raw.toLowerCase()]
  if (alias) return alias
  if (raw.includes('국민연금')) return 'pension_rate'
  if (raw.includes('건강보험')) return 'health_insurance_rate'
  if (raw.includes('고용보험')) return 'employment_insurance_rate'
  if (raw.includes('소득세')) return 'income_tax_rate'
  const lower = raw.toLowerCase()
  if (lower.includes('pension')) return 'pension_rate'
  if (lower.includes('health')) return 'health_insurance_rate'
  if (lower.includes('employment')) return 'employment_insurance_rate'
  if (lower.includes('income')) return 'income_tax_rate'
  return null
}

const normalizeItem = (item: any): NormalizedRate | null => {
  if (!isValidEmploymentType(item?.employment_type)) return null
  return {
    employment_type: item.employment_type,
    income_tax_rate: toRateNumber(item.income_tax_rate ?? item.income_tax),
    pension_rate: toRateNumber(item.pension_rate ?? item.national_pension),
    health_insurance_rate: toRateNumber(item.health_insurance_rate ?? item.health_insurance),
    employment_insurance_rate: toRateNumber(
      item.employment_insurance_rate ?? item.employment_insurance
    ),
  }
}

const dedupeRates = (items: NormalizedRate[]): NormalizedRate[] => {
  const byType = new Map<EmploymentType, NormalizedRate>()
  items.forEach(item => {
    byType.set(item.employment_type, item)
  })
  return Array.from(byType.values())
}

const normalizePayload = (body: any): NormalizedRate[] => {
  if (!body) return []

  if (Array.isArray(body.items)) {
    return dedupeRates(
      body.items
        .filter(item => !!item && typeof item === 'object')
        .map((item: any) => normalizeItem(item))
        .filter((item): item is NormalizedRate => item !== null)
    )
  }

  if (Array.isArray(body)) {
    return dedupeRates(
      body
        .filter(item => !!item && typeof item === 'object')
        .map((item: any) => normalizeItem(item))
        .filter((item): item is NormalizedRate => item !== null)
    )
  }

  if (body.rates && typeof body.rates === 'object') {
    return dedupeRates(
      EMPLOYMENT_TYPES.map(employment_type =>
        normalizeItem({
          employment_type,
          ...body.rates[employment_type],
        })
      ).filter((item): item is NormalizedRate => item !== null)
    )
  }

  if (body.employment_type) {
    const item = normalizeItem(body)
    return item ? [item] : []
  }

  return []
}

export async function GET() {
  const auth = await requireApiAuth()
  if (auth instanceof NextResponse) return auth
  if (!['admin', 'system_admin'].includes(auth.role || '')) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  }
  const supabase = createClient()
  const baseQuery = supabase.from('employment_tax_rates').select('*')
  const { data, error } = await baseQuery.eq('is_active', true)

  let rows = data
  if (error) {
    const needsFallback =
      typeof error.message === 'string' && error.message.toLowerCase().includes('is_active')

    if (!needsFallback) {
      return NextResponse.json({ success: false, error: 'Query failed' }, { status: 500 })
    }

    const fallback = await supabase.from('employment_tax_rates').select('*')
    if (fallback.error) {
      return NextResponse.json({ success: false, error: 'Query failed' }, { status: 500 })
    }
    rows = fallback.data
  }

  const ratesByType = EMPLOYMENT_TYPES.reduce(
    (acc, employment_type) => {
      acc[employment_type] = { ...EMPTY_RATE_VALUES }
      return acc
    },
    {} as Record<EmploymentType, RateValues>
  )

  ;(rows || []).forEach(row => {
    const employmentType = row?.employment_type
    if (!isValidEmploymentType(employmentType)) return

    const fieldFromTaxName = mapTaxNameToField(row?.tax_name)
    if (fieldFromTaxName) {
      const value = row?.rate ?? row?.value ?? row?.percentage ?? row?.[fieldFromTaxName] ?? 0
      ratesByType[employmentType][fieldFromTaxName] = toRateNumber(value)
      return
    }

    RATE_FIELD_CONFIG.forEach(({ field }) => {
      if (row?.[field] !== undefined && row?.[field] !== null) {
        ratesByType[employmentType][field] = toRateNumber(row[field])
      }
    })
  })

  return NextResponse.json({ success: true, data: { rates: ratesByType } })
}

export async function POST(request: Request) {
  const auth = await requireApiAuth()
  if (auth instanceof NextResponse) return auth
  if (!['admin', 'system_admin'].includes(auth.role || '')) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  }
  try {
    const body = await request.json().catch(() => ({}))
    const payload = normalizePayload(body)

    if (!payload.length) {
      return NextResponse.json(
        { success: false, error: 'No valid rate payload provided' },
        { status: 400 }
      )
    }

    const supabase = createClient()
    const now = new Date().toISOString()

    for (const item of payload) {
      for (const { field, taxName } of RATE_FIELD_CONFIG) {
        const rateValue = toRateNumber(item[field])
        const { error: updateError, data: updated } = await supabase
          .from('employment_tax_rates')
          .update({
            rate: rateValue,
            calculation_method: 'percentage',
            is_active: true,
            updated_at: now,
          })
          .eq('employment_type', item.employment_type)
          .eq('tax_name', taxName)
          .select('id')

        if (updateError) {
          console.error('[defaults][POST] update error', updateError)
          return NextResponse.json({ success: false, error: 'Upsert failed' }, { status: 500 })
        }

        if (!updated || updated.length === 0) {
          const { error: insertError } = await supabase.from('employment_tax_rates').insert({
            employment_type: item.employment_type,
            tax_name: taxName,
            rate: rateValue,
            calculation_method: 'percentage',
            is_active: true,
            created_at: now,
            updated_at: now,
          })

          if (insertError) {
            console.error('[defaults][POST] insert error', insertError)
            return NextResponse.json({ success: false, error: 'Upsert failed' }, { status: 500 })
          }
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('[defaults][POST] error', e)
    return NextResponse.json(
      { success: false, error: e?.message || 'Internal error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  return POST(request)
}
