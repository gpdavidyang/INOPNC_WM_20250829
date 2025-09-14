'use client'

import { useState } from 'react'
import AdminDashboard from '@/components/dashboard/admin-dashboard'

// Mock 데이터 생성
const mockProfile = {
  id: 'mock-admin-id',
  email: 'admin@preview.com',
  full_name: '미리보기 관리자',
  role: 'system_admin' as const,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  daily_wage: null,
  phone: '010-1234-5678',
  sites: [],
}

const mockSiteData = {
  dailyReports: [
    { date: '2025-01-14', count: 5, total_workers: 25, total_hours: 200 },
    { date: '2025-01-13', count: 4, total_workers: 20, total_hours: 160 },
    { date: '2025-01-12', count: 6, total_workers: 30, total_hours: 240 },
    { date: '2025-01-11', count: 3, total_workers: 15, total_hours: 120 },
    { date: '2025-01-10', count: 5, total_workers: 25, total_hours: 200 },
  ],
  recentActivity: [
    {
      id: '1',
      type: 'report_submitted',
      timestamp: new Date().toISOString(),
      description: '일일보고서 제출됨 - 서울 현장',
    },
    {
      id: '2',
      type: 'worker_assigned',
      timestamp: new Date().toISOString(),
      description: '작업자 5명 배정 - 부산 현장',
    },
    {
      id: '3',
      type: 'document_uploaded',
      timestamp: new Date().toISOString(),
      description: '안전서류 업로드 - 김작업',
    },
  ],
  workerStats: {
    total: 45,
    active: 38,
    onLeave: 7,
    byRole: [
      { role: '일반공', count: 30 },
      { role: '기술공', count: 10 },
      { role: '관리자', count: 5 },
    ],
  },
  siteStats: {
    total: 8,
    active: 6,
    completed: 2,
    byStatus: [
      { status: '진행중', count: 6 },
      { status: '완료', count: 2 },
    ],
  },
}

export default function AdminPreviewPage() {
  const [isLoading, setIsLoading] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 bg-yellow-50 border-b border-yellow-200">
        <p className="text-sm text-yellow-800 text-center">
          🎨 UI 미리보기 모드 - 실제 데이터가 아닌 목업 데이터입니다
        </p>
      </div>
      <AdminDashboard profile={mockProfile} siteData={mockSiteData} isLoading={isLoading} />
    </div>
  )
}
