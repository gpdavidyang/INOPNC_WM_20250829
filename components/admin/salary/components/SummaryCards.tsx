'use client'

import { Users, Calculator, DollarSign, Calendar } from 'lucide-react'

interface SummaryCardsProps {
  totalWorkers: number
  totalManhours: number
  totalSalary: number
  averageSalary: number
}

export default function SummaryCards({
  totalWorkers,
  totalManhours,
  totalSalary,
  averageSalary
}: SummaryCardsProps) {
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ko-KR').format(num)
  }

  const cards = [
    {
      title: '총 작업자',
      value: `${totalWorkers}명`,
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      title: '총 공수',
      value: `${totalManhours.toFixed(1)}`,
      icon: Calculator,
      color: 'bg-green-500'
    },
    {
      title: '총 급여',
      value: `₩${formatNumber(totalSalary)}`,
      icon: DollarSign,
      color: 'bg-purple-500'
    },
    {
      title: '평균 급여',
      value: `₩${formatNumber(Math.round(averageSalary))}`,
      icon: Calendar,
      color: 'bg-orange-500'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon
        return (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {card.title}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {card.value}
                </p>
              </div>
              <div className={`${card.color} p-3 rounded-lg bg-opacity-10`}>
                <Icon className={`h-6 w-6 ${card.color.replace('bg-', 'text-')}`} />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}