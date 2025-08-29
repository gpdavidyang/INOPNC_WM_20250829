'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createDailyReport } from '@/app/actions/daily-reports'
// TODO: Re-enable when addWorkLog and addWorkLogMaterials are implemented
// import { addWorkLog, addWorkLogMaterials } from '@/app/actions/daily-reports'
// TODO: Re-enable when functions are implemented
// import { uploadFileAttachment } from '@/app/actions/documents'
// import { addBulkAttendance } from '@/app/actions/attendance'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/custom-select'
import { 
  Calendar, 
  Cloud, 
  Thermometer, 
  Plus, 
  Trash2, 
  Save, 
  Send,
  Upload,
  Users,
  Package,
  Clock
} from 'lucide-react'
import { Site, Profile, Material } from '@/types'

interface DailyReportFormProps {
  sites: Site[]
  currentUser: Profile
  materials?: Material[]
  workers?: Profile[]
}

interface WorkLogEntry {
  id: string
  work_type: string
  location: string
  description: string
  worker_count: number
  materials: Array<{
    material_id: string
    quantity: number
  }>
}

interface AttendanceEntry {
  worker_id: string
  check_in_time: string
  check_out_time: string
  work_type: string
}

export default function DailyReportForm({ 
  sites, 
  currentUser, 
  materials = [], 
  workers = [] 
}: DailyReportFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    site_id: (currentUser as any).site_id || '',
    report_date: new Date().toISOString().split('T')[0],
    member_name: '',
    process_type: '',
    total_workers: 0,
    weather: '',
    temperature_high: '',
    temperature_low: '',
    issues: '',
    notes: ''
  })

  // Work logs state
  const [workLogs, setWorkLogs] = useState<WorkLogEntry[]>([])
  
  // Attendance state
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceEntry[]>([])
  
  // File attachments
  const [attachments, setAttachments] = useState<File[]>([])

  const handleAddWorkLog = () => {
    const newWorkLog: WorkLogEntry = {
      id: `temp-${Date.now()}`,
      work_type: '',
      location: '',
      description: '',
      worker_count: 0,
      materials: []
    }
    setWorkLogs([...workLogs, newWorkLog])
  }

  const handleUpdateWorkLog = (id: string, field: keyof WorkLogEntry, value: any) => {
    setWorkLogs(workLogs.map(log => 
      log.id === id ? { ...log, [field]: value } : log
    ))
  }

  const handleRemoveWorkLog = (id: string) => {
    setWorkLogs(workLogs.filter(log => log.id !== id))
  }

  const handleAddMaterial = (workLogId: string) => {
    setWorkLogs(workLogs.map(log => 
      log.id === workLogId 
        ? { ...log, materials: [...log.materials, { material_id: '', quantity: 0 }] }
        : log
    ))
  }

  const handleUpdateMaterial = (workLogId: string, index: number, field: string, value: any) => {
    setWorkLogs(workLogs.map(log => 
      log.id === workLogId 
        ? {
            ...log,
            materials: log.materials.map((mat, i) => 
              i === index ? { ...mat, [field]: value } : mat
            )
          }
        : log
    ))
  }

  const handleRemoveMaterial = (workLogId: string, index: number) => {
    setWorkLogs(workLogs.map(log => 
      log.id === workLogId 
        ? { ...log, materials: log.materials.filter((_, i) => i !== index) }
        : log
    ))
  }

  const handleAddAttendance = () => {
    setAttendanceRecords([
      ...attendanceRecords,
      {
        worker_id: '',
        check_in_time: '08:00',
        check_out_time: '17:00',
        work_type: ''
      }
    ])
  }

  const handleUpdateAttendance = (index: number, field: keyof AttendanceEntry, value: string) => {
    setAttendanceRecords(attendanceRecords.map((record, i) => 
      i === index ? { ...record, [field]: value } : record
    ))
  }

  const handleRemoveAttendance = (index: number) => {
    setAttendanceRecords(attendanceRecords.filter((_, i) => i !== index))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments([...attachments, ...Array.from(e.target.files)])
    }
  }

  const handleRemoveFile = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index))
  }

  const handleSubmit = async (submitForApproval: boolean = false) => {
    setLoading(true)
    setError(null)

    try {
      // 1. Create daily report
      const reportResult = await createDailyReport({
        site_id: formData.site_id,
        work_date: formData.report_date,
        member_name: formData.member_name || 'Unknown',
        process_type: formData.process_type || 'General',
        total_workers: formData.total_workers || 0,
        issues: formData.issues || ''
        // TODO: Add weather and temperature when schema supports it
        // weather: formData.weather,
        // temperature_high: formData.temperature_high ? parseFloat(formData.temperature_high) : undefined,
        // temperature_low: formData.temperature_low ? parseFloat(formData.temperature_low) : undefined
      })

      if (!reportResult.success || !reportResult.data) {
        throw new Error(reportResult.error || 'Failed to create daily report')
      }

      const dailyReportId = reportResult.data.id

      // TODO: 2. Add work logs when functions are implemented
      // for (const workLog of workLogs) {
      //   const workLogResult = await addWorkLog(dailyReportId, {
      //     work_type: workLog.work_type,
      //     location: workLog.location,
      //     description: workLog.description,
      //     worker_count: workLog.worker_count
      //   })

      //   if (workLogResult.success && workLogResult.data && workLog.materials.length > 0) {
      //     // Add materials to work log
      //     await addWorkLogMaterials(
      //       workLogResult.data.id,
      //       workLog.materials.filter(m => m.material_id && m.quantity > 0)
      //     )
      //   }
      // }

      // TODO: 3. Add attendance records when function is fixed
      // if (attendanceRecords.length > 0) {
      //   await addBulkAttendance(
      //     dailyReportId,
      //     attendanceRecords.filter(a => a.worker_id)
      //   )
      // }

      // TODO: 4. Upload attachments when function is implemented
      // for (const file of attachments) {
      //   const formData = new FormData()
      //   formData.append('file', file)
      //   formData.append('entity_type', 'daily_report')
      //   formData.append('entity_id', dailyReportId)
      //   
      //   await uploadFileAttachment(formData)
      // }

      // TODO: 5. Submit for approval if requested when function is implemented
      // if (submitForApproval) {
      //   const { submitDailyReport } = await import('@/app/actions/daily-reports')
      //   await submitDailyReport(dailyReportId)
      // }

      // Success - redirect to daily reports list
      router.push('/dashboard/daily-reports')
    } catch (err) {
      console.error('Error creating daily report:', err)
      setError(err instanceof Error ? err.message : 'Failed to create daily report')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Basic Information */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">기본 정보</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="site">현장</Label>
            <Select
              id="site"
              value={formData.site_id}
              onChange={(e) => setFormData({ ...formData, site_id: e.target.value })}
              disabled={!!(currentUser as any).site_id}
            >
              <option value="">현장 선택</option>
              {sites.map(site => (
                <option key={site.id} value={site.id}>{site.name}</option>
              ))}
            </Select>
          </div>
          
          <div>
            <Label htmlFor="date">작업일자</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                id="date"
                type="date"
                value={formData.report_date}
                onChange={(e) => setFormData({ ...formData, report_date: e.target.value })}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="weather">날씨</Label>
            <div className="relative">
              <Cloud className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Select
                id="weather"
                value={formData.weather}
                onChange={(e) => setFormData({ ...formData, weather: e.target.value })}
                className="pl-10"
              >
                <option value="">날씨 선택</option>
                <option value="맑음">맑음</option>
                <option value="흐림">흐림</option>
                <option value="비">비</option>
                <option value="눈">눈</option>
              </Select>
            </div>
          </div>

          <div>
            <Label>기온</Label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Thermometer className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  type="number"
                  placeholder="최고"
                  value={formData.temperature_high}
                  onChange={(e) => setFormData({ ...formData, temperature_high: e.target.value })}
                  className="pl-10"
                  step="0.1"
                />
              </div>
              <span>~</span>
              <Input
                type="number"
                placeholder="최저"
                value={formData.temperature_low}
                onChange={(e) => setFormData({ ...formData, temperature_low: e.target.value })}
                step="0.1"
              />
              <span>°C</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Work Logs */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">작업 내역</h2>
          <Button onClick={handleAddWorkLog} variant="outline" size="compact">
            <Plus className="h-4 w-4 mr-1" />
            작업 추가
          </Button>
        </div>

        <div className="space-y-4">
          {workLogs.map((workLog, index) => (
            <div key={workLog.id} className="border dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-medium">작업 {index + 1}</h3>
                <Button
                  onClick={() => handleRemoveWorkLog(workLog.id)}
                  variant="ghost"
                  size="compact"
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div>
                  <Label>작업 종류</Label>
                  <Input
                    value={workLog.work_type}
                    onChange={(e) => handleUpdateWorkLog(workLog.id, 'work_type', e.target.value)}
                    placeholder="예: 철근 작업"
                  />
                </div>
                <div>
                  <Label>작업 위치</Label>
                  <Input
                    value={workLog.location}
                    onChange={(e) => handleUpdateWorkLog(workLog.id, 'location', e.target.value)}
                    placeholder="예: 3층 A구역"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>작업 내용</Label>
                  <Textarea
                    value={workLog.description}
                    onChange={(e) => handleUpdateWorkLog(workLog.id, 'description', e.target.value)}
                    placeholder="상세 작업 내용을 입력하세요"
                    rows={2}
                  />
                </div>
                <div>
                  <Label>투입 인원</Label>
                  <Input
                    type="number"
                    value={workLog.worker_count}
                    onChange={(e) => handleUpdateWorkLog(workLog.id, 'worker_count', parseInt(e.target.value) || 0)}
                    min="0"
                  />
                </div>
              </div>

              {/* Materials */}
              <div className="mt-3">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm">사용 자재</Label>
                  <Button
                    onClick={() => handleAddMaterial(workLog.id)}
                    variant="ghost"
                    size="compact"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    자재 추가
                  </Button>
                </div>
                
                {workLog.materials.map((material, matIndex) => (
                  <div key={matIndex} className="flex items-center gap-2 mb-2">
                    <Select
                      value={material.material_id}
                      onChange={(value) => handleUpdateMaterial(workLog.id, matIndex, 'material_id', value)}
                      className="flex-1"
                    >
                      <option value="">자재 선택</option>
                      {materials.map(mat => (
                        <option key={mat.id} value={mat.id}>
                          {mat.name} ({mat.unit})
                        </option>
                      ))}
                    </Select>
                    <Input
                      type="number"
                      value={material.quantity}
                      onChange={(e) => handleUpdateMaterial(workLog.id, matIndex, 'quantity', parseFloat(e.target.value) || 0)}
                      placeholder="수량"
                      className="w-24"
                      step="0.01"
                    />
                    <Button
                      onClick={() => handleRemoveMaterial(workLog.id, matIndex)}
                      variant="ghost"
                      size="compact"
                      className="text-red-600"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {workLogs.length === 0 && (
            <p className="text-center text-gray-500 py-8">
              작업 내역을 추가하려면 &quot;작업 추가&quot; 버튼을 클릭하세요
            </p>
          )}
        </div>
      </Card>

      {/* Attendance */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            <Users className="inline h-5 w-5 mr-2" />
            출근 현황
          </h2>
          <Button onClick={handleAddAttendance} variant="outline" size="compact">
            <Plus className="h-4 w-4 mr-1" />
            작업자 추가
          </Button>
        </div>

        <div className="space-y-2">
          {attendanceRecords.map((record, index) => (
            <div key={index} className="flex items-center gap-2">
              <Select
                value={record.worker_id}
                onChange={(e) => handleUpdateAttendance(index, 'worker_id', e.target.value)}
                className="flex-1"
              >
                <option value="">작업자 선택</option>
                {workers.map(worker => (
                  <option key={worker.id} value={worker.id}>
                    {worker.full_name} ({worker.role})
                  </option>
                ))}
              </Select>
              <Input
                type="time"
                value={record.check_in_time}
                onChange={(e) => handleUpdateAttendance(index, 'check_in_time', e.target.value)}
                className="w-32"
              />
              <span>~</span>
              <Input
                type="time"
                value={record.check_out_time}
                onChange={(e) => handleUpdateAttendance(index, 'check_out_time', e.target.value)}
                className="w-32"
              />
              <Input
                value={record.work_type}
                onChange={(e) => handleUpdateAttendance(index, 'work_type', e.target.value)}
                placeholder="작업 내용"
                className="flex-1"
              />
              <Button
                onClick={() => handleRemoveAttendance(index)}
                variant="ghost"
                size="compact"
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </Card>

      {/* Notes & Attachments */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">비고 및 첨부파일</h2>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="notes">특이사항</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="특이사항이나 전달사항을 입력하세요"
              rows={3}
            />
          </div>

          <div>
            <Label>첨부파일</Label>
            <div className="mt-2">
              <label className="cursor-pointer">
                <div className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div className="text-center">
                    <Upload className="mx-auto h-8 w-8 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      클릭하여 파일 선택 (사진, 문서 등)
                    </p>
                  </div>
                </div>
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                />
              </label>

              {attachments.length > 0 && (
                <div className="mt-3 space-y-2">
                  {attachments.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      <span className="text-sm truncate">{file.name}</span>
                      <Button
                        onClick={() => handleRemoveFile(index)}
                        variant="ghost"
                        size="compact"
                        className="text-red-600"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button
          onClick={() => router.back()}
          variant="outline"
          disabled={loading}
        >
          취소
        </Button>
        <Button
          onClick={() => handleSubmit(false)}
          variant="secondary"
          disabled={loading || !formData.site_id}
        >
          <Save className="h-4 w-4 mr-2" />
          임시저장
        </Button>
        <Button
          onClick={() => handleSubmit(true)}
          variant="primary"
          disabled={loading || !formData.site_id || workLogs.length === 0}
        >
          <Send className="h-4 w-4 mr-2" />
          제출
        </Button>
      </div>
    </div>
  )
}