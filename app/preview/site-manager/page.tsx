'use client'

import { useState } from 'react'
import SiteManagerDashboard from '@/components/dashboard/site-manager-dashboard'

// Mock 데이터
const mockProfile = {
  id: 'mock-manager-id',
  email: 'manager@preview.com',
  full_name: '현장 관리자',
  role: 'site_manager' as const,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  daily_wage: null,
  phone: '010-5678-1234',
  sites: ['site-1', 'site-2'],
}

const mockSiteData = {
  currentSite: {
    id: 'site-1',
    name: '서울 건설현장',
    location: '서울시 강남구',
    status: 'active',
    manager_id: 'mock-manager-id',
  },
  todayReport: {
    id: 'report-1',
    work_date: new Date().toISOString().split('T')[0],
    site_id: 'site-1',
    status: 'draft',
    total_workers: 15,
    total_hours: 120,
    weather: '맑음',
    temperature: 5,
    notes: '정상 작업 진행중',
  },
  workers: [
    { id: 'w1', name: '김작업', role: '일반공', hours: 8, status: '작업중' },
    { id: 'w2', name: '이기술', role: '기술공', hours: 8, status: '작업중' },
    { id: 'w3', name: '박안전', role: '안전관리', hours: 8, status: '작업중' },
    { id: 'w4', name: '최전기', role: '전기공', hours: 6, status: '조퇴' },
    { id: 'w5', name: '정배관', role: '배관공', hours: 8, status: '작업중' },
  ],
  recentReports: [
    { date: '2025-01-13', workers: 14, hours: 112, status: 'submitted' },
    { date: '2025-01-12', workers: 16, hours: 128, status: 'submitted' },
    { date: '2025-01-11', workers: 15, hours: 120, status: 'submitted' },
    { date: '2025-01-10', workers: 13, hours: 104, status: 'submitted' },
  ],
  weeklyStats: {
    totalHours: 584,
    totalWorkers: 73,
    avgDailyWorkers: 14.6,
    completionRate: 95,
  },
}

export default function SiteManagerPreviewPage() {
  const [isLoading, setIsLoading] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 bg-yellow-50 border-b border-yellow-200">
        <p className="text-sm text-yellow-800 text-center">
          🎨 UI 미리보기 모드 - 실제 데이터가 아닌 목업 데이터입니다
        </p>
      </div>
      <SiteManagerDashboard profile={mockProfile} siteData={mockSiteData} isLoading={isLoading} />
    </div>
  )
}
