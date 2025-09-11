'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface DocumentsPageProps {
  searchParams: { [key: string]: string | string[] | undefined }
}

export default function DocumentsPage({ searchParams }: DocumentsPageProps) {
  const router = useRouter()
  
  useEffect(() => {
    // Client-side navigation to documents tab to avoid server redirect loops
    const search = searchParams?.search || ''
    const params = new URLSearchParams()
    if (search) params.set('search', search as string)
    
    const targetUrl = `/dashboard#documents-unified${params.toString() ? '?' + params.toString() : ''}`
    router.replace(targetUrl)
  }, [searchParams, router])
  
  // Show loading state while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-4 text-gray-600">문서함으로 이동 중...</p>
      </div>
    </div>
  )
}