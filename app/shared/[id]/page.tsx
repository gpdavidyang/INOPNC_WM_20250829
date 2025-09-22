import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import SharedDocumentViewer from '@/components/shared/SharedDocumentViewer'
import { createClient } from '@/lib/supabase/server'
import { getAuthForClient } from '@/lib/auth/ultra-simple'
import type { SharedDocument } from '@/types/shared-documents'

interface SharedDocumentPageProps {
  params: { id: string }
  searchParams: { token?: string }
}

export const dynamic = 'force-dynamic'

async function verifyToken(
  documentId: string,
  token: string,
  supabase: ReturnType<typeof createClient>
) {
  const { data: tokenRow } = await supabase
    .from('document_share_tokens')
    .select('id, allow_download, expires_at, used_count, max_uses')
    .eq('document_id', documentId)
    .eq('token', token)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()

  if (!tokenRow) {
    return { valid: false as const, allowDownload: true }
  }

  if (typeof tokenRow.max_uses === 'number' && tokenRow.used_count >= tokenRow.max_uses) {
    return { valid: false as const, allowDownload: tokenRow.allow_download }
  }

  // Increment usage count (fire and forget)
  await supabase
    .from('document_share_tokens')
    .update({ used_count: (tokenRow.used_count ?? 0) + 1 })
    .eq('id', tokenRow.id)

  return { valid: true as const, allowDownload: tokenRow.allow_download }
}

async function hasUserAccess(
  documentId: string,
  supabase: ReturnType<typeof createClient>
) {
  const auth = await getAuthForClient(supabase)

  if (!auth) return { granted: false as const, userId: null }

  const { data: permissionResult } = await supabase.rpc('check_document_permission', {
    p_document_id: documentId,
    p_user_id: auth.userId,
    p_permission_type: 'view',
  } as unknown)

  return {
    granted: Boolean(permissionResult),
    userId: auth.userId,
  }
}

export default async function SharedDocumentPage({
  params,
  searchParams,
}: SharedDocumentPageProps) {
  const supabase = createClient()
  const shareToken = searchParams.token

  const { data: document, error } = await supabase
    .from('shared_documents')
    .select(
      `
      *,
      sites(name, address),
      profiles:profiles!shared_documents_uploaded_by_fkey(name, email)
    `
    )
    .eq('id', params.id)
    .maybeSingle()

  if (error || !document) {
    notFound()
  }

  let hasAccess = Boolean(document.is_public)
  let allowDownload = true

  if (!hasAccess && shareToken) {
    const tokenResult = await verifyToken(params.id, shareToken, supabase)
    hasAccess = tokenResult.valid
    allowDownload = tokenResult.allowDownload
  }

  if (!hasAccess) {
    const permissionResult = await hasUserAccess(params.id, supabase)
    hasAccess = permissionResult.granted
    if (!hasAccess) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
            <h1 className="text-xl font-semibold text-gray-900">접근 권한이 필요합니다</h1>
            <p className="mt-4 text-sm text-gray-600">
              공유 링크가 만료되었거나 이 문서에 대한 권한이 없습니다. 링크를 제공한 관리자에게
              문의해주세요.
            </p>
          </div>
        </div>
      )
    }
  }

  const viewerDocument = document as SharedDocument & {
    sites?: { name: string; address?: string } | null
    profiles?: { name: string; email: string } | null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6">
      <SharedDocumentViewer
        document={viewerDocument}
        token={shareToken}
        allowDownload={allowDownload}
      />
    </div>
  )
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const supabase = createClient()

  const { data: document } = await supabase
    .from('shared_documents')
    .select('title, description')
    .eq('id', params.id)
    .maybeSingle()

  if (!document) {
    return {
      title: '문서를 찾을 수 없습니다',
    }
  }

  return {
    title: `공유 문서: ${document.title}`,
    description: document.description || '공유된 문서입니다.',
  }
}
