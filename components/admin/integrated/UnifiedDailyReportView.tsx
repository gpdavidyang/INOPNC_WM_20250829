'use client'

import { useState, useEffect } from 'react'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  X, 
  Calendar, 
  MapPin, 
  Users, 
  FileText, 
  Building2,
  User,
  Phone,
  Mail,
  Activity,
  Clock,
  Package,
  AlertCircle
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface UnifiedDailyReportViewProps {
  reportId: string
  isOpen: boolean
  onClose: () => void
}

interface IntegratedReportData {
  daily_report: any
  site: any
  primary_customer: any
  all_customers: unknown[]
  worker_assignments: unknown[]
  worker_statistics: any
  documents: Record<string, any[]>
  document_counts: Record<string, number>
  material_usage: any
  related_reports: unknown[]
  report_author: any
}

export default function UnifiedDailyReportView({ reportId, isOpen, onClose }: UnifiedDailyReportViewProps) {
  const [data, setData] = useState<IntegratedReportData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && reportId) {
      fetchIntegratedData()
    }
  }, [reportId, isOpen])

  const fetchIntegratedData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/admin/daily-reports/${reportId}/integrated`)
      if (!response.ok) {
        throw new Error('Failed to fetch integrated report data')
      }
      
      const result = await response.json()
      setData(result)
    } catch (err) {
      setError('데이터를 불러오는데 실패했습니다.')
      console.error('Error fetching integrated report data:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5" />
              <span>작업일지 통합 보기</span>
              {data?.daily_report && (
                <Badge variant={data.daily_report.status === 'submitted' ? 'default' : 'secondary'}>
                  {data.daily_report.status === 'submitted' ? '제출됨' : '임시저장'}
                </Badge>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full text-red-600">
              <AlertCircle className="h-5 w-5 mr-2" />
              {error}
            </div>
          ) : data ? (
            <Tabs defaultValue="overview" className="flex-1 flex flex-col">
              <TabsList className="flex-shrink-0">
                <TabsTrigger value="overview">개요</TabsTrigger>
                <TabsTrigger value="site">현장 정보</TabsTrigger>
                <TabsTrigger value="workers">작업자</TabsTrigger>
                <TabsTrigger value="materials">자재 사용</TabsTrigger>
                <TabsTrigger value="documents">문서</TabsTrigger>
                <TabsTrigger value="related">관련 보고서</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="flex-1 overflow-auto space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Information */}
                  <div className="bg-white rounded-lg border p-4">
                    <h3 className="font-semibold mb-4 flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      기본 정보
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">작업일자:</span>
                        <span className="font-medium">{data.daily_report.work_date}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">부재명:</span>
                        <span className="font-medium">{data.daily_report.member_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">공정:</span>
                        <span className="font-medium">{data.daily_report.process_type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">총 작업자:</span>
                        <span className="font-medium">{data.daily_report.total_workers}명</span>
                      </div>
                    </div>
                  </div>

                  {/* Site Information */}
                  <div className="bg-white rounded-lg border p-4">
                    <h3 className="font-semibold mb-4 flex items-center">
                      <MapPin className="h-4 w-4 mr-2" />
                      현장 정보
                    </h3>
                    {data.site ? (
                      <div className="space-y-3">
                        <div>
                          <span className="text-gray-600">현장명:</span>
                          <p className="font-medium">{data.site.name}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">주소:</span>
                          <p className="text-sm text-gray-700">{data.site.address}</p>
                        </div>
                        {data.site.manager_name && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">담당자:</span>
                            <span className="font-medium">{data.site.manager_name}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-500">현장 정보가 없습니다.</p>
                    )}
                  </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-blue-600">총 작업자</p>
                        <p className="text-xl font-bold text-blue-700">
                          {data.worker_statistics.total_workers}명
                        </p>
                      </div>
                      <Users className="h-6 w-6 text-blue-500" />
                    </div>
                  </div>

                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-green-600">총 근무시간</p>
                        <p className="text-xl font-bold text-green-700">
                          {data.worker_statistics.total_hours}시간
                        </p>
                      </div>
                      <Clock className="h-6 w-6 text-green-500" />
                    </div>
                  </div>

                  <div className="bg-yellow-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-yellow-600">총 문서</p>
                        <p className="text-xl font-bold text-yellow-700">
                          {Object.values(data.document_counts).reduce((a, b) => a + b, 0)}개
                        </p>
                      </div>
                      <FileText className="h-6 w-6 text-yellow-500" />
                    </div>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-purple-600">NPC-1000 사용률</p>
                        <p className="text-xl font-bold text-purple-700">
                          {data.material_usage.usage_rate}
                        </p>
                      </div>
                      <Package className="h-6 w-6 text-purple-500" />
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Site Tab */}
              <TabsContent value="site" className="flex-1 overflow-auto">
                {data.site ? (
                  <div className="space-y-6">
                    <div className="bg-white rounded-lg border p-6">
                      <h3 className="font-semibold mb-4">현장 상세 정보</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium text-gray-600">현장명</label>
                            <p className="text-lg font-medium">{data.site.name}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">주소</label>
                            <p className="text-gray-700">{data.site.address}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">상태</label>
                            <Badge className="ml-2">
                              {data.site.status === 'active' ? '활성' : 
                               data.site.status === 'completed' ? '완료' : '비활성'}
                            </Badge>
                          </div>
                        </div>
                        <div className="space-y-4">
                          {data.site.manager_name && (
                            <div>
                              <label className="text-sm font-medium text-gray-600">현장 담당자</label>
                              <p className="font-medium">{data.site.manager_name}</p>
                            </div>
                          )}
                          {data.site.safety_manager_name && (
                            <div>
                              <label className="text-sm font-medium text-gray-600">안전 담당자</label>
                              <p className="font-medium">{data.site.safety_manager_name}</p>
                            </div>
                          )}
                          <div>
                            <label className="text-sm font-medium text-gray-600">프로젝트 기간</label>
                            <p className="text-gray-700">
                              {data.site.start_date} ~ {data.site.end_date || '진행중'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Customer Information */}
                    {data.all_customers && data.all_customers.length > 0 && (
                      <div className="bg-white rounded-lg border p-6">
                        <h3 className="font-semibold mb-4">고객사 정보</h3>
                        <div className="space-y-4">
                          {data.all_customers.map((customer, index) => (
                            <div key={index} className="border rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium">{customer.name}</h4>
                                <div className="flex gap-2">
                                  <Badge variant={customer.is_primary_customer ? 'default' : 'secondary'}>
                                    {customer.is_primary_customer ? '주요 고객사' : '협력사'}
                                  </Badge>
                                  <Badge variant="outline">
                                    {customer.relationship_type}
                                  </Badge>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                {customer.contact_person && (
                                  <div>
                                    <span className="text-gray-600">담당자: </span>
                                    <span>{customer.contact_person}</span>
                                  </div>
                                )}
                                {customer.phone && (
                                  <div>
                                    <span className="text-gray-600">전화: </span>
                                    <span>{customer.phone}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    현장 정보가 없습니다.
                  </div>
                )}
              </TabsContent>

              {/* Workers Tab */}
              <TabsContent value="workers" className="flex-1 overflow-auto">
                <div className="space-y-6">
                  {/* Worker Statistics */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg border p-4">
                      <h4 className="font-medium mb-2">출근 현황</h4>
                      <div className="text-2xl font-bold text-green-600">
                        {data.worker_statistics.total_workers - data.worker_statistics.absent_workers}명
                      </div>
                      <div className="text-sm text-gray-600">
                        총 {data.worker_statistics.total_workers}명 중 출근
                      </div>
                    </div>
                    <div className="bg-white rounded-lg border p-4">
                      <h4 className="font-medium mb-2">총 근무시간</h4>
                      <div className="text-2xl font-bold text-blue-600">
                        {data.worker_statistics.total_hours}시간
                      </div>
                      <div className="text-sm text-gray-600">
                        연장: {data.worker_statistics.total_overtime}시간
                      </div>
                    </div>
                    <div className="bg-white rounded-lg border p-4">
                      <h4 className="font-medium mb-2">결근</h4>
                      <div className="text-2xl font-bold text-red-600">
                        {data.worker_statistics.absent_workers}명
                      </div>
                      <div className="text-sm text-gray-600">전체 인원 대비</div>
                    </div>
                  </div>

                  {/* Worker List */}
                  {data.worker_assignments && data.worker_assignments.length > 0 ? (
                    <div className="bg-white rounded-lg border">
                      <div className="p-4 border-b">
                        <h3 className="font-semibold">작업자 목록</h3>
                      </div>
                      <div className="divide-y">
                        {data.worker_assignments.map((assignment, index) => (
                          <div key={index} className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                  <User className="h-5 w-5 text-gray-600" />
                                </div>
                                <div>
                                  <p className="font-medium">
                                    {assignment.profiles?.full_name || '이름 없음'}
                                  </p>
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Badge variant="outline" size="sm">
                                      {assignment.trade_type || '일반'}
                                    </Badge>
                                    <Badge variant="outline" size="sm">
                                      {assignment.skill_level || '견습'}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className={`font-medium ${assignment.is_present ? 'text-green-600' : 'text-red-600'}`}>
                                  {assignment.is_present ? '출근' : '결근'}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {assignment.labor_hours || 0}시간
                                  {assignment.overtime_hours > 0 && ` (+${assignment.overtime_hours})`}
                                </div>
                              </div>
                            </div>
                            {assignment.notes && (
                              <div className="mt-2 text-sm text-gray-600 ml-13">
                                {assignment.notes}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      작업자 정보가 없습니다.
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Materials Tab */}
              <TabsContent value="materials" className="flex-1 overflow-auto">
                <div className="bg-white rounded-lg border p-6">
                  <h3 className="font-semibold mb-4 flex items-center">
                    <Package className="h-4 w-4 mr-2" />
                    NPC-1000 자재 사용 현황
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {data.material_usage.npc1000_incoming}L
                      </div>
                      <div className="text-sm text-gray-600">입고량</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {data.material_usage.npc1000_used}L
                      </div>
                      <div className="text-sm text-gray-600">사용량</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">
                        {data.material_usage.npc1000_remaining}L
                      </div>
                      <div className="text-sm text-gray-600">잔량</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {data.material_usage.usage_rate}
                      </div>
                      <div className="text-sm text-gray-600">사용률</div>
                    </div>
                  </div>
                  
                  {/* Usage Progress Bar */}
                  <div className="mt-6">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>사용 진행률</span>
                      <span>{data.material_usage.usage_rate}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                        style={{ 
                          width: data.material_usage.usage_rate
                        }}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Documents Tab */}
              <TabsContent value="documents" className="flex-1 overflow-auto">
                <div className="space-y-4">
                  {Object.entries(data.documents).map(([type, docs]) => (
                    <div key={type} className="bg-white rounded-lg border">
                      <div className="p-4 border-b">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold capitalize">
                            {type === 'photo' ? '사진' :
                             type === 'receipt' ? '영수증' :
                             type === 'document' ? '문서' : type}
                          </h3>
                          <Badge variant="outline">
                            {docs.length}개
                          </Badge>
                        </div>
                      </div>
                      <div className="p-4">
                        {docs.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {docs.map((doc, index) => (
                              <div key={index} className="border rounded-lg p-3">
                                <div className="flex items-start justify-between mb-2">
                                  <h4 className="font-medium text-sm truncate">
                                    {doc.title || doc.file_name}
                                  </h4>
                                  <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                </div>
                                {doc.description && (
                                  <p className="text-xs text-gray-600 mb-2">{doc.description}</p>
                                )}
                                <div className="flex items-center justify-between text-xs text-gray-500">
                                  <span>{doc.profiles?.full_name || '알 수 없음'}</span>
                                  <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            {type} 문서가 없습니다.
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* Related Reports Tab */}
              <TabsContent value="related" className="flex-1 overflow-auto">
                {data.related_reports && data.related_reports.length > 0 ? (
                  <div className="bg-white rounded-lg border">
                    <div className="p-4 border-b">
                      <h3 className="font-semibold">동일 현장 관련 작업일지</h3>
                    </div>
                    <div className="divide-y">
                      {data.related_reports.map((report, index) => (
                        <div key={index} className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <Calendar className="h-4 w-4 text-gray-400" />
                                <span className="font-medium">{report.work_date}</span>
                                <Badge variant={report.status === 'submitted' ? 'default' : 'secondary'}>
                                  {report.status === 'submitted' ? '제출됨' : '임시저장'}
                                </Badge>
                              </div>
                              <div className="text-sm text-gray-600">
                                {report.member_name} • {report.process_type}
                              </div>
                              <div className="text-sm text-gray-500">
                                작업자 {report.total_workers}명
                              </div>
                            </div>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              보기
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    관련된 작업일지가 없습니다.
                  </div>
                )}
              </TabsContent>
            </Tabs>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}