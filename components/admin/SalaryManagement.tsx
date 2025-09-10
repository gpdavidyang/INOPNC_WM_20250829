'use client'

import { useState } from 'react'
import { Profile } from '@/types'
import DailySalaryCalculation from './salary/DailySalaryCalculation'
import IndividualMonthlySalary from './salary/IndividualMonthlySalary'
import SalaryStatementManager from './salary/SalaryStatementManager'
import IndividualSalarySettings from './salary/IndividualSalarySettings'
import SalaryStatsDashboard from './salary/SalaryStatsDashboard'

interface SalaryManagementProps {
  profile: Profile
}

export default function SalaryManagement({ profile }: SalaryManagementProps) {
  const [activeTab, setActiveTab] = useState<'daily' | 'monthly' | 'statements' | 'settings' | 'stats'>('daily')

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('daily')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'daily'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            출력일보 급여계산
          </button>
          <button
            onClick={() => setActiveTab('monthly')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'monthly'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            개인별 월급여계산
          </button>
          <button
            onClick={() => setActiveTab('statements')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'statements'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            급여명세서 생성 및 보관
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'settings'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            개인별 급여기준 설정
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'stats'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            급여 통계 대시보드
          </button>
        </nav>
      </div>

      {/* Daily Salary Calculation Tab */}
      {activeTab === 'daily' && (
        <DailySalaryCalculation />
      )}

      {/* Individual Monthly Salary Tab */}
      {activeTab === 'monthly' && (
        <IndividualMonthlySalary />
      )}

      {/* Salary Statement Manager Tab */}
      {activeTab === 'statements' && (
        <SalaryStatementManager />
      )}

      {/* Individual Salary Settings Tab */}
      {activeTab === 'settings' && (
        <IndividualSalarySettings />
      )}

      {/* Salary Stats Dashboard Tab */}
      {activeTab === 'stats' && (
        <SalaryStatsDashboard />
      )}

    </div>
  )
}