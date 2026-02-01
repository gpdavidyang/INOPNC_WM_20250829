'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import PhotoSheetPrint from '@/components/photo-sheet/PhotoSheetPrint'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'

type ItemMeta = {
  id: string
  member?: string
  process?: string
  content?: string
  stage?: 'before' | 'after'
  previewUrl?: string
}

type PreviewData = {
  title: string
  siteId?: string | null
  siteName: string
  rows: number
  cols: number
  orientation: 'portrait' | 'landscape'
  items: ItemMeta[]
  templateMode?: boolean
  sheetId?: string | null
}

export default function LivePreviewPage() {
  const [data, setData] = useState<PreviewData | null>(null)
  const params = useSearchParams()

  useEffect(() => {
    try {
      const id = params.get('id')
      const sheetId = params.get('sheet_id')
      if (id) {
        // Try server API fetch first (most reliable in Incognito)
        ;(async () => {
          try {
            const res = await fetch(`/api/photo-sheets/preview-session/${encodeURIComponent(id)}`, {
              cache: 'no-store',
              credentials: 'include',
            })
            const j = await res.json().catch(() => ({}))
            if (res.ok && j?.success && j.data) {
              setData(j.data as PreviewData)
              return
            }
          } catch (_e) {
            /* ignore */
          }
        })()
        // Try opener global store first (works in Incognito and avoids storage limits)
        try {
          const fromOpener = (window.opener &&
            (window.opener as any).__PHOTO_PREVIEW_STORE &&
            (window.opener as any).__PHOTO_PREVIEW_STORE[id]) as PreviewData | undefined
          if (fromOpener) {
            setData(fromOpener)
            return
          }
        } catch (_e) {
          /* ignore */
        }
        const raw = localStorage.getItem(`photosheet-preview:${id}`)
        if (raw) {
          setData(JSON.parse(raw) as PreviewData)
          try {
            localStorage.removeItem(`photosheet-preview:${id}`)
          } catch (_e) {
            /* ignore */
          }
          return
        }
      }
      // If sheet_id is provided, fetch the sheet detail and build preview data
      if (sheetId) {
        ;(async () => {
          try {
            const res = await fetch(`/api/photo-sheets/${encodeURIComponent(sheetId)}`, {
              cache: 'no-store',
              credentials: 'include',
            })
            const j = await res.json().catch(() => ({}))
            if (res.ok && j?.success && j?.data) {
              const s = j.data as any
              const items = Array.isArray(s.items) ? s.items : []
              const preview = {
                title: (s.title || '').trim(),
                sheetId: s.id || null,
                siteId: s.site_id || s.site?.id || null,
                siteName: s.site?.name || '',
                rows: Number(s.rows) || 1,
                cols: Number(s.cols) || 1,
                orientation: (s.orientation === 'landscape' ? 'landscape' : 'portrait') as
                  | 'portrait'
                  | 'landscape',
                templateMode: false,
                items: items.map((it: any, i: number) => ({
                  id: String(i),
                  member: it.member_name || undefined,
                  process: it.process_name || undefined,
                  content: it.content || undefined,
                  stage: it.stage || undefined,
                  previewUrl: it.image_url || undefined,
                })),
              } as PreviewData
              setData(preview)
              return
            }
          } catch (_e) {
            /* ignore */
          }
        })()
      }
      // window.name payload (psdata:<base64-json>) support
      const wn = typeof window !== 'undefined' ? window.name || '' : ''
      if (wn.startsWith('psdata:')) {
        const b64 = wn.slice(7)
        try {
          const json = JSON.parse(decodeURIComponent(escape(atob(b64)))) as PreviewData
          setData(json)
          return
        } catch (_e) {
          /* ignore */
        }
      }
      // Fallback: window.name-based key
      const nm = typeof window !== 'undefined' ? window.name || '' : ''
      if (nm.startsWith('psk:')) {
        const kid = nm.slice(4)
        const raw2 = localStorage.getItem(`photosheet-preview:${kid}`)
        if (raw2) {
          setData(JSON.parse(raw2) as PreviewData)
          try {
            localStorage.removeItem(`photosheet-preview:${kid}`)
          } catch (_e) {
            /* ignore */
          }
          return
        }
      }
      const legacy = sessionStorage.getItem('photosheet-preview')
      if (legacy) {
        setData(JSON.parse(legacy) as PreviewData)
        return
      }
    } catch {
      setData(null)
    }
  }, [params])

  // Fallbacks: receive preview via postMessage from opener, and retry polling for a short time
  useEffect(() => {
    let done = false
    const handler = (ev: MessageEvent) => {
      if (!ev || typeof ev.data !== 'object') return
      if ((ev.data as any)?.type === 'photosheet-preview' && (ev.data as any)?.data) {
        setData((ev.data as any).data as PreviewData)
        done = true
      } else if ((ev.data as any)?.type === 'navigate' && (ev.data as any)?.url) {
        try {
          window.location.href = String((ev.data as any).url)
        } catch (_e) {
          /* ignore */
        }
      }
    }
    window.addEventListener('message', handler)
    const id = params.get('id') || (window.name?.startsWith('psk:') ? window.name.slice(4) : '')
    // Actively request from opener as a final handshake (Incognito safe)
    try {
      if (window.opener && id)
        window.opener.postMessage(
          { type: 'request-photosheet-preview', id },
          window.location.origin
        )
    } catch (_e) {
      /* ignore */
    }
    let attempts = 0
    const iv = window.setInterval(() => {
      if (done || attempts++ > 20) {
        window.clearInterval(iv)
        return
      }
      try {
        if (id && window.opener && (window.opener as any).__PHOTO_PREVIEW_STORE) {
          const d = (window.opener as any).__PHOTO_PREVIEW_STORE[id]
          if (d) {
            setData(d as PreviewData)
            window.clearInterval(iv)
          }
        }
      } catch (_e) {
        /* ignore */
      }
    }, 200)
    return () => {
      window.removeEventListener('message', handler)
      try {
        window.clearInterval(iv)
      } catch (_e) {
        /* ignore */
      }
    }
  }, [params])

  const runPrintJob = useCallback(() => {
    try {
      const root = document.querySelector<HTMLDivElement>('.print-root')
      if (!root) return false

      const clone = root.cloneNode(true) as HTMLDivElement
      const inlineStyles = Array.from(clone.querySelectorAll('style'))
      const extractedComponentCss = inlineStyles.map(tag => tag.innerHTML || '').join('\n')
      inlineStyles.forEach(tag => tag.parentElement?.removeChild(tag))

      const iframe = document.createElement('iframe')
      iframe.style.position = 'fixed'
      iframe.style.left = '-10000px'
      iframe.style.top = '0'
      iframe.style.width = '1024px'
      iframe.style.height = '768px'
      iframe.style.border = '0'
      iframe.style.opacity = '0'
      iframe.style.pointerEvents = 'none'
      iframe.setAttribute('aria-hidden', 'true')
      document.body.appendChild(iframe)

      const doc = iframe.contentDocument || iframe.contentWindow?.document
      if (!doc) {
        document.body.removeChild(iframe)
        return false
      }

      const title = (data?.title?.trim() ? data.title.trim() : data?.siteName?.trim()) || '사진대지'
      const bootstrapCss = `
        html, body {
          margin: 0;
          padding: 0;
          background: #fff;
          color: #000;
          font-family: 'Noto Sans KR', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif;
          width: auto !important;
          min-width: 0 !important;
          max-width: none !important;
          height: auto !important;
          min-height: 0 !important;
          max-height: none !important;
          overflow: visible !important;
        }
        #__next, body > div {
          margin: 0 !important;
          padding: 0 !important;
          width: auto !important;
          min-width: 0 !important;
          max-width: none !important;
          height: auto !important;
          min-height: 0 !important;
          max-height: none !important;
          overflow: visible !important;
        }
        img { max-width: 100%; }
      `
      const combinedCss = `${bootstrapCss}\n${extractedComponentCss}`

      doc.open()
      doc.write(`<!DOCTYPE html>
        <html lang="ko">
          <head>
            <meta charSet="utf-8" />
            <title>${title}</title>
            <base href="${window.location.origin}/" />
            <style>${combinedCss}</style>
          </head>
          <body>
            ${clone.outerHTML}
          </body>
        </html>`)
      doc.close()

      const cleanup = () => {
        try {
          document.body.removeChild(iframe)
        } catch {
          /* noop */
        }
      }

      const handlePrint = () => {
        try {
          iframe.contentWindow?.focus()
          iframe.contentWindow?.print()
        } catch {
          cleanup()
        } finally {
          setTimeout(cleanup, 1000)
        }
      }

      const images = Array.from(doc.images || [])
      if (images.length > 0) {
        let loaded = 0
        const notify = () => {
          loaded += 1
          if (loaded >= images.length) {
            setTimeout(handlePrint, 100)
          }
        }
        images.forEach(img => {
          if (img.complete) {
            notify()
          } else {
            img.addEventListener('load', notify, { once: true })
            img.addEventListener('error', notify, { once: true })
          }
        })
        // Fallback timeout
        setTimeout(handlePrint, 2000)
      } else {
        setTimeout(handlePrint, 50)
      }
      return true
    } catch (error) {
      console.error('Custom print job failed', error)
      return false
    }
  }, [data])

  useEffect(() => {
    if (data && params.get('auto') === 'print') {
      const t = setTimeout(() => {
        if (!runPrintJob()) {
          try {
            window.print()
          } catch (_e) {
            /* ignore */
          }
        }
      }, 400)
      return () => clearTimeout(t)
    }
  }, [data, params, runPrintJob])

  useEffect(() => {
    const originalPrint = typeof window !== 'undefined' ? window.print?.bind(window) : null
    if (typeof window === 'undefined' || !originalPrint) return undefined
    window.print = () => {
      if (!runPrintJob()) {
        originalPrint()
      }
    }
    return () => {
      window.print = originalPrint
    }
  }, [runPrintJob])

  const content = useMemo(() => {
    if (!data) return null
    return (
      <PhotoSheetPrint
        title={data.title}
        siteName={data.siteName}
        rows={data.rows}
        cols={data.cols}
        orientation={data.orientation}
        items={data.items}
        templateMode={data.templateMode}
      />
    )
  }, [data])

  if (!data) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        미리보기 데이터를 찾을 수 없습니다. 에디터에서 다시 시도해 주세요.
      </div>
    )
  }

  return (
    <div className="photo-sheet-preview-page px-0 pb-8">
      <div className="print-hide">
        <PageHeader
          title="사진대지 미리보기"
          description="작업 전/후 사진과 부재명·공정·내용을 포함한 사진대지를 인쇄 전에 미리 확인하는 화면입니다."
          breadcrumbs={[
            { label: '대시보드', href: '/dashboard/admin' },
            { label: '현장작업 관리' },
            { label: '사진대지 관리', href: '/dashboard/admin/tools/photo-grid' },
            { label: '미리보기' },
          ]}
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  if (!runPrintJob()) {
                    window.print()
                  }
                }}
              >
                인쇄
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  try {
                    if (window.history.length > 1) {
                      window.history.back()
                    } else {
                      window.location.assign('/dashboard/admin/tools/photo-grid')
                    }
                  } catch {
                    window.location.assign('/dashboard/admin/tools/photo-grid')
                  }
                }}
              >
                닫기
              </Button>
            </div>
          }
        />
      </div>
      <div className="photo-sheet-preview-stage px-4 sm:px-6 lg:px-8 py-4">
        <div className="photo-sheet-preview-scroll w-full overflow-x-auto">
          <div className="photo-sheet-preview-canvas mx-auto min-w-max flex justify-center">
            {content}
          </div>
        </div>
      </div>
    </div>
  )
}
