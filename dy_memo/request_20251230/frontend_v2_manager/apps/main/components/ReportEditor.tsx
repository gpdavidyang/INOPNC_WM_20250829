import React, { useState, useRef } from 'react'
import { DocumentGroup } from '../pages/DocPage'
import { X, Download, Plus, Minus, Hand } from 'lucide-react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

interface ReportEditorProps {
  items: DocumentGroup[]
  siteName: string
  onClose: () => void
  onUpdateStatus: (id: string, status: 'open' | 'done') => void
  onUpdateImage: (id: string, type: 'before' | 'after', file: File) => void
}

export const ReportEditor: React.FC<ReportEditorProps> = ({
  items,
  siteName,
  onClose,
  onUpdateStatus,
  onUpdateImage,
}) => {
  const [zoom, setZoom] = useState(0.5)
  const [isPanning, setIsPanning] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })

  const viewportRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const dragStart = useRef({ x: 0, y: 0 })

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isPanning) return
    e.preventDefault()
    dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y }
    viewportRef.current?.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isPanning || !viewportRef.current?.hasPointerCapture(e.pointerId)) return
    setPosition({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    })
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isPanning) viewportRef.current?.releasePointerCapture(e.pointerId)
  }

  // --- PDF Generation Logic with Smart Filtering ---
  const generatePDF = async () => {
    if (!contentRef.current) {
      alert('콘텐츠를 찾을 수 없습니다.')
      return
    }

    try {
      const original = contentRef.current
      const clone = original.cloneNode(true) as HTMLElement

      // Filter out rows that are purely empty placeholders in the clone
      const rows = Array.from(clone.querySelectorAll('tbody tr'))
      rows.forEach(row => {
        if (row.textContent?.trim() === '') {
          row.remove()
        }
      })

      // Hide photo upload placeholders text in the clone
      const uploadPlaceholders = Array.from(clone.querySelectorAll('.photo-upload-placeholder'))
      uploadPlaceholders.forEach(el => {
        ;(el as HTMLElement).style.display = 'none'
      })

      // Remove borders from image containers for the PDF
      const imageContainers = Array.from(clone.querySelectorAll('.border-slate-300'))
      imageContainers.forEach(el => {
        el.classList.remove('border', 'border-slate-300')
        ;(el as HTMLElement).style.border = 'none'
      })

      clone.style.transform = 'none'
      clone.style.width = '210mm'
      clone.style.minHeight = '297mm'
      clone.style.background = 'white'
      clone.style.margin = '0'
      clone.style.padding = '20mm 10mm'

      const hiddenContainer = document.createElement('div')
      hiddenContainer.style.position = 'absolute'
      hiddenContainer.style.top = '-10000px'
      hiddenContainer.style.left = '-10000px'
      // Force container to be 0x0 to avoid scrollbars/layout shifts
      hiddenContainer.style.width = '0'
      hiddenContainer.style.height = '0'
      hiddenContainer.style.overflow = 'hidden'

      hiddenContainer.appendChild(clone)
      document.body.appendChild(hiddenContainer)

      const images = Array.from(clone.querySelectorAll('img'))
      await Promise.all(
        images.map((img: HTMLImageElement) => {
          if (img.complete) return Promise.resolve()
          return new Promise(resolve => {
            img.onload = resolve
            img.onerror = resolve
          })
        })
      )

      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        backgroundColor: 'white',
        logging: false,
      })

      document.body.removeChild(hiddenContainer)

      const pdf = new jsPDF('p', 'mm', 'a4')

      const pageWidthMm = 210
      const pageHeightMm = 297
      const marginX = 10
      const marginY = 12
      const usableW = pageWidthMm - marginX * 2
      const usableH = pageHeightMm - marginY * 2
      const mmPerPx = usableW / canvas.width

      // Calculate row positions to avoid cutting through table rows
      const tableRows = Array.from(clone.querySelectorAll('tbody tr'))
      const rowBottomsCanvasPx: number[] = []

      tableRows.forEach(row => {
        const rect = row.getBoundingClientRect()
        const cloneRect = clone.getBoundingClientRect()
        const relativeBottom = (rect.bottom - cloneRect.top) * 2 // scale factor
        rowBottomsCanvasPx.push(relativeBottom)
      })

      const pageHeightPx = Math.floor(usableH / mmPerPx)
      let y = 0
      let pageIndex = 0

      while (y < canvas.height - 1) {
        if (pageIndex > 0) pdf.addPage()

        const targetEnd = Math.min(y + pageHeightPx, canvas.height)
        let breakY = targetEnd

        // Find the last row bottom that fits within this page
        for (let i = rowBottomsCanvasPx.length - 1; i >= 0; i--) {
          const rb = rowBottomsCanvasPx[i]
          if (rb > y + 50 && rb <= targetEnd) {
            breakY = rb
            break
          }
        }

        const sliceH = breakY - y
        const sliceCanvas = document.createElement('canvas')
        sliceCanvas.width = canvas.width
        sliceCanvas.height = sliceH
        sliceCanvas
          .getContext('2d')
          ?.drawImage(canvas, 0, y, canvas.width, sliceH, 0, 0, canvas.width, sliceH)

        const sliceHeightMm = sliceH * mmPerPx
        pdf.addImage(
          sliceCanvas.toDataURL('image/jpeg', 0.9),
          'JPEG',
          marginX,
          marginY,
          usableW,
          sliceHeightMm
        )

        pageIndex++
        y = breakY
      }

      pdf.save(`점검보고서_${siteName}_${Date.now()}.pdf`)
    } catch (e) {
      console.error(e)
      alert('PDF 생성 중 오류가 발생했습니다.')
    }
  }

  const handleImageUpload = (id: string, type: 'before' | 'after') => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = e => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) onUpdateImage(id, type, file)
    }
    input.click()
  }

  // Ensure only items with valid punchData are rendered
  const validItems = items.filter(item => item.punchData && item.punchData.location)

  return (
    <div className="fixed inset-0 bg-slate-950 z-[9999] flex flex-col text-white">
      {/* Header */}
      <header className="h-[60px] bg-black flex items-center justify-between px-4 border-b border-slate-800 shrink-0">
        <button onClick={onClose} className="p-2">
          <X size={24} />
        </button>
        <div className="text-center">
          <div className="text-base font-bold">{siteName} 보고서</div>
          <div className="text-[10px] text-slate-400">PDF 저장 및 미리보기</div>
        </div>
        <button onClick={generatePDF} className="p-2 text-primary">
          <Download size={24} />
        </button>
      </header>

      {/* Viewport */}
      <div
        ref={viewportRef}
        className={`flex-1 relative overflow-hidden bg-slate-900 flex justify-center items-start touch-none ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <div
          ref={contentRef}
          className="text-black w-[210mm] min-h-[297mm] p-[20mm_10mm] shadow-2xl origin-top transition-transform duration-75"
          style={{
            backgroundColor: 'white',
            transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
          }}
        >
          <h1 className="text-center text-2xl font-bold mb-6 border-b-2 border-black pb-4">
            펀치리스트 점검 보고서
          </h1>
          <table className="w-full border-collapse border-2 border-black table-fixed">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-black p-2 w-[40px] text-sm">NO</th>
                <th className="border border-black p-2 w-[100px] text-sm">위치</th>
                <th className="border border-black p-2 text-sm">지적 내용</th>
                <th className="border border-black p-2 w-[110px] text-sm">조치전</th>
                <th className="border border-black p-2 w-[110px] text-sm">조치후</th>
                <th className="border border-black p-2 w-[70px] text-sm">상태</th>
              </tr>
            </thead>
            <tbody>
              {validItems.length > 0 ? (
                validItems.map((item, index) => {
                  const beforeFile = item.files.find(
                    f => f.currentView === 'before' || f.url_before
                  )
                  const afterFile = item.files.find(f => f.currentView === 'after' || f.url_after)
                  const imgBefore = beforeFile?.url_before || beforeFile?.url || ''
                  const imgAfter = afterFile?.url_after || afterFile?.url || ''

                  return (
                    <tr key={item.id}>
                      <td className="border border-black p-2 text-center text-sm font-bold">
                        {index + 1}
                      </td>
                      <td
                        className="border border-black p-2 text-center text-sm"
                        contentEditable
                        suppressContentEditableWarning
                      >
                        {item.punchData?.location}
                      </td>
                      <td
                        className="border border-black p-2 text-left text-sm"
                        contentEditable
                        suppressContentEditableWarning
                      >
                        {item.punchData?.issue}
                      </td>
                      <td className="border border-black p-2">
                        <div
                          className="w-[100px] h-[80px] border border-slate-300 bg-slate-50 mx-auto flex items-center justify-center relative cursor-pointer group"
                          onClick={() => handleImageUpload(item.id, 'before')}
                        >
                          {imgBefore ? (
                            <img
                              src={imgBefore}
                              className="w-full h-full object-cover"
                              alt="Before"
                            />
                          ) : (
                            <span className="text-slate-400 text-xs photo-upload-placeholder">
                              사진등록
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="border border-black p-2">
                        <div
                          className="w-[100px] h-[80px] border border-slate-300 bg-slate-50 mx-auto flex items-center justify-center relative cursor-pointer group"
                          onClick={() => handleImageUpload(item.id, 'after')}
                        >
                          {imgAfter ? (
                            <img
                              src={imgAfter}
                              className="w-full h-full object-cover"
                              alt="After"
                            />
                          ) : (
                            <span className="text-slate-400 text-xs photo-upload-placeholder">
                              사진등록
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="border border-black p-2 text-center">
                        <button
                          onClick={() =>
                            onUpdateStatus(
                              item.id,
                              item.punchData?.status === 'open' ? 'done' : 'open'
                            )
                          }
                          className={`px-2 py-1 rounded-full text-[11px] font-bold border ${
                            item.punchData?.status === 'open'
                              ? 'bg-red-50 text-red-500 border-red-200'
                              : 'bg-green-50 text-green-600 border-green-200'
                          }`}
                        >
                          {item.punchData?.status === 'open' ? '미조치' : '완료'}
                        </button>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={6} className="border border-black p-8 text-center text-slate-400">
                    데이터가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700 rounded-full px-6 py-3 flex gap-6 shadow-xl">
        <button
          onClick={() => setZoom(z => Math.max(0.3, z - 0.1))}
          className="flex flex-col items-center gap-1 text-[10px] text-slate-300 hover:text-white"
        >
          <Minus size={18} /> 축소
        </button>
        <button
          onClick={() => setIsPanning(!isPanning)}
          className={`flex flex-col items-center gap-1 text-[10px] ${isPanning ? 'text-primary font-bold' : 'text-slate-300 hover:text-white'}`}
        >
          <Hand size={18} /> 이동
        </button>
        <button
          onClick={() => setZoom(z => z + 0.1)}
          className="flex flex-col items-center gap-1 text-[10px] text-slate-300 hover:text-white"
        >
          <Plus size={18} /> 확대
        </button>
      </div>
    </div>
  )
}
