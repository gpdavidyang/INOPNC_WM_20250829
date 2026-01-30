import React, { useEffect, useRef, useState } from 'react'
import { ChevronLeft } from 'lucide-react'

interface CertificateModalProps {
  isOpen: boolean
  onClose: () => void
  onHeaderReset?: () => void
}

// Helper to load scripts sequentially
const loadScript = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve()
      return
    }
    const script = document.createElement('script')
    script.src = src
    script.onload = () => resolve()
    script.onerror = reject
    document.head.appendChild(script)
  })
}

export const CertificateModal: React.FC<CertificateModalProps> = ({
  isOpen,
  onClose,
  onHeaderReset,
}) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const appInstanceRef = useRef<any>(null)

  // Load external libraries when modal opens
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'

      const loadAll = async () => {
        try {
          await loadScript('https://unpkg.com/lucide@latest/dist/umd/lucide.js')
          await loadScript(
            'https://cdn.jsdelivr.net/npm/signature_pad@4.1.7/dist/signature_pad.umd.min.js'
          )
          await loadScript(
            'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
          )
          await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js')
          setIsLoaded(true)
        } catch (e) {
          console.error('Failed to load scripts', e)
        }
      }
      loadAll()
    } else {
      document.body.style.overflow = ''
      setIsLoaded(false)
      appInstanceRef.current = null
    }
  }, [isOpen])

  // Handle Back Button Click
  const handleBack = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (window.confirm('종료하시겠습니까?')) {
      // 헤더 초기 상태로 복원
      if (onHeaderReset) {
        onHeaderReset()
      }
      onClose()
    }
  }

  // Initialize the Logic (Ported from HTML script)
  useEffect(() => {
    if (!isOpen || !isLoaded || !containerRef.current) return

    // --- Start of Ported Logic ---

    // UI Utils
    class UiUtils {
      toastEl: HTMLElement | null
      toastMsgEl: HTMLElement | null
      timer: any

      constructor() {
        this.toastEl = document.getElementById('toast')
        this.toastMsgEl = document.getElementById('toastMsg')
        this.timer = null
      }
      showToast(msg: string) {
        if (!this.toastEl || !this.toastMsgEl) return
        this.toastMsgEl.innerText = msg
        this.toastEl.classList.add('show')
        clearTimeout(this.timer)
        this.timer = setTimeout(() => this.toastEl?.classList.remove('show'), 2000)
      }
    }

    // Viewer Manager
    class ViewerManager {
      ui: UiUtils
      viewport: HTMLElement | null
      paperWrapper: HTMLElement | null
      btnPan: HTMLElement | null
      zoomLevel: number
      isPanning: boolean
      startX: number
      startY: number
      pointX: number
      pointY: number
      resizeTimer: any

      constructor(uiUtils: UiUtils) {
        this.ui = uiUtils
        this.viewport = document.getElementById('viewport')
        this.paperWrapper = document.getElementById('paperWrapper')
        this.btnPan = document.getElementById('btnPanToggle')
        this.zoomLevel = 1.0
        this.isPanning = false
        this.startX = 0
        this.startY = 0
        this.pointX = 0
        this.pointY = 0
        this.bindEvents()
      }
      bindEvents() {
        document.getElementById('btnZoomIn')?.addEventListener('click', () => this.adjustZoom(0.1))
        document
          .getElementById('btnZoomOut')
          ?.addEventListener('click', () => this.adjustZoom(-0.1))
        this.btnPan?.addEventListener('click', () => this.togglePan())

        const startPan = (e: any) => {
          if (!this.isPanning) return
          const target = e.target as HTMLElement
          if (['INPUT', 'TEXTAREA', 'BUTTON'].includes(target.tagName)) return
          if (
            target.id === 'paperSignCanvas' ||
            (target.closest && target.closest('.sign-cell-canvas'))
          ) {
            return
          }
          e.preventDefault()
          const cx = e.touches ? e.touches[0].clientX : e.clientX
          const cy = e.touches ? e.touches[0].clientY : e.clientY
          this.startX = cx - this.pointX
          this.startY = cy - this.pointY

          const moveHandler = (ev: any) => {
            ev.preventDefault()
            const mx = ev.touches ? ev.touches[0].clientX : ev.clientX
            const my = ev.touches ? ev.touches[0].clientY : ev.clientY
            this.pointX = mx - this.startX
            this.pointY = my - this.startY
            this.updateTransform()
          }
          const upHandler = () => {
            document.removeEventListener('mousemove', moveHandler)
            document.removeEventListener('mouseup', upHandler)
            document.removeEventListener('touchmove', moveHandler)
            document.removeEventListener('touchend', upHandler)
          }
          document.addEventListener('mousemove', moveHandler)
          document.addEventListener('mouseup', upHandler)
          document.addEventListener('touchmove', moveHandler, { passive: false })
          document.addEventListener('touchend', upHandler)
        }

        this.viewport?.addEventListener('mousedown', startPan)
        this.viewport?.addEventListener('touchstart', startPan, { passive: false })

        window.addEventListener('resize', () => {
          clearTimeout(this.resizeTimer)
          this.resizeTimer = setTimeout(() => this.fitToWidth(), 200)
        })
        setTimeout(() => this.fitToWidth(), 100)
      }
      fitToWidth() {
        if (!this.viewport) return
        const viewportW = this.viewport.clientWidth
        const contentW = 854 // A4 px width
        let scale = viewportW / contentW
        if (scale > 1.1) scale = 1.0
        this.zoomLevel = scale
        this.pointX = 0
        this.pointY = 0
        this.updateTransform()
      }
      adjustZoom(delta: number) {
        this.zoomLevel = Math.max(0.3, this.zoomLevel + delta)
        this.updateTransform()
      }
      togglePan() {
        this.isPanning = !this.isPanning
        this.btnPan?.classList.toggle('active', this.isPanning)
        this.viewport?.classList.toggle('panning', this.isPanning)
        this.ui.showToast(this.isPanning ? '이동 모드' : '입력 모드')
      }
      updateTransform() {
        if (this.paperWrapper) {
          this.paperWrapper.style.transform = `translate(${this.pointX}px, ${this.pointY}px) scale(${this.zoomLevel})`
        }
      }
    }

    // Signature Manager
    class SignatureManager {
      ui: UiUtils
      viewer: ViewerManager
      triggerBtn: HTMLElement | null
      paperCanvas: HTMLCanvasElement | null
      guideText: HTMLElement | null
      modal: HTMLElement | null
      modalCanvas: HTMLCanvasElement | null
      fileInput: HTMLInputElement | null
      editLayer: HTMLElement | null
      editImg: HTMLImageElement | null
      editContainer: HTMLElement | null
      scaleSlider: HTMLInputElement | null
      backgroundImages: any[]
      pad: any
      isOpen: boolean
      imgState: { x: number; y: number; scale: number }
      isDraggingImg: boolean
      dragStart: { x: number; y: number }
      paperSignature: any
      paperDrag: {
        isDragging: boolean
        startX: number
        startY: number
        baseX: number
        baseY: number
      }

      constructor(uiUtils: UiUtils, viewerManager: ViewerManager) {
        this.ui = uiUtils
        this.viewer = viewerManager

        this.triggerBtn = document.getElementById('triggerSignModal')
        this.paperCanvas = document.getElementById('paperSignCanvas') as HTMLCanvasElement
        this.guideText = document.getElementById('clickGuideText')

        this.modal = document.getElementById('signModal')
        this.modalCanvas = document.getElementById('modalCanvas') as HTMLCanvasElement
        this.fileInput = document.getElementById('signImageInput') as HTMLInputElement

        this.editLayer = document.getElementById('modalEditLayer')
        this.editImg = document.getElementById('modalEditingImage') as HTMLImageElement
        this.editContainer = document.getElementById('modalEditContainer')
        this.scaleSlider = document.getElementById('modalScaleSlider') as HTMLInputElement

        this.backgroundImages = []
        this.pad = null
        this.isOpen = false

        this.imgState = { x: 0, y: 0, scale: 0.5 }
        this.isDraggingImg = false
        this.dragStart = { x: 0, y: 0 }

        this.paperSignature = null
        this.paperDrag = { isDragging: false, startX: 0, startY: 0, baseX: 0, baseY: 0 }

        this.init()
      }

      init() {
        // @ts-ignore
        const SignaturePad = (window as any).SignaturePad
        this.pad = new SignaturePad(this.modalCanvas, {
          minWidth: 1.0,
          maxWidth: 3.0,
          penColor: 'black',
          throttle: 8,
        })

        this.triggerBtn?.addEventListener('click', () => this.openModal())
        document
          .getElementById('btnCloseModalX')
          ?.addEventListener('click', () => this.closeModal())
        document
          .getElementById('btnCancelModal')
          ?.addEventListener('click', () => this.closeModal())
        document
          .getElementById('btnConfirmModal')
          ?.addEventListener('click', () => this.applySignature())

        document
          .getElementById('btnPen')
          ?.addEventListener('click', e => this.setTool('pen', e.target))
        document
          .getElementById('btnEraser')
          ?.addEventListener('click', e => this.setTool('eraser', e.target))
        document.getElementById('btnUndo')?.addEventListener('click', () => this.undo())
        document.getElementById('btnClear')?.addEventListener('click', () => this.clearAll())

        document
          .getElementById('btnImport')
          ?.addEventListener('click', () => this.fileInput?.click())
        this.fileInput?.addEventListener('change', e => this.handleFile(e))

        document
          .getElementById('btnEditCancel')
          ?.addEventListener('click', () => this.closeEditor())
        document
          .getElementById('btnEditApply')
          ?.addEventListener('click', () => this.applyEditorImage())

        this.scaleSlider?.addEventListener('input', (e: any) => {
          this.imgState.scale = parseFloat(e.target.value)
          this.updateImgTransform()
        })

        this.editImg?.addEventListener('mousedown', e => this.startDrag(e))
        this.editImg?.addEventListener('touchstart', e => this.startDrag(e), { passive: false })

        if (this.paperCanvas && this.paperCanvas.parentElement) {
          new ResizeObserver(() => this.resizePaperCanvas()).observe(
            this.paperCanvas!.parentElement!
          )
          this.paperCanvas.addEventListener('mousedown', e => this.startPaperDrag(e))
          this.paperCanvas.addEventListener('touchstart', e => this.startPaperDrag(e), {
            passive: false,
          })
        }
      }

      openModal() {
        this.isOpen = true
        this.modal?.classList.add('open')
        setTimeout(() => {
          this.resizeModalCanvas()
        }, 100)
      }

      closeModal() {
        this.isOpen = false
        this.modal?.classList.remove('open')
        this.closeEditor()
      }

      resizeModalCanvas() {
        if (!this.modalCanvas || !this.modalCanvas.parentElement) return
        const container = this.modalCanvas.parentElement
        const ratio = Math.max(window.devicePixelRatio || 1, 1)

        const w = container.clientWidth
        const h = container.clientHeight

        if (this.modalCanvas.width !== w * ratio) {
          const data = this.pad.toData()

          this.modalCanvas.width = w * ratio
          this.modalCanvas.height = h * ratio
          this.modalCanvas.getContext('2d')?.scale(ratio, ratio)

          this.pad.clear()
          this.redrawBackgrounds()
          this.pad.fromData(data)
        }
      }

      setTool(type: string, btn: any) {
        const allBtns = document.querySelectorAll('.sign-tools-bar button')
        allBtns.forEach(b => b.classList.remove('active'))
        ;(btn.closest('button') || btn).classList.add('active')

        if (type === 'eraser') {
          this.pad.compositeOperation = 'destination-out'
          this.pad.minWidth = 10
          this.pad.maxWidth = 20
        } else {
          this.pad.compositeOperation = 'source-over'
          this.pad.minWidth = 1
          this.pad.maxWidth = 3
        }
      }

      undo() {
        const data = this.pad.toData()
        if (data && data.length > 0) {
          data.pop()
          this.pad.fromData(data)
        } else if (this.backgroundImages.length > 0) {
          this.backgroundImages.pop()
          this.resizeModalCanvas()
          this.ui.showToast('이미지 삭제됨')
        }
      }

      clearAll() {
        if (window.confirm('모두 지우시겠습니까?')) {
          this.pad.clear()
          this.backgroundImages = []
          this.resizeModalCanvas()
        }
      }

      handleFile(e: any) {
        const file = e.target.files[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = (ev: any) => {
          const img = new Image()
          img.onload = () => {
            const processedUrl = this.processImage(img)
            this.openEditor(processedUrl)
          }
          img.src = ev.target.result
        }
        reader.readAsDataURL(file)
        e.target.value = ''
      }

      processImage(img: HTMLImageElement) {
        const c = document.createElement('canvas')
        const w = img.width,
          h = img.height
        const max = 800
        let scale = 1
        if (w > max || h > max) scale = max / Math.max(w, h)

        c.width = w * scale
        c.height = h * scale
        const ctx = c.getContext('2d')
        if (!ctx) return ''
        ctx.drawImage(img, 0, 0, c.width, c.height)

        const idata = ctx.getImageData(0, 0, c.width, c.height)
        const data = idata.data
        for (let i = 0; i < data.length; i += 4) {
          const avg = (data[i] + data[i + 1] + data[i + 2]) / 3
          if (avg > 200) data[i + 3] = 0
          else {
            data[i] = data[i + 1] = data[i + 2] = 0
          }
        }
        ctx.putImageData(idata, 0, 0)
        return c.toDataURL()
      }

      openEditor(src: string) {
        if (this.editImg) this.editImg.src = src
        if (this.editLayer) this.editLayer.style.display = 'flex'
        this.imgState = { x: 0, y: 0, scale: 0.5 }
        if (this.scaleSlider) this.scaleSlider.value = '0.5'
        this.updateImgTransform()
      }

      closeEditor() {
        if (this.editLayer) this.editLayer.style.display = 'none'
      }

      updateImgTransform() {
        if (this.editImg) {
          this.editImg.style.transform = `translate(-50%, -50%) translate(${this.imgState.x}px, ${this.imgState.y}px) scale(${this.imgState.scale})`
        }
      }

      startDrag(e: any) {
        e.preventDefault()
        this.isDraggingImg = true
        const cx = e.touches ? e.touches[0].clientX : e.clientX
        const cy = e.touches ? e.touches[0].clientY : e.clientY
        this.dragStart = { x: cx - this.imgState.x, y: cy - this.imgState.y }

        const move = (ev: any) => {
          if (!this.isDraggingImg) return
          ev.preventDefault()
          const mx = ev.touches ? ev.touches[0].clientX : ev.clientX
          const my = ev.touches ? ev.touches[0].clientY : ev.clientY
          this.imgState.x = mx - this.dragStart.x
          this.imgState.y = my - this.dragStart.y
          this.updateImgTransform()
        }
        const end = () => {
          this.isDraggingImg = false
          document.removeEventListener('mousemove', move)
          document.removeEventListener('mouseup', end)
          document.removeEventListener('touchmove', move)
          document.removeEventListener('touchend', end)
        }
        document.addEventListener('mousemove', move)
        document.addEventListener('mouseup', end)
        document.addEventListener('touchmove', move, { passive: false })
        document.addEventListener('touchend', end)
      }

      applyEditorImage() {
        if (!this.editImg || !this.editContainer || !this.modalCanvas) return
        const imgRect = this.editImg.getBoundingClientRect()
        const containerRect = this.editContainer.getBoundingClientRect()

        const imgCenterX = imgRect.left + imgRect.width / 2
        const imgCenterY = imgRect.top + imgRect.height / 2
        const contCenterX = containerRect.left + containerRect.width / 2
        const contCenterY = containerRect.top + containerRect.height / 2

        const relX = (imgCenterX - contCenterX) / containerRect.width
        const relY = (imgCenterY - contCenterY) / containerRect.height

        const ratioX = this.modalCanvas.width / containerRect.width
        const ratioY = this.modalCanvas.height / containerRect.height

        const w = imgRect.width * ratioX
        const h = imgRect.height * ratioY

        const canvasCenterX = this.modalCanvas.width / 2
        const canvasCenterY = this.modalCanvas.height / 2

        const drawCenterX = canvasCenterX + relX * this.modalCanvas.width
        const drawCenterY = canvasCenterY + relY * this.modalCanvas.height

        const x = drawCenterX - w / 2
        const y = drawCenterY - h / 2

        const imgObj = new Image()
        imgObj.onload = () => {
          this.backgroundImages.push({ img: imgObj, x, y, w, h })
          this.redrawBackgrounds()
          this.closeEditor()
        }
        imgObj.src = this.editImg.src
      }

      redrawBackgrounds() {
        const ctx = this.modalCanvas?.getContext('2d')
        if (!ctx) return
        const prevComp = ctx.globalCompositeOperation
        ctx.globalCompositeOperation = 'destination-over'
        this.backgroundImages.forEach(item => {
          ctx.drawImage(item.img, item.x, item.y, item.w, item.h)
        })
        ctx.globalCompositeOperation = prevComp
      }

      resizePaperCanvas() {
        if (!this.paperCanvas || !this.paperCanvas.parentElement) return
        const w = this.paperCanvas.parentElement.clientWidth
        const h = this.paperCanvas.parentElement.clientHeight
        if (!w || !h) return

        const ratio = 2
        this.paperCanvas.width = w * ratio
        this.paperCanvas.height = h * ratio

        if (this.paperSignature) {
          this.renderPaperSignature()
        }
      }

      applySignature() {
        if (this.pad.isEmpty() && this.backgroundImages.length === 0) {
          this.ui.showToast('서명 내용이 없습니다.')
          return
        }

        const dataURL = this.modalCanvas?.toDataURL('image/png')
        if (!dataURL) return

        const img = new Image()
        img.onload = () => {
          if (!this.paperCanvas) return
          const pw = this.paperCanvas.width
          const ph = this.paperCanvas.height
          const iw = img.width
          const ih = img.height

          const canvasRatio = pw / ph
          const imgRatio = iw / ih

          let drawW, drawH, offsetX, offsetY
          const marginScale = 0.9

          if (imgRatio > canvasRatio) {
            drawW = pw * marginScale
            drawH = drawW / imgRatio
          } else {
            drawH = ph * marginScale
            drawW = drawH * imgRatio
          }

          offsetX = (pw - drawW) / 2
          offsetY = (ph - drawH) / 2

          this.paperSignature = {
            img,
            w: drawW,
            h: drawH,
            x: offsetX,
            y: offsetY,
          }

          this.renderPaperSignature()

          if (this.guideText) this.guideText.style.display = 'none'
          this.closeModal()
          this.ui.showToast('서명이 적용되었습니다')
        }
        img.src = dataURL
      }

      clearPaper() {
        if (!this.paperCanvas) return
        const ctx = this.paperCanvas.getContext('2d')
        ctx?.clearRect(0, 0, this.paperCanvas.width, this.paperCanvas.height)
        if (this.guideText) this.guideText.style.display = 'block'
        this.clearAll()
        this.paperSignature = null
      }

      renderPaperSignature() {
        if (!this.paperCanvas) return
        const ctx = this.paperCanvas.getContext('2d')
        ctx?.clearRect(0, 0, this.paperCanvas.width, this.paperCanvas.height)
        if (!this.paperSignature) return
        const s = this.paperSignature
        ctx?.drawImage(s.img, s.x, s.y, s.w, s.h)
      }

      startPaperDrag(e: any) {
        if (!this.paperSignature) return
        if (!this.viewer || !this.viewer.isPanning) return
        e.preventDefault()

        const rect = this.paperCanvas?.getBoundingClientRect()
        if (!rect) return
        const isTouch = !!e.touches
        const cx = isTouch ? e.touches[0].clientX : e.clientX
        const cy = isTouch ? e.touches[0].clientY : e.clientY

        this.paperDrag.isDragging = true
        this.paperDrag.startX = cx
        this.paperDrag.startY = cy
        this.paperDrag.baseX = this.paperSignature.x
        this.paperDrag.baseY = this.paperSignature.y

        const move = (ev: any) => {
          if (!this.paperDrag.isDragging || !this.paperCanvas) return
          ev.preventDefault()
          const mx = ev.touches ? ev.touches[0].clientX : ev.clientX
          const my = ev.touches ? ev.touches[0].clientY : ev.clientY

          const ratioX = this.paperCanvas.width / rect.width
          const ratioY = this.paperCanvas.height / rect.height

          const dx = (mx - this.paperDrag.startX) * ratioX
          const dy = (my - this.paperDrag.startY) * ratioY

          this.paperSignature.x = this.paperDrag.baseX + dx
          this.paperSignature.y = this.paperDrag.baseY + dy
          this.renderPaperSignature()
        }

        const end = () => {
          this.paperDrag.isDragging = false
          document.removeEventListener('mousemove', move)
          document.removeEventListener('mouseup', end)
          document.removeEventListener('touchmove', move)
          document.removeEventListener('touchend', end)
        }

        document.addEventListener('mousemove', move)
        document.addEventListener('mouseup', end)
        document.addEventListener('touchmove', move, { passive: false })
        document.addEventListener('touchend', end)
      }
    }

    // Exporter
    class Exporter {
      ui: UiUtils
      paperWrapper: HTMLElement | null
      documentArea: HTMLElement | null

      constructor(uiUtils: UiUtils) {
        this.ui = uiUtils
        this.paperWrapper = document.getElementById('paperWrapper')
        this.documentArea = document.getElementById('documentArea')
        document.getElementById('btnDownload')?.addEventListener('click', () => this.savePDF())
        document.getElementById('btnShare')?.addEventListener('click', () => this.shareContent())
      }

      async prepareCapture() {
        if (!this.paperWrapper) return () => {}
        const originalTransform = this.paperWrapper.style.transform
        const originalMargin = this.paperWrapper.style.margin

        const inputs = document.querySelectorAll('input, textarea')
        const placeholders: any[] = []
        inputs.forEach((el: any) => {
          placeholders.push({ el, val: el.placeholder })
          el.placeholder = ''
        })

        const guideText = document.getElementById('clickGuideText')
        const guideTextDisplay = guideText ? guideText.style.display : null
        if (guideText) {
          guideText.style.display = 'none'
        }

        this.paperWrapper.style.transform = 'scale(1)'
        this.paperWrapper.style.margin = '0'
        document.body.classList.add('clean-mode')

        await new Promise(r => setTimeout(r, 100))

        return () => {
          if (this.paperWrapper) {
            this.paperWrapper.style.transform = originalTransform
            this.paperWrapper.style.margin = originalMargin
          }
          document.body.classList.remove('clean-mode')
          placeholders.forEach(item => (item.el.placeholder = item.val))
          if (guideText) {
            guideText.style.display = guideTextDisplay || ''
          }
        }
      }

      async savePDF() {
        if (!this.documentArea) return
        this.ui.showToast('PDF 생성 중...')
        const restore = await this.prepareCapture()
        try {
          // @ts-ignore
          const html2canvas = (window as any).html2canvas
          // @ts-ignore
          const { jsPDF } = (window as any).jspdf

          const canvas = await html2canvas(this.documentArea, {
            scale: 2,
            useCORS: true,
            backgroundColor: 'white',
          })

          const imgData = canvas.toDataURL('image/jpeg', 0.95)
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

          pdf.save(`작업완료확인서_${this.getDateStr()}.pdf`)
          this.ui.showToast('저장되었습니다!')
        } catch (e) {
          console.error(e)
          this.ui.showToast('저장 실패')
        } finally {
          restore()
        }
      }

      async shareContent() {
        if (!navigator.share) {
          alert('공유 기능을 지원하지 않는 브라우저입니다.')
          return
        }
        if (!this.documentArea) return
        this.ui.showToast('이미지 생성 중...')
        const restore = await this.prepareCapture()
        try {
          // @ts-ignore
          const html2canvas = (window as any).html2canvas
          const canvas = await html2canvas(this.documentArea, { scale: 2, useCORS: true })
          canvas.toBlob(
            async (blob: any) => {
              const file = new File([blob], 'confirmation.jpg', { type: 'image/jpeg' })
              await navigator.share({ title: '작업확인서', files: [file] })
            },
            'image/jpeg',
            0.9
          )
        } catch (e) {
          this.ui.showToast('공유 실패')
        } finally {
          restore()
        }
      }

      getDateStr() {
        const d = new Date()
        return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
      }
    }

    // Main Logic Initialization
    class LogicApp {
      ui: UiUtils
      viewer: ViewerManager
      signer: SignatureManager
      exporter: Exporter

      constructor() {
        this.ui = new UiUtils()
        this.viewer = new ViewerManager(this.ui)
        this.signer = new SignatureManager(this.ui, this.viewer)
        this.exporter = new Exporter(this.ui)

        document.getElementById('btnReset')?.addEventListener('click', () => {
          if (window.confirm('모든 입력을 초기화하시겠습니까?')) {
            document.querySelectorAll('input, textarea').forEach((el: any) => (el.value = ''))
            this.signer.clearPaper()
            this.ui.showToast('초기화 완료')
          }
        })

        const d = new Date()
        const dateField = document.getElementById('dateField') as HTMLInputElement
        if (dateField)
          dateField.value = `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`

        // @ts-ignore
        if (window.lucide && typeof window.lucide.createIcons === 'function') {
          // @ts-ignore
          window.lucide.createIcons()
        }
      }
    }

    appInstanceRef.current = new LogicApp()

    // Cleanup logic if needed, though for a modal it mostly just unmounts
    // --- End of Ported Logic ---
  }, [isOpen, isLoaded, onClose])

  if (!isOpen) return null

  return (
    <div
      ref={containerRef}
      className="cert-scope fixed inset-0 z-[60] bg-slate-950 text-white flex flex-col h-full w-full"
    >
      {/* 
        Inject Styles: We prefix body selectors with .cert-scope to limit impact on main app if modal is open, 
        although here we mostly rely on the modal being a full-screen overlay.
        Since the original CSS targets `body`, we wrap the content and try to apply styles to the container.
        However, for absolute correctness with "100% identical", we include the CSS as is and it will apply globally while modal is open.
      */}
      <style>{`
        :root {
            --font-main: "Pretendard Variable", Pretendard, sans-serif;
            --bg-viewer: rgb(30, 30, 30); 
            --bg-paper: white;
            --border-color: rgb(30, 41, 59);
            --primary-color: rgb(37, 99, 235);
            --header-navy: rgb(26, 37, 79);
            --primary: rgb(49, 163, 250);
            --primary-bg: rgb(234, 246, 255);
        }
        .cert-scope * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        
        .cert-scope { 
            margin: 0; padding: 0; 
            font-family: var(--font-main); 
            background: var(--bg-viewer); 
            color: white;
            height: 100vh; width: 100vw; overflow: hidden;
            display: flex; flex-direction: column;
            overscroll-behavior: none; 
        }
        
        .header-bar {
            height: 60px; background: black; 
            display: flex; align-items: center; justify-content: space-between;
            padding: 0 16px; flex-shrink: 0; z-index: 100; border-bottom: 1px solid rgb(51, 51, 51);
        }
        .header-title { font-size: 18px; font-weight: 700; color: white !important; }
        .header-right { display: flex; align-items: center; gap: 8px; }

        .icon-btn {
            background: none; border: none; color: white; cursor: pointer;
            padding: 8px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
        }
        .icon-btn:hover { background: rgba(255,255,255,0.15); }

        .viewport {
            flex: 1; position: relative; overflow: hidden;
            background: var(--bg-viewer);
            display: flex; 
            justify-content: center;
            align-items: center;
            touch-action: none; 
            cursor: default;
        }
        .viewport.panning { cursor: grab !important; }
        .viewport.panning:active { cursor: grabbing !important; }
        
        .paper-wrapper {
            transform-origin: center center;
            transition: transform 0.05s linear; 
            will-change: transform; 
            padding: 0;
            box-shadow: 0 4px 30px rgba(0,0,0,0.5);
        }

        .a4-paper {
            width: 210mm; min-height: 297mm;
            background: var(--bg-paper); color: black;
            padding: 15mm; 
            display: flex; flex-direction: column;
            justify-content: center;
        }

        .doc-header { text-align: center; margin-bottom: 30px; border-bottom: 3px double black; padding-bottom: 15px; }
        .doc-title { font-size: 36px; font-weight: 900; letter-spacing: 5px; color: rgb(17, 17, 17); margin: 0; }

        .info-table { width: 100%; border-collapse: collapse; border: 2px solid var(--border-color); margin-bottom: 20px; }
        .info-table th, .info-table td { border: 1px solid var(--border-color); padding: 10px 8px; vertical-align: middle; }
        .info-table th { background: rgb(248, 250, 252); font-weight: 800; text-align: center; width: 16%; font-size: 16px; color: rgb(51, 65, 85); white-space: nowrap; }

        .cert-scope input, .cert-scope textarea { 
            width: 100%; border: none; background: transparent; 
            font-family: inherit; font-size: 16px; color: black; outline: none; 
            padding: 4px; font-weight: 600; resize: none;
        }
        .cert-scope input::placeholder, .cert-scope textarea::placeholder { color: rgb(203, 213, 225); font-weight: 400; }

            body.clean-mode .cert-scope input, body.clean-mode .cert-scope textarea { 
                border: none !important; background: transparent !important; 
                outline: none !important; box-shadow: none !important; 
            }

            .section-block { padding: 15px; display: flex; flex-direction: column; border: 2px solid var(--border-color); margin-bottom: 20px; }
            .section-block.note { height: 150px; }
            .sec-header { font-size: 18px; font-weight: 800; color: rgb(30, 41, 59); margin-bottom: 12px; padding-left: 12px; border-left: 5px solid rgb(71, 85, 105); }

            .footer-area { margin-top: 10px; text-align: center; }
            .confirm-msg { font-size: 20px; font-weight: 800; margin-bottom: 25px; line-height: 1.4; white-space: nowrap; }
            .date-input { font-size: 20px; font-weight: 800; text-align: center; margin-bottom: 30px; }

            .recipient-row {
                margin-top: 40px;
                display: flex;
                justify-content: center;
                align-items: center;
                gap: 8px;
                font-weight: 700;
            }
            .recipient-input {
                text-align: center; font-size: 24px; font-weight: 800; width: 250px; border-bottom: 2px solid black;
            }
        .recipient-row {
            margin-top: 40px;
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 8px;
            font-weight: 700;
        }
        .recipient-input {
            text-align: center; font-size: 24px; font-weight: 800; width: 250px; border-bottom: 2px solid black;
        }

        .sign-grid { 
            display: grid; grid-template-columns: 33% 27% 40%; 
            border: 2px solid var(--border-color); margin-bottom: 20px; 
        }
        .sign-cell-text { 
            background: rgb(248, 250, 252); border-right: 1px solid var(--border-color);
            display: flex; flex-direction: column; justify-content: center; align-items: center;
            padding: 10px; gap: 8px;
        }
        .sign-label-text { font-weight: 800; font-size: 18px; color: rgb(51, 65, 85); }
        .sign-input-text { text-align: center; font-size: 18px; font-weight: 700; width: 100%; border-bottom: 1px dashed rgb(203, 213, 225); }

        .sign-cell-canvas { 
            position: relative; background: white; height: 180px; 
            display: flex; flex-direction: column; overflow: hidden; 
            cursor: pointer;
        }
        .sign-cell-canvas:hover { background: rgb(240, 249, 255); }
        
        .sign-label-canvas {
            padding: 8px 12px; font-weight: 700; font-size: 14px; color: rgb(100, 116, 139);
            border-bottom: 1px dashed rgb(226, 232, 240); pointer-events: none; text-align: left;
        }
        
        .display-canvas-wrapper {
            flex: 1; width: 100%; height: 100%; position: relative;
            display: flex; align-items: center; justify-content: center;
        }
        #paperSignCanvas { width: 100%; height: 100%; pointer-events: none; display: block; }
        
        .click-guide {
            position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
            color: rgb(148, 163, 184); font-weight: 700; font-size: 14px; pointer-events: none;
            background: rgba(255,255,255,0.8); padding: 4px 8px; border-radius: 4px;
        }

        .sign-modal {
            display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.8); z-index: 9999;
            flex-direction: column; justify-content: center; align-items: center;
            backdrop-filter: blur(5px); opacity: 0; transition: opacity 0.3s;
        }
        .sign-modal.open { display: flex; opacity: 1; }

        .modal-content {
            width: 95%; max-width: 600px; height: 80vh; max-height: 800px;
            background: white; border-radius: 12px; display: flex; flex-direction: column;
            overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.5);
        }
        
        .modal-header {
            padding: 12px 16px; background: rgb(241, 245, 249); border-bottom: 1px solid rgb(226, 232, 240);
            display: flex; justify-content: space-between; align-items: center;
        }
        .modal-title { font-weight: 800; font-size: 16px; color: rgb(30, 41, 59); }
        .close-btn { background: none; border: none; cursor: pointer; color: rgb(100, 116, 139); }

        .modal-body {
            flex: 1; position: relative; background: white; overflow: hidden; touch-action: none;
            background-image: radial-gradient(rgb(226, 232, 240) 1px, transparent 1px);
            background-size: 20px 20px;
        }
        
        #modalCanvas { width: 100%; height: 100%; touch-action: none; display: block; }

        .sign-tools-bar {
            padding: 10px; background: white; border-top: 1px solid rgb(226, 232, 240);
            display: flex; gap: 8px; overflow-x: auto; flex-shrink: 0;
            align-items: center;
        }
        
        .modal-footer {
            padding: 12px 16px; background: white; border-top: 1px solid rgb(226, 232, 240);
            display: flex; gap: 10px;
        }
        
        .uu-btn {
            flex: 1; height: 48px; 
            border-radius: 10px; 
            font-size: 15px; font-weight: 700; 
            display: flex; align-items: center; justify-content: center; 
            gap: 8px; cursor: pointer; transition: 0.1s;
            min-width: fit-content;
            padding: 0 16px;
        }

        .uu-btn.dashed.type-gray-secondary, 
        .uu-btn.solid.type-gray-secondary {
            background-color: rgb(241, 245, 249);
            border: 1px solid rgb(203, 213, 225);
            color: rgb(71, 85, 105);
            border-style: solid !important;
        }
        .uu-btn.dashed.type-gray-secondary:hover, 
        .uu-btn.solid.type-gray-secondary:hover {
            background-color: rgb(226, 232, 240);
        }

        .uu-btn.dashed.type-blue, 
        .uu-btn.solid.type-blue {
            background-color: var(--header-navy);
            border: none;
            color: white;
            border-style: solid !important;
        }

        .mini-btn {
            font-size: 12px; padding: 6px 12px; border: 1px solid rgb(203, 213, 225); 
            background: white; border-radius: 6px; cursor: pointer; color: rgb(71, 85, 105); font-weight: 700;
            display: flex; align-items: center; gap: 4px; white-space: nowrap;
            height: 40px; justify-content: center;
        }
        .mini-btn.active { background: rgb(239, 246, 255); color: rgb(37, 99, 235); border-color: rgb(37, 99, 235); }
        
        #modalEditLayer {
            display: none; position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.8); z-index: 10;
            flex-direction: column; justify-content: center; align-items: center;
        }
        #modalEditContainer {
            position: relative; width: 100%; height: 100%; 
            border: 2px dashed rgb(49, 163, 250); overflow: hidden;
        }
        #modalEditingImage {
            position: absolute; top: 50%; left: 50%; 
            transform: translate(-50%, -50%); 
            cursor: grab; touch-action: none; max-width: none;
        }
        .modal-edit-controls {
            position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%);
            background: rgb(34, 34, 34); border-radius: 30px; padding: 10px 20px;
            display: flex; gap: 15px; align-items: center; width: 90%; max-width: 400px;
        }

        .controls-pill {
            position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%);
            background: rgb(34, 34, 34); padding: 10px 25px; border-radius: 50px;
            display: flex; gap: 25px; z-index: 200; backdrop-filter: blur(8px);
            box-shadow: 0 10px 30px rgba(0,0,0,0.5); border: 1px solid rgb(51, 51, 51);
        }
        .ctrl-btn {
            background: none; border: none; color: white;
            display: flex; flex-direction: column; align-items: center; gap: 4px;
            font-size: 10px; cursor: pointer; min-width: 35px; opacity: 0.7; transition: 0.2s;
        }
        .ctrl-btn.active { color: rgb(49, 163, 250); opacity: 1; font-weight: 700; }

        .toast {
            position: fixed; bottom: 40px; left: 50%; transform: translateX(-50%);
            background: #1a254f; color: #fff; padding: 8px 16px;
            border-radius: 20px; opacity: 0; transition: all 0.3s ease; pointer-events: none; z-index: 99999;
            display: inline-flex; align-items: center; gap: 6px; font-weight: 600; font-size: 13px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1); white-space: nowrap; height: fit-content;
        }
        #signImageInput { display: none; }
      `}</style>

      {/* HTML Content */}
      <header className="header-bar">
        <button className="icon-btn" id="btnBack" onClick={handleBack}>
          <ChevronLeft size={28} />
        </button>
        <div className="header-title" style={{ color: 'white' }}>
          작업완료확인서
        </div>
        <div className="header-right">
          <button className="icon-btn" id="btnReset">
            <i data-lucide="rotate-ccw"></i>
          </button>
          <button className="icon-btn" id="btnDownload">
            <i data-lucide="download"></i>
          </button>
        </div>
      </header>

      <div className="viewport" id="viewport">
        <div className="paper-wrapper" id="paperWrapper">
          <div className="a4-paper" id="documentArea">
            <header className="doc-header">
              <h1 className="doc-title">작 업 완 료 확 인 서</h1>
            </header>

            <table className="info-table">
              <tbody>
                <tr>
                  <th>현 장 명</th>
                  <td>
                    <input type="text" defaultValue="자이 아파트 101동" placeholder="내용 입력" />
                  </td>
                  <th>공 사 명</th>
                  <td>
                    <input type="text" placeholder="공사명 입력" />
                  </td>
                </tr>
                <tr>
                  <th>작 업 자</th>
                  <td>
                    <input type="text" placeholder="성명 입력" />
                  </td>
                  <th>연락처</th>
                  <td>
                    <input type="text" placeholder="010-0000-0000" />
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="section-block">
              <div className="sec-header">작업내용</div>
              <textarea
                style={{ flex: 1, lineHeight: 1.6 }}
                placeholder="상세 내용"
                defaultValue={'* 지하주차장 PC부재 균열보수 완료\n* '}
              ></textarea>
            </div>

            <div className="section-block note">
              <div className="sec-header">특기사항</div>
              <textarea style={{ flex: 1 }} placeholder="특이사항"></textarea>
            </div>

            <div className="footer-area">
              <div className="confirm-msg">상기 사항과 같이 작업을 완료하였음을 확인합니다.</div>
              <input
                type="text"
                id="dateField"
                className="date-input"
                defaultValue=""
                style={{ cursor: 'pointer' }}
                readOnly
                onFocus={e => e.target.removeAttribute('readonly')}
                onBlur={e => {
                  if (e.target.value.trim() === '') {
                    const d = new Date()
                    e.target.value = `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`
                  }
                  e.target.setAttribute('readonly', 'readonly')
                }}
              />

              <div className="sign-grid">
                <div className="sign-cell-text">
                  <span className="sign-label-text">소 속 :</span>
                  <input
                    type="text"
                    className="sign-input-text"
                    defaultValue="(주)이노피앤씨"
                    placeholder="소속 입력"
                  />
                </div>
                <div className="sign-cell-text">
                  <span className="sign-label-text">성 명 :</span>
                  <input type="text" className="sign-input-text" placeholder="이름 입력" />
                </div>

                <div className="sign-cell-canvas" id="triggerSignModal">
                  <div className="sign-label-canvas">확인자 (서명)</div>
                  <div className="display-canvas-wrapper">
                    <canvas id="paperSignCanvas"></canvas>
                    <div className="click-guide" id="clickGuideText">
                      서명하려면 터치
                    </div>
                  </div>
                </div>
              </div>

              <div className="recipient-row">
                <input type="text" className="recipient-input" placeholder="회사명" />
                <span style={{ fontSize: '20px' }}>귀중</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="controls-pill">
        <button className="ctrl-btn" id="btnZoomOut">
          <i data-lucide="minus"></i>축소
        </button>
        <button className="ctrl-btn" id="btnPanToggle">
          <i data-lucide="hand"></i>이동
        </button>
        <button className="ctrl-btn" id="btnZoomIn">
          <i data-lucide="plus"></i>확대
        </button>
        <button className="ctrl-btn" id="btnShare">
          <i data-lucide="share-2"></i>공유
        </button>
      </div>

      <div className="toast" id="toast">
        <i data-lucide="check" style={{ width: 18 }}></i> <span id="toastMsg">완료</span>
      </div>

      <div className="sign-modal" id="signModal">
        <div className="modal-content">
          <div className="modal-header">
            <span className="modal-title">서명 또는 도장 입력</span>
            <button className="close-btn" id="btnCloseModalX">
              <i data-lucide="x"></i>
            </button>
          </div>

          <div className="modal-body">
            <canvas id="modalCanvas"></canvas>

            <div id="modalEditLayer">
              <div id="modalEditContainer">
                <img id="modalEditingImage" src="" alt="Stamp" draggable={false} />
              </div>
              <div className="modal-edit-controls">
                <span style={{ color: 'white', fontSize: '12px', whiteSpace: 'nowrap' }}>크기</span>
                <input
                  type="range"
                  id="modalScaleSlider"
                  min="0.1"
                  max="2.0"
                  step="0.05"
                  defaultValue="0.5"
                  style={{ flex: 1 }}
                />
                <button className="mini-btn" id="btnEditCancel">
                  취소
                </button>
                <button className="mini-btn active" id="btnEditApply">
                  적용
                </button>
              </div>
            </div>
          </div>

          <div className="sign-tools-bar" id="signToolsBar">
            <button className="mini-btn active" id="btnPen" style={{ marginRight: '4px' }}>
              <i data-lucide="pen-tool"></i> 펜
            </button>
            <button className="mini-btn" id="btnEraser" style={{ marginRight: '10px' }}>
              <i data-lucide="eraser"></i> 지우개
            </button>

            <button
              className="uu-btn dashed type-gray-secondary"
              id="btnImport"
              style={{ height: '40px', fontSize: '13px', padding: '0 12px', marginRight: '4px' }}
            >
              <i data-lucide="image-plus"></i> 도장/사진
            </button>

            <button className="mini-btn" id="btnUndo">
              <i data-lucide="undo-2"></i>
            </button>
            <button className="mini-btn" id="btnClear">
              <i data-lucide="trash-2"></i>
            </button>
            <input type="file" id="signImageInput" accept="image/*" />
          </div>

          <div className="modal-footer">
            <button className="uu-btn dashed type-gray-secondary" id="btnCancelModal">
              취소
            </button>
            <button className="uu-btn solid type-blue" id="btnConfirmModal">
              서명 완료
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
