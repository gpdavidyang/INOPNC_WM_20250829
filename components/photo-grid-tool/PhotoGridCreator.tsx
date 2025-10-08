'use client'

import { useEffect, useMemo, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/custom-select'
import { Loader2, Upload } from 'lucide-react'

interface SiteOption {
  id: string
  name: string
}

interface PhotoGridCreatorProps {
  onCreated?: () => void
}

type OrderedFile = { file: File; order: number; preview: string }

export default function PhotoGridCreator({ onCreated }: PhotoGridCreatorProps) {
  const [sites, setSites] = useState<SiteOption[]>([])
  const [loadingSites, setLoadingSites] = useState(false)

  const [siteId, setSiteId] = useState('')
  const [componentName, setComponentName] = useState('')
  const [componentNameOther, setComponentNameOther] = useState('')
  const [workProcess, setWorkProcess] = useState('')
  const [workProcessOther, setWorkProcessOther] = useState('')
  const [workSection, setWorkSection] = useState('')
  const [workDate, setWorkDate] = useState<string>(() => new Date().toISOString().slice(0, 10))

  const [beforeFiles, setBeforeFiles] = useState<OrderedFile[]>([])
  const [afterFiles, setAfterFiles] = useState<OrderedFile[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Work options (component types & process types) from admin work options management
  interface WorkOptionSetting {
    id: string
    option_type: 'component_type' | 'process_type'
    option_value: string
    option_label: string
    display_order: number
  }
  const [componentOptions, setComponentOptions] = useState<WorkOptionSetting[]>([])
  const [processOptions, setProcessOptions] = useState<WorkOptionSetting[]>([])
  const [loadingOptions, setLoadingOptions] = useState(false)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoadingSites(true)
        const res = await fetch('/api/sites', { cache: 'no-store' })
        const json = await res.json().catch(() => null)
        const list = (json?.data || []) as Array<{ id: string; name: string }>
        if (mounted) setSites(list)
      } catch {
        // ignore
      } finally {
        setLoadingSites(false)
      }
    })()
    ;(async () => {
      try {
        setLoadingOptions(true)
        const [compRes, procRes] = await Promise.all([
          fetch('/api/admin/work-options?option_type=component_type', { cache: 'no-store' }),
          fetch('/api/admin/work-options?option_type=process_type', { cache: 'no-store' }),
        ])
        const comp = (await compRes.json().catch(() => [])) as WorkOptionSetting[]
        const proc = (await procRes.json().catch(() => [])) as WorkOptionSetting[]
        if (mounted) {
          setComponentOptions(Array.isArray(comp) ? comp : [])
          setProcessOptions(Array.isArray(proc) ? proc : [])
        }
      } catch {
        if (mounted) {
          setComponentOptions([])
          setProcessOptions([])
        }
      } finally {
        setLoadingOptions(false)
      }
    })()
    return () => {
      mounted = false
      // revoke object URLs
      beforeFiles.forEach(f => URL.revokeObjectURL(f.preview))
      afterFiles.forEach(f => URL.revokeObjectURL(f.preview))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleAddFiles = (kind: 'before' | 'after') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    const current = kind === 'before' ? beforeFiles : afterFiles
    const arr = Array.from(files)
      .slice(0, Math.max(0, 3 - current.length))
      .map((file, idx) => ({
        file,
        order: current.length + idx,
        preview: URL.createObjectURL(file),
      }))
    const next = [...current, ...arr].slice(0, 3)
    if (kind === 'before') setBeforeFiles(next)
    else setAfterFiles(next)
    e.currentTarget.value = ''
  }

  const reorder = (kind: 'before' | 'after', index: number, dir: -1 | 1) => () => {
    const list = kind === 'before' ? beforeFiles.slice() : afterFiles.slice()
    const targetIndex = index + dir
    if (targetIndex < 0 || targetIndex >= list.length) return
    const [item] = list.splice(index, 1)
    list.splice(targetIndex, 0, item)
    list.forEach((f, i) => (f.order = i))
    if (kind === 'before') setBeforeFiles(list)
    else setAfterFiles(list)
  }

  const removeAt = (kind: 'before' | 'after', index: number) => () => {
    const list = kind === 'before' ? beforeFiles.slice() : afterFiles.slice()
    const [removed] = list.splice(index, 1)
    if (removed) URL.revokeObjectURL(removed.preview)
    list.forEach((f, i) => (f.order = i))
    if (kind === 'before') setBeforeFiles(list)
    else setAfterFiles(list)
  }

  const isOtherComponent = componentName === '__OTHER__'
  const isOtherProcess = workProcess === '__OTHER__'

  const canSubmit = useMemo(() => {
    const compOk = !!componentName && (!isOtherComponent || !!componentNameOther.trim())
    const procOk = !!workProcess && (!isOtherProcess || !!workProcessOther.trim())
    return (
      !!siteId &&
      compOk &&
      procOk &&
      !!workSection &&
      (beforeFiles.length > 0 || afterFiles.length > 0)
    )
  }, [
    siteId,
    componentName,
    workProcess,
    workSection,
    beforeFiles.length,
    afterFiles.length,
    isOtherComponent,
    isOtherProcess,
    componentNameOther,
    workProcessOther,
  ])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    setSuccess(null)
    try {
      const form = new FormData()
      form.append('site_id', siteId)
      const finalComponentName = isOtherComponent ? componentNameOther.trim() : componentName
      const finalWorkProcess = isOtherProcess ? workProcessOther.trim() : workProcess
      form.append('component_name', finalComponentName)
      form.append('work_process', finalWorkProcess)
      form.append('work_section', workSection)
      form.append('work_date', workDate)

      beforeFiles.forEach((f, i) => {
        form.append('before_photos', f.file)
        form.append('before_photo_orders', String(i))
      })
      afterFiles.forEach((f, i) => {
        form.append('after_photos', f.file)
        form.append('after_photo_orders', String(i))
      })

      const res = await fetch('/api/photo-grids', { method: 'POST', body: form })
      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.success) {
        throw new Error(json?.error || '사진대지 생성에 실패했습니다.')
      }

      setSuccess('사진대지가 생성되었습니다.')
      // reset minimal state
      setBeforeFiles([])
      setAfterFiles([])
      if (onCreated) onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="site">현장</Label>
        <Select value={siteId} onValueChange={setSiteId}>
          <SelectTrigger id="site" aria-label="현장 선택" disabled={loadingSites}>
            <SelectValue placeholder={loadingSites ? '로딩 중...' : '현장 선택'} />
          </SelectTrigger>
          <SelectContent>
            {sites.map(s => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Compact 1-row, 4-column layout for key fields */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="space-y-1">
          <Label htmlFor="component_name">부재명</Label>
          <Select value={componentName} onValueChange={setComponentName}>
            <SelectTrigger id="component_name" aria-label="부재명 선택" disabled={loadingOptions}>
              <SelectValue placeholder={loadingOptions ? '로딩 중...' : '부재명 선택'} />
            </SelectTrigger>
            <SelectContent>
              {componentOptions.map(opt => {
                const isOther = opt.option_value === 'other' || opt.option_label === '기타'
                const value = isOther ? '__OTHER__' : opt.option_label
                return (
                  <SelectItem key={opt.id} value={value}>
                    {isOther ? '기타(직접입력)' : opt.option_label}
                  </SelectItem>
                )
              })}
              {/* Append 기타 if not configured in DB */}
              {!componentOptions.some(
                o => o.option_value === 'other' || o.option_label === '기타'
              ) && <SelectItem value="__OTHER__">기타(직접입력)</SelectItem>}
            </SelectContent>
          </Select>
          {isOtherComponent && (
            <div className="pt-1">
              <Input
                aria-label="부재명 직접입력"
                placeholder="부재명을 직접 입력"
                value={componentNameOther}
                onChange={e => setComponentNameOther(e.target.value)}
              />
            </div>
          )}
        </div>
        <div className="space-y-1">
          <Label htmlFor="work_process">작업공정</Label>
          <Select value={workProcess} onValueChange={setWorkProcess}>
            <SelectTrigger id="work_process" aria-label="작업공정 선택" disabled={loadingOptions}>
              <SelectValue placeholder={loadingOptions ? '로딩 중...' : '작업공정 선택'} />
            </SelectTrigger>
            <SelectContent>
              {processOptions.map(opt => {
                const isOther = opt.option_value === 'other' || opt.option_label === '기타'
                const value = isOther ? '__OTHER__' : opt.option_label
                return (
                  <SelectItem key={opt.id} value={value}>
                    {isOther ? '기타(직접입력)' : opt.option_label}
                  </SelectItem>
                )
              })}
              {!processOptions.some(
                o => o.option_value === 'other' || o.option_label === '기타'
              ) && <SelectItem value="__OTHER__">기타(직접입력)</SelectItem>}
            </SelectContent>
          </Select>
          {isOtherProcess && (
            <div className="pt-1">
              <Input
                aria-label="작업공정 직접입력"
                placeholder="작업공정을 직접 입력"
                value={workProcessOther}
                onChange={e => setWorkProcessOther(e.target.value)}
              />
            </div>
          )}
        </div>
        <div className="space-y-1">
          <Label htmlFor="work_section">작업구간</Label>
          <Input
            id="work_section"
            value={workSection}
            onChange={e => setWorkSection(e.target.value)}
            placeholder="예: 3구간 A"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="work_date">작업일자</Label>
          <Input
            id="work_date"
            type="date"
            value={workDate}
            onChange={e => setWorkDate(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label>작업 전 사진 (최대 3장)</Label>
            <label className="inline-flex items-center gap-2 text-blue-600 cursor-pointer text-sm">
              <Upload className="h-4 w-4" /> 파일 추가
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleAddFiles('before')}
              />
            </label>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {beforeFiles.map((f, i) => (
              <div key={i} className="relative rounded border overflow-hidden group">
                <img
                  src={f.preview}
                  alt={`작업 전 ${i + 1}`}
                  className="w-full h-24 object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 flex justify-between p-1 bg-black/50 opacity-0 group-hover:opacity-100 transition">
                  <button
                    type="button"
                    className="text-xs text-white"
                    onClick={reorder('before', i, -1)}
                  >
                    ↑
                  </button>
                  <span className="text-xs text-white">{i + 1}</span>
                  <button
                    type="button"
                    className="text-xs text-white"
                    onClick={reorder('before', i, 1)}
                  >
                    ↓
                  </button>
                </div>
                <button
                  type="button"
                  onClick={removeAt('before', i)}
                  className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 text-xs"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <Label>작업 후 사진 (최대 3장)</Label>
            <label className="inline-flex items-center gap-2 text-blue-600 cursor-pointer text-sm">
              <Upload className="h-4 w-4" /> 파일 추가
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleAddFiles('after')}
              />
            </label>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {afterFiles.map((f, i) => (
              <div key={i} className="relative rounded border overflow-hidden group">
                <img
                  src={f.preview}
                  alt={`작업 후 ${i + 1}`}
                  className="w-full h-24 object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 flex justify-between p-1 bg-black/50 opacity-0 group-hover:opacity-100 transition">
                  <button
                    type="button"
                    className="text-xs text-white"
                    onClick={reorder('after', i, -1)}
                  >
                    ↑
                  </button>
                  <span className="text-xs text-white">{i + 1}</span>
                  <button
                    type="button"
                    className="text-xs text-white"
                    onClick={reorder('after', i, 1)}
                  >
                    ↓
                  </button>
                </div>
                <button
                  type="button"
                  onClick={removeAt('after', i)}
                  className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 text-xs"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}
      {success && <div className="text-sm text-green-700">{success}</div>}

      <div className="pt-2">
        <Button type="submit" disabled={!canSubmit || submitting}>
          {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          사진대지 생성
        </Button>
      </div>
    </form>
  )
}
