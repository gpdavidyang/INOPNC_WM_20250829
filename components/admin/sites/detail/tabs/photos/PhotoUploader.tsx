'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { Upload, X } from 'lucide-react'
import Image from 'next/image'
import { ChangeEvent, DragEvent } from 'react'

interface PhotoUploaderProps {
  onClose: () => void
  onUpload: () => void
  uploading: boolean
  form: any
  setForm: (f: any) => void
  reports: any[]
  highlightBucket: 'before' | 'after' | null
}

export function PhotoUploader({
  onClose,
  onUpload,
  uploading,
  form,
  setForm,
  reports,
  highlightBucket,
}: PhotoUploaderProps) {
  const handleRemove = (bucket: 'before' | 'after', index: number) => {
    setForm((prev: any) => {
      const list = bucket === 'before' ? [...prev.beforeFiles] : [...prev.afterFiles]
      const [removed] = list.splice(index, 1)
      if (removed) URL.revokeObjectURL(removed.previewUrl)
      return { ...prev, [bucket === 'before' ? 'beforeFiles' : 'afterFiles']: list }
    })
  }

  const handleDrop = (bucket: 'before' | 'after') => (e: DragEvent) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
    if (files.length > 0) {
      setForm((prev: any) => ({
        ...prev,
        [bucket === 'before' ? 'beforeFiles' : 'afterFiles']: [
          ...prev[bucket === 'before' ? 'beforeFiles' : 'afterFiles'],
          ...files.map(file => ({ file, previewUrl: URL.createObjectURL(file) })),
        ],
      }))
    }
  }

  const handleFileSelect = (bucket: 'before' | 'after') => (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter(f => f.type.startsWith('image/'))
    if (files.length > 0) {
      setForm((prev: any) => ({
        ...prev,
        [bucket === 'before' ? 'beforeFiles' : 'afterFiles']: [
          ...prev[bucket === 'before' ? 'beforeFiles' : 'afterFiles'],
          ...files.map(file => ({ file, previewUrl: URL.createObjectURL(file) })),
        ],
      }))
    }
    e.target.value = ''
  }

  return (
    <section className="rounded-2xl border-2 border-primary/20 bg-background p-6 shadow-xl space-y-6 animate-in fade-in zoom-in duration-200">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-xl font-black text-foreground">사진 일괄 업로드</h3>
          <p className="text-xs text-muted-foreground">
            작업일지를 선택하고 보수 전/후 사진을 추가하세요.
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} disabled={uploading}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest opacity-50">
            연동 작업일지
          </label>
          <Select value={form.reportId} onValueChange={v => setForm({ ...form, reportId: v })}>
            <SelectTrigger className="h-11 rounded-xl">
              <SelectValue placeholder="작업일지를 선택해 주세요 (필수)" />
            </SelectTrigger>
            <SelectContent>
              {reports.map(r => (
                <SelectItem key={r.id} value={r.id}>
                  {r.work_date ? format(new Date(r.work_date), 'yyyy-MM-dd') : '-'} |{' '}
                  {r.process_type || r.member_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest opacity-50">
            일괄 설명 (선택)
          </label>
          <Input
            placeholder="간략한 설명을 입력하세요..."
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            className="h-11 rounded-xl"
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <UploadZone
          label="보수 전 (Before)"
          files={form.beforeFiles}
          onDrop={handleDrop('before')}
          onSelect={handleFileSelect('before')}
          onRemove={idx => handleRemove('before', idx)}
          active={highlightBucket === 'before'}
        />
        <UploadZone
          label="보수 후 (After)"
          files={form.afterFiles}
          onDrop={handleDrop('after')}
          onSelect={handleFileSelect('after')}
          onRemove={idx => handleRemove('after', idx)}
          active={highlightBucket === 'after'}
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="ghost" onClick={onClose} disabled={uploading} className="rounded-xl px-8">
          취소
        </Button>
        <Button
          onClick={onUpload}
          disabled={uploading || !form.reportId}
          className="rounded-xl px-12 font-bold shadow-lg shadow-blue-500/20"
        >
          {uploading ? '업로드 중...' : '사진 등록 완료'}
        </Button>
      </div>
    </section>
  )
}

function UploadZone({ label, files, onDrop, onSelect, onRemove, active }: any) {
  return (
    <div
      className={cn(
        'group relative rounded-2xl border-2 border-dashed p-4 transition-all space-y-4 min-h-[16rem]',
        active
          ? 'border-blue-500 bg-blue-50/50'
          : 'border-gray-200 bg-gray-50/50 hover:border-gray-300'
      )}
      onDragOver={e => e.preventDefault()}
      onDrop={onDrop}
    >
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-black uppercase tracking-widest opacity-70">{label}</h4>
        <Badge count={files.length} />
      </div>

      {files.length === 0 ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-40">
          <Upload className="w-8 h-8 mb-2" />
          <p className="text-xs font-bold text-center px-4">
            이미지를 드래그하거나
            <br />
            클릭하여 추가
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
          {files.map((f: any, i: number) => (
            <div
              key={i}
              className="relative aspect-square rounded-lg overflow-hidden group/item border bg-white"
            >
              <Image src={f.previewUrl} alt="preview" fill className="object-cover" unoptimized />
              <button
                onClick={() => onRemove(i)}
                className="absolute top-1 right-1 w-5 h-5 bg-white/90 rounded-full flex items-center justify-center text-rose-600 opacity-0 group-hover/item:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <label className="absolute inset-0 cursor-pointer">
        <input type="file" multiple accept="image/*" className="hidden" onChange={onSelect} />
      </label>
    </div>
  )
}

function Badge({ count }: { count: number }) {
  if (count === 0) return null
  return (
    <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
      {count}
    </span>
  )
}
