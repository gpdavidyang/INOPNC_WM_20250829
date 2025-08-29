import { redirect } from 'next/navigation'

interface DocumentsPageProps {
  searchParams: { [key: string]: string | string[] | undefined }
}

export default function DocumentsPage({ searchParams }: DocumentsPageProps) {
  // Server-side redirect to documents tab
  const search = searchParams?.search || ''
  const params = new URLSearchParams()
  if (search) params.set('search', search as string)
  
  const targetUrl = `/dashboard#documents-unified${params.toString() ? '?' + params.toString() : ''}`
  redirect(targetUrl)
}