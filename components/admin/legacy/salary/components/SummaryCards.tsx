'use client'


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
      value: `${totalWorkers || 0}명`,
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      title: '총 공수',
      value: `${(totalManhours || 0).toFixed(1)}`,
      icon: Calculator,
      color: 'bg-green-500'
    },
    {
      title: '총 급여',
      value: `₩${formatNumber(totalSalary || 0)}`,
      icon: DollarSign,
      color: 'bg-purple-500'
    },
    {
      title: '평균 급여',
      value: `₩${formatNumber(Math.round(averageSalary || 0))}`,
      icon: Calendar,
      color: 'bg-orange-500'
    }
  ]

  return (
    <div className="grid grid-cols-4 gap-3 sm:gap-4 relative z-0">
      {cards.map((card, index) => {
        const Icon = card.icon
        return (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-4 relative z-0"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                  {card.title}
                </p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {card.value}
                </p>
              </div>
              <div className={`${card.color} p-2 sm:p-3 rounded-lg bg-opacity-10 mt-2 sm:mt-0 self-start sm:self-auto`}>
                <Icon className={`h-4 w-4 sm:h-6 sm:w-6 ${card.color.replace('bg-', 'text-')}`} />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}