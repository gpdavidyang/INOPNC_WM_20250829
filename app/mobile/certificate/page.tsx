'use client'

import './certificate.css'

import { useUnifiedAuth } from '@/hooks/use-unified-auth'
import { MobileAuthGuard } from '@/modules/mobile/components/auth/mobile-auth-guard'
import {
  Check,
  ChevronLeft,
  Download,
  Eraser,
  Hand,
  ImagePlus,
  Minus,
  PenTool,
  Plus,
  RotateCcw,
  Share2,
  Trash2,
  Undo2,
  X,
} from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import Script from 'next/script'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

export const dynamic = 'force-dynamic'

declare global {
  interface Window {
    SignaturePad?: any
  }
}

type CompletionCertFormV2 = {
  siteId: string
  worklogId: string

  siteName: string // 현장명
  companyName: string // 업체
  constructionName: string // 공사명
  constructionPeriod: string // 공사기간
  workContent: string // 작업내용
  specialNotes: string // 특기사항

  confirmDateText: string // YYYY년 M월 D일
  affiliation: string // 소속
  signerName: string // 성명

  recipientCompany: string // 회사명
  recipientSuffix: string // 귀중

  signatureDataUrl: string | null // paper signature image
}

type CompletionCertDraftV2 = {
  version: 2
  updatedAt: string
  source: { siteId?: string; worklogId?: string }
  form: CompletionCertFormV2
}

const STORAGE_KEY_V2 = 'inopnc_completion_certificate_last_v2'
const STORAGE_KEY_V1 = 'inopnc_completion_certificate_last_v1'

const safeString = (value: unknown) => (typeof value === 'string' ? value : String(value ?? ''))

const formatKoreanDate = (d: Date) => `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`

const emptyForm = (defaults?: Partial<CompletionCertFormV2>): CompletionCertFormV2 => ({
  siteId: '',
  worklogId: '',

  siteName: '',
  companyName: '',
  constructionName: '',
  constructionPeriod: '',
  workContent: '',
  specialNotes: '',

  confirmDateText: formatKoreanDate(new Date()),
  affiliation: '(주)이노피앤씨',
  signerName: '',

  recipientCompany: '',
  recipientSuffix: '귀중',

  signatureDataUrl: null,
  ...defaults,
})

function readDraftV2(): CompletionCertDraftV2 | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY_V2)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || parsed.version !== 2) return null
    if (!parsed.form) return null
    return parsed as CompletionCertDraftV2
  } catch {
    return null
  }
}

function readDraftV1AsV2(): CompletionCertDraftV2 | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY_V1)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || parsed.version !== 1) return null
    const f = parsed?.form
    if (!f) return null

    const confirmDateText = (() => {
      const rawDate = safeString(f?.confirmDate || '').trim()
      if (!rawDate) return formatKoreanDate(new Date())
      // v1 stored yyyy-mm-dd
      const dt = new Date(rawDate)
      if (!Number.isNaN(dt.getTime())) return formatKoreanDate(dt)
      return rawDate
    })()

    const converted: CompletionCertDraftV2 = {
      version: 2,
      updatedAt: safeString(parsed?.updatedAt || new Date().toISOString()),
      source: {
        siteId: safeString(parsed?.source?.siteId || f?.siteId || ''),
        worklogId: safeString(parsed?.source?.worklogId || f?.worklogId || ''),
      },
      form: emptyForm({
        siteId: safeString(f?.siteId || ''),
        worklogId: safeString(f?.worklogId || ''),
        siteName: safeString(f?.siteName || ''),
        companyName: '',
        constructionName: safeString(f?.projectName || ''),
        constructionPeriod: safeString(f?.periodText || ''),
        workContent: safeString(f?.workSummary || ''),
        specialNotes: safeString(f?.notes || ''),
        confirmDateText,
        affiliation: safeString(f?.affiliation || '(주)이노피앤씨'),
        signerName: safeString(f?.signerName || ''),
        recipientCompany: safeString(f?.recipientCompany || ''),
        recipientSuffix: '귀중',
        signatureDataUrl: f?.signatureDataUrl || null,
      }),
    }
    return converted
  } catch {
    return null
  }
}

function writeDraftV2(draft: CompletionCertDraftV2) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(draft))
  } catch {
    // ignore
  }
}

const autoResizeTableInput = (el: HTMLTextAreaElement) => {
  el.style.height = 'auto'
  el.style.height = `${el.scrollHeight}px`
}

function buildWorkContentPrefill(report: any) {
  const content = report?.work_content || report?.workContent || {}
  const location = report?.location_info || report?.locationInfo || {}

  const memberTypes = Array.isArray(content?.memberTypes) ? content.memberTypes : []
  const workProcesses = Array.isArray(content?.workProcesses) ? content.workProcesses : []
  const workTypes = Array.isArray(content?.workTypes) ? content.workTypes : []

  const lines: string[] = []
  if (memberTypes.length) lines.push(`부재명: ${memberTypes.join(', ')}`)
  if (workProcesses.length) lines.push(`작업공정: ${workProcesses.join(', ')}`)
  if (workTypes.length) lines.push(`작업유형: ${workTypes.join(', ')}`)

  const loc = [location?.block, location?.dong, location?.unit]
    .map(v => safeString(v).trim())
    .filter(Boolean)
    .join(' / ')
  if (loc) lines.push(`위치: ${loc}`)

  const workers = Array.isArray(report?.worker_assignments) ? report.worker_assignments : []
  const workerNames = workers
    .map((w: any) => safeString(w?.worker_name || w?.profiles?.full_name || '').trim())
    .filter(Boolean)
  if (workerNames.length) lines.push(`작업자: ${Array.from(new Set(workerNames)).join(', ')}`)

  const notes = safeString(report?.additional_notes || report?.additionalNotes || '').trim()
  if (notes) lines.push(`비고: ${notes}`)

  const bullet = lines.length ? lines.map(l => `* ${l}`).join('\n') + '\n* ' : '* '
  return bullet
}

