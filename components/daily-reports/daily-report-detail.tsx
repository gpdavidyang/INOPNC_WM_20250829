'use client'

import { openFileRecordInNewTab } from '@/lib/files/preview'

//  // TODO: Implement when table exists

interface DailyReportDetailProps {
  report: DailyReport & {
    site?: unknown
    work_logs?: unknown[]
    work_records?: unknown[]
    created_by_profile?: unknown
    approved_by_profile?: unknown
    workers?: unknown[]
    beforePhotos?: unknown[]
    afterPhotos?: unknown[]
    receipts?: unknown[]
    documents?: unknown[]
    component_name?: string
    work_process?: string
    work_section?: string
    hq_request?: string
  }
  currentUser: Profile
}

export default function DailyReportDetail({ report, currentUser }: DailyReportDetailProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [attachments, setAttachments] = useState<any[]>([])
  const [showDetailedWorkLogs, setShowDetailedWorkLogs] = useState(false)
  const [showAttendanceDetails, setShowAttendanceDetails] = useState(false)

  const buildFileRecord = (file: any, defaultName: string) => {
    if (!file) return {}
    if (typeof file === 'string') {
      return {
        file_url: file,
        file_name: defaultName,
        title: defaultName,
      }
    }
    const metadata =
      file && typeof file === 'object' && file.metadata && typeof file.metadata === 'object'
        ? (file.metadata as Record<string, any>)
        : {}
    return {
      file_url: file.url || file.image_url || file.file_url || metadata.url,
      storage_bucket: file.storage_bucket || metadata.storage_bucket || undefined,
      storage_path:
        file.storage_path || file.path || metadata.storage_path || metadata.path || undefined,
      file_name: file.filename || file.file_name || file.store_name || defaultName,
      title: file.filename || file.file_name || file.store_name || defaultName,
    }
  }

  const handleOpenFile = async (file: any, defaultName: string) => {
    const reference = buildFileRecord(file, defaultName)
    try {
      if (!reference.file_url && !reference.storage_path) {
        if (typeof file === 'string' && file) {
          window.open(file, '_blank', 'noopener,noreferrer')
        } else {
          alert('파일 정보를 찾을 수 없습니다.')
        }
        return
      }
      await openFileRecordInNewTab(reference)
    } catch (error) {
      console.error('파일 열기 실패', error)
      if (reference.file_url) {
        window.open(reference.file_url, '_blank', 'noopener,noreferrer')
      } else {
        alert('파일을 열 수 없습니다. 잠시 후 다시 시도해 주세요.')
      }
    }
  }

  // Load attachments
  // TODO: Implement when file attachments are available
  // useState(() => {
  //   getFileAttachments('daily_report', report.id).then(result => {
  //     if (result.success && result.data) {
  //       setAttachments(result.data)
  //     }
  //   })
  // })

  const canEdit = report.created_by === currentUser.id && report.status === 'draft'

  const getStatusBadge = (status: string) => {
    const statusConfig: unknown = {
      draft: { label: '작성중', variant: 'secondary', icon: Clock },
      submitted: { label: '제출됨', variant: 'default', icon: FileText },
      approved: { label: '승인됨', variant: 'success', icon: CheckCircle },
      rejected: { label: '반려됨', variant: 'error', icon: XCircle },
    }

    const config = statusConfig[status] || statusConfig.draft
    const Icon = config.icon

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
          status === 'approved'
            ? 'bg-green-100 text-green-800'
            : status === 'rejected'
              ? 'bg-red-100 text-red-800'
              : status === 'submitted'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-800'
        }`}
      >
        <Icon className="h-3 w-3" />
        {config.label}
      </span>
    )
  }

  const totalWorkerCount = 0 // report.work_logs?.reduce((sum: unknown, log: unknown) => sum + (log.worker_count || 0), 0) || 0
  const totalMaterialUsage = 0 // report.work_logs?.reduce((sum: unknown, log: unknown) => sum + (log.work_log_materials?.length || 0), 0) || 0

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header - 시공업체 스타일과 동일한 구조 */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  작업일지 상세
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {new Date((report as unknown).report_date || report.work_date).toLocaleDateString(
                    'ko-KR',
                    {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      weekday: 'short',
                    }
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {getStatusBadge(report.status || 'draft')}
              {canEdit && (
                <Button
                  variant="outline"
                  size="compact"
                  onClick={() => router.push(`/dashboard/daily-reports/${report.id}/edit`)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  수정
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-3">
          {/* Basic Information - 시공업체 스타일과 동일한 카드 기반 레이아웃 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-3 py-3 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                기본 정보
              </h2>
            </div>
            <div className="px-3 py-3">
              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">
                      작업일자
                    </label>
                    <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {new Date(
                          (report as unknown).report_date || report.work_date
                        ).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          weekday: 'short',
                        })}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">
                      현장명
                    </label>
                    <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                      <Users className="h-4 w-4" />
                      <span>{report.site?.name || '-'}</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">
                      작성자
                    </label>
                    <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                      <Users className="h-4 w-4" />
                      {report.created_by ? (
                        // eslint-disable-next-line @next/next/no-html-link-for-pages
                        <a
                          href={`/dashboard/admin/users/${report.created_by}`}
                          className="underline-offset-2 hover:underline"
                        >
                          {report.created_by_profile?.full_name || report.created_by}
                        </a>
                      ) : (
                        <span>{report.created_by_profile?.full_name || '-'}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">
                      총 투입 인원
                    </label>
                    <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                      <Users className="h-4 w-4" />
                      <span>{totalWorkerCount}명</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">
                      작성일시
                    </label>
                    <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                      <Clock className="h-4 w-4" />
                      <span>{new Date(report.created_at).toLocaleString('ko-KR')}</span>
                    </div>
                  </div>
                </div>
              </div>

              {report.approved_by && (
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">
                        승인자
                      </label>
                      <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                        <CheckCircle className="h-4 w-4" />
                        {report.approved_by ? (
                          // eslint-disable-next-line @next/next/no-html-link-for-pages
                          <a
                            href={`/dashboard/admin/users/${report.approved_by}`}
                            className="underline-offset-2 hover:underline"
                          >
                            {report.approved_by_profile?.full_name || report.approved_by}
                          </a>
                        ) : (
                          <span>{report.approved_by_profile?.full_name || '-'}</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">
                        승인일시
                      </label>
                      <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                        <Clock className="h-4 w-4" />
                        <span>
                          {report.approved_at
                            ? new Date(report.approved_at).toLocaleString('ko-KR')
                            : '-'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Work Content - 작업 내용 (부재명, 작업공정, 작업구간) */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-3 py-3 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                작업 내용
              </h2>
            </div>
            <div className="px-3 py-3">
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">
                    부재명
                  </label>
                  <p className="text-gray-900 dark:text-gray-100">
                    {(report as unknown).component_name ||
                      (report as unknown).member_name ||
                      '해당 데이터 없음'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">
                    작업공정
                  </label>
                  <p className="text-gray-900 dark:text-gray-100">
                    {(report as unknown).work_process ||
                      (report as unknown).process_type ||
                      '해당 데이터 없음'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">
                    작업구간
                  </label>
                  <p className="text-gray-900 dark:text-gray-100">
                    {(report as unknown).work_section || '해당 데이터 없음'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Worker Information - 작업자 정보 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-3 py-3 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Users className="h-5 w-5" />
                작업자 정보
              </h2>
            </div>
            <div className="px-3 py-3">
              {report.work_records && report.work_records.length > 0 ? (
                <div className="space-y-2">
                  {report.work_records.map((record: unknown) => (
                    <div
                      key={record.id}
                      className="flex justify-between items-center py-1 border-b border-gray-100 dark:border-gray-700 last:border-0"
                    >
                      <span className="text-sm text-gray-900 dark:text-gray-100">
                        {record.worker?.full_name || '이름 없음'}
                      </span>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {record.work_hours ? `${record.work_hours.toFixed(1)}시간` : '0시간'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">해당 데이터 없음</p>
              )}
            </div>
          </div>

          {/* Additional Photos - 추가 사진 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-3 py-3 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Camera className="h-5 w-5" />
                추가 사진
              </h2>
            </div>
            <div className="px-3 py-3">
              {(report as unknown).additional_photos &&
              (report as unknown).additional_photos.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {(report as unknown).additional_photos.map((photo: unknown, index: number) => (
                    <img
                      key={index}
                      src={photo.url || photo}
                      alt={`추가 사진 ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-90"
                      onClick={() => handleOpenFile(photo, `추가 사진 ${index + 1}`)}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">해당 데이터 없음</p>
              )}
            </div>
          </div>

          {/* Before Work Photos - 작업 전 사진 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-3 py-3 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Camera className="h-5 w-5" />
                작업 전 사진
              </h2>
            </div>
            <div className="px-3 py-3">
              {(report as unknown).before_photos && (report as unknown).before_photos.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {(report as unknown).before_photos.map((photo: unknown, index: number) => (
                    <img
                      key={index}
                      src={photo.url || photo}
                      alt={`작업 전 사진 ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-90"
                      onClick={() => handleOpenFile(photo, `작업 전 사진 ${index + 1}`)}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">해당 데이터 없음</p>
              )}
            </div>
          </div>

          {/* After Work Photos - 작업 후 사진 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-3 py-3 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Camera className="h-5 w-5" />
                작업 후 사진
              </h2>
            </div>
            <div className="px-3 py-3">
              {(report as unknown).after_photos && (report as unknown).after_photos.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {(report as unknown).after_photos.map((photo: unknown, index: number) => (
                    <img
                      key={index}
                      src={photo.url || photo}
                      alt={`작업 후 사진 ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-90"
                      onClick={() => handleOpenFile(photo, `작업 후 사진 ${index + 1}`)}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">해당 데이터 없음</p>
              )}
            </div>
          </div>

          {/* Receipt Information - 영수증 정보 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-3 py-3 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                영수증 정보
              </h2>
            </div>
            <div className="px-3 py-3">
              {(report as unknown).receipts && (report as unknown).receipts.length > 0 ? (
                <div className="space-y-2">
                  {(report as unknown).receipts.map((receipt: unknown, index: number) => (
                    <div
                      key={index}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-2"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {receipt.store_name || '상호명 없음'}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {receipt.amount
                              ? `${receipt.amount.toLocaleString()}원`
                              : '금액 정보 없음'}
                          </p>
                        </div>
                        {receipt.image_url && (
                          <button
                            onClick={() =>
                              handleOpenFile(receipt.image_url, receipt.store_name || '영수증')
                            }
                            className="text-xs text-blue-600 hover:text-blue-700"
                          >
                            보기
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">해당 데이터 없음</p>
              )}
            </div>
          </div>

          {/* Request to Headquarters - 본사에게 요청 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-3 py-3 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                본사에게 요청
              </h2>
            </div>
            <div className="px-3 py-3">
              {(report as unknown).headquarters_request ? (
                <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                  {(report as unknown).headquarters_request}
                </p>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">해당 데이터 없음</p>
              )}
            </div>
          </div>

          {/* NPC-1000 Material Management - NPC-1000 자재관리 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-3 py-3 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Package className="h-5 w-5" />
                NPC-1000 자재관리
              </h2>
            </div>
            <div className="px-3 py-3">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">
                    입고
                  </label>
                  <p className="text-gray-900 dark:text-gray-100">
                    {(report as unknown).npc1000_incoming !== null &&
                    (report as unknown).npc1000_incoming !== undefined
                      ? `${(report as unknown).npc1000_incoming}개`
                      : '해당 데이터 없음'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">
                    사용
                  </label>
                  <p className="text-gray-900 dark:text-gray-100">
                    {(report as unknown).npc1000_used !== null &&
                    (report as unknown).npc1000_used !== undefined
                      ? `${(report as unknown).npc1000_used}개`
                      : '해당 데이터 없음'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">
                    잔량
                  </label>
                  <p className="text-gray-900 dark:text-gray-100">
                    {(report as unknown).npc1000_remaining !== null &&
                    (report as unknown).npc1000_remaining !== undefined
                      ? `${(report as unknown).npc1000_remaining}개`
                      : '해당 데이터 없음'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Special Notes - 특이 사항 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-3 py-3 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                특이 사항
              </h2>
            </div>
            <div className="px-3 py-3">
              {(report as unknown).issues || (report as unknown).notes ? (
                <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                  {(report as unknown).issues || (report as unknown).notes}
                </p>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">해당 데이터 없음</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Approval Dialog - 제거됨 */}
      {false && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <Card className="w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">작업일지 반려</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">반려 사유</label>
              <Textarea
                value={approvalComments}
                onChange={e => setApprovalComments(e.target.value)}
                placeholder="반려 사유를 입력하세요"
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowApprovalDialog(false)}
                disabled={loading}
              >
                취소
              </Button>
              <Button
                variant="danger"
                onClick={() => handleApproval(false)}
                disabled={loading || !approvalComments}
              >
                반려하기
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
