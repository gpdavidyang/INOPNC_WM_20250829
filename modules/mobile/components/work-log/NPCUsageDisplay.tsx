'use client'

import React, { useState, useEffect } from 'react'
import { SelectedMaterial } from './MaterialSelector'

interface NPCUsageStats {
  daily: {
    totalCost: number
    materialCount: number
    topMaterial: string
  }
  weekly: {
    totalCost: number
    materialCount: number
    avgDaily: number
  }
  monthly: {
    totalCost: number
    materialCount: number
    avgDaily: number
  }
}

interface NPCUsageDisplayProps {
  currentMaterials: SelectedMaterial[]
  showStats?: boolean
  className?: string
}

export const NPCUsageDisplay: React.FC<NPCUsageDisplayProps> = ({
  currentMaterials,
  showStats = true,
  className = '',
}) => {
  const [stats, setStats] = useState<NPCUsageStats | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'monthly'>('daily')

  // Calculate current day totals
  const currentTotal = currentMaterials.reduce((sum, material) => sum + material.totalPrice, 0)
  const currentCount = currentMaterials.length

  // Load usage statistics (mock implementation)
  useEffect(() => {
    if (!showStats) return

    const loadStats = async () => {
      setIsLoading(true)
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Mock data - in real app, this would come from API
      const mockStats: NPCUsageStats = {
        daily: {
          totalCost: currentTotal,
          materialCount: currentCount,
          topMaterial: currentMaterials.length > 0 ? currentMaterials[0].name : '없음',
        },
        weekly: {
          totalCost: currentTotal * 5.2, // Average working days
          materialCount: currentCount * 3,
          avgDaily: currentTotal,
        },
        monthly: {
          totalCost: currentTotal * 22, // Average working days per month
          materialCount: currentCount * 12,
          avgDaily: currentTotal,
        },
      }
      
      setStats(mockStats)
      setIsLoading(false)
    }

    loadStats()
  }, [currentMaterials, currentTotal, currentCount, showStats])

  // Get material category distribution
  const getCategoryDistribution = () => {
    const distribution = currentMaterials.reduce((acc, material) => {
      const category = material.category
      if (!acc[category]) {
        acc[category] = { count: 0, total: 0 }
      }
      acc[category].count += 1
      acc[category].total += material.totalPrice
      return acc
    }, {} as Record<string, { count: number; total: number }>)

    return Object.entries(distribution).map(([category, data]) => ({
      category,
      count: data.count,
      total: data.total,
      percentage: (data.total / currentTotal) * 100,
    }))
  }

  const categoryLabels = {
    concrete: '콘크리트',
    steel: '철골/철근', 
    form: '거푸집',
    misc: '기타자재',
  }

  const categoryColors = {
    concrete: '#0068FE',
    steel: '#9aa3b2',
    form: '#2563eb', 
    misc: '#667085',
  }

  if (!showStats) {
    return (
      <div className={`npc-usage-summary ${className}`}>
        <div className="bg-[var(--card)] rounded-lg p-4 border border-[var(--line)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-[var(--num)] bg-opacity-10 rounded-full flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--num)" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                  <path d="m2 17 10 5 10-5"/>
                  <path d="m2 12 10 5 10-5"/>
                </svg>
              </div>
              <span className="font-medium text-[var(--text)]">자재 사용량</span>
            </div>
            
            <div className="text-right">
              <p className="text-sm text-[var(--muted)]">{currentCount}개 항목</p>
              <p className="font-bold text-[var(--num)]">
                {currentTotal.toLocaleString()}원
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`npc-usage-display ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-6 h-6 bg-[var(--num)] bg-opacity-10 rounded-full flex items-center justify-center">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--num)" strokeWidth="2">
            <line x1="12" y1="1" x2="12" y2="23"/>
            <path d="m17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
        </div>
        <h3 className="text-base font-bold text-[var(--text)]">NPC-1000 사용현황</h3>
      </div>

      {/* Tab Navigation */}
      <div className="flex bg-[var(--bg)] rounded-lg p-1 mb-4">
        {(['daily', 'weekly', 'monthly'] as const).map(tab => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === tab
                ? 'bg-[var(--card)] text-[var(--text)] shadow-sm'
                : 'text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            {tab === 'daily' && '일간'}
            {tab === 'weekly' && '주간'} 
            {tab === 'monthly' && '월간'}
          </button>
        ))}
      </div>

      {/* Statistics */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[var(--num)] border-t-transparent" />
        </div>
      ) : stats ? (
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[var(--card)] rounded-lg p-4 border border-[var(--line)]">
              <div className="text-center">
                <p className="text-2xl font-bold text-[var(--num)]">
                  {stats[activeTab].totalCost.toLocaleString()}
                </p>
                <p className="text-sm text-[var(--muted)]">총 자재비 (원)</p>
              </div>
            </div>
            
            <div className="bg-[var(--card)] rounded-lg p-4 border border-[var(--line)]">
              <div className="text-center">
                <p className="text-2xl font-bold text-[var(--text)]">
                  {stats[activeTab].materialCount}
                </p>
                <p className="text-sm text-[var(--muted)]">사용 자재수</p>
              </div>
            </div>
          </div>

          {/* Category Distribution */}
          {currentMaterials.length > 0 && (
            <div className="bg-[var(--card)] rounded-lg p-4 border border-[var(--line)]">
              <h4 className="font-medium text-[var(--text)] mb-3">자재 분포</h4>
              
              <div className="space-y-3">
                {getCategoryDistribution().map(item => (
                  <div key={item.category} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: categoryColors[item.category as keyof typeof categoryColors] }}
                      />
                      <span className="text-sm text-[var(--text)]">
                        {categoryLabels[item.category as keyof typeof categoryLabels]}
                      </span>
                      <span className="text-xs text-[var(--muted)]">
                        ({item.count}개)
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[var(--text)]">
                        {item.total.toLocaleString()}원
                      </span>
                      <span className="text-xs text-[var(--muted)]">
                        ({item.percentage.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Visual Bar Chart */}
              <div className="mt-4">
                <div className="flex h-2 bg-[var(--line)] rounded-full overflow-hidden">
                  {getCategoryDistribution().map(item => (
                    <div
                      key={item.category}
                      className="h-full transition-all duration-300"
                      style={{
                        width: `${item.percentage}%`,
                        backgroundColor: categoryColors[item.category as keyof typeof categoryColors],
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Daily Average (for weekly/monthly) */}
          {(activeTab === 'weekly' || activeTab === 'monthly') && (
            <div className="bg-[var(--bg)] rounded-lg p-4 border border-[var(--line)]">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--muted)]">일 평균 사용량</span>
                <span className="font-medium text-[var(--text)]">
                  {stats[activeTab].avgDaily.toLocaleString()}원
                </span>
              </div>
            </div>
          )}

          {/* Top Material */}
          {stats[activeTab].topMaterial && stats[activeTab].topMaterial !== '없음' && (
            <div className="bg-[var(--ok-bg)] rounded-lg p-4 border border-[var(--ok)]">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-[var(--ok)] bg-opacity-20 rounded-full flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ok)" strokeWidth="2">
                    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-[var(--ok)]">최다 사용 자재</p>
                  <p className="font-medium text-[var(--text)]">
                    {stats[activeTab].topMaterial}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-[var(--muted)]">통계 데이터를 불러올 수 없습니다</p>
        </div>
      )}
    </div>
  )
}