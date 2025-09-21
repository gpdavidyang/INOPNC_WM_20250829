import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

type DocumentSummary = {
  id: string
  title: string
  type: string
  approval_status: 'pending' | 'approved' | 'rejected'
  site_id?: string
  created_at: string
}

const STUB_DOCUMENTS: DocumentSummary[] = [
  {
    id: 'doc-1',
    title: '안전 교육 자료',
    type: 'safety',
    approval_status: 'approved',
    created_at: new Date().toISOString(),
  },
  {
    id: 'doc-2',
    title: '현장 점검 보고서',
    type: 'inspection',
    approval_status: 'pending',
    created_at: new Date().toISOString(),
  },
]

export async function GET() {
  const payload = {
    success: true,
    data: {
      documents: STUB_DOCUMENTS,
      total: STUB_DOCUMENTS.length,
      pages: 1,
    },
  }

  return NextResponse.json(payload)
}
