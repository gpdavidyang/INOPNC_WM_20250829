'use client'

import DataTable from '@/components/admin/DataTable'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { Profile } from '@/types'
import { Building2, Calendar, ClipboardList, Search, User } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

interface RequestsTabProps {
  profile: Profile
}

interface HeadquartersRequest {
  id: string
  request_date: string
  requester_id: string
  requester_name: string
  requester_email: string
  requester_role: string
  site_id?: string
  site_name?: string
  category: string
  subject: string
  content: string
  urgency: 'low' | 'medium' | 'high' | 'critical'
  status: 'pending' | 'in_progress' | 'resolved' | 'closed'
  created_at: string
}

export default function RequestsTab({ profile }: RequestsTabProps) {
  const [requests, setRequests] = useState<HeadquartersRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const supabase = createClient()

  useEffect(() => {
    loadRequests()
  }, [])

  const loadRequests = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('headquarters_requests')
        .select(
          `
          *,
          profiles!requester_id(full_name, email, role),
          sites!site_id(name)
        `
        )
        .order('created_at', { ascending: false })

      if (!error && data) {
        const formattedData: HeadquartersRequest[] = data.map(item => ({
          ...item,
          requester_name: (item as any).profiles?.full_name || '알 수 없음',
          requester_email: (item as any).profiles?.email || '',
          requester_role: (item as any).profiles?.role || 'worker',
          site_name: (item as any).sites?.name || '',
        }))
        setRequests(formattedData)
      }
    } catch (error) {
      console.error('Failed to load requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const roleLabel = (role: string) => {
    const labels: Record<string, string> = {
      worker: '작업자',
      site_manager: '현장관리자',
      partner: '시공업체',
      customer_manager: '고객관리자',
      admin: '본사관리자',
    }
    return labels[role] || role
  }

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return requests
    const s = searchTerm.toLowerCase()
    return requests.filter(
      r =>
        r.subject.toLowerCase().includes(s) ||
        r.content.toLowerCase().includes(s) ||
        r.requester_name.toLowerCase().includes(s) ||
        r.site_name?.toLowerCase().includes(s)
    )
  }, [requests, searchTerm])

  return (
    <div className="space-y-6">
      {/* 1. Stats Grid (v1.66) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: '누적 요청',
            value: requests.length,
            unit: '건',
            bg: 'bg-indigo-50/50',
            text: 'text-indigo-600',
          },
          {
            label: '미처리 요청',
            value: requests.filter(r => r.status === 'pending').length,
            unit: '건',
            bg: 'bg-amber-50/50',
            text: 'text-amber-600',
          },
          {
            label: '최근 7일',
            value: requests.filter(r => {
              const sevenDaysAgo = new Date()
              sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
              return new Date(r.created_at) > sevenDaysAgo
            }).length,
            unit: '건',
            bg: 'bg-blue-50/50',
            text: 'text-blue-600',
          },
        ].map((stat, idx) => (
          <Card
            key={idx}
            className={cn(
              'rounded-2xl border-none shadow-sm shadow-gray-200/40 overflow-hidden',
              stat.bg
            )}
          >
            <CardContent className="p-5 flex flex-col justify-between h-full">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter">
                {stat.label}
              </p>
              <div className="flex items-baseline gap-1 mt-2">
                <span className={cn('text-2xl font-black tracking-tight', stat.text)}>
                  {stat.value}
                </span>
                <span className="text-xs font-bold text-slate-400">{stat.unit}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 2. Main Content Card */}
      <Card className="rounded-3xl border-gray-200 shadow-sm shadow-gray-200/40 overflow-hidden">
        <CardHeader className="border-b border-gray-100 bg-gray-50/30 px-6 py-6 sm:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-bold text-[#1A254F] flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-indigo-500" />
                요청 내역 리스트
              </CardTitle>
              <CardDescription className="text-sm font-normal text-slate-400">
                접수된 모든 본사 요청 사항을 통합 조회합니다.
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="제목, 내용, 요청자 검색..."
                  className="h-10 rounded-xl bg-white border-slate-200 pl-10 text-sm font-normal shadow-sm focus:ring-2 focus:ring-blue-500/10 min-w-[240px]"
                />
              </div>
              <Button
                onClick={loadRequests}
                className="h-10 rounded-xl bg-[#1A254F] hover:bg-[#2A355F] text-white px-6 font-semibold text-sm shadow-sm"
              >
                조회하기
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <DataTable
            data={filtered}
            rowKey="id"
            emptyMessage="접수된 본사 요청이 없습니다."
            columns={[
              {
                key: 'request_date',
                header: '요청일',
                sortable: true,
                width: '160px',
                render: (r: HeadquartersRequest) => (
                  <div className="flex items-center gap-2 text-slate-500 font-normal">
                    <Calendar className="w-3.5 h-3.5 text-slate-300" />
                    {new Date(r.request_date).toLocaleDateString('ko-KR')}
                  </div>
                ),
              },
              {
                key: 'site_name',
                header: '현장',
                sortable: true,
                width: '180px',
                render: (r: HeadquartersRequest) => (
                  <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                    <Building2 className="w-3.5 h-3.5 text-indigo-300" />
                    <span className="truncate">{r.site_name || '글로벌'}</span>
                  </div>
                ),
              },
              {
                key: 'requester_name',
                header: '요청자',
                width: '150px',
                render: (r: HeadquartersRequest) => (
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                      <User className="w-3.5 h-3.5 text-slate-300" />
                      {r.requester_name}
                    </div>
                    <span className="text-[10px] text-slate-400 ml-5 font-medium">
                      {roleLabel(r.requester_role)}
                    </span>
                  </div>
                ),
              },
              {
                key: 'subject',
                header: '제목',
                render: (r: HeadquartersRequest) => (
                  <div className="space-y-0.5">
                    <p className="font-semibold text-[#1A254F] line-clamp-1">{r.subject}</p>
                    <p className="text-[12px] text-slate-400 font-normal line-clamp-1">
                      {r.content}
                    </p>
                  </div>
                ),
              },
              {
                key: 'status',
                header: '상태',
                width: '100px',
                align: 'center',
                render: (r: HeadquartersRequest) => {
                  const colors: Record<string, string> = {
                    pending: 'bg-amber-50 text-amber-600 border-amber-100',
                    in_progress: 'bg-blue-50 text-blue-600 border-blue-100',
                    resolved: 'bg-emerald-50 text-emerald-600 border-emerald-100',
                    closed: 'bg-slate-50 text-slate-400 border-slate-100',
                  }
                  const labels: Record<string, string> = {
                    pending: '접수대기',
                    in_progress: '처리중',
                    resolved: '해결됨',
                    closed: '종료',
                  }
                  return (
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded-full text-[10px] font-bold border',
                        colors[r.status] || colors.pending
                      )}
                    >
                      {labels[r.status] || r.status}
                    </span>
                  )
                },
              },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  )
}
