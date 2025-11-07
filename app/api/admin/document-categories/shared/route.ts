import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import {
  DEFAULT_SHARED_DOCUMENT_CATEGORIES,
  normalizeSharedDocumentCategories,
  type SharedDocumentCategoryOption,
  generateSharedCategoryValue,
} from '@/lib/constants/shared-document-categories'
import { withAdminAuth, type AdminActionResult } from '@/app/actions/admin/common'
import {
  readDevSharedDocumentCategories,
  resetDevSharedDocumentCategories,
  writeDevSharedDocumentCategories,
} from '@/lib/dev/shared-document-category-store'

export const dynamic = 'force-dynamic'

const CONFIG_KEY = 'shared_document_categories'
const CONFIG_CATEGORY = 'documents_shared'

function isAdminRole(role?: string | null): boolean {
  if (!role) return false
  return role === 'admin' || role === 'system_admin'
}

function prepareCategoryOption(
  option: any,
  usedValues: string[]
): SharedDocumentCategoryOption | null {
  if (!option || typeof option !== 'object') return null

  const label =
    typeof option.label === 'string' && option.label.trim().length > 0 ? option.label.trim() : null

  if (!label) return null

  const preferredValue =
    typeof option.value === 'string' && option.value.trim().length > 0 ? option.value : undefined

  const value = generateSharedCategoryValue(label, usedValues, preferredValue)
  usedValues.push(value)

  return {
    value,
    label,
    description:
      typeof option.description === 'string' && option.description.trim().length > 0
        ? option.description.trim()
        : null,
  }
}

export async function GET() {
  const auth = await requireApiAuth()
  if (auth instanceof NextResponse) {
    return auth
  }

  if (!isAdminRole(auth.role)) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  const result = await withAdminAuth(async supabase => {
    const { data, error } = await supabase
      .from('system_configurations')
      .select('setting_value')
      .eq('setting_key', CONFIG_KEY)
      .maybeSingle()

    if (error && error.code !== 'PGRST116') {
      console.error('[shared-document-categories][GET] query failed:', error)
      return {
        success: false,
        error: 'Failed to load shared document categories',
        message: error.message,
      } satisfies AdminActionResult
    }

    const categories = normalizeSharedDocumentCategories(data?.setting_value)
    return {
      success: true,
      data: {
        categories,
        source: data?.setting_value ? 'custom' : 'default',
      },
    } satisfies AdminActionResult<{ categories: SharedDocumentCategoryOption[]; source: string }>
  })

  if (!result.success || !result.data) {
    if (process.env.NODE_ENV !== 'production') {
      const devCategories = await readDevSharedDocumentCategories()
      return NextResponse.json({
        success: true,
        data: devCategories,
        source: 'dev-fallback',
      })
    }

    return NextResponse.json(
      {
        error: result.error || 'Failed to load shared document categories',
        details: result.message,
      },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    data: result.data.categories,
    source: result.data.source,
  })
}

