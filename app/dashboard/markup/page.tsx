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
  const embedded = searchParams.get('embedded') === 'true'

  const supabase = createClient()


  useEffect(() => {
    let isCancelled = false
    
    const loadData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (isCancelled) return
        
        if (!user) {
          router.push('/auth/login')
          return
        }

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (isCancelled) return

        if (error || !profile) {
          console.error('Error loading profile:', error)
          return
        }

        setProfile(profile as any)
      } catch (error) {
        if (!isCancelled) {
          console.error('Error loading profile:', error)
        }
      } finally {
        if (!isCancelled) {
          setLoading(false)
        }
      }
    }
    
    loadData()
    
    return () => {
      isCancelled = true
    }
  }, []) // Only run once on mount

  useEffect(() => {
    let isCancelled = false
    
    if (fileId && profile) {
      const loadDoc = async () => {
        try {
          if (isCancelled) return
          setDocumentLoading(true)
          console.log('Loading document:', fileId)
          const response = await fetch(`/api/markup-documents/${fileId}`)
          const result = await response.json()

          if (isCancelled) return

          if (result.success && result.data) {
            console.log('Document loaded:', result.data)
            setDocumentToOpen(result.data)
          } else {
            console.error('Failed to load document:', result.error)
          }
        } catch (error) {
          if (!isCancelled) {
            console.error('Error loading document:', error)
          }
        } finally {
          if (!isCancelled) {
            setDocumentLoading(false)
          }
        }
      }
      
      loadDoc()
    }
    
    return () => {
      isCancelled = true
    }
  }, [fileId, profile])

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
    <div className={embedded ? 'h-full' : ''}>
      <MarkupEditor
        profile={profile}
        onClose={embedded ? undefined : handleClose}
        initialFile={documentToOpen}
        blueprintUrl={documentToOpen?.original_blueprint_url || documentToOpen?.file_url}
        initialView={mode === 'edit' || (fileId && documentToOpen) || view === 'upload' ? 'editor' : 'list'}
        embedded={embedded}
      />
    </div>
  )
}