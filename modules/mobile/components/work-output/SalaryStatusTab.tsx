'use client'

import React, { useState, useEffect } from 'react'
import {
  Download,
  Printer,
  FileText,
  Users,
  User,
  Save,
  Share2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import SalaryCalculator from './SalaryCalculator'
import PayslipGenerator from './PayslipGenerator'

export default function SalaryStatusTab() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [workerType, setWorkerType] = useState<'individual' | 'all'>('individual')
  const [selectedWorker, setSelectedWorker] = useState<string>('')
  const [employmentType, setEmploymentType] = useState<'freelance' | 'daily' | 'regular'>(
    'freelance'
  )
  const [customTaxRate, setCustomTaxRate] = useState<string>('15.42')
  const [basePay, setBasePay] = useState<number>(130000)
  const [salaryData, setSalaryData] = useState<any>(null)
  const [showPayslip, setShowPayslip] = useState(false)
  const [zoomLevel, setZoomLevel] = useState<number>(100)

  // Load base pay from admin settings on mount
  useEffect(() => {
    const loadBasePay = () => {
      try {
        const savedBasePay = localStorage.getItem('adminBasePay')
        if (savedBasePay) {
          setBasePay(parseInt(savedBasePay))
        } else {
          setBasePay(130000) // Default: 130,000원
        }
      } catch (error) {
        console.error('Failed to load base pay:', error)
        setBasePay(130000)
      }
    }

    loadBasePay()
  }, [])

  const handleCalculateSalary = async () => {
    try {
      // Calculate tax rate based on employment type
      let taxRate = 0
      if (employmentType === 'freelance') {
        taxRate = 3.3
      } else if (employmentType === 'daily') {
        taxRate = 6
      } else if (employmentType === 'regular') {
        taxRate = parseFloat(customTaxRate) || 15.42
      }

      // TODO: Replace with actual API call
      // const response = await fetch('/api/salary/calculate', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     month: selectedMonth,
      //     year: selectedYear,
      //     workerType,
      //     workerId: selectedWorker,
      //     employmentType,
      //     taxRate
      //   })
      // })
      // const data = await response.json()

      // Calculate salary using base pay from admin settings
      const workDays = 22 // TODO: Get actual work days from API
      const workHours = workDays * 8
      const overtimeHours = 20 // TODO: Get actual overtime from API

      const basicSalary = basePay * workDays
      const overtimePay = Math.round((basePay / 8) * 1.5 * overtimeHours)
      const allowances = 200000 // TODO: Get from API
      const totalEarnings = basicSalary + overtimePay + allowances

      // Calculate deductions
      const tax = Math.round(totalEarnings * (taxRate / 100))
      const insurance = Math.round(totalEarnings * 0.0343) // 건강보험 3.43%
      const pension = Math.round(totalEarnings * 0.045) // 국민연금 4.5%
      const totalDeductions = tax + insurance + pension
      const netPay = totalEarnings - totalDeductions

      const mockSalaryData = {
        worker: {
          id: 'worker1',
          name: '홍길동',
          position: '기술자',
          department: '시공팀',
        },
        period: `${selectedYear}년 ${selectedMonth}월`,
        workDays,
        workHours,
        overtimeHours,
        basePay,
        basicSalary,
        overtimePay,
        allowances,
        totalEarnings,
        tax,
        insurance,
        pension,
        totalDeductions,
        netPay,
        employmentType,
        taxRate,
      }

      setSalaryData(mockSalaryData)
      setShowPayslip(true)
    } catch (error) {
      console.error('Failed to calculate salary:', error)
    }
  }

  const handleDownloadPDF = () => {
    if (!salaryData) return

    // Add title for PDF
    const originalTitle = document.title
    document.title = `급여명세서_${salaryData.worker.name}_${salaryData.period}`

    // Trigger PDF generation
    window.print()

    // Restore original title
    setTimeout(() => {
      document.title = originalTitle
    }, 100)
  }

  const handlePrint = () => {
    if (!salaryData) return

    // Add title for print
    const originalTitle = document.title
    document.title = `급여명세서_${salaryData.worker.name}_${salaryData.period}`

    // Trigger print
    window.print()

    // Restore original title
    setTimeout(() => {
      document.title = originalTitle
    }, 100)
  }

  const handleSaveToDevice = () => {
    if (!salaryData) return

    // Generate JSON data for saving
    const dataStr = JSON.stringify(salaryData, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr)

    const exportFileDefaultName = `급여명세서_${salaryData.worker.name}_${salaryData.period}.json`

    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  const handleShare = async () => {
    if (!salaryData) return

    const shareData = {
      title: `급여명세서 - ${salaryData.worker.name}`,
      text: `${salaryData.period} 급여명세서\n실지급액: ₩${salaryData.netPay.toLocaleString()}`,
    }

    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData)
      } else {
        // Fallback to copying to clipboard
        const text = `${shareData.title}\n${shareData.text}`
        await navigator.clipboard.writeText(text)
        alert('급여명세서 정보가 클립보드에 복사되었습니다.')
      }
    } catch (error) {
      console.error('Error sharing:', error)
    }
  }

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 25, 200))
  }

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 25, 50))
  }

  const handleResetZoom = () => {
    setZoomLevel(100)
  }

  return (
    <div className="space-y-4">
      {!showPayslip ? (
        <>
          {/* Salary calculation form */}
          <SalaryCalculator
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            workerType={workerType}
            selectedWorker={selectedWorker}
            employmentType={employmentType}
            customTaxRate={customTaxRate}
            basePay={basePay}
            onMonthChange={setSelectedMonth}
            onYearChange={setSelectedYear}
            onWorkerTypeChange={setWorkerType}
            onWorkerChange={setSelectedWorker}
            onEmploymentTypeChange={setEmploymentType}
            onCustomTaxRateChange={setCustomTaxRate}
            onBasePayChange={setBasePay}
            onCalculate={handleCalculateSalary}
          />
        </>
      ) : (
        <>
          {/* Payslip preview and actions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">급여명세서</h3>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setShowPayslip(false)}
                  className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors no-print"
                >
                  돌아가기
                </button>

                {/* Zoom controls */}
                <div className="flex items-center gap-1 no-print">
                  <button
                    onClick={handleZoomOut}
                    disabled={zoomLevel <= 50}
                    className={`p-2 rounded-lg transition-colors ${
                      zoomLevel <= 50
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                    title="축소"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleResetZoom}
                    className="px-3 py-2 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors min-w-[60px]"
                    title="원본 크기"
                  >
                    {zoomLevel}%
                  </button>
                  <button
                    onClick={handleZoomIn}
                    disabled={zoomLevel >= 200}
                    className={`p-2 rounded-lg transition-colors ${
                      zoomLevel >= 200
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                    title="확대"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={handleDownloadPDF}
                  className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors no-print"
                  title="PDF로 다운로드"
                >
                  <Download className="w-4 h-4" />
                  PDF
                </button>
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors no-print"
                  title="인쇄하기"
                >
                  <Printer className="w-4 h-4" />
                  인쇄
                </button>
                <button
                  onClick={handleSaveToDevice}
                  className="flex items-center gap-2 px-3 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors no-print"
                  title="데이터 저장"
                >
                  <Save className="w-4 h-4" />
                  저장
                </button>
                <button
                  onClick={handleShare}
                  className="flex items-center gap-2 px-3 py-2 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors no-print"
                  title="공유하기"
                >
                  <Share2 className="w-4 h-4" />
                  공유
                </button>
              </div>
            </div>

            <PayslipGenerator salaryData={salaryData} zoomLevel={zoomLevel} />
          </div>
        </>
      )}
    </div>
  )
}
