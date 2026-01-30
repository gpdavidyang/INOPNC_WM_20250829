import React, { useState, useEffect } from 'react'
import {
  ChevronLeft,
  RotateCcw,
  Download,
  ImagePlus,
  Minus,
  Plus,
  Hand,
  Share2,
  Save,
} from 'lucide-react'
import { PhotoData } from '@inopnc/shared/types'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

interface PhotoEditorProps {
  isOpen: boolean
  onClose: () => void
  initialData: PhotoData[]
  onUpdate: (data: PhotoData[]) => void
  meta: { site: string; project: string; member: string; process: string }
}

const PhotoEditor: React.FC<PhotoEditorProps> = ({
  isOpen,
  onClose,
  initialData,
  onUpdate,
  meta,
}) => {
  const [zoom, setZoom] = useState(0.7)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null)

  // Ensure grid of 6
  const ensureGrid = (data: (PhotoData | null)[]) => {
    const rem = data.length % 6
    if (rem !== 0) {
      return [...data, ...Array(6 - rem).fill(null)]
    }
    return data.length === 0 ? Array(6).fill(null) : data
  }

  const [gridData, setGridData] = useState<(PhotoData | null)[]>(ensureGrid(initialData))

  useEffect(() => {
    if (isOpen) {
      setGridData(ensureGrid(initialData))
    }
  }, [isOpen, initialData])

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files) as File[]

      // Handle async reading
      const readers = newFiles.map(file => {
        return new Promise<PhotoData>(resolve => {
          const reader = new FileReader()
          reader.onload = ev => {
            resolve({
              img: ev.target?.result as string,
              member: meta.member,
              process: meta.process,
              desc: '보수후',
            })
          }
          reader.readAsDataURL(file)
        })
      })

      Promise.all(readers).then(results => {
        setGridData(prev => {
          const clone = [...prev]
          results.forEach(item => {
            const idx = clone.findIndex(p => p === null)
            if (idx !== -1) clone[idx] = item
            else clone.push(item)
          })
          return ensureGrid(clone)
        })
      })
    }
  }

  const updatePhotoText = (index: number, field: keyof PhotoData, value: string) => {
    setGridData(prev => {
      const next = [...prev]
      if (next[index]) {
        next[index] = { ...next[index]!, [field]: value }
      }
      return next
    })
  }

  const handleSaveToApp = () => {
    const cleanData = gridData.filter(p => p !== null) as PhotoData[]
    onUpdate(cleanData)
    onClose()
  }

  const savePDF = async () => {
    const wrapper = document.getElementById('pe-paper-wrapper')
    if (!wrapper) return

    const originalTransform = wrapper.style.transform
    wrapper.style.transform = 'scale(1)'

    try {
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pages = wrapper.querySelectorAll('.pe-page')

      for (let i = 0; i < pages.length; i++) {
        if (i > 0) pdf.addPage()
        const canvas = await html2canvas(pages[i] as HTMLElement, {
          scale: 1.5,
          useCORS: true,
          backgroundColor: 'white',
        })
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.8), 'JPEG', 0, 0, 210, 297)
      }
      pdf.save(`${meta.site || 'photo_log'}.pdf`)
    } catch (e) {
      console.error(e)
      alert('Error saving PDF')
    } finally {
      wrapper.style.transform = originalTransform
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isPanning) return
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning || !dragStart) return
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    })
  }

  const handleMouseUp = () => {
    setDragStart(null)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-slate-950 z-50 flex flex-col text-white">
      <header className="h-14 bg-black border-b border-slate-800 flex items-center justify-between px-3 shrink-0">
        <div className="flex items-center gap-2">
          <button onClick={onClose}>
            <ChevronLeft />
          </button>
          <span className="font-bold">스마트 사진대지</span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setGridData(ensureGrid([]))} className="p-2">
            <RotateCcw className="w-5 h-5" />
          </button>
          <button onClick={savePDF} className="p-2">
            <Download className="w-5 h-5" />
          </button>
          <button
            onClick={handleSaveToApp}
            className="flex items-center gap-1 bg-primary px-3 py-1 rounded-lg text-sm font-bold ml-2"
          >
            <Save className="w-4 h-4" /> 저장
          </button>
        </div>
      </header>

      <div className="bg-slate-900 p-3 border-b border-slate-800 flex flex-col gap-2 shrink-0">
        <div className="flex gap-2">
          <input
            className="flex-1 bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm"
            defaultValue={meta.site}
            placeholder="현장명"
          />
          <input
            className="flex-1 bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm"
            defaultValue={meta.project}
            placeholder="공사명"
          />
        </div>
      </div>

      <div
        className={`flex-1 relative overflow-hidden flex justify-center pt-8 pb-32 bg-slate-950 ${isPanning ? 'cursor-grab active:cursor-grabbing' : ''}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          id="pe-paper-wrapper"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'top center',
            transition: isPanning ? 'none' : 'transform 0.1s',
          }}
          className="flex flex-col gap-8 items-center pointer-events-none"
        >
          {Array.from({ length: Math.ceil(gridData.length / 6) }).map((_, pageIdx) => (
            <div
              key={pageIdx}
              className="pe-page w-[794px] h-[1123px] text-black p-10 shadow-xl flex flex-col box-border pointer-events-auto"
              style={{ backgroundColor: 'white' }}
            >
              <div className="text-center mb-4">
                <h1 className="text-3xl font-black">{meta.site || '공사 사진대지'}</h1>
              </div>
              <table className="w-full border-collapse border-2 border-slate-700 table-fixed mb-0">
                <tbody>
                  <tr>
                    <td className="border border-slate-700 bg-slate-100 font-bold w-[15%] h-[30px] text-center">
                      공사명
                    </td>
                    <td className="border border-slate-700 pl-2">{meta.project}</td>
                  </tr>
                </tbody>
              </table>

              <table className="w-full border-collapse border-2 border-slate-700 table-fixed mt-[-2px]">
                <colgroup>
                  <col width="15%" />
                  <col width="35%" />
                  <col width="15%" />
                  <col width="35%" />
                </colgroup>
                <tbody>
                  {[0, 1, 2].map(row => {
                    const idx1 = pageIdx * 6 + row * 2
                    const idx2 = idx1 + 1
                    const d1 = gridData[idx1]
                    const d2 = gridData[idx2]
                    return (
                      <React.Fragment key={row}>
                        <tr className="h-[215px]">
                          <td
                            colSpan={2}
                            className="border border-slate-700 p-0 relative bg-slate-50 cursor-pointer overflow-hidden"
                          >
                            {d1 ? (
                              <img src={d1.img} className="w-full h-full object-cover" />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center text-slate-300 text-4xl">
                                +
                              </div>
                            )}
                          </td>
                          <td
                            colSpan={2}
                            className="border border-slate-700 p-0 relative bg-slate-50 cursor-pointer overflow-hidden"
                          >
                            {d2 ? (
                              <img src={d2.img} className="w-full h-full object-cover" />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center text-slate-300 text-4xl">
                                +
                              </div>
                            )}
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-slate-700 bg-slate-100 font-bold text-center h-8">
                            부재명
                          </td>
                          <td className="border border-slate-700">
                            <input
                              className="w-full h-full text-center border-none outline-none bg-transparent focus:bg-blue-50"
                              value={d1?.member || ''}
                              onChange={e => updatePhotoText(idx1, 'member', e.target.value)}
                            />
                          </td>
                          <td className="border border-slate-700 bg-slate-100 font-bold text-center">
                            부재명
                          </td>
                          <td className="border border-slate-700">
                            <input
                              className="w-full h-full text-center border-none outline-none bg-transparent focus:bg-blue-50"
                              value={d2?.member || ''}
                              onChange={e => updatePhotoText(idx2, 'member', e.target.value)}
                            />
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-slate-700 bg-slate-100 font-bold text-center h-8">
                            공 정
                          </td>
                          <td className="border border-slate-700">
                            <input
                              className="w-full h-full text-center border-none outline-none bg-transparent focus:bg-blue-50"
                              value={d1?.process || ''}
                              onChange={e => updatePhotoText(idx1, 'process', e.target.value)}
                            />
                          </td>
                          <td className="border border-slate-700 bg-slate-100 font-bold text-center">
                            공 정
                          </td>
                          <td className="border border-slate-700">
                            <input
                              className="w-full h-full text-center border-none outline-none bg-transparent focus:bg-blue-50"
                              value={d2?.process || ''}
                              onChange={e => updatePhotoText(idx2, 'process', e.target.value)}
                            />
                          </td>
                        </tr>
                        <tr>
                          <td className="border border-slate-700 bg-slate-100 font-bold text-center h-8">
                            내 용
                          </td>
                          <td className="border border-slate-700 text-center font-semibold cursor-pointer">
                            <input
                              className="w-full h-full text-center border-none outline-none bg-transparent focus:bg-blue-50"
                              value={d1?.desc || ''}
                              onChange={e => updatePhotoText(idx1, 'desc', e.target.value)}
                            />
                          </td>
                          <td className="border border-slate-700 bg-slate-100 font-bold text-center">
                            내 용
                          </td>
                          <td className="border border-slate-700 text-center font-semibold cursor-pointer">
                            <input
                              className="w-full h-full text-center border-none outline-none bg-transparent focus:bg-blue-50"
                              value={d2?.desc || ''}
                              onChange={e => updatePhotoText(idx2, 'desc', e.target.value)}
                            />
                          </td>
                        </tr>
                      </React.Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </div>

      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 px-6 py-2 rounded-full flex gap-6 border border-slate-700 shadow-2xl z-50">
        <label className="flex flex-col items-center gap-1 text-[10px] text-white/70 hover:text-white cursor-pointer">
          <ImagePlus size={20} />
          <span>추가</span>
          <input type="file" multiple accept="image/*" className="hidden" onChange={handleUpload} />
        </label>
        <div className="w-px h-6 bg-slate-600 self-center"></div>
        <button
          onClick={() => setZoom(z => Math.max(0.2, z - 0.1))}
          className="flex flex-col items-center gap-1 text-[10px] text-white/70 hover:text-white"
        >
          <Minus size={20} />
          <span>축소</span>
        </button>
        <button
          onClick={() => setIsPanning(!isPanning)}
          className={`flex flex-col items-center gap-1 text-[10px] ${isPanning ? 'text-primary' : 'text-white/70'} hover:text-white`}
        >
          <Hand size={20} />
          <span>이동</span>
        </button>
        <button
          onClick={() => setZoom(z => z + 0.1)}
          className="flex flex-col items-center gap-1 text-[10px] text-white/70 hover:text-white"
        >
          <Plus size={20} />
          <span>확대</span>
        </button>
        <button
          onClick={() => {}}
          className="flex flex-col items-center gap-1 text-[10px] text-white/70 hover:text-white"
        >
          <Share2 size={20} />
          <span>공유</span>
        </button>
      </div>
    </div>
  )
}

export default PhotoEditor
