'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Calendar,
  MapPin,
  User,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Package,
  Users,
  Shield,
  Wrench,
  Camera,
  Download,
  Printer,
  Share2,
  Edit,
  Trash2,
  Building2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import type { DailyReport, Site, Profile } from '@/types'
import type { DailyReportFormData } from '@/types/daily-reports'

interface DailyReportDetailViewProps {
  report: DailyReport & {
    site?: Site
    created_by_profile?: Profile
    approved_by_profile?: Profile
    formData?: DailyReportFormData
  }
  currentUser: Profile
  onEdit?: () => void
  onDelete?: () => void
  onApprove?: () => void
  onReject?: () => void
}

export function DailyReportDetailView({
  report,
  currentUser,
  onEdit,
  onDelete,
  onApprove,
  onReject
}: DailyReportDetailViewProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [showActions, setShowActions] = useState(false)

  const canEdit = currentUser.id === report.created_by && report.status === 'draft'
  const canDelete = currentUser.id === report.created_by && report.status === 'draft'

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge className="bg-gray-100 text-gray-800">임시저장</Badge>
      case 'submitted':
        return <Badge className="bg-blue-100 text-blue-800">제출됨</Badge>
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">승인됨</Badge>
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">반려됨</Badge>
      default:
        return null
    }
  }


  const formData = report.formData || {}

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold">작업일지 상세</h1>
              {getStatusBadge(report.status || 'draft')}
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{format(new Date(report.work_date), 'yyyy년 MM월 dd일 (EEEE)', { locale: ko })}</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>{report.site?.name}</span>
              </div>
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                <span>{report.created_by_profile?.full_name}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{format(new Date(report.created_at), 'yyyy.MM.dd HH:mm')}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="compact">
              <Download className="w-4 h-4 mr-1" />
              다운로드
            </Button>
            <Button variant="outline" size="compact">
              <Printer className="w-4 h-4 mr-1" />
              인쇄
            </Button>
            <Button variant="outline" size="compact">
              <Share2 className="w-4 h-4 mr-1" />
              공유
            </Button>
            {(canEdit || canDelete) && (
              <div className="relative">
                <Button
                  variant="outline"
                  size="compact"
                  onClick={() => setShowActions(!showActions)}
                >
                  <span className="sr-only">작업</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </Button>
                {showActions && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-10">
                    {canEdit && (
                      <button
                        onClick={onEdit}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-gray-100"
                      >
                        <Edit className="w-4 h-4" />
                        수정
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={onDelete}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-gray-100 text-red-600 border-t"
                      >
                        <Trash2 className="w-4 h-4" />
                        삭제
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Approval Info */}
        {report.status === 'approved' && report.approved_by_profile && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">승인됨</span>
              <span className="text-sm">
                - {report.approved_by_profile.full_name} ({format(new Date(report.approved_at!), 'yyyy.MM.dd HH:mm')})
              </span>
            </div>
          </div>
        )}

        {report.status === 'rejected' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
            <div className="flex items-center gap-2 text-red-800">
              <XCircle className="w-5 h-5" />
              <span className="font-medium">반려됨</span>
              <span className="text-sm">
                - 반려 사유를 확인하고 수정 후 다시 제출해주세요
              </span>
            </div>
          </div>
        )}
      </Card>

      {/* Content Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('overview')}
              className={cn(
                'px-6 py-3 text-sm font-medium border-b-2 transition-colors',
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              )}
            >
              개요
            </button>
            <button
              onClick={() => setActiveTab('details')}
              className={cn(
                'px-6 py-3 text-sm font-medium border-b-2 transition-colors',
                activeTab === 'details'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              )}
            >
              상세내역
            </button>
            <button
              onClick={() => setActiveTab('materials')}
              className={cn(
                'px-6 py-3 text-sm font-medium border-b-2 transition-colors',
                activeTab === 'materials'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              )}
            >
              자재/장비
            </button>
            <button
              onClick={() => setActiveTab('safety')}
              className={cn(
                'px-6 py-3 text-sm font-medium border-b-2 transition-colors',
                activeTab === 'safety'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              )}
            >
              안전/품질
            </button>
            <button
              onClick={() => setActiveTab('photos')}
              className={cn(
                'px-6 py-3 text-sm font-medium border-b-2 transition-colors',
                activeTab === 'photos'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              )}
            >
              사진
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Work Content */}
              <Card className="p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-gray-600" />
                  작업 내용
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <dt className="text-sm text-gray-600 mb-1">부재명</dt>
                    <dd className="font-medium text-lg">{report.member_name || '-'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-600 mb-1">공정</dt>
                    <dd className="font-medium text-lg">{report.process_type || '-'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-600 mb-1">작업구간</dt>
                    <dd className="font-medium text-lg">{formData.work_section || '-'}</dd>
                  </div>
                </div>
              </Card>

              {/* Worker Input - Individual Workers */}
              <Card className="p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Users className="w-5 h-5 text-gray-600" />
                  작업자 입력
                </h3>
                {(formData as any).workers && (formData as any).workers.length > 0 ? (
                  <div className="space-y-3">
                    {(formData as any).workers.map((worker: any, index: number) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <User className="w-5 h-5 text-gray-500" />
                          <div>
                            <p className="font-medium">{worker.name}</p>
                            <p className="text-sm text-gray-600">{worker.position || '작업자'}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">{worker.hours || 8}시간</p>
                          <p className="text-sm text-gray-600">{(worker.hours || 8) / 8} 공수</p>
                        </div>
                      </div>
                    ))}
                    <div className="border-t pt-3 mt-3">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">총 작업인원: {(formData as any).workers.length}명</span>
                        <span className="font-semibold text-lg">
                          총 {(formData as any).workers.reduce((sum: number, worker: any) => sum + (worker.hours || 8), 0)}시간
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">총 작업인원</span>
                    <span className="font-bold text-lg">{report.total_workers || 0}명</span>
                  </div>
                )}
              </Card>



              {/* Issues */}
              {report.issues && (
                <Card className="p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-orange-600" />
                    특이사항
                  </h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{report.issues}</p>
                </Card>
              )}
            </div>
          )}

          {/* Details Tab */}
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Work Logs */}
              {(formData as any).work_logs && (formData as any).work_logs.length > 0 && (
                <Card className="p-4">
                  <h3 className="font-semibold mb-3">작업 내역</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">작업 유형</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">위치</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">상세 내용</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">인원</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {(formData as any).work_logs.map((log: any, index: number) => (
                          <tr key={index}>
                            <td className="px-4 py-2">{log.work_type}</td>
                            <td className="px-4 py-2">{log.location}</td>
                            <td className="px-4 py-2">{log.description}</td>
                            <td className="px-4 py-2">{log.worker_count}명</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}

              {/* Subcontractor Workers */}
              {(formData as any).subcontractor_workers && (formData as any).subcontractor_workers.length > 0 && (
                <Card className="p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-gray-600" />
                    협력업체 작업인원
                  </h3>
                  <div className="space-y-2">
                    {(formData as any).subcontractor_workers.map((sub: any, index: number) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <div>
                          <p className="font-medium">{sub.subcontractor_name}</p>
                          {sub.work_type && <p className="text-sm text-gray-600">{sub.work_type}</p>}
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{sub.worker_count}명</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* Materials Tab */}
          {activeTab === 'materials' && (
            <div className="space-y-6">
              {/* Material Usage */}
              {(formData as any).material_usage && (formData as any).material_usage.length > 0 && (
                <Card className="p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Package className="w-5 h-5 text-gray-600" />
                    자재 사용 내역
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">자재명</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">수량</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">단위</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">비고</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {(formData as any).material_usage.map((material: any, index: number) => (
                          <tr key={index}>
                            <td className="px-4 py-2">{material.material_name}</td>
                            <td className="px-4 py-2">{material.quantity}</td>
                            <td className="px-4 py-2">{material.unit || 'EA'}</td>
                            <td className="px-4 py-2">{material.notes || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}

              {/* Equipment Usage */}
              {(formData as any).equipment_usage && (formData as any).equipment_usage.length > 0 && (
                <Card className="p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Wrench className="w-5 h-5 text-gray-600" />
                    장비 사용 내역
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">장비명</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">사용시간</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">운전자</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">연료</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {(formData as any).equipment_usage.map((equipment: any, index: number) => (
                          <tr key={index}>
                            <td className="px-4 py-2">{equipment.equipment_name}</td>
                            <td className="px-4 py-2">{equipment.hours_used}시간</td>
                            <td className="px-4 py-2">{equipment.operator_name || '-'}</td>
                            <td className="px-4 py-2">{equipment.fuel_consumed ? `${equipment.fuel_consumed}L` : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* Safety Tab */}
          {activeTab === 'safety' && (
            <div className="space-y-6">
              {/* Safety Incidents */}
              {(formData as any).safety_incidents && (formData as any).safety_incidents.length > 0 && (
                <Card className="p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-red-600" />
                    안전 사고
                  </h3>
                  <div className="space-y-3">
                    {(formData as any).safety_incidents.map((incident: any, index: number) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <Badge className={cn(
                            incident.severity === 'critical' && 'bg-red-100 text-red-800',
                            incident.severity === 'major' && 'bg-orange-100 text-orange-800',
                            incident.severity === 'moderate' && 'bg-yellow-100 text-yellow-800',
                            incident.severity === 'minor' && 'bg-green-100 text-green-800'
                          )}>
                            {incident.severity}
                          </Badge>
                          <span className="text-sm text-gray-600">{incident.incident_time}</span>
                        </div>
                        <p className="font-medium mb-1">{incident.description}</p>
                        {incident.location && (
                          <p className="text-sm text-gray-600 mb-1">위치: {incident.location}</p>
                        )}
                        {incident.actions_taken && (
                          <p className="text-sm text-gray-700">조치사항: {incident.actions_taken}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Quality Inspections */}
              {(formData as any).quality_inspections && (formData as any).quality_inspections.length > 0 && (
                <Card className="p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    품질 검사
                  </h3>
                  <div className="space-y-3">
                    {(formData as any).quality_inspections.map((inspection: any, index: number) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">{inspection.inspection_type}</span>
                          <Badge className={cn(
                            inspection.result === 'pass' && 'bg-green-100 text-green-800',
                            inspection.result === 'fail' && 'bg-red-100 text-red-800',
                            inspection.result === 'conditional_pass' && 'bg-yellow-100 text-yellow-800'
                          )}>
                            {inspection.result === 'pass' && '합격'}
                            {inspection.result === 'fail' && '불합격'}
                            {inspection.result === 'conditional_pass' && '조건부 합격'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">검사자: {inspection.inspector_name}</p>
                        {inspection.notes && (
                          <p className="text-sm text-gray-700 mt-2">{inspection.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* Photos Tab */}
          {activeTab === 'photos' && (
            <div className="space-y-6">
              {/* Before Work Photos */}
              <Card className="p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Camera className="w-5 h-5 text-blue-600" />
                  작업전 사진
                </h3>
                {(formData as any).before_photos && (formData as any).before_photos.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {(formData as any).before_photos.map((photo: any, index: number) => (
                      <div key={index} className="relative group">
                        <img
                          src={photo.url || photo.path}
                          alt={`작업전 사진 ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border cursor-pointer hover:opacity-75 transition-opacity"
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-50 rounded-lg">
                          <Button size="sm" variant="secondary">
                            보기
                          </Button>
                        </div>
                        {photo.description && (
                          <p className="text-xs text-gray-600 mt-1 text-center truncate">
                            {photo.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">작업전 사진이 없습니다</p>
                )}
              </Card>

              {/* After Work Photos */}
              <Card className="p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Camera className="w-5 h-5 text-green-600" />
                  작업후 사진
                </h3>
                {(formData as any).after_photos && (formData as any).after_photos.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {(formData as any).after_photos.map((photo: any, index: number) => (
                      <div key={index} className="relative group">
                        <img
                          src={photo.url || photo.path}
                          alt={`작업후 사진 ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border cursor-pointer hover:opacity-75 transition-opacity"
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-50 rounded-lg">
                          <Button size="sm" variant="secondary">
                            보기
                          </Button>
                        </div>
                        {photo.description && (
                          <p className="text-xs text-gray-600 mt-1 text-center truncate">
                            {photo.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">작업후 사진이 없습니다</p>
                )}
              </Card>

              {/* Receipts Section */}
              <Card className="p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-600" />
                  영수증 첨부
                </h3>
                {(formData as any).receipts && (formData as any).receipts.length > 0 ? (
                  <div className="space-y-3">
                    {(formData as any).receipts.map((receipt: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="w-8 h-8 text-gray-500" />
                          <div>
                            <p className="font-medium">{receipt.filename || `영수증_${index + 1}`}</p>
                            <p className="text-sm text-gray-600">
                              {receipt.amount && `₩${receipt.amount.toLocaleString()}`}
                              {receipt.vendor && ` • ${receipt.vendor}`}
                              {receipt.description && ` • ${receipt.description}`}
                            </p>
                            <p className="text-xs text-gray-500">
                              {receipt.date && format(new Date(receipt.date), 'yyyy.MM.dd')}
                              {receipt.file_size && ` • ${(receipt.file_size / 1024).toFixed(1)}KB`}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Download className="w-4 h-4 mr-1" />
                            다운로드
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">영수증이 없습니다</p>
                )}
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}