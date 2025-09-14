'use client'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { UnifiedDocument } from '@/hooks/use-unified-documents'

interface PartnerViewProps {
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
  companyId?: string
}

export default function PartnerView({
  documents,
  loading,
  viewMode,
  selectedDocuments,
  onSelectionChange,
  onDocumentAction,
  onDocumentClick,
  pagination,
  onPageChange,
  companyId
}: PartnerViewProps) {
  
  // 기성청구 문서 필터링
  const invoiceDocuments = documents.filter(doc => doc.category_type === 'invoice')
  const sharedDocuments = documents.filter(doc => doc.category_type === 'shared')
  const otherDocuments = documents.filter(doc => 
    !['invoice', 'shared'].includes(doc.category_type)
  )
  
  // 문서 선택 토글
  const toggleSelection = (documentId: string) => {
    if (selectedDocuments.includes(documentId)) {
      onSelectionChange(selectedDocuments.filter(id => id !== documentId))
    } else {
      onSelectionChange([...selectedDocuments, documentId])
    }
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
            검토중
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
  
  // 문서 카드 렌더링
  const renderDocumentCard = (document: UnifiedDocument, isInvoice: boolean = false) => {
    const Icon = isInvoice ? Package : FileText
    
    return (
      <Card key={document.id} className={`hover:shadow-lg transition-shadow ${isInvoice ? 'border-yellow-200' : ''}`}>
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
                {isInvoice && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onDocumentAction('edit', [document.id])}>
                      <Edit3 className="h-4 w-4 mr-2" />
                      수정
                    </DropdownMenuItem>
                    {document.workflow_status !== 'approved' && (
                      <DropdownMenuItem 
                        onClick={() => onDocumentAction('delete', [document.id])}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        삭제
                      </DropdownMenuItem>
                    )}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <button
            onClick={() => onDocumentClick(document)}
            className="w-full text-left"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 rounded ${isInvoice ? 'bg-yellow-100' : 'bg-gray-100'}`}>
                <Icon className={`h-6 w-6 ${isInvoice ? 'text-yellow-600' : 'text-gray-600'}`} />
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
              {getStatusBadge(document.workflow_status || document.status)}
              
              {document.site && (
                <p className="text-sm text-gray-500">
                  <Building2 className="h-3 w-3 inline mr-1" />
                  {document.site.name}
                </p>
              )}
              
              {isInvoice && document.metadata?.amount && (
                <p className="text-sm font-medium text-yellow-600">
                  청구금액: {new Intl.NumberFormat('ko-KR', { 
                    style: 'currency', 
                    currency: 'KRW' 
                  }).format(document.metadata.amount)}
                </p>
              )}
              
              <div className="text-xs text-gray-400">
                {format(new Date(document.created_at), 'yyyy-MM-dd', { locale: ko })}
              </div>
            </div>
          </button>
        </CardContent>
      </Card>
    )
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600"></div>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* 파트너사 정보 알림 */}
      <Alert>
        <Building2 className="h-4 w-4" />
        <AlertDescription>
          귀사의 문서만 표시됩니다. 기성청구 문서는 자유롭게 관리하실 수 있으며, 
          공유문서는 열람만 가능합니다.
        </AlertDescription>
      </Alert>
      
      {/* 선택 도구바 */}
      {selectedDocuments.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg flex items-center justify-between">
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
              variant="destructive"
              onClick={() => onDocumentAction('delete', selectedDocuments)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              삭제
            </Button>
          </div>
        </div>
      )}
      
      {/* 기성청구 문서 섹션 */}
      {invoiceDocuments.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Package className="h-5 w-5 text-yellow-600" />
              기성청구 문서
              <Badge variant="secondary">{invoiceDocuments.length}</Badge>
            </h3>
            <Button
              size="sm"
              onClick={() => onDocumentAction('create_invoice', [])}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              새 청구서 작성
            </Button>
          </div>
          
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {invoiceDocuments.map(doc => renderDocumentCard(doc, true))}
            </div>
          ) : (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b bg-yellow-50 dark:bg-yellow-900/20">
                    <tr>
                      <th className="text-left p-4">
                        <Checkbox />
                      </th>
                      <th className="text-left p-4 font-medium">문서명</th>
                      <th className="text-left p-4 font-medium">현장</th>
                      <th className="text-left p-4 font-medium">청구금액</th>
                      <th className="text-left p-4 font-medium">상태</th>
                      <th className="text-left p-4 font-medium">작성일</th>
                      <th className="text-left p-4 font-medium">작업</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceDocuments.map(document => (
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
                            className="text-left hover:text-yellow-600 font-medium"
                          >
                            {document.title || document.file_name}
                          </button>
                        </td>
                        <td className="p-4">
                          <p className="text-sm">{document.site?.name || '-'}</p>
                        </td>
                        <td className="p-4">
                          <p className="font-medium">
                            {document.metadata?.amount ? 
                              new Intl.NumberFormat('ko-KR', { 
                                style: 'currency', 
                                currency: 'KRW' 
                              }).format(document.metadata.amount) : 
                              '-'
                            }
                          </p>
                        </td>
                        <td className="p-4">
                          {getStatusBadge(document.workflow_status || document.status)}
                        </td>
                        <td className="p-4">
                          <p className="text-sm">
                            {format(new Date(document.created_at), 'yyyy-MM-dd')}
                          </p>
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
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => onDocumentAction('edit', [document.id])}>
                                <Edit3 className="h-4 w-4 mr-2" />
                                수정
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}
      
      {/* 공유문서 섹션 */}
      {sharedDocuments.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <Share2 className="h-5 w-5 text-blue-600" />
            공유문서
            <Badge variant="secondary">{sharedDocuments.length}</Badge>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sharedDocuments.map(doc => renderDocumentCard(doc, false))}
          </div>
        </div>
      )}
      
      {/* 문서가 없을 때 */}
      {documents.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">등록된 문서가 없습니다</p>
            <Button
              onClick={() => onDocumentAction('create_invoice', [])}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              첫 기성청구서 작성하기
            </Button>
          </CardContent>
        </Card>
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