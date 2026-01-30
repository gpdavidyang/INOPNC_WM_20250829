import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime'
import { useEffect, useRef, useState } from 'react'
import { ChevronLeft } from 'lucide-react'
// Helper to load scripts sequentially
const loadScript = src => {
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
export const CertificateModal = ({ isOpen, onClose, onHeaderReset }) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const containerRef = useRef(null)
  const appInstanceRef = useRef(null)
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
  const handleBack = e => {
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
      constructor() {
        Object.defineProperty(this, 'toastEl', {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0,
        })
        Object.defineProperty(this, 'toastMsgEl', {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0,
        })
        Object.defineProperty(this, 'timer', {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0,
        })
        this.toastEl = document.getElementById('toast')
        this.toastMsgEl = document.getElementById('toastMsg')
        this.timer = null
      }
      showToast(msg) {
        if (!this.toastEl || !this.toastMsgEl) return
        this.toastMsgEl.innerText = msg
        this.toastEl.classList.add('show')
        clearTimeout(this.timer)
        this.timer = setTimeout(() => this.toastEl?.classList.remove('show'), 2000)
      }
    }
    // Viewer Manager
    class ViewerManager {
      constructor(uiUtils) {
        Object.defineProperty(this, 'ui', {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0,
        })
        Object.defineProperty(this, 'viewport', {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0,
        })
        Object.defineProperty(this, 'paperWrapper', {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0,
        })
        Object.defineProperty(this, 'btnPan', {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0,
        })
        Object.defineProperty(this, 'zoomLevel', {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0,
        })
        Object.defineProperty(this, 'isPanning', {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0,
        })
        Object.defineProperty(this, 'startX', {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0,
        })
        Object.defineProperty(this, 'startY', {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0,
        })
        Object.defineProperty(this, 'pointX', {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0,
        })
        Object.defineProperty(this, 'pointY', {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0,
        })
        Object.defineProperty(this, 'resizeTimer', {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0,
        })
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
        const startPan = e => {
          if (!this.isPanning) return
          const target = e.target
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
          const moveHandler = ev => {
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
      adjustZoom(delta) {
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
      constructor(uiUtils, viewerManager) {
        Object.defineProperty(this, 'ui', {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0,
        })
        Object.defineProperty(this, 'viewer', {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0,
        })
        Object.defineProperty(this, 'triggerBtn', {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0,
        })
        Object.defineProperty(this, 'paperCanvas', {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0,
        })
        Object.defineProperty(this, 'guideText', {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0,
        })
        Object.defineProperty(this, 'modal', {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0,
        })
        Object.defineProperty(this, 'modalCanvas', {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0,
        })
        Object.defineProperty(this, 'fileInput', {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0,
        })
        Object.defineProperty(this, 'editLayer', {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0,
        })
        Object.defineProperty(this, 'editImg', {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0,
        })
        Object.defineProperty(this, 'editContainer', {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0,
        })
        Object.defineProperty(this, 'scaleSlider', {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0,
        })
        Object.defineProperty(this, 'backgroundImages', {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0,
        })
        Object.defineProperty(this, 'pad', {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0,
        })
        Object.defineProperty(this, 'isOpen', {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0,
        })
        Object.defineProperty(this, 'imgState', {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0,
        })
        Object.defineProperty(this, 'isDraggingImg', {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0,
        })
        Object.defineProperty(this, 'dragStart', {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0,
        })
        Object.defineProperty(this, 'paperSignature', {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0,
        })
        Object.defineProperty(this, 'paperDrag', {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0,
        })
        this.ui = uiUtils
        this.viewer = viewerManager
        this.triggerBtn = document.getElementById('triggerSignModal')
        this.paperCanvas = document.getElementById('paperSignCanvas')
        this.guideText = document.getElementById('clickGuideText')
        this.modal = document.getElementById('signModal')
        this.modalCanvas = document.getElementById('modalCanvas')
        this.fileInput = document.getElementById('signImageInput')
        this.editLayer = document.getElementById('modalEditLayer')
        this.editImg = document.getElementById('modalEditingImage')
        this.editContainer = document.getElementById('modalEditContainer')
        this.scaleSlider = document.getElementById('modalScaleSlider')
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
        const SignaturePad = window.SignaturePad
        this.pad = new SignaturePad(this.modalCanvas, {
          minWidth: 1.0,
          maxWidth: 3.0,
          penColor: '#000',
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
        this.scaleSlider?.addEventListener('input', e => {
          this.imgState.scale = parseFloat(e.target.value)
          this.updateImgTransform()
        })
        this.editImg?.addEventListener('mousedown', e => this.startDrag(e))
        this.editImg?.addEventListener('touchstart', e => this.startDrag(e), { passive: false })
        if (this.paperCanvas && this.paperCanvas.parentElement) {
          new ResizeObserver(() => this.resizePaperCanvas()).observe(this.paperCanvas.parentElement)
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
      setTool(type, btn) {
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
      handleFile(e) {
        const file = e.target.files[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = ev => {
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
      processImage(img) {
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
      openEditor(src) {
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
      startDrag(e) {
        e.preventDefault()
        this.isDraggingImg = true
        const cx = e.touches ? e.touches[0].clientX : e.clientX
        const cy = e.touches ? e.touches[0].clientY : e.clientY
        this.dragStart = { x: cx - this.imgState.x, y: cy - this.imgState.y }
        const move = ev => {
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
      startPaperDrag(e) {
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
        const move = ev => {
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
      constructor(uiUtils) {
        Object.defineProperty(this, 'ui', {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0,
        })
        Object.defineProperty(this, 'paperWrapper', {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0,
        })
        Object.defineProperty(this, 'documentArea', {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0,
        })
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
        const placeholders = []
        inputs.forEach(el => {
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
          const html2canvas = window.html2canvas
          // @ts-ignore
          const { jsPDF } = window.jspdf
          const canvas = await html2canvas(this.documentArea, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff',
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
          const html2canvas = window.html2canvas
          const canvas = await html2canvas(this.documentArea, { scale: 2, useCORS: true })
          canvas.toBlob(
            async blob => {
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
      constructor() {
        Object.defineProperty(this, 'ui', {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0,
        })
        Object.defineProperty(this, 'viewer', {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0,
        })
        Object.defineProperty(this, 'signer', {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0,
        })
        Object.defineProperty(this, 'exporter', {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0,
        })
        this.ui = new UiUtils()
        this.viewer = new ViewerManager(this.ui)
        this.signer = new SignatureManager(this.ui, this.viewer)
        this.exporter = new Exporter(this.ui)
        document.getElementById('btnReset')?.addEventListener('click', () => {
          if (window.confirm('모든 입력을 초기화하시겠습니까?')) {
            document.querySelectorAll('input, textarea').forEach(el => (el.value = ''))
            this.signer.clearPaper()
            this.ui.showToast('초기화 완료')
          }
        })
        const d = new Date()
        const dateField = document.getElementById('dateField')
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
  return _jsxs('div', {
    ref: containerRef,
    className:
      'cert-scope fixed inset-0 z-[60] bg-[#1e1e1e] text-white flex flex-col h-full w-full',
    children: [
      _jsx('style', {
        children: `
        :root {
            --font-main: "Pretendard Variable", Pretendard, sans-serif;
            --bg-viewer: #1e1e1e; 
            --bg-paper: #ffffff;
            --border-color: #1e293b;
            --primary-color: #2563eb;
            --header-navy: #1a254f;
            --primary: #31a3fa;
            --primary-bg: #eaf6ff;
        }
        .cert-scope * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        
        .cert-scope { 
            margin: 0; padding: 0; 
            font-family: var(--font-main); 
            background: var(--bg-viewer); 
            color: #fff;
            height: 100vh; width: 100vw; overflow: hidden;
            display: flex; flex-direction: column;
            overscroll-behavior: none; 
        }
        
        .header-bar {
            height: 60px; background: #000; 
            display: flex; align-items: center; justify-content: space-between;
            padding: 0 16px; flex-shrink: 0; z-index: 100; border-bottom: 1px solid #333;
        }
        .header-title { font-size: 18px; font-weight: 700; color: #fff; }
        .header-right { display: flex; align-items: center; gap: 8px; }

        .icon-btn {
            background: none; border: none; color: #fff; cursor: pointer;
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
            background: var(--bg-paper); color: #000;
            padding: 15mm; 
            display: flex; flex-direction: column;
            justify-content: center;
        }

        .doc-header { text-align: center; margin-bottom: 30px; border-bottom: 3px double #000; padding-bottom: 15px; }
        .doc-title { font-size: 36px; font-weight: 900; letter-spacing: 5px; color: #fff; margin: 0; }

        .info-table { width: 100%; border-collapse: collapse; border: 2px solid var(--border-color); margin-bottom: 20px; }
        .info-table th, .info-table td { border: 1px solid var(--border-color); padding: 10px 8px; vertical-align: middle; }
        .info-table th { background: #f8fafc; font-weight: 800; text-align: center; width: 16%; font-size: 16px; color: #334155; white-space: nowrap; }

        .cert-scope input, .cert-scope textarea { 
            width: 100%; border: none; background: transparent; 
            font-family: inherit; font-size: 16px; color: #000; outline: none; 
            padding: 4px; font-weight: 600; resize: none;
        }
        .cert-scope input::placeholder, .cert-scope textarea::placeholder { color: #cbd5e1; font-weight: 400; }
        .cert-scope input:focus, .cert-scope textarea:focus { background: rgba(37, 99, 235, 0.05); }

        body.clean-mode .cert-scope input, body.clean-mode .cert-scope textarea { 
            border: none !important; background: transparent !important; 
            outline: none !important; box-shadow: none !important; 
        }

        .section-block { padding: 15px; display: flex; flex-direction: column; border: 2px solid var(--border-color); margin-bottom: 20px; }
        .section-block.note { height: 150px; }
        .sec-header { font-size: 18px; font-weight: 800; color: #1e293b; margin-bottom: 12px; padding-left: 12px; border-left: 5px solid #475569; }

        .footer-area { margin-top: 10px; text-align: center; }
        .confirm-msg { font-size: 20px; font-weight: 800; margin-bottom: 25px; }
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
            text-align: center; font-size: 24px; font-weight: 800; width: 250px; border-bottom: 2px solid #000;
        }

        .sign-grid { 
            display: grid; grid-template-columns: 33% 27% 40%; 
            border: 2px solid var(--border-color); margin-bottom: 20px; 
        }
        .sign-cell-text { 
            background: #f8fafc; border-right: 1px solid var(--border-color);
            display: flex; flex-direction: column; justify-content: center; align-items: center;
            padding: 10px; gap: 8px;
        }
        .sign-label-text { font-weight: 800; font-size: 18px; color: #334155; }
        .sign-input-text { text-align: center; font-size: 18px; font-weight: 700; width: 100%; border-bottom: 1px dashed #cbd5e1; }

        .sign-cell-canvas { 
            position: relative; background: #fff; height: 180px; 
            display: flex; flex-direction: column; overflow: hidden; 
            cursor: pointer;
        }
        .sign-cell-canvas:hover { background: #f0f9ff; }
        
        .sign-label-canvas {
            padding: 8px 12px; font-weight: 700; font-size: 14px; color: #64748b;
            border-bottom: 1px dashed #e2e8f0; pointer-events: none; text-align: left;
        }
        
        .display-canvas-wrapper {
            flex: 1; width: 100%; height: 100%; position: relative;
            display: flex; align-items: center; justify-content: center;
        }
        #paperSignCanvas { width: 100%; height: 100%; pointer-events: none; display: block; }
        
        .click-guide {
            position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
            color: #94a3b8; font-weight: 700; font-size: 14px; pointer-events: none;
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
            background: #fff; border-radius: 12px; display: flex; flex-direction: column;
            overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.5);
        }
        
        .modal-header {
            padding: 12px 16px; background: #f1f5f9; border-bottom: 1px solid #e2e8f0;
            display: flex; justify-content: space-between; align-items: center;
        }
        .modal-title { font-weight: 800; font-size: 16px; color: #1e293b; }
        .close-btn { background: none; border: none; cursor: pointer; color: #64748b; }

        .modal-body {
            flex: 1; position: relative; background: #fff; overflow: hidden; touch-action: none;
            background-image: radial-gradient(#e2e8f0 1px, transparent 1px);
            background-size: 20px 20px;
        }
        
        #modalCanvas { width: 100%; height: 100%; touch-action: none; display: block; }

        .sign-tools-bar {
            padding: 10px; background: #fff; border-top: 1px solid #e2e8f0;
            display: flex; gap: 8px; overflow-x: auto; flex-shrink: 0;
            align-items: center;
        }
        
        .modal-footer {
            padding: 12px 16px; background: #fff; border-top: 1px solid #e2e8f0;
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
            background-color: #f1f5f9;
            border: 1px solid #cbd5e1;
            color: #475569;
            border-style: solid !important;
        }
        .uu-btn.dashed.type-gray-secondary:hover, 
        .uu-btn.solid.type-gray-secondary:hover {
            background-color: #e2e8f0;
        }

        .uu-btn.dashed.type-blue, 
        .uu-btn.solid.type-blue {
            background-color: var(--header-navy);
            border: none;
            color: #ffffff;
            border-style: solid !important;
        }

        .mini-btn {
            font-size: 12px; padding: 6px 12px; border: 1px solid #cbd5e1; 
            background: #fff; border-radius: 6px; cursor: pointer; color: #475569; font-weight: 700;
            display: flex; align-items: center; gap: 4px; white-space: nowrap;
            height: 40px; justify-content: center;
        }
        .mini-btn.active { background: #eff6ff; color: #2563eb; border-color: #2563eb; }
        
        #modalEditLayer {
            display: none; position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.8); z-index: 10;
            flex-direction: column; justify-content: center; align-items: center;
        }
        #modalEditContainer {
            position: relative; width: 100%; height: 100%; 
            border: 2px dashed #31a3fa; overflow: hidden;
        }
        #modalEditingImage {
            position: absolute; top: 50%; left: 50%; 
            transform: translate(-50%, -50%); 
            cursor: grab; touch-action: none; max-width: none;
        }
        .modal-edit-controls {
            position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%);
            background: #222; border-radius: 30px; padding: 10px 20px;
            display: flex; gap: 15px; align-items: center; width: 90%; max-width: 400px;
        }

        .controls-pill {
            position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%);
            background: #222; padding: 10px 25px; border-radius: 50px;
            display: flex; gap: 25px; z-index: 200; backdrop-filter: blur(8px);
            box-shadow: 0 10px 30px rgba(0,0,0,0.5); border: 1px solid #333;
        }
        .ctrl-btn {
            background: none; border: none; color: #fff;
            display: flex; flex-direction: column; align-items: center; gap: 4px;
            font-size: 10px; cursor: pointer; min-width: 35px; opacity: 0.7; transition: 0.2s;
        }
        .ctrl-btn.active { color: #31a3fa; opacity: 1; font-weight: 700; }

        .toast {
            position: fixed; top: 80px; left: 50%; transform: translateX(-50%);
            background: rgba(30, 41, 59, 0.95); color: #fff; padding: 12px 24px;
            border-radius: 50px; opacity: 0; transition: 0.3s; pointer-events: none; z-index: 99999;
            display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 14px;
        }
        .toast.show { opacity: 1; top: 90px; }
        
        #signImageInput { display: none; }
      `,
      }),
      _jsxs('header', {
        className: 'header-bar',
        children: [
          _jsx('button', {
            className: 'icon-btn',
            id: 'btnBack',
            onClick: handleBack,
            children: _jsx(ChevronLeft, { size: 28 }),
          }),
          _jsx('div', {
            className: 'header-title',
            children: '\uC791\uC5C5\uC644\uB8CC\uD655\uC778\uC11C',
          }),
          _jsxs('div', {
            className: 'header-right',
            children: [
              _jsx('button', {
                className: 'icon-btn',
                id: 'btnReset',
                children: _jsx('i', { 'data-lucide': 'rotate-ccw' }),
              }),
              _jsx('button', {
                className: 'icon-btn',
                id: 'btnDownload',
                children: _jsx('i', { 'data-lucide': 'download' }),
              }),
            ],
          }),
        ],
      }),
      _jsx('div', {
        className: 'viewport',
        id: 'viewport',
        children: _jsx('div', {
          className: 'paper-wrapper',
          id: 'paperWrapper',
          children: _jsxs('div', {
            className: 'a4-paper',
            id: 'documentArea',
            children: [
              _jsx('header', {
                className: 'doc-header',
                children: _jsx('h1', {
                  className: 'doc-title',
                  children: '\uC791 \uC5C5 \uC644 \uB8CC \uD655 \uC778 \uC11C',
                }),
              }),
              _jsx('table', {
                className: 'info-table',
                children: _jsxs('tbody', {
                  children: [
                    _jsxs('tr', {
                      children: [
                        _jsx('th', { children: '\uD604 \uC7A5 \uBA85' }),
                        _jsx('td', {
                          children: _jsx('input', {
                            type: 'text',
                            defaultValue: '\uC790\uC774 \uC544\uD30C\uD2B8 101\uB3D9',
                            placeholder: '\uB0B4\uC6A9 \uC785\uB825',
                          }),
                        }),
                        _jsx('th', { children: '\uACF5 \uC0AC \uBA85' }),
                        _jsx('td', {
                          children: _jsx('input', {
                            type: 'text',
                            placeholder: '\uACF5\uC0AC\uBA85 \uC785\uB825',
                          }),
                        }),
                      ],
                    }),
                    _jsxs('tr', {
                      children: [
                        _jsx('th', { children: '\uC791 \uC5C5 \uC790' }),
                        _jsx('td', {
                          children: _jsx('input', {
                            type: 'text',
                            placeholder: '\uC131\uBA85 \uC785\uB825',
                          }),
                        }),
                        _jsx('th', { children: '\uC5F0\uB77D\uCC98' }),
                        _jsx('td', {
                          children: _jsx('input', { type: 'text', placeholder: '010-0000-0000' }),
                        }),
                      ],
                    }),
                  ],
                }),
              }),
              _jsxs('div', {
                className: 'section-block',
                children: [
                  _jsx('div', { className: 'sec-header', children: '\uC791\uC5C5\uB0B4\uC6A9' }),
                  _jsx('textarea', {
                    style: { flex: 1, lineHeight: 1.6 },
                    placeholder: '\uC0C1\uC138 \uB0B4\uC6A9',
                    defaultValue: '* 지하주차장 PC부재 균열보수 완료\n* ',
                  }),
                ],
              }),
              _jsxs('div', {
                className: 'section-block note',
                children: [
                  _jsx('div', { className: 'sec-header', children: '\uD2B9\uAE30\uC0AC\uD56D' }),
                  _jsx('textarea', { style: { flex: 1 }, placeholder: '\uD2B9\uC774\uC0AC\uD56D' }),
                ],
              }),
              _jsxs('div', {
                className: 'footer-area',
                children: [
                  _jsx('div', {
                    className: 'confirm-msg',
                    children:
                      '\uC0C1\uAE30 \uC0AC\uD56D\uACFC \uAC19\uC774 \uC791\uC5C5\uC744 \uC644\uB8CC\uD558\uC600\uC74C\uC744 \uD655\uC778\uD569\uB2C8\uB2E4.',
                  }),
                  _jsx('input', {
                    type: 'text',
                    id: 'dateField',
                    className: 'date-input',
                    defaultValue: '',
                    style: { cursor: 'pointer' },
                    readOnly: true,
                    onFocus: e => e.target.removeAttribute('readonly'),
                    onBlur: e => {
                      if (e.target.value.trim() === '') {
                        const d = new Date()
                        e.target.value = `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`
                      }
                      e.target.setAttribute('readonly', 'readonly')
                    },
                  }),
                  _jsxs('div', {
                    className: 'sign-grid',
                    children: [
                      _jsxs('div', {
                        className: 'sign-cell-text',
                        children: [
                          _jsx('span', {
                            className: 'sign-label-text',
                            children: '\uC18C \uC18D :',
                          }),
                          _jsx('input', {
                            type: 'text',
                            className: 'sign-input-text',
                            defaultValue: '(\uC8FC)\uC774\uB178\uD53C\uC564\uC528',
                            placeholder: '\uC18C\uC18D \uC785\uB825',
                          }),
                        ],
                      }),
                      _jsxs('div', {
                        className: 'sign-cell-text',
                        children: [
                          _jsx('span', {
                            className: 'sign-label-text',
                            children: '\uC131 \uBA85 :',
                          }),
                          _jsx('input', {
                            type: 'text',
                            className: 'sign-input-text',
                            placeholder: '\uC774\uB984 \uC785\uB825',
                          }),
                        ],
                      }),
                      _jsxs('div', {
                        className: 'sign-cell-canvas',
                        id: 'triggerSignModal',
                        children: [
                          _jsx('div', {
                            className: 'sign-label-canvas',
                            children: '\uD655\uC778\uC790 (\uC11C\uBA85)',
                          }),
                          _jsxs('div', {
                            className: 'display-canvas-wrapper',
                            children: [
                              _jsx('canvas', { id: 'paperSignCanvas' }),
                              _jsx('div', {
                                className: 'click-guide',
                                id: 'clickGuideText',
                                children: '\uC11C\uBA85\uD558\uB824\uBA74 \uD130\uCE58',
                              }),
                            ],
                          }),
                        ],
                      }),
                    ],
                  }),
                  _jsxs('div', {
                    className: 'recipient-row',
                    children: [
                      _jsx('input', {
                        type: 'text',
                        className: 'recipient-input',
                        placeholder: '\uD68C\uC0AC\uBA85',
                      }),
                      _jsx('span', { style: { fontSize: '20px' }, children: '\uADC0\uC911' }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        }),
      }),
      _jsxs('div', {
        className: 'controls-pill',
        children: [
          _jsxs('button', {
            className: 'ctrl-btn',
            id: 'btnZoomOut',
            children: [_jsx('i', { 'data-lucide': 'minus' }), '\uCD95\uC18C'],
          }),
          _jsxs('button', {
            className: 'ctrl-btn',
            id: 'btnPanToggle',
            children: [_jsx('i', { 'data-lucide': 'hand' }), '\uC774\uB3D9'],
          }),
          _jsxs('button', {
            className: 'ctrl-btn',
            id: 'btnZoomIn',
            children: [_jsx('i', { 'data-lucide': 'plus' }), '\uD655\uB300'],
          }),
          _jsxs('button', {
            className: 'ctrl-btn',
            id: 'btnShare',
            children: [_jsx('i', { 'data-lucide': 'share-2' }), '\uACF5\uC720'],
          }),
        ],
      }),
      _jsxs('div', {
        className: 'toast',
        id: 'toast',
        children: [
          _jsx('i', { 'data-lucide': 'check', style: { width: 18 } }),
          ' ',
          _jsx('span', { id: 'toastMsg', children: '\uC644\uB8CC' }),
        ],
      }),
      _jsx('div', {
        className: 'sign-modal',
        id: 'signModal',
        children: _jsxs('div', {
          className: 'modal-content',
          children: [
            _jsxs('div', {
              className: 'modal-header',
              children: [
                _jsx('span', {
                  className: 'modal-title',
                  children: '\uC11C\uBA85 \uB610\uB294 \uB3C4\uC7A5 \uC785\uB825',
                }),
                _jsx('button', {
                  className: 'close-btn',
                  id: 'btnCloseModalX',
                  children: _jsx('i', { 'data-lucide': 'x' }),
                }),
              ],
            }),
            _jsxs('div', {
              className: 'modal-body',
              children: [
                _jsx('canvas', { id: 'modalCanvas' }),
                _jsxs('div', {
                  id: 'modalEditLayer',
                  children: [
                    _jsx('div', {
                      id: 'modalEditContainer',
                      children: _jsx('img', {
                        id: 'modalEditingImage',
                        src: '',
                        alt: 'Stamp',
                        draggable: false,
                      }),
                    }),
                    _jsxs('div', {
                      className: 'modal-edit-controls',
                      children: [
                        _jsx('span', {
                          style: { color: '#fff', fontSize: '12px', whiteSpace: 'nowrap' },
                          children: '\uD06C\uAE30',
                        }),
                        _jsx('input', {
                          type: 'range',
                          id: 'modalScaleSlider',
                          min: '0.1',
                          max: '2.0',
                          step: '0.05',
                          defaultValue: '0.5',
                          style: { flex: 1 },
                        }),
                        _jsx('button', {
                          className: 'mini-btn',
                          id: 'btnEditCancel',
                          children: '\uCDE8\uC18C',
                        }),
                        _jsx('button', {
                          className: 'mini-btn active',
                          id: 'btnEditApply',
                          children: '\uC801\uC6A9',
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            _jsxs('div', {
              className: 'sign-tools-bar',
              id: 'signToolsBar',
              children: [
                _jsxs('button', {
                  className: 'mini-btn active',
                  id: 'btnPen',
                  style: { marginRight: '4px' },
                  children: [
                    _jsx('i', {
                      'data-lucide': 'pen-tool',
                      style: { width: '14px', height: '14px' },
                    }),
                    ' \uD39C',
                  ],
                }),
                _jsxs('button', {
                  className: 'mini-btn',
                  id: 'btnEraser',
                  style: { marginRight: '10px' },
                  children: [
                    _jsx('i', {
                      'data-lucide': 'eraser',
                      style: { width: '14px', height: '14px' },
                    }),
                    ' \uC9C0\uC6B0\uAC1C',
                  ],
                }),
                _jsxs('button', {
                  className: 'uu-btn dashed type-gray-secondary',
                  id: 'btnImport',
                  style: {
                    height: '40px',
                    fontSize: '13px',
                    padding: '0 12px',
                    marginRight: '4px',
                  },
                  children: [
                    _jsx('i', {
                      'data-lucide': 'image-plus',
                      style: { width: '16px', height: '16px' },
                    }),
                    ' \uB3C4\uC7A5/\uC0AC\uC9C4',
                  ],
                }),
                _jsx('button', {
                  className: 'mini-btn',
                  id: 'btnUndo',
                  children: _jsx('i', {
                    'data-lucide': 'undo-2',
                    style: { width: '14px', height: '14px' },
                  }),
                }),
                _jsx('button', {
                  className: 'mini-btn',
                  id: 'btnClear',
                  children: _jsx('i', {
                    'data-lucide': 'trash-2',
                    style: { width: '14px', height: '14px' },
                  }),
                }),
                _jsx('input', { type: 'file', id: 'signImageInput', accept: 'image/*' }),
              ],
            }),
            _jsxs('div', {
              className: 'modal-footer',
              children: [
                _jsx('button', {
                  className: 'uu-btn dashed type-gray-secondary',
                  id: 'btnCancelModal',
                  children: '\uCDE8\uC18C',
                }),
                _jsx('button', {
                  className: 'uu-btn solid type-blue',
                  id: 'btnConfirmModal',
                  children: '\uC11C\uBA85 \uC644\uB8CC',
                }),
              ],
            }),
          ],
        }),
      }),
    ],
  })
}
