'use client'

import React, { useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { UnifiedDocument } from '@/hooks/use-unified-documents'

interface AdminViewProps {
  documents: UnifiedDocument[]
  loading: boolean
  viewMode: 'list' | 'grid'
  selectedDocuments: string[]
  onSelectionChange: (ids: string[]) => void
  onDocumentAction: (action: string, documentIds: string[], data?: unknown) => void
  onDocumentClick: (document: UnifiedDocument) => void
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  onPageChange: (page: number) => void
}

export default function AdminView({
  documents,
  loading,
  viewMode,
  selectedDocuments,
  onSelectionChange,
  onDocumentAction,
  onDocumentClick,
  pagination,
  onPageChange
}: AdminViewProps) {
  
  const [showApprovalDialog, setShowApprovalDialog] = useState(false)
  const [showRejectionDialog, setShowRejectionDialog] = useState(false)
  const [approvalComment, setApprovalComment] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [pendingDocumentIds, setPendingDocumentIds] = useState<string[]>([])
  
  // 문서 선택 토글
  const toggleSelection = (documentId: string) => {
    if (selectedDocuments.includes(documentId)) {
      onSelectionChange(selectedDocuments.filter(id => id !== documentId))
    } else {
      onSelectionChange([...selectedDocuments, documentId])
    }
  }
  
  // 전체 선택/해제
  const toggleAllSelection = () => {
    if (selectedDocuments.length === documents.length) {
      onSelectionChange([])
    } else {
      onSelectionChange(documents.map(doc => doc.id))
    }
  }
  
  // 승인 처리
  const handleApprove = (documentIds: string[]) => {
    setPendingDocumentIds(documentIds)
    setShowApprovalDialog(true)
  }
  
  const confirmApproval = () => {
    onDocumentAction('approve', pendingDocumentIds, { comment: approvalComment })
    setShowApprovalDialog(false)
    setApprovalComment('')
    setPendingDocumentIds([])
  }
  
  // 반려 처리
  const handleReject = (documentIds: string[]) => {
    setPendingDocumentIds(documentIds)
    setShowRejectionDialog(true)
  }
  
  const confirmRejection = () => {
    onDocumentAction('reject', pendingDocumentIds, { reason: rejectionReason })
    setShowRejectionDialog(false)
    setRejectionReason('')
    setPendingDocumentIds([])
  }
  
  // 문서 타입 아이콘
  const getDocumentIcon = (document: UnifiedDocument) => {
    const iconMap: Record<string, unknown> = {
      markup: Image,
      photo_grid: Image,
      required: Shield,
      invoice: FileText,
      shared: Share2,
      personal: User
    }
    return iconMap[document.category_type] || FileText
  }
  
  // 상태 배지
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle className="h-3 w-3 mr-1" />
            승인됨
          </Badge>
        )
      case 'rejected':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            반려됨
          </Badge>
        )
      case 'pending':
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            대기중
          </Badge>
        )
      case 'draft':
        return (
          <Badge variant="outline">
            <Edit3 className="h-3 w-3 mr-1" />
            작성중
          </Badge>
        )
      default:
        return (
          <Badge variant="outline">
            <AlertCircle className="h-3 w-3 mr-1" />
            {status}
          </Badge>
        )
    }
  }
  
  // 카테고리 배지
  const getCategoryBadge = (category: string) => {
    const categoryMap: Record<string, { label: string; color: string }> = {
      shared: { label: '공유문서', color: 'bg-blue-100 text-blue-700' },
      markup: { label: '도면마킹', color: 'bg-purple-100 text-purple-700' },
      photo_grid: { label: '사진대지', color: 'bg-orange-100 text-orange-700' },
      required: { label: '필수제출', color: 'bg-green-100 text-green-700' },
      invoice: { label: '기성청구', color: 'bg-yellow-100 text-yellow-700' },
      personal: { label: '개인문서', color: 'bg-gray-100 text-gray-700' }
    }
    
    const config = categoryMap[category] || { label: category, color: 'bg-gray-100' }
    return (
      <Badge className={config.color} variant="secondary">
        {config.label}
      </Badge>
    )
  }
  
  // 통계 카드
  const renderStatistics = () => {
    const stats = {
      total: documents.length,
      pending: documents.filter(d => d.workflow_status === 'pending').length,
      approved: documents.filter(d => d.workflow_status === 'approved').length,
      rejected: documents.filter(d => d.workflow_status === 'rejected').length
    }
    
    return (
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-sm text-gray-500">전체 문서</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-sm text-gray-500">승인 대기</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            <p className="text-sm text-gray-500">승인 완료</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            <p className="text-sm text-gray-500">반려</p>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }
  
  return (
    <div className="space-y-4">
      {/* 통계 */}
      {renderStatistics()}
      
      {/* 일괄 작업 도구바 */}
      {selectedDocuments.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg flex items-center justify-between">
          <span className="text-sm font-medium">
            {selectedDocuments.length}개 문서 선택됨
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="default"
              onClick={() => handleApprove(selectedDocuments)}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              승인
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleReject(selectedDocuments)}
            >
              <XCircle className="h-4 w-4 mr-2" />
              반려
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDocumentAction('archive', selectedDocuments)}
            >
              보관
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDocumentAction('download', selectedDocuments)}
            >
              <Download className="h-4 w-4 mr-2" />
              다운로드
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onDocumentAction('delete', selectedDocuments)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              삭제
            </Button>
          </div>
        </div>
      )}
      
      {/* 문서 리스트 */}
      {viewMode === 'list' ? (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="text-left p-4">
                    <Checkbox
                      checked={selectedDocuments.length === documents.length && documents.length > 0}
                      onCheckedChange={toggleAllSelection}
                    />
                  </th>
                  <th className="text-left p-4 font-medium">문서명</th>
                  <th className="text-left p-4 font-medium">카테고리</th>
                  <th className="text-left p-4 font-medium">현장</th>
                  <th className="text-left p-4 font-medium">회사</th>
                  <th className="text-left p-4 font-medium">상태</th>
                  <th className="text-left p-4 font-medium">업로더</th>
                  <th className="text-left p-4 font-medium">생성일</th>
                  <th className="text-left p-4 font-medium">작업</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((document) => {
                  const Icon = getDocumentIcon(document)
                  return (
                    <tr key={document.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-900">
                      <td className="p-4">
                        <Checkbox
                          checked={selectedDocuments.includes(document.id)}
                          onCheckedChange={() => toggleSelection(document.id)}
                        />
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => onDocumentClick(document)}
                          className="flex items-center gap-2 text-left hover:text-blue-600"
                        >
                          <Icon className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="font-medium">{document.title || document.file_name}</p>
                            {document.description && (
                              <p className="text-sm text-gray-500">{document.description}</p>
                            )}
                          </div>
                        </button>
                      </td>
                      <td className="p-4">
                        {getCategoryBadge(document.category_type)}
                      </td>
                      <td className="p-4">
                        <p className="text-sm">
                          {document.site?.name || '-'}
                        </p>
                      </td>
                      <td className="p-4">
                        <p className="text-sm">
                          {document.customer_company?.name || '-'}
                        </p>
                      </td>
                      <td className="p-4">
                        {getStatusBadge(document.workflow_status || document.status)}
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          <p>{document.uploader?.full_name || '알 수 없음'}</p>
                          <p className="text-gray-500">{document.uploader?.role}</p>
                        </div>
                      </td>
                      <td className="p-4 text-sm">
                        {format(new Date(document.created_at), 'yyyy-MM-dd HH:mm')}
                      </td>
                      <td className="p-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>문서 관리</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onDocumentClick(document)}>
                              <Eye className="h-4 w-4 mr-2" />
                              상세 보기
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onDocumentAction('download', [document.id])}>
                              <Download className="h-4 w-4 mr-2" />
                              다운로드
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {document.workflow_status !== 'approved' && (
                              <DropdownMenuItem 
                                onClick={() => handleApprove([document.id])}
                                className="text-green-600"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                승인
                              </DropdownMenuItem>
                            )}
                            {document.workflow_status !== 'rejected' && (
                              <DropdownMenuItem 
                                onClick={() => handleReject([document.id])}
                                className="text-orange-600"
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                반려
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onDocumentAction('edit', [document.id])}>
                              <Edit3 className="h-4 w-4 mr-2" />
                              수정
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => onDocumentAction('delete', [document.id])}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              삭제
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        /* 그리드 뷰 */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {documents.map((document) => {
            const Icon = getDocumentIcon(document)
            return (
              <Card key={document.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <Checkbox
                      checked={selectedDocuments.includes(document.id)}
                      onCheckedChange={() => toggleSelection(document.id)}
                    />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onDocumentClick(document)}>
                          <Eye className="h-4 w-4 mr-2" />
                          보기
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {document.workflow_status !== 'approved' && (
                          <DropdownMenuItem 
                            onClick={() => handleApprove([document.id])}
                            className="text-green-600"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            승인
                          </DropdownMenuItem>
                        )}
                        {document.workflow_status !== 'rejected' && (
                          <DropdownMenuItem 
                            onClick={() => handleReject([document.id])}
                            className="text-orange-600"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            반려
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <button
                    onClick={() => onDocumentClick(document)}
                    className="w-full text-left"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded">
                        <Icon className="h-6 w-6 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {document.title || document.file_name}
                        </p>
                        {document.description && (
                          <p className="text-sm text-gray-500 truncate">
                            {document.description}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        {getCategoryBadge(document.category_type)}
                        {getStatusBadge(document.workflow_status || document.status)}
                      </div>
                      
                      <div className="text-sm space-y-1">
                        {document.site && (
                          <p className="text-gray-600">
                            <Building2 className="h-3 w-3 inline mr-1" />
                            {document.site.name}
                          </p>
                        )}
                        {document.customer_company && (
                          <p className="text-gray-600">
                            <Building2 className="h-3 w-3 inline mr-1" />
                            {document.customer_company.name}
                          </p>
                        )}
                        <p className="text-gray-600">
                          <User className="h-3 w-3 inline mr-1" />
                          {document.uploader?.full_name}
                        </p>
                        <p className="text-gray-600">
                          <Calendar className="h-3 w-3 inline mr-1" />
                          {format(new Date(document.created_at), 'yyyy-MM-dd')}
                        </p>
                      </div>
                    </div>
                  </button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
      
      {/* 페이지네이션 */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
          >
            이전
          </Button>
          
          <span className="flex items-center px-3 text-sm">
            {pagination.page} / {pagination.totalPages}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
          >
            다음
          </Button>
        </div>
      )}
      
      {/* 승인 다이얼로그 */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>문서 승인</DialogTitle>
            <DialogDescription>
              선택한 {pendingDocumentIds.length}개 문서를 승인하시겠습니까?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">승인 의견 (선택)</label>
              <Textarea
                value={approvalComment}
                onChange={(e) => setApprovalComment(e.target.value)}
                placeholder="승인 의견을 입력하세요..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApprovalDialog(false)}>
              취소
            </Button>
            <Button onClick={confirmApproval} className="bg-green-600 hover:bg-green-700">
              승인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 반려 다이얼로그 */}
      <Dialog open={showRejectionDialog} onOpenChange={setShowRejectionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>문서 반려</DialogTitle>
            <DialogDescription>
              선택한 {pendingDocumentIds.length}개 문서를 반려하시겠습니까?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">반려 사유 (필수)</label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="반려 사유를 입력하세요..."
                rows={3}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectionDialog(false)}>
              취소
            </Button>
            <Button 
              onClick={confirmRejection} 
              variant="destructive"
              disabled={!rejectionReason.trim()}
            >
              반려
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}