export default function MobileCompletionCertificatePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const requestedSiteId = String(searchParams.get('siteId') || '').trim()
  const requestedWorklogId = String(searchParams.get('worklogId') || '').trim()

  const { profile } = useUnifiedAuth()

  const [form, setForm] = useState<CompletionCertFormV2>(() =>
    emptyForm({ signerName: safeString(profile?.full_name || '').trim() })
  )
  const [isPanning, setIsPanning] = useState(false)
  const [isSignOpen, setIsSignOpen] = useState(false)
  const [signaturePadReady, setSignaturePadReady] = useState(false)

  const viewportRef = useRef<HTMLDivElement | null>(null)
  const paperWrapperRef = useRef<HTMLDivElement | null>(null)
  const documentAreaRef = useRef<HTMLDivElement | null>(null)
  const toastRef = useRef<HTMLDivElement | null>(null)
  const toastMsgRef = useRef<HTMLSpanElement | null>(null)
  const toastTimerRef = useRef<number | null>(null)

  const paperSignCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const clickGuideRef = useRef<HTMLDivElement | null>(null)
  const modalCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const modalEditLayerRef = useRef<HTMLDivElement | null>(null)
  const modalEditContainerRef = useRef<HTMLDivElement | null>(null)
  const modalEditingImageRef = useRef<HTMLImageElement | null>(null)
  const modalScaleSliderRef = useRef<HTMLInputElement | null>(null)
  const signImageInputRef = useRef<HTMLInputElement | null>(null)

  const signaturePadRef = useRef<any>(null)
  const backgroundImagesRef = useRef<
    Array<{ img: HTMLImageElement; x: number; y: number; w: number; h: number }>
  >([])
  const imgStateRef = useRef<{ x: number; y: number; scale: number }>({ x: 0, y: 0, scale: 0.5 })
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const isDraggingImgRef = useRef(false)

  const paperSignatureRef = useRef<{
    img: HTMLImageElement
    x: number
    y: number
    w: number
    h: number
  } | null>(null)

  const saveTimerRef = useRef<number | null>(null)
  const lastLoadedKeyRef = useRef<string>('')

  const effectiveKey = useMemo(
    () => `${requestedSiteId || ''}::${requestedWorklogId || ''}`,
    [requestedSiteId, requestedWorklogId]
  )

  const showToast = useCallback((msg: string) => {
    const el = toastRef.current
    const msgEl = toastMsgRef.current
    if (!el || !msgEl) return
    msgEl.textContent = msg
    el.classList.add('show')
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current)
    toastTimerRef.current = window.setTimeout(() => el.classList.remove('show'), 2000)
  }, [])

  // Mount/unmount body class for black background + capture mode.
  useEffect(() => {
    document.body.classList.add('completion-cert')
    return () => {
      document.body.classList.remove('completion-cert')
      document.body.classList.remove('clean-mode')
    }
  }, [])

  // Fill signer name when profile becomes available (without overriding user input).
  useEffect(() => {
    const name = safeString(profile?.full_name || '').trim()
    if (!name) return
    setForm(curr => (curr.signerName ? curr : { ...curr, signerName: name }))
  }, [profile?.full_name])

  // Restore draft: prefer v2, fallback to v1 conversion.
  useEffect(() => {
    if (!effectiveKey) return
    if (lastLoadedKeyRef.current === effectiveKey) return
    lastLoadedKeyRef.current = effectiveKey

    const draft = readDraftV2() || readDraftV1AsV2()
    const shouldRestore =
      !!draft &&
      (!requestedWorklogId ||
        (safeString(draft?.source?.worklogId || '').trim() === requestedWorklogId &&
          (!requestedSiteId || safeString(draft?.source?.siteId || '').trim() === requestedSiteId)))

    if (shouldRestore && draft) {
      setForm(draft.form)
      writeDraftV2(draft) // normalize v1->v2
    } else if (!requestedWorklogId) {
      setForm(emptyForm({ signerName: safeString(profile?.full_name || '').trim() }))
    }
  }, [effectiveKey, profile?.full_name, requestedSiteId, requestedWorklogId, showToast])

  // Auto prefill by worklogId.
  useEffect(() => {
    if (!requestedWorklogId) return
    let isCancelled = false
    const run = async () => {
      try {
        const res = await fetch(`/api/mobile/daily-reports/${requestedWorklogId}`, {
          credentials: 'include',
          cache: 'no-store',
        })
        if (!res.ok) throw new Error('작업일지 정보를 불러오지 못했습니다.')
        const json = await res.json()
        const report = json?.data
        if (!report) throw new Error('작업일지 정보가 없습니다.')
        if (requestedSiteId && String(report?.site_id || '') !== requestedSiteId) {
          throw new Error('현장 정보가 일치하지 않습니다.')
        }

        const nextSiteId = String(report?.site_id || requestedSiteId || '').trim()
        const nextWorklogId = String(report?.id || requestedWorklogId || '').trim()
        const nextSiteName = safeString(report?.sites?.name || '').trim()

        if (isCancelled) return
        setForm(prev => {
          const isDifferentWorklog = prev.worklogId && prev.worklogId !== nextWorklogId
          const base = isDifferentWorklog ? emptyForm({ signerName: prev.signerName }) : prev

          const merged: CompletionCertFormV2 = {
            ...base,
            siteId: nextSiteId || base.siteId,
            worklogId: nextWorklogId || base.worklogId,
            siteName: base.siteName || nextSiteName,
            constructionName: base.constructionName || '',
            workContent: base.workContent || buildWorkContentPrefill(report),
            confirmDateText: base.confirmDateText || formatKoreanDate(new Date()),
          }
          return merged
        })
      } catch (err: any) {
        showToast(err?.message || '확인서 프리필에 실패했습니다.')
      }
    }
    run()
    return () => {
      isCancelled = true
    }
  }, [requestedSiteId, requestedWorklogId, showToast])

  const persistDraft = useCallback((nextForm: CompletionCertFormV2) => {
    const draft: CompletionCertDraftV2 = {
      version: 2,
      updatedAt: new Date().toISOString(),
      source: { siteId: nextForm.siteId || '', worklogId: nextForm.worklogId || '' },
      form: nextForm,
    }
    writeDraftV2(draft)
  }, [])

  // Auto-save (only most recent 1) - debounced.
  useEffect(() => {
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current)
    saveTimerRef.current = window.setTimeout(() => persistDraft(form), 600)
    return () => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current)
    }
  }, [form, persistDraft])

  // Viewer behavior (ported): fit-to-width and pan when toggle active.
  const viewerStateRef = useRef({
    zoomLevel: 1.0,
    pointX: 0,
    pointY: 0,
    startX: 0,
    startY: 0,
  })

  const updateTransform = useCallback(() => {
    const wrapper = paperWrapperRef.current
    if (!wrapper) return
    const s = viewerStateRef.current
    wrapper.style.transform = `translate(${s.pointX}px, ${s.pointY}px) scale(${s.zoomLevel})`
  }, [])

  const fitToWidth = useCallback(() => {
    const viewport = viewportRef.current
    if (!viewport) return
    const viewportW = viewport.clientWidth
    const contentW = 854
    let scale = viewportW / contentW
    if (scale > 1.1) scale = 1.0
    viewerStateRef.current.zoomLevel = scale
    viewerStateRef.current.pointX = 0
    viewerStateRef.current.pointY = 0
    updateTransform()
  }, [updateTransform])

  useEffect(() => {
    const handleResize = () => {
      window.clearTimeout((handleResize as any)._t)
      ;(handleResize as any)._t = window.setTimeout(() => fitToWidth(), 200)
    }
    window.addEventListener('resize', handleResize)
    const t = window.setTimeout(() => fitToWidth(), 100)
    return () => {
      window.removeEventListener('resize', handleResize)
      window.clearTimeout(t)
    }
  }, [fitToWidth])

  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return

    const startPan = (e: MouseEvent | TouchEvent) => {
      if (!isPanning) return
      const target = e.target as HTMLElement | null
      if (target?.tagName && ['INPUT', 'TEXTAREA', 'BUTTON'].includes(target.tagName)) return
      if (target?.id === 'paperSignCanvas' || target?.closest?.('.sign-cell-canvas')) return

      e.preventDefault()
      const cx = 'touches' in e ? e.touches[0]?.clientX : (e as MouseEvent).clientX
      const cy = 'touches' in e ? e.touches[0]?.clientY : (e as MouseEvent).clientY
      const s = viewerStateRef.current
      s.startX = cx - s.pointX
      s.startY = cy - s.pointY

      const moveHandler = (ev: MouseEvent | TouchEvent) => {
        ev.preventDefault()
        const mx = 'touches' in ev ? ev.touches[0]?.clientX : (ev as MouseEvent).clientX
        const my = 'touches' in ev ? ev.touches[0]?.clientY : (ev as MouseEvent).clientY
        s.pointX = mx - s.startX
        s.pointY = my - s.startY
        updateTransform()
      }
      const upHandler = () => {
        document.removeEventListener('mousemove', moveHandler as any)
        document.removeEventListener('mouseup', upHandler)
        document.removeEventListener('touchmove', moveHandler as any)
        document.removeEventListener('touchend', upHandler)
      }

      document.addEventListener('mousemove', moveHandler as any)
      document.addEventListener('mouseup', upHandler)
      document.addEventListener('touchmove', moveHandler as any, { passive: false })
      document.addEventListener('touchend', upHandler)
    }

    viewport.addEventListener('mousedown', startPan as any)
    viewport.addEventListener('touchstart', startPan as any, { passive: false })
    return () => {
      viewport.removeEventListener('mousedown', startPan as any)
      viewport.removeEventListener('touchstart', startPan as any)
    }
  }, [isPanning, updateTransform])

  const adjustZoom = useCallback(
    (delta: number) => {
      viewerStateRef.current.zoomLevel = Math.max(0.3, viewerStateRef.current.zoomLevel + delta)
      updateTransform()
    },
    [updateTransform]
  )

  const togglePan = useCallback(() => {
    setIsPanning(v => {
      const next = !v
      showToast(next ? '이동 모드' : '입력 모드')
      return next
    })
  }, [showToast])

  // Signature system (ported).
  const resizePaperCanvas = useCallback(() => {
    const paperCanvas = paperSignCanvasRef.current
    if (!paperCanvas) return
    const parent = paperCanvas.parentElement
    if (!parent) return
    const w = parent.clientWidth
    const h = parent.clientHeight
    if (!w || !h) return
    const ratio = 2
    paperCanvas.width = w * ratio
    paperCanvas.height = h * ratio
    if (paperSignatureRef.current) {
      const ctx = paperCanvas.getContext('2d')
      if (!ctx) return
      ctx.clearRect(0, 0, paperCanvas.width, paperCanvas.height)
      const s = paperSignatureRef.current
      ctx.drawImage(s.img, s.x, s.y, s.w, s.h)
    }
  }, [])

  const setGuideVisible = useCallback((visible: boolean) => {
    const guide = clickGuideRef.current
    if (!guide) return
    guide.style.display = visible ? 'block' : 'none'
  }, [])

  const renderPaperSignatureFromDataUrl = useCallback(
    (dataUrl: string) => {
      const paperCanvas = paperSignCanvasRef.current
      if (!paperCanvas) return
      const img = new Image()
      img.onload = () => {
        const pw = paperCanvas.width
        const ph = paperCanvas.height
        const iw = img.width
        const ih = img.height
        const canvasRatio = pw / ph
        const imgRatio = iw / ih
        const marginScale = 0.9
        let drawW: number
        let drawH: number
        if (imgRatio > canvasRatio) {
          drawW = pw * marginScale
          drawH = drawW / imgRatio
        } else {
          drawH = ph * marginScale
          drawW = drawH * imgRatio
        }
        const offsetX = (pw - drawW) / 2
        const offsetY = (ph - drawH) / 2
        paperSignatureRef.current = { img, w: drawW, h: drawH, x: offsetX, y: offsetY }
        const ctx = paperCanvas.getContext('2d')
        if (!ctx) return
        ctx.clearRect(0, 0, paperCanvas.width, paperCanvas.height)
        ctx.drawImage(img, offsetX, offsetY, drawW, drawH)
        setGuideVisible(false)
      }
      img.src = dataUrl
    },
    [setGuideVisible]
  )

  useEffect(() => {
    resizePaperCanvas()
  }, [resizePaperCanvas])

  useEffect(() => {
    if (!form.signatureDataUrl) return
    // Ensure canvas sized before drawing.
    resizePaperCanvas()
    renderPaperSignatureFromDataUrl(form.signatureDataUrl)
  }, [form.signatureDataUrl, renderPaperSignatureFromDataUrl, resizePaperCanvas])

  useEffect(() => {
    // Match i3 behavior: auto-resize single-line table textareas on load/update.
    document.querySelectorAll('textarea.table-input').forEach(node => {
      if (node instanceof HTMLTextAreaElement) autoResizeTableInput(node)
    })
  }, [form.siteName, form.companyName, form.constructionName, form.constructionPeriod])

  useEffect(() => {
    const paperCanvas = paperSignCanvasRef.current
    if (!paperCanvas) return
    const parent = paperCanvas.parentElement
    if (!parent) return
    const ro = new ResizeObserver(() => resizePaperCanvas())
    ro.observe(parent)
    return () => ro.disconnect()
  }, [resizePaperCanvas])

  const resizeModalCanvas = useCallback(() => {
    const canvas = modalCanvasRef.current
    const pad = signaturePadRef.current
    if (!canvas || !pad) return
    const container = canvas.parentElement
    if (!container) return
    const ratio = Math.max(window.devicePixelRatio || 1, 1)
    const w = container.clientWidth
    const h = container.clientHeight
    if (!w || !h) return

    if (canvas.width !== w * ratio || canvas.height !== h * ratio) {
      const data = pad.toData()
      canvas.width = w * ratio
      canvas.height = h * ratio
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
      pad.clear()
      // redraw backgrounds under strokes
      const prevComp = ctx.globalCompositeOperation
      ctx.globalCompositeOperation = 'destination-over'
      backgroundImagesRef.current.forEach(item => {
        ctx.drawImage(item.img, item.x, item.y, item.w, item.h)
      })
      ctx.globalCompositeOperation = prevComp
      pad.fromData(data)
    }
  }, [])

  const setSignTool = useCallback((type: 'pen' | 'eraser') => {
    const pad = signaturePadRef.current
    if (!pad) return
    if (type === 'eraser') {
      pad.compositeOperation = 'destination-out'
      pad.minWidth = 10
      pad.maxWidth = 20
    } else {
      pad.compositeOperation = 'source-over'
      pad.minWidth = 1
      pad.maxWidth = 3
    }
  }, [])

  const redrawBackgrounds = useCallback(() => {
    const canvas = modalCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const prevComp = ctx.globalCompositeOperation
    ctx.globalCompositeOperation = 'destination-over'
    backgroundImagesRef.current.forEach(item => {
      ctx.drawImage(item.img, item.x, item.y, item.w, item.h)
    })
    ctx.globalCompositeOperation = prevComp
  }, [])

  const openEditor = useCallback((src: string) => {
    const layer = modalEditLayerRef.current
    const img = modalEditingImageRef.current
    const slider = modalScaleSliderRef.current
    if (!layer || !img || !slider) return
    img.src = src
    layer.style.display = 'flex'
    imgStateRef.current = { x: 0, y: 0, scale: 0.5 }
    slider.value = '0.5'
    img.style.transform = `translate(-50%, -50%) translate(0px, 0px) scale(0.5)`
  }, [])

  const closeEditor = useCallback(() => {
    const layer = modalEditLayerRef.current
    if (!layer) return
    layer.style.display = 'none'
  }, [])

  const processImageToStampLike = useCallback((img: HTMLImageElement) => {
    const c = document.createElement('canvas')
    const w = img.width
    const h = img.height
    const max = 800
    let scale = 1
    if (w > max || h > max) scale = max / Math.max(w, h)
    c.width = w * scale
    c.height = h * scale
    const ctx = c.getContext('2d')
    if (!ctx) return null
    ctx.drawImage(img, 0, 0, c.width, c.height)
    const idata = ctx.getImageData(0, 0, c.width, c.height)
    const data = idata.data
    for (let i = 0; i < data.length; i += 4) {
      const avg = (data[i] + data[i + 1] + data[i + 2]) / 3
      if (avg > 200) data[i + 3] = 0
      else {
        data[i] = 0
        data[i + 1] = 0
        data[i + 2] = 0
      }
    }
    ctx.putImageData(idata, 0, 0)
    return c.toDataURL()
  }, [])

  const handleImportImage = useCallback(() => {
    signImageInputRef.current?.click()
  }, [])

  const handleFileChange = useCallback(
    (file: File | null) => {
      if (!file) return
      const reader = new FileReader()
      reader.onload = ev => {
        const img = new Image()
        img.onload = () => {
          const processed = processImageToStampLike(img)
          if (processed) openEditor(processed)
        }
        img.src = String(ev.target?.result || '')
      }
      reader.readAsDataURL(file)
    },
    [openEditor, processImageToStampLike]
  )

  const applyEditorImage = useCallback(() => {
    const editImg = modalEditingImageRef.current
    const editContainer = modalEditContainerRef.current
    const canvas = modalCanvasRef.current
    if (!editImg || !editContainer || !canvas) return

    const imgRect = editImg.getBoundingClientRect()
    const containerRect = editContainer.getBoundingClientRect()

    const imgCenterX = imgRect.left + imgRect.width / 2
    const imgCenterY = imgRect.top + imgRect.height / 2
    const contCenterX = containerRect.left + containerRect.width / 2
    const contCenterY = containerRect.top + containerRect.height / 2

    const relX = (imgCenterX - contCenterX) / containerRect.width
    const relY = (imgCenterY - contCenterY) / containerRect.height

    const ratioX = canvas.width / containerRect.width
    const ratioY = canvas.height / containerRect.height

    const w = imgRect.width * ratioX
    const h = imgRect.height * ratioY

    const canvasCenterX = canvas.width / 2
    const canvasCenterY = canvas.height / 2

    const drawCenterX = canvasCenterX + relX * canvas.width
    const drawCenterY = canvasCenterY + relY * canvas.height

    const x = drawCenterX - w / 2
    const y = drawCenterY - h / 2

    const imgObj = new Image()
    imgObj.onload = () => {
      backgroundImagesRef.current.push({ img: imgObj, x, y, w, h })
      redrawBackgrounds()
      closeEditor()
    }
    imgObj.src = editImg.src
  }, [closeEditor, redrawBackgrounds])

  const undoSignature = useCallback(() => {
    const pad = signaturePadRef.current
    if (!pad) return
    const data = pad.toData()
    if (data && data.length > 0) {
      data.pop()
      pad.fromData(data)
    } else if (backgroundImagesRef.current.length > 0) {
      backgroundImagesRef.current.pop()
      resizeModalCanvas()
      showToast('이미지 삭제됨')
    }
  }, [resizeModalCanvas, showToast])

  const clearAllSignature = useCallback(() => {
    if (!confirm('모두 지우시겠습니까?')) return
    const pad = signaturePadRef.current
    if (!pad) return
    pad.clear()
    backgroundImagesRef.current = []
    resizeModalCanvas()
  }, [resizeModalCanvas])

  const closeSignModal = useCallback(() => {
    setIsSignOpen(false)
    closeEditor()
  }, [closeEditor])

  const applySignatureToPaper = useCallback(() => {
    const pad = signaturePadRef.current
    const modalCanvas = modalCanvasRef.current
    const paperCanvas = paperSignCanvasRef.current
    if (!pad || !modalCanvas || !paperCanvas) return

    if (pad.isEmpty() && backgroundImagesRef.current.length === 0) {
      showToast('서명 내용이 없습니다.')
      return
    }

    const dataURL = modalCanvas.toDataURL('image/png')
    const img = new Image()
    img.onload = () => {
      const pw = paperCanvas.width
      const ph = paperCanvas.height
      const iw = img.width
      const ih = img.height

      const canvasRatio = pw / ph
      const imgRatio = iw / ih
      const marginScale = 0.9
      let drawW: number
      let drawH: number

      if (imgRatio > canvasRatio) {
        drawW = pw * marginScale
        drawH = drawW / imgRatio
      } else {
        drawH = ph * marginScale
        drawW = drawH * imgRatio
      }

      const offsetX = (pw - drawW) / 2
      const offsetY = (ph - drawH) / 2

      paperSignatureRef.current = { img, w: drawW, h: drawH, x: offsetX, y: offsetY }

      const ctx = paperCanvas.getContext('2d')
      if (!ctx) return
      ctx.clearRect(0, 0, paperCanvas.width, paperCanvas.height)
      ctx.drawImage(img, offsetX, offsetY, drawW, drawH)

      setGuideVisible(false)
      setForm(curr => ({ ...curr, signatureDataUrl: dataURL }))
      closeSignModal()
      showToast('서명이 적용되었습니다')
    }
    img.src = dataURL
  }, [closeSignModal, setGuideVisible, showToast])

  const clearPaperSignature = useCallback(() => {
    const paperCanvas = paperSignCanvasRef.current
    if (!paperCanvas) return
    const ctx = paperCanvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, paperCanvas.width, paperCanvas.height)
    paperSignatureRef.current = null
    setGuideVisible(true)
    const pad = signaturePadRef.current
    if (pad) pad.clear()
    backgroundImagesRef.current = []
    resizeModalCanvas()
    setForm(curr => ({ ...curr, signatureDataUrl: null }))
  }, [resizeModalCanvas, setGuideVisible])

  // Initialize signature pad when script is ready + modal canvas exists.
  const ensureSignaturePad = useCallback(() => {
    const canvas = modalCanvasRef.current
    if (!canvas) return false
    if (!window.SignaturePad) return false
    if (signaturePadRef.current) return true

    signaturePadRef.current = new window.SignaturePad(canvas, {
      minWidth: 1.0,
      maxWidth: 3.0,
      penColor: '#000',
      throttle: 8,
    })
    setSignTool('pen')
    return true
  }, [setSignTool])

  useEffect(() => {
    if (!signaturePadReady) return
    const ok = ensureSignaturePad()
    if (ok && isSignOpen) {
      const t = window.setTimeout(() => resizeModalCanvas(), 0)
      return () => window.clearTimeout(t)
    }
  }, [ensureSignaturePad, isSignOpen, resizeModalCanvas, signaturePadReady])

  useEffect(() => {
    if (!isSignOpen) return
    // If the modal opens before the script is ready, initialize as soon as possible.
    if (signaturePadReady) ensureSignaturePad()
    // Delay to let modal layout settle (ported behavior).
    const t = window.setTimeout(() => resizeModalCanvas(), 100)
    return () => window.clearTimeout(t)
  }, [ensureSignaturePad, isSignOpen, resizeModalCanvas, signaturePadReady])

  // Drag imported image inside editor layer.
  useEffect(() => {
    const img = modalEditingImageRef.current
    const slider = modalScaleSliderRef.current
    if (!img || !slider) return

    const updateTransform = () => {
      const s = imgStateRef.current
      img.style.transform = `translate(-50%, -50%) translate(${s.x}px, ${s.y}px) scale(${s.scale})`
    }

    const onSlider = () => {
      imgStateRef.current.scale = parseFloat(slider.value)
      updateTransform()
    }

    const startDrag = (e: MouseEvent | TouchEvent) => {
      e.preventDefault()
      isDraggingImgRef.current = true
      const cx = 'touches' in e ? e.touches[0]?.clientX : (e as MouseEvent).clientX
      const cy = 'touches' in e ? e.touches[0]?.clientY : (e as MouseEvent).clientY
      dragStartRef.current = { x: cx - imgStateRef.current.x, y: cy - imgStateRef.current.y }

      const move = (ev: MouseEvent | TouchEvent) => {
        if (!isDraggingImgRef.current) return
        ev.preventDefault()
        const mx = 'touches' in ev ? ev.touches[0]?.clientX : (ev as MouseEvent).clientX
        const my = 'touches' in ev ? ev.touches[0]?.clientY : (ev as MouseEvent).clientY
        imgStateRef.current.x = mx - dragStartRef.current.x
        imgStateRef.current.y = my - dragStartRef.current.y
        updateTransform()
      }

      const end = () => {
        isDraggingImgRef.current = false
        document.removeEventListener('mousemove', move as any)
        document.removeEventListener('mouseup', end)
        document.removeEventListener('touchmove', move as any)
        document.removeEventListener('touchend', end)
      }

      document.addEventListener('mousemove', move as any)
      document.addEventListener('mouseup', end)
      document.addEventListener('touchmove', move as any, { passive: false })
      document.addEventListener('touchend', end)
    }

    slider.addEventListener('input', onSlider)
    img.addEventListener('mousedown', startDrag as any)
    img.addEventListener('touchstart', startDrag as any, { passive: false })

    return () => {
      slider.removeEventListener('input', onSlider)
      img.removeEventListener('mousedown', startDrag as any)
      img.removeEventListener('touchstart', startDrag as any)
    }
  }, [])

  // Exporter helpers (ported onclone fixes).
  const fixRecipientForCapture = (clonedDoc: Document) => {
    try {
      const docArea = clonedDoc.getElementById('documentArea')
      if (!docArea) return

      const row = docArea.querySelector('.recipient-row')
      if (!row) return

      const companyInput = row.querySelector('input.recipient-input') as HTMLInputElement | null
      const suffixInput = row.querySelector('input.recipient-suffix') as HTMLInputElement | null

      const replaceWithDiv = (
        inputEl: HTMLInputElement | null,
        cssText: string,
        fallbackText = ''
      ) => {
        if (!inputEl || !inputEl.parentNode) return
        const div = clonedDoc.createElement('div')
        const val = (inputEl.value || '').trim()
        div.textContent = val || fallbackText
        div.setAttribute('style', cssText)
        inputEl.parentNode.replaceChild(div, inputEl)
      }

      if (companyInput) {
        replaceWithDiv(
          companyInput,
          [
            'text-align:center',
            'font-size:24px',
            'font-weight:800',
            'width:300px',
            'height:60px',
            'line-height:60px',
            'box-sizing:border-box',
            'border-bottom:2px solid #000',
            'background:transparent',
            'border-radius:0',
            'padding:0',
            'margin-bottom:3px',
            'color:#000',
            'font-family:inherit',
          ].join(';'),
          ''
        )
      }

      if (suffixInput) {
        replaceWithDiv(
          suffixInput,
          [
            'width:60px',
            'text-align:left',
            'font-size:20px',
            'font-weight:700',
            'height:auto',
            'line-height:1.4',
            'box-sizing:border-box',
            'border:none',
            'background:transparent',
            'padding:0',
            'margin-bottom:10px',
            'color:#000',
            'font-family:inherit',
          ].join(';'),
          '귀중'
        )
      }
    } catch {
      // ignore
    }
  }

  const fixTableInputsForCapture = (clonedDoc: Document) => {
    try {
      const docArea = clonedDoc.getElementById('documentArea')
      if (!docArea) return

      const targets = docArea.querySelectorAll('textarea.table-input')
      targets.forEach(ta => {
        if (!ta || !ta.parentNode) return
        const computed = clonedDoc.defaultView?.getComputedStyle(ta as any)
        const height = computed?.height || ''
        const div = clonedDoc.createElement('div')
        div.textContent = (ta as HTMLTextAreaElement).value || ''
        div.setAttribute(
          'style',
          [
            'width:100%',
            'border:none',
            'background:transparent',
            'font-family:inherit',
            'font-size:16px',
            'color:#000',
            'outline:none',
            'padding:2px',
            'font-weight:600',
            'white-space:pre-wrap',
            'word-break:break-word',
            'line-height:1.4',
            'min-height:24px',
            height ? `height:${height}` : '',
            'display:block',
          ].join(';')
        )
        ta.parentNode.replaceChild(div, ta)
      })
    } catch {
      // ignore
    }
  }

  const fixOtherInputsForCapture = (clonedDoc: Document) => {
    try {
      const docArea = clonedDoc.getElementById('documentArea')
      if (!docArea) return

      // Replace sign inputs (소속/성명) to avoid baseline drift in html2canvas.
      docArea.querySelectorAll('input.sign-input-text').forEach(node => {
        const input = node as HTMLInputElement
        if (!input?.parentNode) return
        const div = clonedDoc.createElement('div')
        div.textContent = (input.value || '').trim()
        div.setAttribute(
          'style',
          [
            'text-align:center',
            'font-size:18px',
            'font-weight:700',
            'width:100%',
            'border-bottom:1px dashed #cbd5e1',
            'padding:4px',
            'box-sizing:border-box',
            'color:#000',
            'font-family:inherit',
            'line-height:1.2',
            'min-height:26px',
          ].join(';')
        )
        input.parentNode.replaceChild(div, input)
      })

      // Replace the date field (large centered date text).
      const dateField = docArea.querySelector('#dateField') as HTMLInputElement | null
      if (dateField?.parentNode) {
        const div = clonedDoc.createElement('div')
        div.textContent = (dateField.value || '').trim()
        div.setAttribute(
          'style',
          [
            'font-size:20px',
            'font-weight:800',
            'text-align:center',
            'margin-bottom:30px',
            'padding:4px',
            'color:#000',
            'font-family:inherit',
            'line-height:1.2',
          ].join(';')
        )
        dateField.parentNode.replaceChild(div, dateField)
      }

      // Replace section textareas (작업내용/특기사항) to avoid baseline drift in capture.
      docArea.querySelectorAll('.section-block textarea').forEach(node => {
        const ta = node as HTMLTextAreaElement
        if (!ta?.parentNode) return
        const computed = clonedDoc.defaultView?.getComputedStyle(ta as any)
        const height = computed?.height || ''
        const lineHeight = computed?.lineHeight || '1.6'
        const padding = computed?.padding || '4px'

        const div = clonedDoc.createElement('div')
        div.textContent = ta.value || ''
        div.setAttribute(
          'style',
          [
            'width:100%',
            'border:none',
            'background:transparent',
            'font-family:inherit',
            'font-size:16px',
            'color:#000',
            'outline:none',
            `padding:${padding}`,
            'font-weight:600',
            'white-space:pre-wrap',
            'word-break:break-word',
            `line-height:${lineHeight}`,
            height ? `height:${height}` : '',
            'display:block',
          ].join(';')
        )
        ta.parentNode.replaceChild(div, ta)
      })
    } catch {
      // ignore
    }
  }

  const prepareCapture = useCallback(async () => {
    const wrapper = paperWrapperRef.current
    if (!wrapper) return () => {}

    try {
      // Ensure webfonts are ready before html2canvas snapshots to reduce baseline drift.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fontsReady = (document as any)?.fonts?.ready
      // Proactively load the exact faces used by the i3 certificate (static Pretendard).
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fontsLoad = (document as any)?.fonts?.load
      if (fontsLoad && typeof fontsLoad === 'function') {
        await Promise.all([
          fontsLoad('400 16px Pretendard'),
          fontsLoad('600 16px Pretendard'),
          fontsLoad('700 16px Pretendard'),
          fontsLoad('800 16px Pretendard'),
          fontsLoad('900 36px Pretendard'),
        ])
      }
      if (fontsReady && typeof fontsReady.then === 'function') {
        await fontsReady
      }
    } catch {
      // ignore
    }

    const originalTransform = wrapper.style.transform
    const originalMargin = wrapper.style.margin

    const inputs = document.querySelectorAll('input, textarea')
    const placeholders: Array<{ el: HTMLInputElement | HTMLTextAreaElement; val: string }> = []
    inputs.forEach(el => {
      placeholders.push({ el: el as any, val: (el as any).placeholder || '' })
      ;(el as any).placeholder = ''
    })

    const guide = clickGuideRef.current
    const guideDisplay = guide ? guide.style.display : ''
    if (guide) guide.style.display = 'none'

    wrapper.style.transform = 'scale(1)'
    wrapper.style.margin = '0'
    document.body.classList.add('clean-mode')

    await new Promise(r => setTimeout(r, 100))

    return () => {
      wrapper.style.transform = originalTransform
      wrapper.style.margin = originalMargin
      document.body.classList.remove('clean-mode')
      placeholders.forEach(item => (item.el.placeholder = item.val))
      if (guide) guide.style.display = guideDisplay || ''
    }
  }, [])

  const savePdf = useCallback(async () => {
    const docArea = documentAreaRef.current
    if (!docArea) return
    showToast('PDF 생성 중...')
    const restore = await prepareCapture()
    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(docArea, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        onclone: clonedDoc => {
          fixRecipientForCapture(clonedDoc as any)
          fixTableInputsForCapture(clonedDoc as any)
          fixOtherInputsForCapture(clonedDoc as any)
        },
      })

      const imgData = canvas.toDataURL('image/jpeg', 0.95)
      const { jsPDF } = await import('jspdf')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pW = pdf.internal.pageSize.getWidth()
      const pH = pdf.internal.pageSize.getHeight()
      const imgH = (canvas.height * pW) / canvas.width

      if (imgH <= pH) {
        const totalMargin = pH - imgH
        const topMargin = totalMargin / 2
        pdf.addImage(imgData, 'JPEG', 0, topMargin, pW, imgH)
      } else {
        const ratio = pH / imgH
        pdf.addImage(imgData, 'JPEG', 0, 0, pW * ratio, imgH * ratio)
      }

      const now = new Date()
      const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
      pdf.save(`작업완료확인서_${dateStr}.pdf`)
      showToast('저장되었습니다!')
    } catch (e) {
      console.error(e)
      showToast('저장 실패')
    } finally {
      restore()
    }
  }, [prepareCapture, showToast])

  const shareContent = useCallback(async () => {
    const docArea = documentAreaRef.current
    if (!docArea) return
    if (!(navigator as any)?.share) {
      alert('공유 기능을 지원하지 않는 브라우저입니다.')
      return
    }
    showToast('이미지 생성 중...')
    const restore = await prepareCapture()
    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(docArea, {
        scale: 2,
        useCORS: true,
        onclone: clonedDoc => {
          fixRecipientForCapture(clonedDoc as any)
          fixTableInputsForCapture(clonedDoc as any)
          fixOtherInputsForCapture(clonedDoc as any)
        },
      })
      await new Promise<void>((resolve, reject) => {
        canvas.toBlob(
          async blob => {
            try {
              if (!blob) return reject(new Error('blob 생성 실패'))
              const file = new File([blob], 'confirmation.jpg', { type: 'image/jpeg' })
              await (navigator as any).share({ title: '작업확인서', files: [file] })
              resolve()
            } catch (err) {
              reject(err)
            }
          },
          'image/jpeg',
          0.9
        )
      })
    } catch (e) {
      showToast('공유 실패')
    } finally {
      restore()
    }
  }, [prepareCapture, showToast])

  const resetAll = useCallback(() => {
    if (!confirm('모든 입력을 초기화하시겠습니까?')) return
    setForm(curr =>
      emptyForm({
        siteId: curr.siteId,
        worklogId: curr.worklogId,
        signerName: curr.signerName,
      })
    )
    clearPaperSignature()
    showToast('초기화 완료')
  }, [clearPaperSignature, showToast])

  return (
    <MobileAuthGuard requiredRoles={['site_manager']}>
      <Script
        src="/vendor/signature_pad.umd.min.js"
        strategy="afterInteractive"
        onLoad={() => setSignaturePadReady(true)}
        onError={() => {
          setSignaturePadReady(false)
          showToast('서명 모듈 로드 실패')
        }}
      />

      <header className="header-bar">
        <button
          type="button"
          className="icon-btn"
          aria-label="뒤로가기"
          onClick={() => {
            if (confirm('종료하시겠습니까?')) router.back()
          }}
        >
          <ChevronLeft width={28} height={28} />
        </button>
        <div className="header-title">작업완료확인서</div>
        <div className="header-right">
          <button type="button" className="icon-btn" aria-label="새로고침" onClick={resetAll}>
            <RotateCcw width={24} height={24} />
          </button>
          <button type="button" className="icon-btn" aria-label="다운로드" onClick={savePdf}>
            <Download width={24} height={24} />
          </button>
        </div>
      </header>

      <div className={`viewport ${isPanning ? 'panning' : ''}`} id="viewport" ref={viewportRef}>
        <div className="paper-wrapper" id="paperWrapper" ref={paperWrapperRef}>
          <div className="a4-paper" id="documentArea" ref={documentAreaRef}>
            <header className="doc-header">
              <h1 className="doc-title">작 업 완 료 확 인 서</h1>
            </header>

            <table className="info-table">
              <colgroup>
                <col style={{ width: '12%' }} />
                <col style={{ width: '48%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '30%' }} />
              </colgroup>
              <tbody>
                <tr>
                  <th>현 장 명</th>
                  <td>
                    <textarea
                      className="table-input"
                      rows={1}
                      placeholder="내용 입력"
                      value={form.siteName}
                      onChange={e => {
                        autoResizeTableInput(e.currentTarget)
                        setForm(f => ({ ...f, siteName: e.target.value }))
                      }}
                      onInput={e => autoResizeTableInput(e.currentTarget)}
                    />
                  </td>
                  <th>업 체</th>
                  <td>
                    <textarea
                      className="table-input"
                      rows={1}
                      placeholder="업체명 입력"
                      value={form.companyName}
                      onChange={e => {
                        autoResizeTableInput(e.currentTarget)
                        setForm(f => ({ ...f, companyName: e.target.value }))
                      }}
                      onInput={e => autoResizeTableInput(e.currentTarget)}
                    />
                  </td>
                </tr>
                <tr>
                  <th>공 사 명</th>
                  <td>
                    <textarea
                      className="table-input"
                      rows={1}
                      placeholder="공사명 입력"
                      value={form.constructionName}
                      onChange={e => {
                        autoResizeTableInput(e.currentTarget)
                        setForm(f => ({ ...f, constructionName: e.target.value }))
                      }}
                      onInput={e => autoResizeTableInput(e.currentTarget)}
                    />
                  </td>
                  <th>공사기간</th>
                  <td>
                    <textarea
                      className="table-input"
                      rows={1}
                      placeholder="기간 입력"
                      value={form.constructionPeriod}
                      onChange={e => {
                        autoResizeTableInput(e.currentTarget)
                        setForm(f => ({ ...f, constructionPeriod: e.target.value }))
                      }}
                      onInput={e => autoResizeTableInput(e.currentTarget)}
                    />
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="section-block">
              <div className="sec-header">작업내용</div>
              <textarea
                style={{ flex: 1, lineHeight: 1.6 }}
                placeholder="상세 내용"
                value={form.workContent}
                onChange={e => setForm(f => ({ ...f, workContent: e.target.value }))}
              />
            </div>

            <div className="section-block note">
              <div className="sec-header">특기사항</div>
              <textarea
                style={{ flex: 1 }}
                placeholder="특이사항"
                value={form.specialNotes}
                onChange={e => setForm(f => ({ ...f, specialNotes: e.target.value }))}
              />
            </div>

            <div className="footer-area">
              <div className="confirm-msg">상기 사항과 같이 작업을 완료하였음을 확인합니다.</div>

              <input
                type="text"
                id="dateField"
                className="date-input"
                value={form.confirmDateText}
                style={{ cursor: 'pointer' }}
                readOnly
                onFocus={e => {
                  ;(e.currentTarget as HTMLInputElement).readOnly = false
                }}
                onBlur={e => {
                  const next = e.currentTarget.value.trim() || formatKoreanDate(new Date())
                  ;(e.currentTarget as HTMLInputElement).readOnly = true
                  setForm(f => ({ ...f, confirmDateText: next }))
                }}
                onChange={e => setForm(f => ({ ...f, confirmDateText: e.target.value }))}
              />

              <div className="sign-grid">
                <div className="sign-cell-text">
                  <span className="sign-label-text">소 속 :</span>
                  <input
                    type="text"
                    className="sign-input-text"
                    value={form.affiliation}
                    placeholder="소속 입력"
                    onChange={e => setForm(f => ({ ...f, affiliation: e.target.value }))}
                  />
                </div>
                <div className="sign-cell-text">
                  <span className="sign-label-text">성 명 :</span>
                  <input
                    type="text"
                    className="sign-input-text"
                    value={form.signerName}
                    placeholder="이름 입력"
                    onChange={e => setForm(f => ({ ...f, signerName: e.target.value }))}
                  />
                </div>

                <div
                  className="sign-cell-canvas"
                  id="triggerSignModal"
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    if (!signaturePadReady) {
                      showToast('서명 모듈 로딩 중...')
                    }
                    setIsSignOpen(true)
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      if (!signaturePadReady) {
                        showToast('서명 모듈 로딩 중...')
                      }
                      setIsSignOpen(true)
                    }
                  }}
                >
                  <div className="sign-label-canvas">확인자 (서명)</div>
                  <div className="display-canvas-wrapper">
                    <canvas id="paperSignCanvas" ref={paperSignCanvasRef} />
                    <div className="click-guide" id="clickGuideText" ref={clickGuideRef}>
                      서명하려면 터치
                    </div>
                  </div>
                </div>
              </div>

              <div className="recipient-row">
                <input
                  type="text"
                  className="recipient-input"
                  placeholder="회사명"
                  value={form.recipientCompany}
                  onChange={e => setForm(f => ({ ...f, recipientCompany: e.target.value }))}
                />
                <input
                  type="text"
                  className="recipient-suffix"
                  value={form.recipientSuffix}
                  placeholder=""
                  onChange={e => setForm(f => ({ ...f, recipientSuffix: e.target.value }))}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="controls-pill">
        <button
          type="button"
          className="ctrl-btn"
          onClick={() => adjustZoom(-0.1)}
          aria-label="축소"
        >
          <Minus width={20} height={20} />
          축소
        </button>
        <button
          type="button"
          className={`ctrl-btn ${isPanning ? 'active' : ''}`}
          onClick={togglePan}
          aria-label="이동"
        >
          <Hand width={20} height={20} />
          이동
        </button>
        <button
          type="button"
          className="ctrl-btn"
          onClick={() => adjustZoom(0.1)}
          aria-label="확대"
        >
          <Plus width={20} height={20} />
          확대
        </button>
        <button type="button" className="ctrl-btn" onClick={shareContent} aria-label="공유">
          <Share2 width={20} height={20} />
          공유
        </button>
      </div>

      <div className="toast" id="toast" ref={toastRef}>
        <Check size={18} />
        <span id="toastMsg" ref={toastMsgRef}>
          완료
        </span>
      </div>

      <div className={`sign-modal ${isSignOpen ? 'open' : ''}`} id="signModal">
        <div className="modal-content">
          <div className="modal-header">
            <span className="modal-title">서명 또는 도장 입력</span>
            <button
              type="button"
              className="close-btn"
              id="btnCloseModalX"
              onClick={closeSignModal}
            >
              <X />
            </button>
          </div>

          <div className="modal-body">
            <canvas id="modalCanvas" ref={modalCanvasRef} />

            <div id="modalEditLayer" ref={modalEditLayerRef}>
              <div id="modalEditContainer" ref={modalEditContainerRef}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  id="modalEditingImage"
                  ref={modalEditingImageRef}
                  src=""
                  alt="Stamp"
                  draggable={false}
                />
              </div>
              <div className="modal-edit-controls">
                <span style={{ color: '#fff', fontSize: 12, whiteSpace: 'nowrap' }}>크기</span>
                <input
                  type="range"
                  id="modalScaleSlider"
                  ref={modalScaleSliderRef}
                  min="0.1"
                  max="2.0"
                  step="0.05"
                  defaultValue="0.5"
                  style={{ flex: 1 }}
                />
                <button type="button" className="mini-btn" id="btnEditCancel" onClick={closeEditor}>
                  취소
                </button>
                <button
                  type="button"
                  className="mini-btn active"
                  id="btnEditApply"
                  onClick={applyEditorImage}
                >
                  적용
                </button>
              </div>
            </div>
          </div>

          <div className="sign-tools-bar" id="signToolsBar">
            <button
              type="button"
              className="mini-btn active"
              id="btnPen"
              style={{ marginRight: 4 }}
              onClick={e => {
                setSignTool('pen')
                ;(document.querySelectorAll('.sign-tools-bar button') || []).forEach(b =>
                  b.classList.remove('active')
                )
                ;(e.currentTarget as HTMLButtonElement).classList.add('active')
              }}
            >
              <PenTool width={14} /> 펜
            </button>
            <button
              type="button"
              className="mini-btn"
              id="btnEraser"
              style={{ marginRight: 10 }}
              onClick={e => {
                setSignTool('eraser')
                ;(document.querySelectorAll('.sign-tools-bar button') || []).forEach(b =>
                  b.classList.remove('active')
                )
                ;(e.currentTarget as HTMLButtonElement).classList.add('active')
              }}
            >
              <Eraser width={14} /> 지우개
            </button>
            <button
              type="button"
              className="uu-btn dashed type-gray-secondary"
              id="btnImport"
              style={{ height: 40, fontSize: 13, padding: '0 12px', marginRight: 4 }}
              onClick={handleImportImage}
            >
              <ImagePlus width={16} /> 도장/사진
            </button>
            <button type="button" className="mini-btn" id="btnUndo" onClick={undoSignature}>
              <Undo2 width={14} />
            </button>
            <button type="button" className="mini-btn" id="btnClear" onClick={clearAllSignature}>
              <Trash2 width={14} />
            </button>
            <input
              type="file"
              id="signImageInput"
              ref={signImageInputRef}
              accept="image/*"
              onChange={e => {
                const file = e.currentTarget.files?.[0] || null
                handleFileChange(file)
                e.currentTarget.value = ''
              }}
            />
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="uu-btn dashed type-gray-secondary"
              id="btnCancelModal"
              onClick={closeSignModal}
            >
              취소
            </button>
            <button
              type="button"
              className="uu-btn solid type-blue"
              id="btnConfirmModal"
              onClick={applySignatureToPaper}
            >
              서명 완료
            </button>
          </div>
        </div>
      </div>
    </MobileAuthGuard>
  )
}
