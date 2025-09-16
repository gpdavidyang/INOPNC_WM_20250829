'use client'

import React, { useState, useEffect } from 'react'
import { Calculator, User, Users, Calendar } from 'lucide-react'

interface Worker {
  id: string
  name: string
  position: string
}

interface SalaryCalculatorProps {
  selectedMonth: number
  selectedYear: number
  workerType: 'individual' | 'all'
  selectedWorker: string
  employmentType: 'freelance' | 'daily' | 'regular'
  customTaxRate: string
  basePay: number
  onMonthChange: (month: number) => void
  onYearChange: (year: number) => void
  onWorkerTypeChange: (type: 'individual' | 'all') => void
  onWorkerChange: (workerId: string) => void
  onEmploymentTypeChange: (type: 'freelance' | 'daily' | 'regular') => void
  onCustomTaxRateChange: (rate: string) => void
  onBasePayChange: (pay: number) => void
  onCalculate: () => void
}

export default function SalaryCalculator({
  selectedMonth,
  selectedYear,
  workerType,
  selectedWorker,
  employmentType,
  customTaxRate,
  basePay,
  onMonthChange,
  onYearChange,
  onWorkerTypeChange,
  onWorkerChange,
  onEmploymentTypeChange,
  onCustomTaxRateChange,
  onBasePayChange,
  onCalculate,
}: SalaryCalculatorProps) {
  const [workers, setWorkers] = useState<Worker[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchWorkers()
  }, [])

  const fetchWorkers = async () => {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/workers')
      // const data = await response.json()

      // Mock data for now
      const mockWorkers: Worker[] = [
        { id: 'worker1', name: '홍길동', position: '기술자' },
        { id: 'worker2', name: '김철수', position: '반장' },
        { id: 'worker3', name: '이영희', position: '작업자' },
        { id: 'worker4', name: '박민수', position: '기술자' },
      ]

      setWorkers(mockWorkers)
    } catch (error) {
      console.error('Failed to fetch workers:', error)
    }
  }

  const months = [
    '1월',
    '2월',
    '3월',
    '4월',
    '5월',
    '6월',
    '7월',
    '8월',
    '9월',
    '10월',
    '11월',
    '12월',
  ]

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i)

  return (
    <div className="space-y-4">
      {/* Base pay display */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">기본 일당</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">관리자 설정 기준</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {basePay.toLocaleString()}원
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">8시간 기준</p>
          </div>
        </div>
      </div>

      {/* Employment type selection */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <h3 className="font-medium text-gray-900 dark:text-white mb-3">고용 형태</h3>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => onEmploymentTypeChange('freelance')}
            className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
              employmentType === 'freelance'
                ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-600 dark:text-blue-400'
                : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
            }`}
          >
            프리랜서
          </button>
          <button
            onClick={() => onEmploymentTypeChange('daily')}
            className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
              employmentType === 'daily'
                ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-600 dark:text-blue-400'
                : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
            }`}
          >
            일용직
          </button>
          <button
            onClick={() => onEmploymentTypeChange('regular')}
            className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
              employmentType === 'regular'
                ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-600 dark:text-blue-400'
                : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
            }`}
          >
            정규직
          </button>
        </div>

        {/* Tax rate display/input based on employment type */}
        <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {employmentType === 'freelance' && <div>세율: 3.3% (고정)</div>}
            {employmentType === 'daily' && <div>세율: 6% (고정)</div>}
            {employmentType === 'regular' && (
              <div className="space-y-2">
                <label className="block">세율 직접 입력 (%)</label>
                <input
                  type="number"
                  value={customTaxRate}
                  onChange={e => onCustomTaxRateChange(e.target.value)}
                  step="0.01"
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="예: 15.42"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Period selection */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h3 className="font-medium text-gray-900 dark:text-white">급여 계산 기간</h3>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">년도</label>
            <select
              value={selectedYear}
              onChange={e => onYearChange(Number(e.target.value))}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {years.map(year => (
                <option key={year} value={year}>
                  {year}년
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">월</label>
            <select
              value={selectedMonth}
              onChange={e => onMonthChange(Number(e.target.value))}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {months.map((month, index) => (
                <option key={index} value={index + 1}>
                  {month}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Worker selection */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <h3 className="font-medium text-gray-900 dark:text-white mb-3">대상 선택</h3>

        <div className="space-y-3">
          <div className="flex gap-3">
            <button
              onClick={() => onWorkerTypeChange('individual')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-colors ${
                workerType === 'individual'
                  ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
              }`}
            >
              <User className="w-4 h-4" />
              <span className="font-medium">개인</span>
            </button>

            <button
              onClick={() => onWorkerTypeChange('all')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-colors ${
                workerType === 'all'
                  ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
              }`}
            >
              <Users className="w-4 h-4" />
              <span className="font-medium">전체</span>
            </button>
          </div>

          {workerType === 'individual' && (
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                작업자 선택
              </label>
              <select
                value={selectedWorker}
                onChange={e => onWorkerChange(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">작업자를 선택하세요</option>
                {workers.map(worker => (
                  <option key={worker.id} value={worker.id}>
                    {worker.name} ({worker.position})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Calculate button */}
      <button
        onClick={onCalculate}
        disabled={workerType === 'individual' && !selectedWorker}
        className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
          workerType === 'individual' && !selectedWorker
            ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        <Calculator className="w-5 h-5" />
        급여 계산하기
      </button>
    </div>
  )
}
