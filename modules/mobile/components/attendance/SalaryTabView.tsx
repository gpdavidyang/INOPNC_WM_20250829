'use client'

import {
  CustomSelect,
  CustomSelectContent,
  CustomSelectItem,
  CustomSelectTrigger,
  CustomSelectValue,
} from '@/components/ui/custom-select'
import { ChevronRight, Clock, Eye, EyeOff, FileText, Share } from 'lucide-react'
import React from 'react'

interface SalaryTabViewProps {
  salarySelectedYearMonth: string
  handleSalaryYearMonthChange: (val: string) => void
  salaryOptions: { value: string; label: string }[]
  apiMonthly: any | null
  recentSalaryHistory: any[]
  showAllSalaryHistory: boolean
  setShowAllSalaryHistory: (show: boolean) => void
}

export const SalaryTabView: React.FC<SalaryTabViewProps> = ({
  salarySelectedYearMonth,
  handleSalaryYearMonthChange,
  salaryOptions,
  apiMonthly,
  recentSalaryHistory,
  showAllSalaryHistory,
  setShowAllSalaryHistory,
}) => {
  const [showSalary, setShowSalary] = React.useState(true)

  const formatManDays = (val: number) => {
    return Number(val).toFixed(1)
  }

  return (
    <div className="attendance-calendar-section animate-fade-in pt-1">
      {/* 2. Current Month Payment Pending Section */}
      <div className="mb-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            {/* Clock icon - using Lucide React equivalent */}
            <Clock size={20} className="text-[#1a254f]" />
            <span className="text-[19px] font-bold text-[#1a254f]">이번 달 지급 대기</span>
          </div>
          <button
            onClick={() => setShowSalary(!showSalary)}
            className="bg-transparent border-none flex items-center gap-1 cursor-pointer text-[#94a3b8] text-[13px] font-semibold p-0 hover:text-[#31a3fa] transition-colors"
          >
            <span>금액 보기/숨기기</span>
            {showSalary ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>

        {/* Card */}
        <div className="bg-white shadow-sm rounded-[16px] p-5 border border-[#e6ecf4]">
          <div className="flex justify-between items-center mb-4">
            <span className="text-[18px] font-extrabold text-[#1a254f]">
              {salarySelectedYearMonth.replace('-', '년 ')}월
            </span>
            {(() => {
              const status = apiMonthly?.snapshot?.status || 'pending'
              const isPaid = status === 'paid'
              return (
                <span
                  className={`text-[12px] font-semibold px-2.5 py-1 rounded-full border ${
                    isPaid
                      ? 'bg-slate-50 text-slate-600 border-slate-200'
                      : 'bg-sky-50 text-sky-600 border-sky-200'
                  }`}
                >
                  {isPaid ? '지급완료' : '지급대기'}
                </span>
              )
            })()}
          </div>

          <div className="flex justify-between items-center pb-4 border-b border-dashed border-[#f1f5f9] mb-3">
            <span className="font-bold text-[#1a254f]">실수령 예정액</span>
            <div className="flex items-baseline justify-end gap-0.5">
              <span className="text-[24px] text-sky-500 font-extrabold tracking-tighter">
                {showSalary
                  ? (typeof apiMonthly?.salary === 'object'
                      ? apiMonthly.salary.net_pay || 0
                      : 0
                    ).toLocaleString()
                  : '••••'}
              </span>
              <span className="text-[16px] font-semibold text-sky-500">원</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-[15px] text-[#64748b]">
              <span className="font-bold text-[#1a254f]">공수</span>
              <span className="font-semibold text-[#1a254f] text-[16px]">
                {apiMonthly?.totalManDays !== undefined
                  ? Number(apiMonthly.totalManDays).toFixed(1)
                  : apiMonthly?.manDays || '0.0'}
              </span>
            </div>
            <div className="flex justify-between items-center text-[15px] text-[#64748b]">
              <span className="font-bold text-[#1a254f]">평균단가</span>
              <span className="font-semibold text-[#1a254f] text-[16px]">
                {showSalary
                  ? (() => {
                      const manDays = apiMonthly?.totalManDays || apiMonthly?.manDays || 0
                      const totalGross =
                        typeof apiMonthly?.salary === 'object'
                          ? apiMonthly.salary.total_gross_pay || 0
                          : 0
                      const avg = manDays > 0 ? Math.round(totalGross / manDays) : 0
                      return avg.toLocaleString()
                    })()
                  : '••••'}
              </span>
            </div>
          </div>

          <button
            className="w-full mt-5 p-3 rounded-[12px] bg-[#31a3fa] text-white font-bold text-[15px] cursor-pointer flex items-center justify-center gap-2 hover:bg-[#2563eb] transition-colors shadow-md shadow-blue-500/20 active:scale-[0.98]"
            onClick={async () => {
              if (navigator.share) {
                try {
                  await navigator.share({
                    title: 'INOPNC 급여 지급 요청',
                    text: `${salarySelectedYearMonth} 급여 지급 요청\n실수령액: ${(typeof apiMonthly?.salary ===
                    'object'
                      ? apiMonthly.salary.net_pay || 0
                      : 0
                    ).toLocaleString()}원`,
                    url: window.location.href,
                  })
                } catch (err) {
                  console.error('Share failed', err)
                }
              } else {
                alert('공유 기능을 지원하지 않는 브라우저입니다.')
              }
            }}
          >
            <Share size={18} />
            지급 요청하기 (공유)
          </button>
        </div>
      </div>

      {/* 4. Recent History List */}
      <div className="space-y-4 pt-4">
        {/* Header & Filters */}
        <div className="flex justify-between items-center mb-0">
          <div className="flex items-center gap-2">
            <FileText size={20} className="text-[#1a254f]" />
            <h3 className="text-[19px] font-bold text-[#1a254f]">지난 급여 내역</h3>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <CustomSelect>
              <CustomSelectTrigger className="w-full h-[48px] bg-white border border-[#e6ecf4] rounded-[12px] px-3.5 text-[15px] font-semibold text-[#1a254f] shadow-sm">
                <CustomSelectValue placeholder="전체" />
              </CustomSelectTrigger>
              <CustomSelectContent>
                <CustomSelectItem value="all" className="py-3 text-[15px]">
                  전체
                </CustomSelectItem>
                {/* Dynamically populate options based on history if needed, for now simplified */}
              </CustomSelectContent>
            </CustomSelect>
          </div>
          <div className="relative flex-1">
            <CustomSelect>
              <CustomSelectTrigger className="w-full h-[48px] bg-white border border-[#e6ecf4] rounded-[12px] px-3.5 text-[15px] font-semibold text-[#1a254f] shadow-sm">
                <CustomSelectValue placeholder="최신순" />
              </CustomSelectTrigger>
              <CustomSelectContent>
                <CustomSelectItem value="latest" className="py-3 text-[15px]">
                  최신순
                </CustomSelectItem>
                <CustomSelectItem value="amount" className="py-3 text-[15px]">
                  금액순
                </CustomSelectItem>
              </CustomSelectContent>
            </CustomSelect>
          </div>
        </div>

        {/* History Cards */}
        <ul className="space-y-4">
          {recentSalaryHistory.map((item, idx) => {
            const salaryData =
              typeof item.salary === 'object'
                ? item.salary
                : { net_pay: item.salary, base_pay: 0, total_deductions: 0, work_days: 0 }
            const netPay = salaryData.net_pay || 0
            // Estimate tax if not available or use 0
            const tax =
              salaryData.total_deductions || Math.floor((salaryData.base_pay || netPay) * 0.033)

            return (
              <li
                key={`${item.label}-${idx}`}
                className="bg-white p-6 rounded-[16px] border border-[#e6ecf4] shadow-sm space-y-4"
              >
                {/* Header: Month & Badge */}
                <div className="flex justify-between items-center">
                  <span className="text-[18px] font-extrabold text-[#1a254f]">{item.label}</span>
                  <span className="text-[13px] font-semibold px-2.5 py-1 rounded-full border bg-slate-50 text-slate-600 border-slate-200">
                    지급완료
                  </span>
                </div>

                {/* Net Pay Row */}
                <div className="flex justify-between items-center pb-4 border-b border-dashed border-[#e6ecf4]">
                  <span className="font-bold text-[#1a254f]">실수령액</span>
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-[20px] font-black text-[#1a254f] tracking-tight">
                      {showSalary ? netPay.toLocaleString() : '••••'}
                    </span>
                    <span className="text-[15px] font-bold text-[#1a254f]">원</span>
                  </div>
                </div>

                {/* Details Rows */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[15px]">
                    <span className="font-bold text-[#1a254f]">공수</span>
                    <span className="font-semibold text-[#1a254f] text-[16px]">
                      {formatManDays(
                        salaryData.total_labor_hours
                          ? salaryData.total_labor_hours / 8
                          : item.manDays || 0
                      )}
                    </span>
                  </div>
                  {/* Unit Price (Hidden if not available easily or privacy) - money2.html shows it */}
                  <div className="flex justify-between items-center text-[15px]">
                    <span className="font-bold text-[#1a254f]">공제 (3.3%)</span>
                    <span className="font-semibold text-[#ef4444] text-[16px]">
                      {showSalary ? `-${tax.toLocaleString()}` : '••••'}
                    </span>
                  </div>
                </div>

                {/* View Detail Button */}
                <button
                  onClick={() => {
                    // Extract year/month from label "2024년 1월" or use item properties if available
                    let year = '',
                      month = ''
                    if (item.label) {
                      const parts = item.label.split('년 ')
                      if (parts.length === 2) {
                        year = parts[0]
                        month = parts[1].replace('월', '')
                      }
                    }
                    if (year && month) {
                      window.open(`/api/salary/paystub?year=${year}&month=${month}`, '_blank')
                    } else {
                      alert('명세서 정보를 찾을 수 없습니다.')
                    }
                  }}
                  className="w-full py-3 rounded-[10px] bg-[#f1f5f9] text-[#64748b] font-bold text-[15px] hover:bg-[#e2e8f0] transition-colors mt-2 cursor-pointer"
                >
                  급여명세서 조회
                </button>
              </li>
            )
          })}

          {recentSalaryHistory.length === 0 && (
            <li className="py-12 text-center text-[14px] text-[#94a3b8]">내역이 없습니다.</li>
          )}
        </ul>

        {/* Load More Button */}
        <button
          onClick={() => setShowAllSalaryHistory(!showAllSalaryHistory)}
          className="w-full h-[50px] bg-white border border-[#e6ecf4] rounded-full text-[#64748b] font-semibold text-[15px] flex items-center justify-center gap-1 mt-6 hover:bg-[#f8fafc] transition-colors"
        >
          <span>{showAllSalaryHistory ? '접기' : '더 보기'}</span>
          <ChevronRight
            size={16}
            className={`transform transition-transform ${showAllSalaryHistory ? '-rotate-90' : 'rotate-90'}`}
          />
        </button>
      </div>
    </div>
  )
}
