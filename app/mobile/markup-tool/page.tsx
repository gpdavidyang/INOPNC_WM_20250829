'use client'

import { useState, useEffect, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter, useSearchParams } from 'next/navigation'
import { MobileLayout as MobileLayoutShell } from '@/modules/mobile/components/layout/MobileLayout'
import { SharedMarkupEditor } from '@/components/markup/SharedMarkupEditor'
import { DrawingBrowser } from '@/modules/mobile/components/markup/DrawingBrowser'
import { useUnifiedAuth } from '@/hooks/use-unified-auth'
import { ArrowLeft, FolderOpen } from 'lucide-react'
import { toast, Toaster } from 'sonner'
import type { MarkupObject } from '@/types/markup'

interface DrawingFile {
  id: string
  name: string
  size: number
  type: string
  url: string
  uploadDate: Date
}

export default function MarkupToolPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, profile, loading } = useUnifiedAuth()
  const queryClient = useQueryClient()
  const [drawingFile, setDrawingFile] = useState<DrawingFile | null>(null)
  const [markupDocument, setMarkupDocument] = useState<any>(null)
  const [showBrowser, setShowBrowser] = useState(false)
  const [selectedSite, setSelectedSite] = useState<{ id: string; name: string } | null>(null)

  const resolvedProfile = useMemo(() => {
    if (profile) return profile
    if (!user) return null

    const fallbackName =
      typeof user.user_metadata?.full_name === 'string' && user.user_metadata.full_name.trim()
        ? user.user_metadata.full_name.trim()
        : (user.email ?? '모바일 사용자')

    return {
      id: user.id,
      full_name: fallbackName,
      role: (user.user_metadata?.role as string) || 'worker',
      email: user.email ?? null,
      site_id: (user.user_metadata?.site_id as string) || null,
    }
  }, [profile, user])

  // URL 파라미터로 모드 확인
  const mode = searchParams.get('mode')
  const linkWorklogId = searchParams.get('worklogId')
  const siteIdParam = searchParams.get('siteId')
  const docIdParam = searchParams.get('docId')

  useEffect(() => {
    // 모드에 따라 초기 화면 설정
    if (mode === 'browse' || mode === 'upload') {
      setShowBrowser(true)
    }

    // URL 파라미터 기반 선택 현장 적용
    if (siteIdParam) {
      setSelectedSite(prev => (prev?.id ? prev : { id: siteIdParam, name: '' }))
      try {
        localStorage.setItem('selected_site', JSON.stringify({ id: siteIdParam, name: '' }))
      } catch (error) {
        console.warn('로컬 스토리지에 현장 정보를 저장하지 못했습니다.', error)
      }
    }

    // localStorage에서 선택된 도면 불러오기 (파라미터가 없을 때만)
    const tryLoadFromLocal = () => {
      const savedDrawing = localStorage.getItem('selected_drawing')
      if (savedDrawing) {
        try {
          const drawing = JSON.parse(savedDrawing)
          setDrawingFile(drawing)

          const markupData = drawing.markupData || drawing.markup_data || []
          setMarkupDocument({
            id: drawing.id,
            title: drawing.name || drawing.title,
            original_blueprint_url: drawing.url,
            markup_data: markupData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })

          if (mode === 'continue' && markupData.length > 0) {
            toast.info(`이전 작업을 계속합니다. (${markupData.length}개 마킹)`)
          }
          return true
        } catch (error) {
          console.error('Error parsing drawing data:', error)
          toast.error('도면 데이터를 불러올 수 없습니다.')
        }
      }
      return false
    }

    // mode=start + docId일 때, 서버에서 문서 프리로드 시도
    const tryPreloadFromParams = async () => {
      if (mode !== 'start' || !docIdParam) return false
      try {
        // 1) 마킹 문서로 시도 (기존 문서 열기)
        const res1 = await fetch(`/api/markup-documents/${docIdParam}`, { cache: 'no-store' })
        if (res1.ok) {
          const json = await res1.json()
          const doc = json?.data
          if (doc) {
            const url = doc.file_url || doc.original_blueprint_url
            const title = doc.title || '마킹 문서'

            const drawing = {
              id: doc.id,
              name: title,
              title,
              url,
              size: 0,
              type: 'markup',
              uploadDate: new Date(doc.updated_at || doc.created_at || Date.now()),
              isMarked: true,
              markupData: doc.markup_data || [],
              markupCount: Array.isArray(doc.markup_data) ? doc.markup_data.length : 0,
              source: 'markup',
              siteId: siteIdParam || undefined,
              siteName: selectedSite?.name,
            }

            setDrawingFile(drawing as any)
            setMarkupDocument({
              id: doc.id,
              title,
              original_blueprint_url: url,
              markup_data: doc.markup_data || [],
              created_at: doc.created_at || new Date().toISOString(),
              updated_at: doc.updated_at || new Date().toISOString(),
            })

            try {
              localStorage.setItem('selected_drawing', JSON.stringify(drawing))
            } catch (error) {
              console.warn('로컬 스토리지에 도면 정보를 저장하지 못했습니다.', error)
            }

            setShowBrowser(false)
            toast.success('도면을 불러왔습니다. 마킹을 시작하세요.')
            return true
          }
        }

        // 2) 공도면(블루프린트)로 시도 (unified_documents)
        const res2 = await fetch(`/api/unified-documents/v2/${docIdParam}`, { cache: 'no-store' })
        if (res2.ok) {
          const json2 = await res2.json()
          const doc = json2?.data
          if (doc) {
            const url = doc.file_url || doc.fileUrl
            const title = doc.title || doc.name || '도면'

            const drawing = {
              id: doc.id,
              name: title,
              title,
              url,
              size: doc.file_size || 0,
              type: 'blueprint',
              uploadDate: new Date(doc.updated_at || doc.created_at || Date.now()),
              isMarked: false,
              source: 'blueprint',
              siteId: siteIdParam || undefined,
              siteName: selectedSite?.name,
            }

            setDrawingFile(drawing as any)
            setMarkupDocument({
              id: doc.id,
              title,
              original_blueprint_url: url,
              markup_data: [],
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })

            try {
              localStorage.setItem('selected_drawing', JSON.stringify(drawing))
            } catch (error) {
              console.warn('로컬 스토리지에 도면 정보를 저장하지 못했습니다.', error)
            }

            setShowBrowser(false)
            toast.success('도면을 불러왔습니다. 마킹을 시작하세요.')
            return true
          }
        }

        // 3) 파트너 문서 목록에서 조회하여 매칭 (site_documents/legacy 포함)
        if (siteIdParam) {
          const res3 = await fetch(
            `/api/partner/sites/${encodeURIComponent(siteIdParam)}/documents?type=drawing`,
            { cache: 'no-store' }
          )
          if (res3.ok) {
            const json3 = await res3.json()
            const list: any[] = json3?.data?.documents || []
            const match = list.find((d: any) => d.id === docIdParam)
            if (match) {
              const drawing = {
                id: match.id,
                name: match.title || match.name || '도면',
                title: match.title || match.name || '도면',
                url: match.fileUrl,
                size: match.fileSize || 0,
                type: 'blueprint',
                uploadDate: new Date(match.uploadDate || Date.now()),
                isMarked: false,
                source: 'blueprint',
                siteId: siteIdParam,
                siteName: selectedSite?.name,
              }

              setDrawingFile(drawing as any)
              setMarkupDocument({
                id: match.id,
                title: drawing.title,
                original_blueprint_url: match.fileUrl,
                markup_data: [],
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })

              try {
                localStorage.setItem('selected_drawing', JSON.stringify(drawing))
              } catch (error) {
                console.warn('로컬 스토리지에 도면 정보를 저장하지 못했습니다.', error)
              }

              setShowBrowser(false)
              toast.success('도면을 불러왔습니다. 마킹을 시작하세요.')
              return true
            }
          }
        }
      } catch (error) {
        console.warn('문서 프리로드 실패:', error)
      }
      return false
    }

    ;(async () => {
      // 우선 파라미터로 프리로드 시도
      const preloaded = await tryPreloadFromParams()
      if (preloaded) return

      // 파라미터가 없거나 실패 시, 로컬스토리지 시도
      const loadedLocal = tryLoadFromLocal()
      if (loadedLocal) return

      // 도면이 없고 모드도 지정되지 않은 경우 브라우저 표시
      if (!mode) setShowBrowser(true)
    })()
  }, [mode, siteIdParam, docIdParam, selectedSite?.name])

  const handleSave = async (document: any, publish = false) => {
    try {
      // 1) 서버 저장
      const payload = {
        title: document.title || (drawingFile?.name ?? '무제 도면'),
        description: document.description || '',
        markup_data: Array.isArray(document.markup_data) ? document.markup_data : [],
        preview_image_url: document.preview_image_url || undefined,
      }

      let savedId: string | undefined
      let previewDataUrl: string | undefined
      try {
        previewDataUrl = await renderMarkupSnapshotDataUrl(
          document.original_blueprint_url || drawingFile?.url,
          payload.markup_data || []
        )
      } catch (snapshotError) {
        console.warn('Failed to render markup snapshot:', snapshotError)
      }

      if (drawingFile?.id) {
        // 새로운 통합 API: 도면 ID 기반 저장/게시
        const body = {
          drawingId: drawingFile.id,
          title: payload.title,
          description: payload.description,
          markupData: payload.markup_data,
          preview_image_url: payload.preview_image_url,
          preview_image_data: previewDataUrl,
          published: Boolean(publish),
        }
        const res = await fetch('/api/docs/drawings/markups/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        const json = await res.json()
        if (!res.ok || json?.success === false) throw new Error(json?.error || '마킹 저장 실패')
        savedId = json?.data?.markup?.id
        if (json?.data?.markup?.preview_image_url) {
          payload.preview_image_url = json.data.markup.preview_image_url
        }
        toast.success(publish ? '마킹 저장 및 진행도면 게시 완료' : '마킹 저장 완료')
      } else {
        // Fallback: 기존 API
        const fallback = {
          title: payload.title,
          description: payload.description,
          original_blueprint_url: document.original_blueprint_url || drawingFile?.url,
          original_blueprint_filename: drawingFile?.name || 'blueprint.png',
          markup_data: payload.markup_data,
          preview_image_url: payload.preview_image_url,
          preview_image_data: previewDataUrl,
        }
        const res = await fetch('/api/markup-documents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(fallback),
        })
        const json = await res.json()
        if (!res.ok || json?.error) throw new Error(json?.error || '마킹 문서 저장 실패')
        savedId = json?.data?.id
        if (json?.data?.preview_image_url) {
          payload.preview_image_url = json.data.preview_image_url
        }
        toast.success('마킹 저장 완료')
      }

      // 2-1) 작업일지 링크(있다면)
      if (linkWorklogId && savedId) {
        try {
          await fetch(`/api/markup-documents/${savedId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ linked_worklog_id: linkWorklogId }),
          })
        } catch (e) {
          console.warn('Linking to worklog failed:', e)
        }
      }

      toast.info('PDF로 저장되었습니다', {
        description: '현장공유함 > 진행도면에서 PDF를 확인하거나 공유할 수 있어요.',
      })

      // 2) 로컬 fallback 업데이트
      const recentMarkup = {
        id: savedId || document.id || `local-${Date.now()}`,
        title: payload.title,
        blueprintUrl: document.original_blueprint_url || drawingFile?.url,
        updatedAt: new Date().toISOString(),
        markupCount: payload.markup_data?.length || 0,
      }
      localStorage.setItem('recent_markup', JSON.stringify(recentMarkup))
      setMarkupDocument(prev => ({
        ...(prev || {}),
        markup_data: payload.markup_data,
        preview_image_url: payload.preview_image_url,
      }))

      // 저장 후 뒤로 가기
      try {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['worklogs'] }),
          queryClient.invalidateQueries({ queryKey: ['worklog-calendar'] }),
          queryClient.invalidateQueries({ queryKey: ['markup-documents'] }),
        ])
      } catch (e) {
        // best-effort cache invalidation; ignore failures
      }

      setTimeout(() => {
        router.back()
      }, 1000)
    } catch (error) {
      console.error('Save error:', error)
      toast.error(error instanceof Error ? error.message : '저장에 실패했습니다.')
    }
  }

  const renderMarkupSnapshotDataUrl = async (
    sourceUrl?: string | null,
    markupObjects: MarkupObject[] = []
  ): Promise<string | undefined> => {
    try {
      if (!sourceUrl) return undefined
      const img = await loadImage(sourceUrl)
      const width = img.naturalWidth || img.width
      const height = img.naturalHeight || img.height
      if (!width || !height) return undefined
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, width, height)
      drawMarkupObjectsOnCanvas(ctx, markupObjects || [])
      return canvas.toDataURL('image/png', 0.95)
    } catch {
      return undefined
    }
  }

  const loadImage = (src: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('이미지를 불러올 수 없습니다.'))
      img.src = src
    })

  const drawMarkupObjectsOnCanvas = (ctx: CanvasRenderingContext2D, objects: MarkupObject[]) => {
    objects.forEach(obj => {
      if (obj.type === 'box') {
        ctx.save()
        ctx.strokeStyle = colorToHex(obj.color || 'gray')
        ctx.lineWidth = getBoxStrokeWidth(obj.size)
        ctx.strokeRect(obj.x, obj.y, (obj as any).width || 0, (obj as any).height || 0)
        if ((obj as any).label) {
          ctx.font = '12px Pretendard, sans-serif'
          ctx.fillStyle = colorToHex(obj.color || 'gray')
          ctx.textBaseline = 'bottom'
          ctx.fillText(String((obj as any).label), obj.x + 4, Math.max(12, obj.y - 4))
        }
        ctx.restore()
        return
      }
      if (obj.type === 'text') {
        const anyObj = obj as any
        ctx.save()
        ctx.font = `${anyObj.fontSize || 14}px Pretendard, sans-serif`
        ctx.fillStyle = anyObj.fontColor || '#111'
        ctx.textBaseline = 'alphabetic'
        ctx.fillText(String(anyObj.content || ''), obj.x, obj.y)
        ctx.restore()
        return
      }
      if (obj.type === 'drawing') {
        const anyObj = obj as any
        const path = Array.isArray(anyObj.path) ? anyObj.path : []
        if (path.length > 1) {
          ctx.save()
          ctx.beginPath()
          ctx.moveTo(path[0].x, path[0].y)
          for (let i = 1; i < path.length; i++) ctx.lineTo(path[i].x, path[i].y)
          ctx.strokeStyle = colorToHex(anyObj.strokeColor || '#ef4444')
          ctx.lineWidth = Number(anyObj.strokeWidth) || 2
          ctx.lineJoin = 'round'
          ctx.lineCap = 'round'
          ctx.stroke()
          ctx.restore()
        }
        return
      }
      if (obj.type === 'stamp') {
        drawStamp(ctx, obj)
      }
    })
  }

  const drawStamp = (ctx: CanvasRenderingContext2D, obj: MarkupObject) => {
    const anyObj = obj as any
    const color = colorToHex(anyObj.color || '#ef4444')
    const size = sizeToPixels(anyObj.size || 'medium')
    const half = size / 2
    ctx.save()
    ctx.fillStyle = color
    ctx.globalAlpha = 0.85
    if (anyObj.shape === 'circle') {
      ctx.beginPath()
      ctx.arc(anyObj.x, anyObj.y, half, 0, Math.PI * 2)
      ctx.fill()
    } else if (anyObj.shape === 'square') {
      ctx.fillRect(anyObj.x - half, anyObj.y - half, size, size)
    } else if (anyObj.shape === 'triangle') {
      ctx.beginPath()
      ctx.moveTo(anyObj.x, anyObj.y - half)
      ctx.lineTo(anyObj.x - half, anyObj.y + half)
      ctx.lineTo(anyObj.x + half, anyObj.y + half)
      ctx.closePath()
      ctx.fill()
    } else {
      const pts = getStarPoints(anyObj.x, anyObj.y, half, half / 2)
      ctx.beginPath()
      ctx.moveTo(pts[0].x, pts[0].y)
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y)
      ctx.closePath()
      ctx.fill()
    }
    ctx.restore()
  }

  const getStarPoints = (cx: number, cy: number, outer: number, inner: number) => {
    const pts: Array<{ x: number; y: number }> = []
    for (let i = 0; i < 10; i++) {
      const angle = (Math.PI / 5) * i - Math.PI / 2
      const radius = i % 2 === 0 ? outer : inner
      pts.push({ x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius })
    }
    return pts
  }

  const colorToHex = (value: string) => {
    const map: Record<string, string> = { red: '#ef4444', blue: '#3b82f6', gray: '#6b7280' }
    if (!value) return '#ef4444'
    if (value.startsWith('#')) return value
    return map[value] || value
  }

  const sizeToPixels = (size: 'small' | 'medium' | 'large') => {
    if (size === 'small') return 18
    if (size === 'large') return 36
    return 24
  }

  const getBoxStrokeWidth = (size?: 'small' | 'medium' | 'large') => {
    if (size === 'small') return 2
    if (size === 'large') return 4
    return 3
  }

  const handleClose = () => {
    router.back()
  }

  // DrawingBrowser에서 도면 선택 핸들러
  const handleDrawingSelect = (drawing: any) => {
    setDrawingFile({
      id: drawing.id,
      name: drawing.name || drawing.title,
      size: drawing.size || 0,
      type: drawing.type || 'image',
      url: drawing.url,
      uploadDate: drawing.uploadDate || new Date(),
    })

    setMarkupDocument({
      id: drawing.id,
      title: drawing.name || drawing.title,
      original_blueprint_url: drawing.url,
      markup_data: drawing.markupData || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    setShowBrowser(false)
    toast.success('도면을 불러왔습니다. 마킹을 시작하세요.')
  }

  // 사용자 정보가 없거나 도면이 없는 경우
  if (loading && !resolvedProfile) {
    return (
      <MobileLayoutShell>
        <div className="flex items-center justify-center py-10 bg-gray-50 rounded-lg">
          <div className="text-center">
            <p className="text-gray-600 mb-4">사용자 정보를 불러오는 중...</p>
          </div>
        </div>
      </MobileLayoutShell>
    )
  }

  if (!resolvedProfile) {
    return (
      <MobileLayoutShell>
        <div className="flex items-center justify-center bg-gray-50 px-6 py-10 rounded-lg">
          <div className="text-center max-w-sm">
            <h1 className="text-xl font-semibold text-gray-900 mb-3">
              접근 권한을 확인할 수 없습니다
            </h1>
            <p className="text-sm text-gray-600 mb-4">
              로그인 정보가 만료되었거나 프로필을 불러오지 못했습니다. 다시 로그인하거나 홈 화면으로
              돌아가 주세요.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => router.replace('/mobile')}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 text-sm font-medium"
              >
                홈으로 이동
              </button>
              <button
                onClick={() => router.replace('/auth/sign-in')}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium"
              >
                다시 로그인
              </button>
            </div>
          </div>
        </div>
      </MobileLayoutShell>
    )
  }

  // DrawingBrowser 표시
  if (showBrowser) {
    return (
      <MobileLayoutShell>
        <div className="bg-white rounded-lg border">
          <div className="flex items-center justify-between p-3 border-b">
            <button
              onClick={handleClose}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft size={20} />
              뒤로
            </button>
            <h1 className="text-base font-semibold">도면 선택</h1>
            <button
              onClick={() => setShowBrowser(false)}
              className="text-sm text-blue-600 hover:text-blue-700"
              disabled={!drawingFile}
            >
              {drawingFile ? '마킹하기' : ''}
            </button>
          </div>
          <div className="max-h-[70vh] overflow-y-auto">
            <DrawingBrowser
              selectedSite={selectedSite?.id}
              siteName={selectedSite?.name}
              userId={resolvedProfile.id}
              onDrawingSelect={handleDrawingSelect}
              initialMode={mode === 'upload' ? 'upload' : 'browse'}
            />
          </div>
        </div>
      </MobileLayoutShell>
    )
  }

  // 도면이 없는 경우
  if (!drawingFile || !markupDocument) {
    return (
      <MobileLayoutShell>
        <div className="bg-white rounded-lg border">
          <div className="flex items-center justify-between p-3 border-b">
            <button
              onClick={handleClose}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft size={20} />
              뒤로
            </button>
            <h1 className="text-base font-semibold">도면 마킹</h1>
            <button
              onClick={() => setShowBrowser(true)}
              className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
            >
              <FolderOpen size={18} />
              도면 선택
            </button>
          </div>
          <div className="flex items-center justify-center py-10">
            <div className="text-center">
              <div className="text-6xl mb-4">📐</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">도면을 선택해주세요</h2>
              <p className="text-gray-600 mb-6">도면을 선택하여 마킹을 시작하세요</p>
              <button
                onClick={() => setShowBrowser(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                도면 선택하기
              </button>
            </div>
          </div>
        </div>
      </MobileLayoutShell>
    )
  }

  return (
    <MobileLayoutShell>
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="flex items-center justify-between p-3 border-b">
          <button
            onClick={handleClose}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">뒤로</span>
          </button>
          <h1 className="text-base font-semibold">도면 마킹</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowBrowser(true)}
              className="p-2 text-gray-600 hover:text-gray-900"
              title="도면 변경"
            >
              <FolderOpen size={20} />
            </button>
            <button
              onClick={() => handleSave(markupDocument, false)}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              저장
            </button>
            <button
              onClick={() => handleSave(markupDocument, true)}
              className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium"
            >
              게시
            </button>
          </div>
        </div>
        <div className="max-h-[70vh] overflow-hidden">
          <SharedMarkupEditor
            profile={resolvedProfile}
            mode="worker"
            onSave={handleSave}
            onClose={handleClose}
            initialDocument={markupDocument}
            embedded={true}
          />
        </div>
      </div>
      <Toaster position="bottom-center" richColors />
    </MobileLayoutShell>
  )
}
