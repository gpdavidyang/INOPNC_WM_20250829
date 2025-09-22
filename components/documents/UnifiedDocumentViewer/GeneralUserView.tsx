'use client'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { UnifiedDocument } from '@/hooks/use-unified-documents'

interface GeneralUserViewProps {
  documents: UnifiedDocument[]
  loading: boolean
  viewMode: 'list' | 'grid'
  selectedDocuments: string[]
  onSelectionChange: (ids: string[]) => void
  onDocumentAction: (action: string, documentIds: string[]) => void
  onDocumentClick: (document: UnifiedDocument) => void
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  onPageChange: (page: number) => void
}

export default function GeneralUserView({
  documents,
  loading,
  viewMode,
  selectedDocuments,
  onSelectionChange,
  onDocumentAction,
  onDocumentClick,
  pagination,
  onPageChange
}: GeneralUserViewProps) {
  
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
  
  // 문서 타입 아이콘
  const getDocumentIcon = (document: UnifiedDocument) => {
    if (document.category_type === 'markup' || document.category_type === 'photo_grid') {
      return Image
    }
    return FileText
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
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }
  
  if (documents.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">문서가 없습니다</p>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <div className="space-y-4">
      {/* 선택 도구바 */}
      {selectedDocuments.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg flex items-center justify-between">
          <span className="text-sm font-medium">
            {selectedDocuments.length}개 문서 선택됨
          </span>
          <div className="flex gap-2">
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
              variant="outline"
              onClick={() => onDocumentAction('share', selectedDocuments)}
            >
              <Share2 className="h-4 w-4 mr-2" />
              공유
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
      
      {/* 리스트 뷰 */}
      {viewMode === 'list' ? (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
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
                  <th className="text-left p-4 font-medium">상태</th>
                  <th className="text-left p-4 font-medium">업로드</th>
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
                        <p className="text-sm">{document.site?.name || '-'}</p>
                      </td>
                      <td className="p-4">
                        {getStatusBadge(document.workflow_status || document.status)}
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          <p>{document.uploader?.full_name || '알 수 없음'}</p>
                          <p className="text-gray-500">
                            {formatDistanceToNow(new Date(document.created_at), { 
                              addSuffix: true, 
                              locale: ko 
                            })}
                          </p>
                        </div>
                      </td>
                      <td className="p-4">
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
                            <DropdownMenuItem onClick={() => onDocumentAction('download', [document.id])}>
                              <Download className="h-4 w-4 mr-2" />
                              다운로드
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onDocumentAction('share', [document.id])}>
                              <Share2 className="h-4 w-4 mr-2" />
                              공유
                            </DropdownMenuItem>
                            {document.uploaded_by === document.uploader?.id && (
                              <>
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
                              </>
                            )}
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
                        <DropdownMenuItem onClick={() => onDocumentAction('download', [document.id])}>
                          <Download className="h-4 w-4 mr-2" />
                          다운로드
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDocumentAction('share', [document.id])}>
                          <Share2 className="h-4 w-4 mr-2" />
                          공유
                        </DropdownMenuItem>
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
                      
                      {document.site && (
                        <p className="text-sm text-gray-500">
                          현장: {document.site.name}
                        </p>
                      )}
                      
                      <div className="text-xs text-gray-400">
                        {document.uploader?.full_name} · 
                        {formatDistanceToNow(new Date(document.created_at), { 
                          addSuffix: true, 
                          locale: ko 
                        })}
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
    </div>
  )
}