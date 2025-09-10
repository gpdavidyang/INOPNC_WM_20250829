'use client'

import React from 'react'
import { Search, Filter, Grid, List, SlidersHorizontal } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Label } from '@/components/ui/label'

interface DocumentFiltersProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  filters: {
    status: string
    siteId: string
    documentType: string
    dateRange: string
  }
  onFiltersChange: (filters: any) => void
  viewMode: 'list' | 'grid'
  onViewModeChange: (mode: 'list' | 'grid') => void
  isAdmin?: boolean
}

export default function DocumentFilters({
  searchTerm,
  onSearchChange,
  filters,
  onFiltersChange,
  viewMode,
  onViewModeChange,
  isAdmin = false
}: DocumentFiltersProps) {
  
  const handleFilterChange = (key: string, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value
    })
  }
  
  return (
    <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
      {/* 검색 */}
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="문서명, 설명, 파일명으로 검색..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      
      {/* 필터 */}
      <div className="flex gap-2">
        {/* 상태 필터 */}
        <Select
          value={filters.status}
          onValueChange={(value) => handleFilterChange('status', value)}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="상태" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 상태</SelectItem>
            <SelectItem value="active">활성</SelectItem>
            <SelectItem value="pending">대기중</SelectItem>
            <SelectItem value="approved">승인됨</SelectItem>
            <SelectItem value="rejected">반려됨</SelectItem>
            <SelectItem value="archived">보관됨</SelectItem>
            {isAdmin && <SelectItem value="deleted">삭제됨</SelectItem>}
          </SelectContent>
        </Select>
        
        {/* 문서 타입 필터 */}
        <Select
          value={filters.documentType}
          onValueChange={(value) => handleFilterChange('documentType', value)}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="문서 타입" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 타입</SelectItem>
            <SelectItem value="pdf">PDF</SelectItem>
            <SelectItem value="image">이미지</SelectItem>
            <SelectItem value="document">문서</SelectItem>
            <SelectItem value="spreadsheet">스프레드시트</SelectItem>
            <SelectItem value="other">기타</SelectItem>
          </SelectContent>
        </Select>
        
        {/* 기간 필터 */}
        <Select
          value={filters.dateRange}
          onValueChange={(value) => handleFilterChange('dateRange', value)}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="기간" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 기간</SelectItem>
            <SelectItem value="today">오늘</SelectItem>
            <SelectItem value="week">이번 주</SelectItem>
            <SelectItem value="month">이번 달</SelectItem>
            <SelectItem value="3months">최근 3개월</SelectItem>
            <SelectItem value="6months">최근 6개월</SelectItem>
            <SelectItem value="year">올해</SelectItem>
          </SelectContent>
        </Select>
        
        {/* 고급 필터 */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon">
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="grid gap-4">
              <div className="space-y-2">
                <h4 className="font-medium leading-none">고급 필터</h4>
                <p className="text-sm text-muted-foreground">
                  추가 필터 옵션을 설정하세요
                </p>
              </div>
              <div className="grid gap-2">
                <div className="grid grid-cols-3 items-center gap-4">
                  <Label htmlFor="fileSize">파일 크기</Label>
                  <Select defaultValue="all">
                    <SelectTrigger className="col-span-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체</SelectItem>
                      <SelectItem value="small">10MB 이하</SelectItem>
                      <SelectItem value="medium">10-50MB</SelectItem>
                      <SelectItem value="large">50MB 이상</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-3 items-center gap-4">
                  <Label htmlFor="approval">승인 필요</Label>
                  <Select defaultValue="all">
                    <SelectTrigger className="col-span-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체</SelectItem>
                      <SelectItem value="required">필요</SelectItem>
                      <SelectItem value="not_required">불필요</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-3 items-center gap-4">
                  <Label htmlFor="public">공개 여부</Label>
                  <Select defaultValue="all">
                    <SelectTrigger className="col-span-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체</SelectItem>
                      <SelectItem value="public">공개</SelectItem>
                      <SelectItem value="private">비공개</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm">
                  초기화
                </Button>
                <Button size="sm">
                  적용
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      
      {/* 뷰 모드 전환 */}
      <div className="flex gap-1 border rounded-lg p-1">
        <Button
          variant={viewMode === 'list' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onViewModeChange('list')}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant={viewMode === 'grid' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onViewModeChange('grid')}
        >
          <Grid className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}