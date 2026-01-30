import React, { useEffect, useRef } from 'react'
import { X, Download } from 'lucide-react'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { SalaryHistoryItem } from '@inopnc/shared'

interface PayStubOverlayProps {
  isOpen: boolean
  onClose: () => void
  data: SalaryHistoryItem | null
}

const PayStubOverlay: React.FC<PayStubOverlayProps> = ({ isOpen, onClose, data }) => {
  const printRef = useRef<HTMLDivElement>(null)

  // Prevent double scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const handleDownload = async () => {
    if (!printRef.current) return
    try {
      // A4 사이즈: 210mm x 297mm
      const pdf = new jsPDF('p', 'mm', 'a4')

      // html2canvas로 캡처 (A4 비율에 맞게)
      const canvas = await html2canvas(printRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: 'white',
        width: printRef.current.scrollWidth,
        height: printRef.current.scrollHeight,
      })

      const imgData = canvas.toDataURL('image/png')

      // A4 페이지 여백 설정 (상하좌우 15mm씩)
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 15
      const usableWidth = pageWidth - margin * 2
      const usableHeight = pageHeight - margin * 2

      // 이미지 비율 계산
      const imgWidth = usableWidth
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      // 이미지가 페이지보다 크면 비율 조정
      let finalWidth = imgWidth
      let finalHeight = imgHeight

      if (imgHeight > usableHeight) {
        finalHeight = usableHeight
        finalWidth = (canvas.width * finalHeight) / canvas.height
      }

      // 중앙 정렬하여 이미지 추가
      const x = (pageWidth - finalWidth) / 2
      const y = margin

      pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight)
      pdf.save('급여명세서.pdf')
    } catch (error) {
      alert('PDF 생성 중 오류가 발생했습니다.')
    }
  }

  if (!isOpen || !data) return null

  const tax = Math.floor(data.baseTotal * 0.033)
  const net = data.baseTotal - tax
  const incomeTax = Math.floor(data.baseTotal * 0.03)
  const localTax = Math.floor(data.baseTotal * 0.003)
  const [year, month] = data.rawDate.split('-')

  return (
    <div
      className={`fixed inset-0 bg-bg-body z-[2000] flex flex-col transform transition-transform duration-300 ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
    >
      <div className="h-[60px] px-4 flex items-center justify-between bg-[var(--bg-surface)] border-b border-[var(--border)] shrink-0">
        <button
          className="bg-none border-none text-text-main dark:text-white cursor-pointer"
          onClick={onClose}
        >
          <X />
        </button>
        <span className="text-lg font-bold text-text-main dark:text-white">급여명세서 조회</span>
        <div className="w-6"></div>
      </div>

      <div className="flex-1 p-5 overflow-y-auto">
        <div
          ref={printRef}
          className="w-full max-w-[450px] rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] p-[25px_25px_30px] mb-5 font-main mx-auto"
          style={{ backgroundColor: 'white', color: 'rgb(17, 17, 17)' }}
        >
          <div className="flex justify-between items-end border-b-2 border-header-navy pb-4 mb-[25px]">
            <div>
              <h1 className="text-[28px] font-extrabold text-header-navy m-0 tracking-tighter leading-tight">
                급여 명세서
              </h1>
              <div className="text-[20px] font-bold text-header-navy mt-1">
                {year}. {month}월
              </div>
            </div>
            <div className="text-right">
              <div className="text-base font-bold text-black">(주)이노피앤씨</div>
              <div className="text-sm text-slate-500 font-medium">발급일: 2025. 12. 10.</div>
            </div>
          </div>

          <table className="w-full border-collapse mb-4 border border-slate-300">
            <tbody>
              <tr>
                <th className="border border-slate-300 p-2 text-sm text-center h-8 bg-slate-50 text-header-navy font-bold w-1/4">
                  성명
                </th>
                <td className="border border-slate-300 p-2 text-sm text-center h-8 font-medium text-black">
                  김반장
                </td>
              </tr>
              <tr>
                <th className="border border-slate-300 p-2 text-sm text-center h-8 bg-slate-50 text-header-navy font-bold">
                  지급일
                </th>
                <td className="border border-slate-300 p-2 text-sm text-center h-8 font-medium text-black">
                  2025. 12. 10.
                </td>
              </tr>
            </tbody>
          </table>

          <table className="w-full border-collapse mb-0 border-t border-header-navy">
            <thead>
              <tr>
                <th
                  colSpan={2}
                  className="w-1/2 bg-header-navy text-white p-2 text-sm font-bold text-center border border-slate-500 border-b-0"
                >
                  임금지급내역
                </th>
                <th
                  colSpan={2}
                  className="w-1/2 bg-header-navy text-white p-2 text-sm font-bold text-center border border-slate-500 border-b-0"
                >
                  공제내역
                </th>
              </tr>
              <tr>
                <td className="bg-sky-50 text-header-navy font-bold text-center p-2 text-sm border border-slate-300">
                  임금항목
                </td>
                <td className="bg-sky-50 text-header-navy font-bold text-center p-2 text-sm border border-slate-300">
                  지급금액(원)
                </td>
                <td className="bg-sky-50 text-header-navy font-bold text-center p-2 text-sm border border-slate-300">
                  공제항목
                </td>
                <td className="bg-sky-50 text-header-navy font-bold text-center p-2 text-sm border border-slate-300">
                  지급금액(원)
                </td>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-slate-300 p-2 text-sm text-center h-9">기본급</td>
                <td className="border border-slate-300 p-2 text-sm text-right h-9 font-medium">
                  {data.baseTotal.toLocaleString()}
                </td>
                <td className="border border-slate-300 p-2 text-sm text-center h-9">소득세</td>
                <td className="border border-slate-300 p-2 text-sm text-right h-9 font-medium">
                  {incomeTax.toLocaleString()}
                </td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2 text-sm text-center h-9"></td>
                <td className="border border-slate-300 p-2 text-sm text-right h-9 font-medium"></td>
                <td className="border border-slate-300 p-2 text-sm text-center h-9">지방소득세</td>
                <td className="border border-slate-300 p-2 text-sm text-right h-9 font-medium">
                  {localTax.toLocaleString()}
                </td>
              </tr>
              <tr>
                <td className="border border-slate-300 border-b-0 h-1"></td>
                <td className="border border-slate-300 border-b-0 h-1"></td>
                <td className="border border-slate-300 border-b-0 h-1"></td>
                <td className="border border-slate-300 border-b-0 h-1"></td>
              </tr>
              <tr>
                <td className="bg-slate-50 text-header-navy font-bold text-center p-2 text-sm border-t border-slate-300">
                  지급액 계
                </td>
                <td className="bg-slate-50 text-header-navy font-bold text-right p-2 text-sm border-t border-slate-300">
                  {data.baseTotal.toLocaleString()}
                </td>
                <td className="bg-slate-50 text-header-navy font-bold text-center p-2 text-sm border-t border-slate-300">
                  공제액 계
                </td>
                <td className="bg-slate-50 text-header-navy font-bold text-right p-2 text-sm border-t border-slate-300">
                  {tax.toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>

          <div className="mt-4 bg-blue-50 rounded-2xl p-5 flex justify-between items-center">
            <span className="text-base font-bold text-header-navy">실지급액</span>
            <span className="text-[26px] font-extrabold text-blue-600">{net.toLocaleString()}</span>
          </div>

          <table className="w-full border-collapse mt-4">
            <thead>
              <tr>
                <td
                  colSpan={3}
                  className="bg-header-navy text-white p-2 text-center font-bold text-sm"
                >
                  계산 방법
                </td>
              </tr>
              <tr>
                <th className="bg-header-navy text-white p-2 text-[12px] border border-slate-500 w-1/5 text-center">
                  구분
                </th>
                <th className="bg-header-navy text-white p-2 text-[12px] border border-slate-500 text-center">
                  산출식 또는 산출방법
                </th>
                <th className="bg-header-navy text-white p-2 text-[12px] border border-slate-500 text-center">
                  지급액(원)
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-slate-300 p-2 text-[12px] text-center text-black font-semibold">
                  기본급
                </td>
                <td className="border border-slate-300 p-2 text-[12px] text-center text-black">
                  {data.man.toFixed(1)}공수 X {Math.round(data.price).toLocaleString()}원
                </td>
                <td className="border border-slate-300 p-2 text-[12px] text-right text-black">
                  {data.baseTotal.toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>

          <div className="mt-5 text-center text-sm text-slate-500 font-medium">
            본 명세서는 전자 발급되었습니다.
          </div>
        </div>

        <button
          onClick={handleDownload}
          className="mt-4 w-full max-w-[500px] mx-auto bg-header-navy text-white text-base font-bold rounded-xl h-14 border-none flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95 shadow-[0_4px_12px_rgba(26,37,79,0.2)]"
        >
          <Download width={20} /> PDF 다운로드 (A4)
        </button>
      </div>
    </div>
  )
}

export default PayStubOverlay
