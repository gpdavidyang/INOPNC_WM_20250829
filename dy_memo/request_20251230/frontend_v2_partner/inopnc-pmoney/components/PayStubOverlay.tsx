import React, { useEffect, useRef } from 'react'
import { X, Download } from 'lucide-react'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { SalaryHistoryItem } from '../types'

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
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const imgWidth = 180
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      pdf.addImage(imgData, 'PNG', 15, 15, imgWidth, imgHeight)
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
      <div className="h-[60px] px-4 flex items-center justify-between bg-bg-surface border-b border-border shrink-0 dark:bg-[#1e293b] dark:border-[#334155]">
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
          className="w-full max-w-[500px] bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] p-[30px_30px_40px] text-[#111] mb-5 font-main mx-auto"
        >
          <div className="flex justify-between items-end border-b-2 border-[#1a254f] pb-5 mb-[30px]">
            <div>
              <h1 className="text-[32px] font-extrabold text-[#1a254f] m-0 tracking-tighter leading-tight">
                급여 명세서
              </h1>
              <div className="text-[22px] font-bold text-[#1a254f] mt-1">
                {year}. {month}월
              </div>
            </div>
            <div className="text-right">
              <div className="text-base font-bold text-[#111]">(주)이노피앤씨</div>
              <div className="text-sm text-[#64748b] font-medium">발급일: 2025. 12. 10.</div>
            </div>
          </div>

          <table className="w-full border-collapse mb-5 border border-[#d1d5db]">
            <tbody>
              <tr>
                <th className="border border-[#d1d5db] p-2 text-sm text-center h-9 bg-[#f8fafc] text-[#1a254f] font-bold w-1/4">
                  성명
                </th>
                <td className="border border-[#d1d5db] p-2 text-sm text-center h-9 font-medium text-[#111]">
                  김반장
                </td>
              </tr>
              <tr>
                <th className="border border-[#d1d5db] p-2 text-sm text-center h-9 bg-[#f8fafc] text-[#1a254f] font-bold">
                  지급일
                </th>
                <td className="border border-[#d1d5db] p-2 text-sm text-center h-9 font-medium text-[#111]">
                  2025. 12. 10.
                </td>
              </tr>
            </tbody>
          </table>

          <table className="w-full border-collapse mb-0 border-t border-[#1a254f]">
            <thead>
              <tr>
                <th
                  colSpan={2}
                  className="w-1/2 bg-[#1a254f] text-white p-2.5 text-sm font-bold text-center border border-[#556080] border-b-0"
                >
                  임금지급내역
                </th>
                <th
                  colSpan={2}
                  className="w-1/2 bg-[#1a254f] text-white p-2.5 text-sm font-bold text-center border border-[#556080] border-b-0"
                >
                  공제내역
                </th>
              </tr>
              <tr>
                <td className="bg-[#e0f2fe] text-[#1a254f] font-bold text-center p-2.5 text-sm border border-[#d1d5db]">
                  임금항목
                </td>
                <td className="bg-[#e0f2fe] text-[#1a254f] font-bold text-center p-2.5 text-sm border border-[#d1d5db]">
                  지급금액(원)
                </td>
                <td className="bg-[#e0f2fe] text-[#1a254f] font-bold text-center p-2.5 text-sm border border-[#d1d5db]">
                  공제항목
                </td>
                <td className="bg-[#e0f2fe] text-[#1a254f] font-bold text-center p-2.5 text-sm border border-[#d1d5db]">
                  지급금액(원)
                </td>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-[#d1d5db] p-2.5 text-sm text-center h-10">기본급</td>
                <td className="border border-[#d1d5db] p-2.5 text-sm text-right h-10 font-medium">
                  {data.baseTotal.toLocaleString()}
                </td>
                <td className="border border-[#d1d5db] p-2.5 text-sm text-center h-10">소득세</td>
                <td className="border border-[#d1d5db] p-2.5 text-sm text-right h-10 font-medium">
                  {incomeTax.toLocaleString()}
                </td>
              </tr>
              <tr>
                <td className="border border-[#d1d5db] p-2.5 text-sm text-center h-10"></td>
                <td className="border border-[#d1d5db] p-2.5 text-sm text-right h-10 font-medium"></td>
                <td className="border border-[#d1d5db] p-2.5 text-sm text-center h-10">
                  지방소득세
                </td>
                <td className="border border-[#d1d5db] p-2.5 text-sm text-right h-10 font-medium">
                  {localTax.toLocaleString()}
                </td>
              </tr>
              <tr>
                <td className="border border-[#d1d5db] border-b-0 h-2"></td>
                <td className="border border-[#d1d5db] border-b-0 h-2"></td>
                <td className="border border-[#d1d5db] border-b-0 h-2"></td>
                <td className="border border-[#d1d5db] border-b-0 h-2"></td>
              </tr>
              <tr>
                <td className="bg-[#f8fafc] text-[#1a254f] font-bold text-center p-2.5 text-sm border-t border-[#d1d5db]">
                  지급액 계
                </td>
                <td className="bg-[#f8fafc] text-[#1a254f] font-bold text-right p-2.5 text-sm border-t border-[#d1d5db]">
                  {data.baseTotal.toLocaleString()}
                </td>
                <td className="bg-[#f8fafc] text-[#1a254f] font-bold text-center p-2.5 text-sm border-t border-[#d1d5db]">
                  공제액 계
                </td>
                <td className="bg-[#f8fafc] text-[#1a254f] font-bold text-right p-2.5 text-sm border-t border-[#d1d5db]">
                  {tax.toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>

          <div className="mt-5 bg-[#eff6ff] rounded-2xl p-6 flex justify-between items-center">
            <span className="text-base font-bold text-[#1a254f]">실지급액</span>
            <span className="text-[28px] font-extrabold text-[#2563eb]">
              {net.toLocaleString()}
            </span>
          </div>

          <table className="w-full border-collapse mt-5">
            <thead>
              <tr>
                <td
                  colSpan={3}
                  className="bg-[#1a254f] text-white p-2 text-center font-bold text-sm"
                >
                  계산 방법
                </td>
              </tr>
              <tr>
                <th className="bg-[#1a254f] text-white p-2 text-[13px] border border-[#556080] w-1/5 text-center">
                  구분
                </th>
                <th className="bg-[#1a254f] text-white p-2 text-[13px] border border-[#556080] text-center">
                  산출식 또는 산출방법
                </th>
                <th className="bg-[#1a254f] text-white p-2 text-[13px] border border-[#556080] text-center">
                  지급액(원)
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-[#d1d5db] p-2 text-[13px] text-center text-[#111] font-semibold">
                  기본급
                </td>
                <td className="border border-[#d1d5db] p-2 text-[13px] text-center text-[#111]">
                  {data.man.toFixed(1)}공수 X {Math.round(data.price).toLocaleString()}원
                </td>
                <td className="border border-[#d1d5db] p-2 text-[13px] text-right text-[#111]">
                  {data.baseTotal.toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>

          <div className="mt-6 text-center text-sm text-[#64748b] font-medium">
            본 명세서는 전자 발급되었습니다.
          </div>
        </div>

        <button
          onClick={handleDownload}
          className="mt-4 w-full max-w-[500px] mx-auto bg-[#1a254f] text-white text-base font-bold rounded-xl h-14 border-none flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95 shadow-[0_4px_12px_rgba(26,37,79,0.2)]"
        >
          <Download width={20} /> PDF 다운로드 (A4)
        </button>
      </div>
    </div>
  )
}

export default PayStubOverlay
