import React, { useEffect, useRef, useState } from 'react'
import { ChevronLeft, RotateCcw, Download, Share2, ZoomIn, ZoomOut, Move } from 'lucide-react'
import SignaturePad from 'signature_pad'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { ManpowerItem, WorkSet, MaterialItem } from '@inopnc/shared/types'

interface WorkReportModalProps {
  isOpen: boolean
  onClose: () => void
  siteName: string
  manpowerList: ManpowerItem[]
  workSets: WorkSet[]
  materials: MaterialItem[]
}

const WorkReportModal: React.FC<WorkReportModalProps> = ({
  isOpen,
  onClose,
  siteName,
  manpowerList,
  workSets,
  materials,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const signaturePadRef = useRef<SignaturePad | null>(null)
  const [zoom, setZoom] = useState(1)
  const [formKey, setFormKey] = useState(0) // For resetting uncontrolled inputs

  // Generate dynamic content strings
  const workerString = manpowerList
    .filter(m => m.worker && m.workHours > 0)
    .map(m => `${m.worker}(${m.workHours})`)
    .join(', ')

  const workContentString = workSets
    .map((ws, i) => {
      const loc = `${ws.location.block ? ws.location.block + '블럭 ' : ''}${ws.location.dong ? ws.location.dong + '동 ' : ''}${ws.location.floor ? ws.location.floor + '층' : ''}`
      const mem = ws.member === '기타' ? ws.customMemberValue : ws.member
      const proc = ws.process === '기타' ? ws.customProcessValue : ws.process
      return `${i + 1}. [${loc}] ${mem} - ${proc}`
    })
    .join('\n')

  const materialString = materials.map(m => `${m.name}: ${m.qty}말`).join(', ')

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      const canvas = canvasRef.current
      // Handle resizing
      const ratio = Math.max(window.devicePixelRatio || 1, 1)
      canvas.width = canvas.offsetWidth * ratio
      canvas.height = canvas.offsetHeight * ratio
      canvas.getContext('2d')?.scale(ratio, ratio)

      signaturePadRef.current = new SignaturePad(canvas, {
        backgroundColor: 'rgba(255, 255, 255, 0)',
        minWidth: 0.5,
        maxWidth: 2.5,
      })
    }
  }, [isOpen, formKey])

  const handleClear = () => signaturePadRef.current?.clear()

  const handleReset = () => {
    if (confirm('작성 내용을 초기화하시겠습니까?')) {
      setFormKey(prev => prev + 1)
    }
  }

  const handleShare = async () => {
    const element = document.getElementById('wr-document-area')
    if (!element) return

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: 'white',
      })
      canvas.toBlob(
        async blob => {
          if (blob) {
            const file = new File([blob], `work_report_${Date.now()}.jpg`, { type: 'image/jpeg' })
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
              await navigator.share({
                files: [file],
                title: '작업완료확인서',
                text: `${siteName} 작업완료확인서입니다.`,
              })
            } else {
              alert('이 브라우저에서는 파일 공유를 지원하지 않습니다.')
            }
          }
        },
        'image/jpeg',
        0.95
      )
    } catch (e) {
      console.error(e)
      alert('공유 준비 중 오류가 발생했습니다.')
    }
  }

  const handleDownload = async () => {
    const element = document.getElementById('wr-document-area')
    if (!element) return

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: 'white',
      })
      const imgData = canvas.toDataURL('image/jpeg', 0.95)
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = 210
      const imgHeight = (canvas.height * pageWidth) / canvas.width
      pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, imgHeight)
      pdf.save('WorkReport.pdf')
    } catch (e) {
      console.error(e)
      alert('PDF Creation Failed')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-slate-950 z-50 flex flex-col text-white">
      <header className="h-[60px] bg-black border-b border-slate-800 flex items-center justify-between px-4 shrink-0">
        <button onClick={onClose}>
          <ChevronLeft size={28} />
        </button>
        <span className="text-lg font-bold">작업완료확인서</span>
        <div className="flex gap-4">
          <button onClick={handleReset}>
            <RotateCcw />
          </button>
          <button onClick={handleDownload}>
            <Download />
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-auto bg-slate-950 flex justify-center pt-5 pb-20">
        <div
          style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
          className="transition-transform duration-100"
        >
          <div
            id="wr-document-area"
            key={formKey}
            className="w-[210mm] min-h-[297mm] text-black p-[15mm] shadow-2xl flex flex-col box-border"
            style={{ backgroundColor: 'white' }}
          >
            <header className="text-center mb-8 border-b-4 border-double border-black pb-4">
              <h1 className="text-4xl font-black tracking-[5px]">작 업 완 료 확 인 서</h1>
            </header>

            <table className="w-full border-collapse border-2 border-slate-800 mb-5">
              <tbody>
                <tr>
                  <th className="border border-slate-800 p-2 bg-slate-50 w-[16%] text-slate-700 font-extrabold">
                    현 장 명
                  </th>
                  <td className="border border-slate-800 p-2">
                    <input
                      className="w-full outline-none font-semibold"
                      defaultValue={siteName}
                      placeholder="내용 입력"
                    />
                  </td>
                  <th className="border border-slate-800 p-2 bg-slate-50 w-[16%] text-slate-700 font-extrabold">
                    공 사 명
                  </th>
                  <td className="border border-slate-800 p-2">
                    <input
                      className="w-full outline-none font-semibold"
                      placeholder="공사명 입력"
                      defaultValue="균열보수 공사"
                    />
                  </td>
                </tr>
                <tr>
                  <th className="border border-slate-800 p-2 bg-slate-50 w-[16%] text-slate-700 font-extrabold">
                    작 업 자
                  </th>
                  <td className="border border-slate-800 p-2">
                    <textarea
                      className="w-full h-full outline-none font-semibold resize-none overflow-hidden"
                      rows={2}
                      defaultValue={workerString}
                      placeholder="성명 입력"
                    ></textarea>
                  </td>
                  <th className="border border-slate-800 p-2 bg-slate-50 w-[16%] text-slate-700 font-extrabold">
                    작업일자
                  </th>
                  <td className="border border-slate-800 p-2">
                    <input
                      className="w-full outline-none font-semibold"
                      defaultValue={new Date().toISOString().slice(0, 10)}
                    />
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="border-2 border-slate-800 p-4 mb-5 flex flex-col h-[280px]">
              <div className="text-lg font-extrabold text-slate-800 mb-3 border-l-[5px] border-slate-600 pl-3">
                작업내용
              </div>
              <textarea
                className="flex-1 w-full resize-none outline-none font-semibold leading-relaxed"
                defaultValue={workContentString}
                placeholder="상세 내용 입력..."
              ></textarea>
              {materialString && (
                <div className="mt-2 pt-2 border-t border-dashed border-slate-300">
                  <span className="font-bold text-slate-600 mr-2">사용자재:</span>
                  <span className="font-semibold">{materialString}</span>
                </div>
              )}
            </div>

            <div className="border-2 border-slate-800 p-4 mb-5 flex flex-col h-[100px]">
              <div className="text-lg font-extrabold text-slate-800 mb-3 border-l-[5px] border-slate-600 pl-3">
                특기사항
              </div>
              <textarea
                className="flex-1 w-full resize-none outline-none font-semibold"
                placeholder="특이사항..."
              ></textarea>
            </div>

            <div className="mt-4 text-center">
              <div className="text-xl font-extrabold mb-6">
                상기 사항과 같이 작업을 완료하였음을 확인합니다.
              </div>
              <div className="text-xl font-extrabold mb-8 text-center">
                {new Date().toLocaleDateString()}
              </div>

              <div className="grid grid-cols-[33%_27%_40%] border-2 border-slate-800 mb-5">
                <div className="bg-slate-50 border-r border-slate-800 flex flex-col justify-center items-center p-3 gap-2">
                  <span className="font-extrabold text-lg text-slate-700">소 속 :</span>
                  <input
                    className="text-center text-lg font-bold w-full border-b border-dashed border-slate-300 bg-transparent"
                    defaultValue="(주)이노피앤씨"
                  />
                </div>
                <div className="bg-slate-50 border-r border-slate-800 flex flex-col justify-center items-center p-3 gap-2">
                  <span className="font-extrabold text-lg text-slate-700">성 명 :</span>
                  <input
                    className="text-center text-lg font-bold w-full border-b border-dashed border-slate-300 bg-transparent"
                    placeholder="작업반장"
                    defaultValue={manpowerList[0]?.worker || ''}
                  />
                </div>
                <div
                  className="relative h-[200px] flex flex-col"
                  style={{ backgroundColor: 'white' }}
                >
                  <div className="p-2 text-sm font-bold text-slate-500 border-b border-dashed border-slate-200">
                    확인자 (서명)
                  </div>
                  <div className="flex-1 relative">
                    <canvas ref={canvasRef} className="w-full h-full cursor-crosshair touch-none" />
                  </div>
                  <div className="h-11 bg-slate-50 border-t border-slate-200 flex justify-between items-center px-2">
                    <button
                      onClick={handleClear}
                      className="text-xs px-3 py-1 bg-transparent border border-slate-300 rounded text-slate-600 font-semibold shadow-sm"
                    >
                      지우기
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-black/80 px-8 py-3 rounded-full flex gap-8 backdrop-blur shadow-2xl z-50">
        <button
          onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}
          className="flex flex-col items-center gap-1 text-[11px] text-white/70 hover:text-white"
        >
          <ZoomOut size={20} />
          축소
        </button>
        <button
          onClick={() => {}}
          className="flex flex-col items-center gap-1 text-[11px] text-white/70 hover:text-white"
        >
          <Move size={20} />
          이동
        </button>
        <button
          onClick={() => setZoom(z => z + 0.1)}
          className="flex flex-col items-center gap-1 text-[11px] text-white/70 hover:text-white"
        >
          <ZoomIn size={20} />
          확대
        </button>
        <button
          onClick={handleShare}
          className="flex flex-col items-center gap-1 text-[11px] text-white/70 hover:text-white"
        >
          <Share2 size={20} />
          공유
        </button>
      </div>
    </div>
  )
}

export default WorkReportModal
