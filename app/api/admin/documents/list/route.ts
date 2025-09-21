import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { getDocuments } from '@/app/actions/admin/documents'
import type { DocumentType } from '@/types/documents'
import type { ApprovalStatus } from '@/types'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const page = Number.parseInt(searchParams.get('page') || '1', 10)
  const limit = Number.parseInt(searchParams.get('limit') || '10', 10)
  const search = searchParams.get('search') || ''
  const typeParam = (searchParams.get('type') || '') as DocumentType | ''
  const statusParam = (searchParams.get('approval_status') || '') as ApprovalStatus | ''
  const siteId = searchParams.get('site_id') || undefined

  const pageNumber = Number.isFinite(page) && page > 0 ? page : 1
  const limitNumber = Number.isFinite(limit) && limit > 0 ? limit : 10
  const documentType = typeParam && typeParam !== 'all' ? (typeParam as DocumentType) : undefined
  const approvalStatus =
    statusParam && statusParam !== 'all' ? (statusParam as ApprovalStatus) : undefined

  const usingStubData = !process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!usingStubData) {
    const authResult = await requireApiAuth()

    if (authResult instanceof NextResponse) {
      return authResult
    }

    if (!authResult.role || !['admin', 'system_admin'].includes(authResult.role)) {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
    }
  }

  const result = await getDocuments(
    pageNumber,
    limitNumber,
    search,
    documentType,
    approvalStatus,
    siteId
  )

  if (process.env.NODE_ENV === 'development') {
    console.info('[api/admin/documents/list] result summary', {
      success: result.success,
      total: result.data?.total,
      pages: result.data?.pages,
      returned: result.data?.documents?.length,
      usingStubData,
    })
  }
  return NextResponse.json(result, { status: result.success ? 200 : 500 })
}
