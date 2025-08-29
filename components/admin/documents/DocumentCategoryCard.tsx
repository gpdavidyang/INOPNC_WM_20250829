'use client'

import { DocumentCategory } from '@/types'
import { LucideIcon } from 'lucide-react'

interface DocumentCategoryCardProps {
  category: DocumentCategory
  icon: LucideIcon
  color: string
  documentCount: number
  onClick: () => void
}

export default function DocumentCategoryCard({ 
  category, 
  icon: Icon, 
  color, 
  documentCount, 
  onClick 
}: DocumentCategoryCardProps) {
  const getColorClasses = (color: string) => {
    const colorMap: Record<string, { bg: string, text: string, border: string, icon: string }> = {
      blue: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-900 dark:text-blue-100', border: 'border-blue-200 dark:border-blue-800', icon: 'text-blue-600 dark:text-blue-400' },
      green: { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-900 dark:text-green-100', border: 'border-green-200 dark:border-green-800', icon: 'text-green-600 dark:text-green-400' },
      purple: { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-900 dark:text-purple-100', border: 'border-purple-200 dark:border-purple-800', icon: 'text-purple-600 dark:text-purple-400' },
      red: { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-900 dark:text-red-100', border: 'border-red-200 dark:border-red-800', icon: 'text-red-600 dark:text-red-400' },
      orange: { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-900 dark:text-orange-100', border: 'border-orange-200 dark:border-orange-800', icon: 'text-orange-600 dark:text-orange-400' },
      yellow: { bg: 'bg-yellow-50 dark:bg-yellow-900/20', text: 'text-yellow-900 dark:text-yellow-100', border: 'border-yellow-200 dark:border-yellow-800', icon: 'text-yellow-600 dark:text-yellow-400' },
      gray: { bg: 'bg-gray-50 dark:bg-gray-900/20', text: 'text-gray-900 dark:text-gray-100', border: 'border-gray-200 dark:border-gray-800', icon: 'text-gray-600 dark:text-gray-400' }
    }
    return colorMap[color] || colorMap.gray
  }

  const colors = getColorClasses(color)

  return (
    <div
      onClick={onClick}
      className={`${colors.bg} ${colors.border} border rounded-lg p-6 cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <Icon className={`h-6 w-6 ${colors.icon}`} />
            <h3 className={`text-lg font-semibold ${colors.text}`}>
              {category.display_name}
            </h3>
          </div>
          
          {category.description && (
            <p className={`text-sm ${colors.text} opacity-80 mb-3`}>
              {category.description}
            </p>
          )}
          
          <div className="flex items-center justify-between">
            <span className={`text-2xl font-bold ${colors.text}`}>
              {documentCount}
            </span>
            <span className={`text-sm ${colors.text} opacity-70`}>
              문서
            </span>
          </div>
        </div>
      </div>
      
      <div className={`mt-4 pt-4 border-t ${colors.border}`}>
        <div className="flex items-center justify-between">
          <span className={`text-xs font-medium ${colors.text} opacity-70`}>
            카테고리 보기
          </span>
          <svg 
            className={`h-4 w-4 ${colors.icon}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </div>
  )
}