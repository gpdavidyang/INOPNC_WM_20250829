'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Calendar,
  Search,
  Filter,
  Download,
  Users,
  MapPin,
  Building2,
  Clock,
  ArrowUpDown,
  RefreshCw,
  Eye
} from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface AssignmentHistoryRecord {
  id: string
  user_id: string
  site_id: string
  assignment_type: 'permanent' | 'temporary' | 'substitute'
  role: 'worker' | 'supervisor' | 'site_manager'
  assigned_date: string
  unassigned_date?: string
  is_active: boolean
  notes?: string
  user: {
    full_name: string
    email: string
  }
  site: {
    name: string
    address: string
  }
  assigned_by_user?: {
    full_name: string
  }
  unassigned_by_user?: {
    full_name: string
  }
}

interface HistoryFilters {
  search: string
  status: 'all' | 'active' | 'inactive'
  assignmentType: string
  role: string
  dateRange: string
  sortBy: 'assigned_date' | 'unassigned_date' | 'user_name' | 'site_name'
  sortOrder: 'asc' | 'desc'
}

export default function AssignmentHistory() {
  const [records, setRecords] = useState<AssignmentHistoryRecord[]>([])
  const [filteredRecords, setFilteredRecords] = useState<AssignmentHistoryRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRecord, setSelectedRecord] = useState<AssignmentHistoryRecord | null>(null)
  
  const [filters, setFilters] = useState<HistoryFilters>({
    search: '',
    status: 'all',
    assignmentType: '',
    role: '',
    dateRange: '',
    sortBy: 'assigned_date',
    sortOrder: 'desc'
  })

  useEffect(() => {
    fetchAssignmentHistory()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [records, filters])

  const fetchAssignmentHistory = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/assignment/user-assignments?status=all')
      if (response.ok) {
        const data = await response.json()
        setRecords(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch assignment history:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...records]

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      filtered = filtered.filter(record =>
        record.user.full_name.toLowerCase().includes(searchTerm) ||
        record.user.email.toLowerCase().includes(searchTerm) ||
        record.site.name.toLowerCase().includes(searchTerm) ||
        record.site.address.toLowerCase().includes(searchTerm)
      )
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(record =>
        filters.status === 'active' ? record.is_active : !record.is_active
      )
    }

    // Assignment type filter
    if (filters.assignmentType && filters.assignmentType !== 'all') {
      filtered = filtered.filter(record => record.assignment_type === filters.assignmentType)
    }

    // Role filter
    if (filters.role && filters.role !== 'all') {
      filtered = filtered.filter(record => record.role === filters.role)
    }

    // Date range filter
    if (filters.dateRange && filters.dateRange !== 'all') {
      const now = new Date()
      let startDate: Date
      
      switch (filters.dateRange) {
        case '7days':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case '30days':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        case '90days':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
          break
        default:
          startDate = new Date(0)
      }
      
      filtered = filtered.filter(record => 
        new Date(record.assigned_date) >= startDate
      )
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue: string | Date
      let bValue: string | Date

      switch (filters.sortBy) {
        case 'assigned_date':
          aValue = new Date(a.assigned_date)
          bValue = new Date(b.assigned_date)
          break
        case 'unassigned_date':
          aValue = a.unassigned_date ? new Date(a.unassigned_date) : new Date(0)
          bValue = b.unassigned_date ? new Date(b.unassigned_date) : new Date(0)
          break
        case 'user_name':
          aValue = a.user.full_name
          bValue = b.user.full_name
          break
        case 'site_name':
          aValue = a.site.name
          bValue = b.site.name
          break
        default:
          aValue = a.assigned_date
          bValue = b.assigned_date
      }

      if (aValue < bValue) return filters.sortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return filters.sortOrder === 'asc' ? 1 : -1
      return 0
    })

    setFilteredRecords(filtered)
  }

  const exportToCSV = () => {
    const csvContent = [
      // Header
      ['사용자명', '이메일', '현장명', '현장주소', '배정유형', '역할', '배정일', '해제일', '상태', '비고'].join(','),
      // Data rows
      ...filteredRecords.map(record => [
        record.user.full_name,
        record.user.email,
        record.site.name,
        record.site.address,
        record.assignment_type,
        record.role,
        format(new Date(record.assigned_date), 'yyyy-MM-dd', { locale: ko }),
        record.unassigned_date ? format(new Date(record.unassigned_date), 'yyyy-MM-dd', { locale: ko }) : '',
        record.is_active ? '활성' : '비활성',
        record.notes || ''
      ].join(','))
    ].join('\n')

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `assignment_history_${format(new Date(), 'yyyyMMdd')}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const getAssignmentTypeBadge = (type: string) => {
    const variants = {
      permanent: { label: '정규', variant: 'default' as const },
      temporary: { label: '임시', variant: 'secondary' as const },
      substitute: { label: '대체', variant: 'outline' as const }
    }
    const config = variants[type as keyof typeof variants] || variants.permanent
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getRoleBadge = (role: string) => {
    const variants = {
      worker: { label: '작업자', variant: 'default' as const },
      supervisor: { label: '감독자', variant: 'secondary' as const },
      site_manager: { label: '현장관리자', variant: 'destructive' as const }
    }
    const config = variants[role as keyof typeof variants] || variants.worker
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const calculateDuration = (startDate: string, endDate?: string) => {
    const start = new Date(startDate)
    const end = endDate ? new Date(endDate) : new Date()
    const diffInDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffInDays < 1) return '1일 미만'
    if (diffInDays < 30) return `${diffInDays}일`
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)}개월`
    return `${Math.floor(diffInDays / 365)}년`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">배정 이력</h2>
          <p className="text-muted-foreground">
            사용자 현장 배정의 전체 이력을 조회하고 관리합니다
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchAssignmentHistory} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            새로고침
          </Button>
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            CSV 내보내기
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            필터 및 검색
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <Input
                placeholder="사용자명, 현장명 검색"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full"
              />
            </div>

            <Select 
              value={filters.status} 
              onValueChange={(value: 'all' | 'active' | 'inactive') => 
                setFilters(prev => ({ ...prev, status: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 상태</SelectItem>
                <SelectItem value="active">활성 배정</SelectItem>
                <SelectItem value="inactive">비활성 배정</SelectItem>
              </SelectContent>
            </Select>

            <Select 
              value={filters.assignmentType} 
              onValueChange={(value) => setFilters(prev => ({ ...prev, assignmentType: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="배정 유형" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 유형</SelectItem>
                <SelectItem value="permanent">정규</SelectItem>
                <SelectItem value="temporary">임시</SelectItem>
                <SelectItem value="substitute">대체</SelectItem>
              </SelectContent>
            </Select>

            <Select 
              value={filters.role} 
              onValueChange={(value) => setFilters(prev => ({ ...prev, role: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="역할" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 역할</SelectItem>
                <SelectItem value="worker">작업자</SelectItem>
                <SelectItem value="supervisor">감독자</SelectItem>
                <SelectItem value="site_manager">현장관리자</SelectItem>
              </SelectContent>
            </Select>

            <Select 
              value={filters.dateRange} 
              onValueChange={(value) => setFilters(prev => ({ ...prev, dateRange: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="기간" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 기간</SelectItem>
                <SelectItem value="7days">최근 7일</SelectItem>
                <SelectItem value="30days">최근 30일</SelectItem>
                <SelectItem value="90days">최근 90일</SelectItem>
              </SelectContent>
            </Select>

            <Select 
              value={`${filters.sortBy}_${filters.sortOrder}`}
              onValueChange={(value) => {
                const [sortBy, sortOrder] = value.split('_')
                setFilters(prev => ({ 
                  ...prev, 
                  sortBy: sortBy as any, 
                  sortOrder: sortOrder as 'asc' | 'desc' 
                }))
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="assigned_date_desc">배정일 (최신순)</SelectItem>
                <SelectItem value="assigned_date_asc">배정일 (오래된순)</SelectItem>
                <SelectItem value="user_name_asc">사용자명 (가나다순)</SelectItem>
                <SelectItem value="user_name_desc">사용자명 (역순)</SelectItem>
                <SelectItem value="site_name_asc">현장명 (가나다순)</SelectItem>
                <SelectItem value="site_name_desc">현장명 (역순)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">전체 이력</p>
                <p className="text-2xl font-bold">{filteredRecords.length}</p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">활성 배정</p>
                <p className="text-2xl font-bold text-green-600">
                  {filteredRecords.filter(r => r.is_active).length}
                </p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">완료된 배정</p>
                <p className="text-2xl font-bold text-gray-600">
                  {filteredRecords.filter(r => !r.is_active).length}
                </p>
              </div>
              <MapPin className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">고유 사용자</p>
                <p className="text-2xl font-bold text-blue-600">
                  {new Set(filteredRecords.map(r => r.user_id)).size}
                </p>
              </div>
              <Building2 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* History Table */}
      <Card>
        <CardHeader>
          <CardTitle>배정 이력 목록</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              로딩 중...
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              조건에 맞는 배정 이력이 없습니다.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">사용자</th>
                    <th className="text-left p-3">현장</th>
                    <th className="text-left p-3">배정 정보</th>
                    <th className="text-left p-3">기간</th>
                    <th className="text-left p-3">상태</th>
                    <th className="text-left p-3">작업</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map(record => (
                    <tr key={record.id} className="border-b hover:bg-muted/50">
                      <td className="p-3">
                        <div>
                          <div className="font-medium">{record.user.full_name}</div>
                          <div className="text-sm text-muted-foreground">{record.user.email}</div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div>
                          <div className="font-medium">{record.site.name}</div>
                          <div className="text-sm text-muted-foreground">{record.site.address}</div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          {getAssignmentTypeBadge(record.assignment_type)}
                          {getRoleBadge(record.role)}
                        </div>
                      </td>
                      <td className="p-3">
                        <div>
                          <div className="text-sm">
                            {format(new Date(record.assigned_date), 'yyyy-MM-dd', { locale: ko })}
                            {record.unassigned_date && (
                              <> ~ {format(new Date(record.unassigned_date), 'yyyy-MM-dd', { locale: ko })}</>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            ({calculateDuration(record.assigned_date, record.unassigned_date)})
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge variant={record.is_active ? 'default' : 'secondary'}>
                          {record.is_active ? '활성' : '완료'}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedRecord(record)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>배정 상세 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">사용자</Label>
                  <p className="text-sm">{selectedRecord.user.full_name}</p>
                  <p className="text-xs text-muted-foreground">{selectedRecord.user.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">현장</Label>
                  <p className="text-sm">{selectedRecord.site.name}</p>
                  <p className="text-xs text-muted-foreground">{selectedRecord.site.address}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">배정 유형</Label>
                  <div className="mt-1">
                    {getAssignmentTypeBadge(selectedRecord.assignment_type)}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">역할</Label>
                  <div className="mt-1">
                    {getRoleBadge(selectedRecord.role)}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">배정일</Label>
                  <p className="text-sm">
                    {format(new Date(selectedRecord.assigned_date), 'yyyy년 MM월 dd일 HH:mm', { locale: ko })}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">해제일</Label>
                  <p className="text-sm">
                    {selectedRecord.unassigned_date 
                      ? format(new Date(selectedRecord.unassigned_date), 'yyyy년 MM월 dd일 HH:mm', { locale: ko })
                      : '진행 중'
                    }
                  </p>
                </div>
              </div>

              {selectedRecord.notes && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">비고</Label>
                  <p className="text-sm mt-1 p-2 bg-muted rounded-md">
                    {selectedRecord.notes}
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSelectedRecord(null)}>
                  닫기
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

function Label({ className, ...props }: React.ComponentProps<'label'>) {
  return <label className={className} {...props} />
}