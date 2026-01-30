import React, { useState } from 'react'
import { Eye, EyeOff, ChevronDown } from 'lucide-react'
import { SALARY_HISTORY } from '@inopnc/shared'

interface SalaryPageProps {
  isPrivacyOn: boolean
  setIsPrivacyOn: React.Dispatch<React.SetStateAction<boolean>>
  selectedPayStub: (typeof SALARY_HISTORY)[0] | null
  setSelectedPayStub: React.Dispatch<React.SetStateAction<(typeof SALARY_HISTORY)[0] | null>>
  isPayStubOpen: boolean
  setIsPayStubOpen: React.Dispatch<React.SetStateAction<boolean>>
}

const SalaryPage: React.FC<SalaryPageProps> = ({
  isPrivacyOn,
  setIsPrivacyOn,
  selectedPayStub,
  setSelectedPayStub,
  isPayStubOpen,
  setIsPayStubOpen,
}) => {
  const [salHistoryExpanded, setSalHistoryExpanded] = useState(false)
  const [salDateFilter, setSalDateFilter] = useState('all')
  const [currentYear, setCurrentYear] = useState(2025)
  const [currentMonth, setCurrentMonth] = useState(12)

  // Get current month data
  const currentMonthData =
    SALARY_HISTORY.find(
      item =>
        item.year === currentYear &&
        item.rawDate === `${currentYear}-${currentMonth.toString().padStart(2, '0')}`
    ) || SALARY_HISTORY[0]

  // Filter salary history
  const filteredHistory = SALARY_HISTORY.filter(item => {
    if (salDateFilter === 'all') return true
    return `${item.year}-${item.month.toString().padStart(2, '0')}` === salDateFilter
  })

  // Handle pay stub opening
  const handleOpenPayStub = (item: (typeof SALARY_HISTORY)[0]) => {
    setSelectedPayStub(item)
    setIsPayStubOpen(true)
  }

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <span className="text-xl font-bold text-[var(--header-navy)] font-main">
          이번 달 지급 대기
        </span>
        <button
          onClick={() => setIsPrivacyOn(!isPrivacyOn)}
          className="bg-transparent border-none flex items-center gap-1 cursor-pointer text-[var(--text-sub)] text-[15px] font-semibold p-0"
        >
          <span>금액 보기/숨기기</span>
          {isPrivacyOn ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>

      {/* Current Salary Card */}
      <div className="bg-[var(--bg-surface)] shadow-[var(--shadow-soft)] rounded-2xl p-[24px_20px] mb-6 border border-[var(--border)]">
        <div className="flex justify-between items-center mb-4">
          <span className="text-lg font-extrabold text-[var(--text-main)]">
            {currentYear}년 {currentMonth}월
          </span>
          <span className="text-[13px] font-semibold px-2.5 py-1 rounded-full border bg-[var(--st-ing-bg)] text-white border-[var(--st-ing-border)]">
            지급대기
          </span>
        </div>

        <div className="flex justify-between items-center mb-3.5 pb-3.5 border-b border-dashed border-[var(--border)] gap-2 flex-nowrap">
          <span className="font-bold text-[var(--text-main)] shrink-0">실수령 예정액</span>
          <div className="flex items-baseline justify-end gap-0.5 whitespace-nowrap shrink flex-nowrap">
            <span className="text-[24px] text-[var(--text-main)] font-extrabold tracking-tighter whitespace-nowrap">
              {isPrivacyOn ? '****' : currentMonthData.netPay.toLocaleString()}
            </span>
            <span className="text-base font-semibold text-[var(--text-main)]">원</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex justify-between items-center">
            <span className="text-[13px] font-semibold text-[var(--text-sub)]">총액</span>
            <span className="text-[13px] font-semibold text-[var(--text-main)]">
              {isPrivacyOn ? '****' : currentMonthData.grossPay.toLocaleString()}원
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[13px] font-semibold text-[var(--text-sub)]">공제</span>
            <span className="text-[13px] font-semibold text-[var(--text-main)]">
              {isPrivacyOn ? '****' : currentMonthData.deductions.toLocaleString()}원
            </span>
          </div>
        </div>
      </div>

      {/* Salary History */}
      <div className="bg-[var(--bg-surface)] shadow-[var(--shadow-soft)] rounded-2xl p-[20px] border border-[var(--border)]">
        <div className="flex justify-between items-center mb-4">
          <span className="text-lg font-extrabold text-[var(--text-main)]">급여 기록</span>
          <button
            onClick={() => setSalHistoryExpanded(!salHistoryExpanded)}
            className="bg-transparent border-none flex items-center gap-1 cursor-pointer text-[var(--text-sub)] text-[15px] font-semibold p-0"
          >
            <span>{salHistoryExpanded ? '접기' : '더보기'}</span>
            <ChevronDown
              size={16}
              className={`transition-transform ${salHistoryExpanded ? 'rotate-180' : ''}`}
            />
          </button>
        </div>

        {/* Date Filter */}
        <div className="relative w-full mb-4">
          <select
            className="appearance-none w-full h-[54px] bg-white border border-[#e2e8f0] rounded-xl px-[18px] pr-[40px] font-main text-[17px] font-semibold text-[#111111] hover:border-[#cbd5e1] focus:border-primary focus:shadow-[0_0_0_3px_rgba(49,163,250,0.15)] dark:bg-[#0f172a] dark:border-[#334155] dark:text-white"
            value={salDateFilter}
            onChange={e => setSalDateFilter(e.target.value)}
          >
            <option value="all">전체</option>
            <option value="2025-12">2025년 12월</option>
            <option value="2025-11">2025년 11월</option>
            <option value="2025-10">2025년 10월</option>
          </select>
          <ChevronDown
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#333333] pointer-events-none dark:text-[#94a3b8]"
            size={20}
          />
        </div>

        {/* History List */}
        <div className="space-y-3">
          {filteredHistory
            .slice(0, salHistoryExpanded ? filteredHistory.length : 3)
            .map((item, index) => (
              <div
                key={index}
                className="flex justify-between items-center p-3 bg-white rounded-xl border border-[var(--border)] cursor-pointer hover:bg-[var(--bg-hover)] transition-colors"
                onClick={() => handleOpenPayStub(item)}
              >
                <div>
                  <span className="text-sm font-semibold text-[var(--text-main)]">
                    {item.year}년 {item.month}월
                  </span>
                  <span className="ml-2 text-xs px-2 py-1 rounded-full bg-[var(--st-done-bg)] text-white border border-[var(--st-done-border)]">
                    지급완료
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-[var(--text-main)]">
                    {isPrivacyOn ? '****' : item.netPay.toLocaleString()}원
                  </span>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}

export default SalaryPage
