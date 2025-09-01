'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types'
import MarkupEditor from '@/components/markup/markup-editor'

export default function MarkupPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [documentLoading, setDocumentLoading] = useState(false)
  const [documentToOpen, setDocumentToOpen] = useState<any>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const fileId = searchParams.get('file') || searchParams.get('open') || searchParams.get('document')
  const view = searchParams.get('view')
  const mode = searchParams.get('mode')

  const supabase = createClient()

  const loadProfile = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error || !profile) {
        console.error('Error loading profile:', error)
        return
      }

      setProfile(profile as any)
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase, router])

  const loadDocument = useCallback(async (documentId: string) => {
    try {
      setDocumentLoading(true)
      console.log('Loading document:', documentId)
      const response = await fetch(`/api/markup-documents/${documentId}`)
      const result = await response.json()

      if (result.success && result.data) {
        console.log('Document loaded:', result.data)
        setDocumentToOpen(result.data)
      } else {
        console.error('Failed to load document:', result.error)
      }
    } catch (error) {
      console.error('Error loading document:', error)
    } finally {
      setDocumentLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  useEffect(() => {
    if (fileId && profile) {
      loadDocument(fileId)
    }
  }, [fileId, profile, loadDocument])

  const handleClose = () => {
    router.push('/dashboard')
  }

  if (loading || documentLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!profile) {
    return null
  }

  // 문서 ID가 있고 편집 모드인 경우, 문서가 로드될 때까지 대기
  if (fileId && mode === 'edit' && !documentToOpen) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">문서를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <MarkupEditor
      profile={profile}
      onClose={handleClose}
      initialFile={documentToOpen}
      blueprintUrl={documentToOpen?.original_blueprint_url}
      initialView={mode === 'edit' || (fileId && documentToOpen) || view === 'upload' ? 'editor' : 'list'}
    />
  )
}