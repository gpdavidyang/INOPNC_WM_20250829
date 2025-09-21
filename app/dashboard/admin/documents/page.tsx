import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { getDocuments } from '@/app/actions/admin/documents'
import { DocumentsContent } from '@/components/admin/documents/DocumentsContent'
import { ADMIN_DOCUMENTS_STUB } from '@/lib/admin/stub-data'

export const metadata: Metadata = {
  title: '문서 관리',
}

const DEFAULT_PAGE_SIZE = 10

export default async function AdminDocumentsPage() {
  await requireAdminProfile()
  const useStubData = !process.env.SUPABASE_SERVICE_ROLE_KEY
  const initialResult = await getDocuments(1, DEFAULT_PAGE_SIZE)

  const initialDocuments = useStubData
    ? ADMIN_DOCUMENTS_STUB.slice(0, DEFAULT_PAGE_SIZE)
    : initialResult.success
      ? (initialResult.data?.documents ?? [])
      : []

  const initialTotal = useStubData
    ? ADMIN_DOCUMENTS_STUB.length
    : initialResult.success
      ? (initialResult.data?.total ?? 0)
      : 0

  const initialPages = useStubData
    ? Math.max(Math.ceil(initialTotal / DEFAULT_PAGE_SIZE), 1)
    : initialResult.success
      ? (initialResult.data?.pages ?? 1)
      : 1

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <DocumentsContent
        initialDocuments={initialDocuments}
        initialTotal={initialTotal}
        initialPages={initialPages}
        pageSize={DEFAULT_PAGE_SIZE}
        initialLoadErrored={!initialResult.success}
      />
    </div>
  )
}
