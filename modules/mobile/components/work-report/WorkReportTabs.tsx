'use client'

import React from 'react'
import { WorkReportStatus } from './types'

interface WorkReportTabsProps {
  activeTab: WorkReportStatus
  onTabChange: (status: WorkReportStatus) => void
  draftCount?: number
  completedCount?: number
}

export default function WorkReportTabs({
  activeTab,
  onTabChange,
  draftCount = 0,
  completedCount = 0,
}: WorkReportTabsProps) {
  const tabs = [
    {
      id: 'draft' as WorkReportStatus,
      label: '임시저장',
      count: draftCount,
      color: '#FF2980',
    },
    {
      id: 'completed' as WorkReportStatus,
      label: '작성완료',
      count: completedCount,
      color: '#14B8A6',
    },
  ]

  return (
    <div className="work-report-tabs">
      <div className="tabs-container">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => onTabChange(tab.id)}
            style={{
              borderBottomColor: activeTab === tab.id ? tab.color : 'transparent',
            }}
          >
            <span className="tab-label">{tab.label}</span>
            {tab.count > 0 && (
              <span className="tab-count" style={{ backgroundColor: tab.color }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
