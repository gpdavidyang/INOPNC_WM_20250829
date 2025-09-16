'use client'

import React from 'react'

interface PayslipGeneratorProps {
  salaryData: {
    worker: {
      id: string
      name: string
      position: string
      department: string
    }
    period: string
    workDays: number
    workHours: number
    overtimeHours?: number
    basePay?: number
    basicSalary: number
    overtimePay: number
    allowances: number
    totalEarnings: number
    tax: number
    insurance: number
    pension: number
    totalDeductions: number
    netPay: number
    employmentType?: string
    taxRate?: number
  }
  zoomLevel?: number
}

export default function PayslipGenerator({ salaryData, zoomLevel = 100 }: PayslipGeneratorProps) {
  const formatCurrency = (amount: number) => {
    return `₩${amount.toLocaleString('ko-KR')}`
  }

  return (
    <>
      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #payslip-print-content,
          #payslip-print-content * {
            visibility: visible;
          }
          #payslip-print-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20mm;
            background: white;
            transform: none !important;
          }
          .no-print {
            display: none !important;
          }
          @page {
            size: A4;
            margin: 0;
          }
          .print-break-before {
            page-break-before: always;
          }
          .print-break-after {
            page-break-after: always;
          }
        }
      `}</style>

      <div
        className="bg-white dark:bg-gray-800 rounded-lg print:bg-white transition-transform duration-200 origin-top-left"
        id="payslip-print-content"
        style={{
          transform: `scale(${zoomLevel / 100})`,
          transformOrigin: 'top left',
        }}
      >
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 print:border-gray-200 pb-4 mb-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white print:text-gray-900 mb-2">
              급여명세서
            </h2>
            <p className="text-gray-600 dark:text-gray-400 print:text-gray-600">
              {salaryData.period}
            </p>
          </div>
        </div>

        {/* Worker Information */}
        <div className="bg-gray-50 dark:bg-gray-900 print:bg-gray-50 rounded-lg p-4 mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white print:text-gray-900 mb-3">
            직원 정보
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400 print:text-gray-600">성명:</span>
              <span className="ml-2 font-medium text-gray-900 dark:text-white print:text-gray-900">
                {salaryData.worker.name}
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400 print:text-gray-600">직위:</span>
              <span className="ml-2 font-medium text-gray-900 dark:text-white print:text-gray-900">
                {salaryData.worker.position}
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400 print:text-gray-600">부서:</span>
              <span className="ml-2 font-medium text-gray-900 dark:text-white print:text-gray-900">
                {salaryData.worker.department}
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400 print:text-gray-600">
                근무일수:
              </span>
              <span className="ml-2 font-medium text-gray-900 dark:text-white print:text-gray-900">
                {salaryData.workDays}일 ({salaryData.workHours}시간)
              </span>
            </div>
          </div>
        </div>

        {/* Earnings */}
        <div className="mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">지급 내역</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">기본급</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {formatCurrency(salaryData.basicSalary)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">연장근로수당</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {formatCurrency(salaryData.overtimePay)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">기타수당</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {formatCurrency(salaryData.allowances)}
              </span>
            </div>
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between">
                <span className="font-semibold text-gray-900 dark:text-white">지급액 합계</span>
                <span className="font-bold text-lg text-blue-600 dark:text-blue-400">
                  {formatCurrency(salaryData.totalEarnings)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Deductions */}
        <div className="mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">공제 내역</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">소득세</span>
              <span className="font-medium text-red-600 dark:text-red-400">
                -{formatCurrency(salaryData.tax)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">건강보험</span>
              <span className="font-medium text-red-600 dark:text-red-400">
                -{formatCurrency(salaryData.insurance)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">국민연금</span>
              <span className="font-medium text-red-600 dark:text-red-400">
                -{formatCurrency(salaryData.pension)}
              </span>
            </div>
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between">
                <span className="font-semibold text-gray-900 dark:text-white">공제액 합계</span>
                <span className="font-bold text-lg text-red-600 dark:text-red-400">
                  -{formatCurrency(salaryData.totalDeductions)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Net Pay */}
        <div className="bg-blue-50 dark:bg-blue-900/30 print:bg-blue-50 rounded-lg p-4 border border-blue-200 dark:border-blue-800 print:border-blue-200">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-gray-900 dark:text-white print:text-gray-900">
              실지급액
            </span>
            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400 print:text-blue-600">
              {formatCurrency(salaryData.netPay)}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 print:border-gray-200 text-center text-sm text-gray-500 dark:text-gray-400 print:text-gray-500">
          <p>본 급여명세서는 {new Date().toLocaleDateString('ko-KR')} 발행되었습니다.</p>
        </div>
      </div>
    </>
  )
}
