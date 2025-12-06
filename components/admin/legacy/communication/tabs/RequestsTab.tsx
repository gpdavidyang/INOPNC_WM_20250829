'use client'

import React, { Fragment, useEffect, useState } from 'react'
import { Search, Calendar, User } from 'lucide-react'
import type { Profile } from '@/types'
import { createClient } from '@/lib/supabase/client'

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
  category: 'general' | 'technical' | 'administrative' | 'complaint' | 'suggestion' | 'other'
  subject: string
  content: string
  urgency: 'low' | 'medium' | 'high' | 'critical'
  status: 'pending' | 'in_progress' | 'resolved' | 'closed'
  assigned_to?: string
  assigned_to_name?: string
  response?: string
  response_date?: string
  resolved_date?: string
  attachments?: string[]
  created_at: string
  updated_at: string
}

export default function RequestsTab({ profile }: RequestsTabProps) {
  const [requests, setRequests] = useState<HeadquartersRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<
    'request_date' | 'site_name' | 'subject' | 'requester_name' | 'content'
  >('request_date')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  const supabase = createClient()

  useEffect(() => {
    loadRequests()
  }, [])

  const loadRequests = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('headquarters_requests')
        .select(
          `
          *,
          profiles!requester_id(full_name, email, role),
          sites!site_id(name),
          assigned_profile:profiles!assigned_to(full_name)
        `
        )
        .order('created_at', { ascending: false })

      const { data, error } = await query

      if (!error && data) {
        const formattedData: HeadquartersRequest[] = data.map(item => ({
          ...item,
          requester_name: (item as unknown).profiles?.full_name || '알 수 없음',
          requester_email: (item as unknown).profiles?.email || '',
          requester_role: (item as unknown).profiles?.role || 'worker',
          site_name: (item as unknown).sites?.name || '',
          assigned_to_name: (item as unknown).assigned_profile?.full_name || '',
        }))
        setRequests(formattedData)
      }
    } catch (error) {
      console.error('Failed to load requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetail = (request: HeadquartersRequest) => {
    setExpandedId(prev => (prev === request.id ? null : request.id))
  }

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      worker: '작업자',
      site_manager: '현장관리자',
      partner: '시공업체',
      customer_manager: '고객관리자',
      admin: '관리자',
    }
    return labels[role] || role
  }

  const filteredRequests = requests.filter(
    request =>
      searchTerm === '' ||
      request.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.requester_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const sortedRequests = [...filteredRequests].sort((a, b) => {
    const dir = sortDirection === 'asc' ? 1 : -1
    const getVal = (r: HeadquartersRequest) => {
      switch (sortField) {
        case 'request_date':
          return r.request_date || ''
        case 'site_name':
          return r.site_name || ''
        case 'subject':
          return r.subject || ''
        case 'requester_name':
          return r.requester_name || ''
        case 'content':
          return r.content || ''
        default:
          return ''
      }
    }
    const va = getVal(a)
    const vb = getVal(b)

    if (sortField === 'request_date') {
      return (new Date(va).getTime() - new Date(vb).getTime()) * dir
    }

    return va.localeCompare(vb) * dir
  })

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const stats = {
    total: requests.length,
  }

  return (
    <div className="p-6">
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">전체 요청</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="제목, 내용, 요청자 검색..."
            className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      {/* Requests Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase cursor-pointer select-none"
                onClick={() => handleSort('request_date')}
              >
                요청일
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase cursor-pointer select-none"
                onClick={() => handleSort('site_name')}
              >
                현장
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase cursor-pointer select-none"
                onClick={() => handleSort('subject')}
              >
                작업일지
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase cursor-pointer select-none"
                onClick={() => handleSort('requester_name')}
              >
                요청자
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase cursor-pointer select-none"
                onClick={() => handleSort('content')}
              >
                요청 내용
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                  데이터를 불러오는 중...
                </td>
              </tr>
            ) : filteredRequests.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                  요청사항이 없습니다.
                </td>
              </tr>
            ) : (
              sortedRequests.map(request => (
                <tr
                  key={request.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={() => handleViewDetail(request)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      {request.request_date}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {request.site_name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    <p className="line-clamp-1" title={request.subject}>
                      {request.subject || '-'}
                    </p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center text-gray-900 dark:text-white">
                      <User className="h-4 w-4 mr-1 text-gray-400" />
                      {request.requester_name}
                    </div>
                    <div className="text-xs text-gray-500">
                      역할:{getRoleLabel(request.requester_role)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-normal text-sm text-gray-900 dark:text-white">
                    <p className="line-clamp-3" title={request.content}>
                      {request.content}
                    </p>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
