'use client'

import { AppBar } from '@/modules/mobile/components/layout/AppBar'
import { MobileLayout } from '@/modules/mobile/components/layout/MobileLayout'
import { formatDate } from '@/modules/mobile/utils/work-log-utils'
import { ArrowLeft, FileText, Plus } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

// Mock Data Type
interface PTWItem {
  id: string
  siteId: string
  title: string
  status: 'pending' | 'approved' | 'rejected' | 'expired'
  type: string
  date: string
  requester: string
}

// Mock Data
const MOCK_PTW_LIST: PTWItem[] = [
  {
    id: 'ptw-1',
    siteId: 'site-1',
    title: '고소작업 허가서',
    status: 'approved',
    type: '고소작업',
    date: '2025-05-10',
    requester: '김철수',
  },
  {
    id: 'ptw-2',
    siteId: 'site-1',
    title: '화기작업 허가서',
    status: 'pending',
    type: '화기작업',
    date: '2025-05-12',
    requester: '이영희',
  },
]

export default function PTWListPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const siteId = searchParams.get('siteId')

  const [ptwList, setPtwList] = useState<PTWItem[]>([])

  useEffect(() => {
    // 실제 API 연동 시 여기서 fetch
    // 현재는 Mock Data 사용
    if (siteId) {
      setPtwList(MOCK_PTW_LIST.filter(item => item.siteId === siteId || !siteId)) // siteId 없으면 전체? 일단 필터링
    } else {
      setPtwList(MOCK_PTW_LIST)
    }
  }, [siteId])

  const getStatusLabel = (status: PTWItem['status']) => {
    switch (status) {
      case 'pending':
        return '승인대기'
      case 'approved':
        return '승인됨'
      case 'rejected':
        return '반려됨'
      case 'expired':
        return '만료됨'
      default:
        return '-'
    }
  }

  const getStatusColor = (status: PTWItem['status']) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-50'
      case 'approved':
        return 'text-green-600 bg-green-50'
      case 'rejected':
        return 'text-red-600 bg-red-50'
      case 'expired':
        return 'text-gray-500 bg-gray-100'
      default:
        return 'text-gray-500 bg-gray-100'
    }
  }

  return (
    <MobileLayout>
      <AppBar
        left={<ArrowLeft onClick={() => router.back()} />}
        center="PTW 작업허가서"
        right={<Plus onClick={() => alert('신규 발급 기능 준비중')} />}
      />

      <div className="flex flex-col p-4 gap-4 bg-gray-50 min-h-[calc(100vh-56px)]">
        {ptwList.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-60 text-gray-400">
            <FileText size={48} className="mb-2 opacity-20" />
            <span>발급된 작업허가서가 없습니다.</span>
          </div>
        ) : (
          ptwList.map(ptw => (
            <div
              key={ptw.id}
              className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-3"
            >
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <span className="text-sm text-gray-500">{ptw.type}</span>
                  <span className="font-bold text-lg text-gray-900">{ptw.title}</span>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-bold ${getStatusColor(ptw.status)}`}
                >
                  {getStatusLabel(ptw.status)}
                </span>
              </div>

              <div className="h-px bg-gray-100" />

              <div className="flex justify-between text-sm text-gray-600">
                <span>신청일: {formatDate(ptw.date)}</span>
                <span>신청자: {ptw.requester}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </MobileLayout>
  )
}
