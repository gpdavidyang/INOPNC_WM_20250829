import { createClient } from "@/lib/supabase/server"
import { notFound } from 'next/navigation'

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
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-4">{document.title}</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{document.description}</p>
          <div className="text-sm text-gray-500">
            <p>사이트: {document.sites?.name}</p>
            <p>업로드: {document.profiles?.name} ({document.profiles?.email})</p>
          </div>
        </div>
      </div>
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