'use client'

import { useState } from 'react'
import WorkerDashboard from '@/components/dashboard/worker-dashboard'

// Mock 데이터
const mockProfile = {
  id: 'mock-worker-id',
  email: 'worker@preview.com',
  full_name: '김작업',
  role: 'worker' as const,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  daily_wage: 150000,
  phone: '010-9876-5432',
  sites: [],
}

const mockWorkerData = {
  currentMonth: {
    totalDays: 20,
    totalHours: 160,
    totalEarnings: 3000000,
    overtime: 12,
  },
  lastMonth: {
    totalDays: 22,
    totalHours: 176,
    totalEarnings: 3300000,
    overtime: 8,
  },
  recentWork: [
    { date: '2025-01-14', site: '서울 현장', hours: 8, earnings: 150000, status: '정산완료' },
    { date: '2025-01-13', site: '서울 현장', hours: 9, earnings: 168750, status: '정산완료' },
    { date: '2025-01-12', site: '부산 현장', hours: 8, earnings: 150000, status: '정산대기' },
    { date: '2025-01-11', site: '부산 현장', hours: 10, earnings: 187500, status: '정산대기' },
    { date: '2025-01-10', site: '서울 현장', hours: 8, earnings: 150000, status: '정산완료' },
  ],
  documents: {
    required: 5,
    submitted: 3,
    pending: 2,
    list: [
      { name: '신분증', status: 'submitted', date: '2025-01-01' },
      { name: '통장사본', status: 'submitted', date: '2025-01-01' },
      { name: '안전교육증', status: 'submitted', date: '2025-01-02' },
      { name: '건강진단서', status: 'pending', date: null },
      { name: '4대보험 가입서류', status: 'pending', date: null },
    ],
  },
  weeklyHours: [
    { day: '월', hours: 8 },
    { day: '화', hours: 9 },
    { day: '수', hours: 8 },
    { day: '목', hours: 10 },
    { day: '금', hours: 8 },
    { day: '토', hours: 6 },
    { day: '일', hours: 0 },
  ],
}

export default function WorkerPreviewPage() {
  const [isLoading, setIsLoading] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 bg-yellow-50 border-b border-yellow-200">
        <p className="text-sm text-yellow-800 text-center">
          🎨 UI 미리보기 모드 - 실제 데이터가 아닌 목업 데이터입니다
        </p>
      </div>
      <WorkerDashboard profile={mockProfile} workerData={mockWorkerData} isLoading={isLoading} />
    </div>
  )
}
