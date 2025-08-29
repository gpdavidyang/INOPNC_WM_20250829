import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SharedDocumentViewer from '@/components/shared/SharedDocumentViewer'

interface SharedDocumentPageProps {
  params: { id: string }
  searchParams: { token?: string }
}

export default async function SharedDocumentPage({ 
  params, 
  searchParams 
}: SharedDocumentPageProps) {
  const supabase = createClient()

  // Verify document exists and is accessible
  const { data: document, error } = await supabase
    .from('shared_documents')
    .select(`
      *,
      sites(name, address),
      profiles!shared_documents_uploaded_by_fkey(name, email)
    `)
    .eq('id', params.id)
    .eq('is_deleted', false)
    .single()

  if (error || !document) {
    notFound()
  }

  // TODO: Validate sharing token if required
  // In a production system, you'd verify the token here
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <SharedDocumentViewer 
        document={document} 
        token={searchParams.token}
      />
    </div>
  )
}

// Generate metadata for the shared document
export async function generateMetadata({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const { data: document } = await supabase
    .from('shared_documents')
    .select('title, description')
    .eq('id', params.id)
    .single()

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