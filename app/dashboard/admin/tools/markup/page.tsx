import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { getMarkupDocuments } from '@/app/actions/admin/markup'
import ToolPageClient from './ToolPageClient'

export const metadata: Metadata = {
  title: '도면마킹 관리',
}

export default async function AdminMarkupToolPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>
}) {
  await requireAdminProfile()

  // Launcher: recent docs and quick start
  const result = await getMarkupDocuments(1, 10)
  const docs = result.success && result.data ? (result.data as any).documents : []

  return <ToolPageClient docs={docs} />
}