export async function PUT(request: NextRequest) {
  const auth = await requireApiAuth()
  if (auth instanceof NextResponse) {
    return auth
  }

  if (!isAdminRole(auth.role)) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const input = body && Array.isArray(body.categories) ? body.categories : null

  if (!input) {
    return NextResponse.json({ error: '유효한 카테고리 목록이 필요합니다.' }, { status: 400 })
  }

  const categories: SharedDocumentCategoryOption[] = []
  const usedValues: string[] = []
  let invalidCount = 0

  input.forEach(raw => {
    const option = prepareCategoryOption(raw, usedValues)
    if (option) categories.push(option)
    else invalidCount += 1
  })

  if (invalidCount > 0) {
    return NextResponse.json(
      { error: '모든 분류 항목에는 표시 이름이 필요합니다.' },
      { status: 400 }
    )
  }

  if (categories.length === 0) {
    return NextResponse.json({ error: '최소 1개 이상의 분류를 설정해야 합니다.' }, { status: 400 })
  }

  const timestamp = new Date().toISOString()

  const result = await withAdminAuth(async supabase => {
    const { data: updatedRows, error: updateError } = await supabase
      .from('system_configurations')
      .update({
        category: CONFIG_CATEGORY,
        setting_value: categories,
        data_type: 'json',
        description: '관리자가 정의한 공유문서 분류 목록',
        is_public: false,
        updated_at: timestamp,
      })
      .eq('setting_key', CONFIG_KEY)
      .select('setting_value')

    if (updateError) {
      console.error('[shared-document-categories][PUT] update failed:', updateError)
      return {
        success: false,
        error: '공유문서 분류를 저장할 수 없습니다.',
        message: updateError.message,
      } satisfies AdminActionResult
    }

    if (Array.isArray(updatedRows) && updatedRows.length > 0) {
      return {
        success: true,
        data: normalizeSharedDocumentCategories(updatedRows[0]?.setting_value ?? categories),
      } satisfies AdminActionResult<SharedDocumentCategoryOption[]>
    }

    const { error: insertError, data: insertedRows } = await supabase
      .from('system_configurations')
      .insert({
        category: CONFIG_CATEGORY,
        setting_key: CONFIG_KEY,
        setting_value: categories,
        data_type: 'json',
        description: '관리자가 정의한 공유문서 분류 목록',
        is_public: false,
        created_at: timestamp,
        updated_at: timestamp,
      })
      .select('setting_value')

    if (insertError) {
      console.error('[shared-document-categories][PUT] insert failed:', insertError)
      return {
        success: false,
        error: '공유문서 분류를 저장할 수 없습니다.',
        message: insertError.message,
      } satisfies AdminActionResult
    }

    const insertedValue =
      Array.isArray(insertedRows) && insertedRows[0]?.setting_value
        ? insertedRows[0]?.setting_value
        : categories

    return {
      success: true,
      data: normalizeSharedDocumentCategories(insertedValue),
    } satisfies AdminActionResult<SharedDocumentCategoryOption[]>
  })

  if (!result.success || !result.data) {
    if (process.env.NODE_ENV !== 'production') {
      await writeDevSharedDocumentCategories(categories)
      return NextResponse.json({
        success: true,
        data: normalizeSharedDocumentCategories(categories),
        message: '공유문서 분류가 저장되었습니다. (dev fallback)',
      })
    }

    return NextResponse.json(
      {
        error: result.error || '공유문서 분류를 저장할 수 없습니다.',
        details: result.message,
      },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    data: result.data,
    message: '공유문서 분류가 저장되었습니다.',
  })
}

export async function DELETE() {
  const auth = await requireApiAuth()
  if (auth instanceof NextResponse) {
    return auth
  }

  if (!isAdminRole(auth.role)) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  const result = await withAdminAuth(async supabase => {
    const { error } = await supabase
      .from('system_configurations')
      .delete()
      .eq('setting_key', CONFIG_KEY)

    if (error) {
      console.error('[shared-document-categories][DELETE] failed:', error)
      return {
        success: false,
        error: '공유문서 분류를 초기화할 수 없습니다.',
        message: error.message,
      } satisfies AdminActionResult
    }

    return {
      success: true,
      data: DEFAULT_SHARED_DOCUMENT_CATEGORIES,
    } satisfies AdminActionResult<SharedDocumentCategoryOption[]>
  })

  if (!result.success || !result.data) {
    if (process.env.NODE_ENV !== 'production') {
      const devCategories = await resetDevSharedDocumentCategories()
      return NextResponse.json({
        success: true,
        data: devCategories,
        message: '공유문서 분류가 기본값으로 초기화되었습니다. (dev fallback)',
      })
    }

    return NextResponse.json(
      {
        error: result.error || '공유문서 분류를 초기화할 수 없습니다.',
        details: result.message,
      },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    data: result.data,
    message: '공유문서 분류가 기본값으로 초기화되었습니다.',
  })
}
