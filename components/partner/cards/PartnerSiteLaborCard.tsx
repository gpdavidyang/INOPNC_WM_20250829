'use client'

import React from 'react'
import { Clock, MapPin, TrendingUp } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface SiteLaborData {
  id: string
  name: string
  address: string
  totalLaborHours: number
  averageDailyHours: number
  recentWorkDate: string
  recentDailyHours: number
  status: 'active' | 'inactive' | 'completed'
  contractValue?: number
}

interface PartnerSiteLaborCardProps {
  site: SiteLaborData
  onClick: () => void
}

export default function PartnerSiteLaborCard({ site, onClick }: PartnerSiteLaborCardProps) {
  const formatHours = (hours: number) => {
    if (hours >= 1000) {
      return `${(hours / 1000).toFixed(1)}k시간`
    }
    return `${hours.toFixed(0)}시간`
  }

  const formatCurrency = (amount: number) => {
    if (amount >= 100000000) {
      return `${(amount / 100000000).toFixed(1)}억`
    }
    return `${(amount / 10000).toFixed(0)}만원`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'inactive': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
      case 'completed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return '진행중'
      case 'inactive': return '중단'
      case 'completed': return '완료'
      default: return status
    }
  }

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-all duration-200 border border-gray-200 dark:border-gray-700"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {site.name}
                </h3>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {site.address}
              </p>
            </div>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(site.status)}`}>
              {getStatusLabel(site.status)}
            </span>
          </div>

          {/* Labor Hours Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2">
              <div className="flex items-center gap-1 mb-1">
                <Clock className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                <span className="text-xs text-blue-700 dark:text-blue-300">이번달 공수</span>
              </div>
              <p className="text-sm font-bold text-blue-900 dark:text-blue-100">
                {formatHours(site.totalLaborHours)}
              </p>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2">
              <div className="flex items-center gap-1 mb-1">
                <TrendingUp className="h-3 w-3 text-green-600 dark:text-green-400" />
                <span className="text-xs text-green-700 dark:text-green-300">평균/일</span>
              </div>
              <p className="text-sm font-bold text-green-900 dark:text-green-100">
                {site.averageDailyHours.toFixed(0)}시간
              </p>
            </div>
          </div>

          {/* Recent Work Info */}
          <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>최근작업: {new Date(site.recentWorkDate).toLocaleDateString('ko-KR')}</span>
              <span className="font-medium">{site.recentDailyHours}시간</span>
            </div>
            {site.contractValue && (
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>계약금액:</span>
                <span className="font-medium">{formatCurrency(site.contractValue)}</span>
              </div>
            )}
          </div>

          {/* View Details Button */}
          <div className="text-right">
            <span className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
              상세보기 →
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}