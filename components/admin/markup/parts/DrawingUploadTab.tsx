'use client'

import { Button } from '@/components/ui/button'
import { FileText, Loader2, Upload, X } from 'lucide-react'
import React, { useState } from 'react'

import { useDrawingManager } from '@/hooks/use-drawing-manager'

export function DrawingUploadTab({
  worklogId,
  siteId,
  onSuccess,
}: {
  worklogId: string
  siteId?: string
  onSuccess: () => void
}) {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [docType, setDocType] = useState<'progress' | 'plan'>('progress')
  const { uploading, uploadDrawings } = useDrawingManager()
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleUpload = async () => {
    if (!siteId) return
    const success = await uploadDrawings(selectedFiles, worklogId, siteId, docType)
    if (success) {
      setSelectedFiles([])
      onSuccess()
    }
  }

  return (
    <div className="flex flex-col gap-6 p-2 h-full">
      {/* Type Selection */}
      <div className="space-y-3">
        <label className="text-[14px] font-black text-[#1f2942]">도면 종류 (필수)</label>
        <div className="grid grid-cols-2 p-1 bg-[#f0f4ff] rounded-2xl gap-1">
          <button
            onClick={() => setDocType('progress')}
            className={`py-3.5 rounded-xl text-[14px] font-black transition-all ${
              docType === 'progress'
                ? 'bg-white text-[#31a3fa] shadow-sm'
                : 'text-[#9aa4c5] hover:text-[#31a3fa]/60'
            }`}
          >
            진행 도면
          </button>
          <button
            onClick={() => setDocType('plan')}
            className={`py-3.5 rounded-xl text-[14px] font-black transition-all ${
              docType === 'plan'
                ? 'bg-white text-[#31a3fa] shadow-sm'
                : 'text-[#9aa4c5] hover:text-[#31a3fa]/60'
            }`}
          >
            공 도면
          </button>
        </div>
      </div>

      {/* Upload Zone */}
      <div
        className={`flex-1 flex flex-col items-center justify-center rounded-3xl border-2 border-dashed transition-all p-8 text-center cursor-pointer min-h-[300px] ${
          dragActive
            ? 'border-[#31a3fa] bg-[#31a3fa]/5 scale-[0.99]'
            : 'border-[#e0e6f3] bg-[#f8faff] hover:border-[#31a3fa]/40 hover:bg-[#f0f4ff]/50'
        }`}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={e => {
          e.preventDefault()
          setDragActive(true)
        }}
        onDragLeave={e => {
          e.preventDefault()
          setDragActive(false)
        }}
        onDrop={e => {
          e.preventDefault()
          setDragActive(false)
          setSelectedFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)])
        }}
      >
        <div className="h-20 w-20 flex items-center justify-center rounded-3xl bg-white shadow-sm border border-[#e0e6f3] text-[#31a3fa] mb-6">
          <Upload className={`h-8 w-8 ${uploading ? 'animate-bounce' : ''}`} />
        </div>
        <p className="text-[16px] font-black text-[#1f2942] mb-1">파일을 선택하거나 드래그하세요</p>
        <p className="text-[12px] font-bold text-[#9aa4c5]">PDF, JPG, PNG 지원 (최대 10MB)</p>

        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          multiple
          accept=".pdf,image/*"
          onChange={e => setSelectedFiles(prev => [...prev, ...Array.from(e.target.files || [])])}
        />
      </div>

      {/* Selected Files Preview */}
      {selectedFiles.length > 0 && (
        <div className="grid gap-2 mb-2 max-h-[140px] overflow-y-auto pr-2 custom-scrollbar">
          {selectedFiles.map((f, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 bg-white border border-[#e0e6f3] rounded-xl group"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-[#f0f4ff] flex items-center justify-center text-[#31a3fa]">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <div className="text-[13px] font-bold text-[#1f2942] truncate max-w-[300px]">
                    {f.name}
                  </div>
                  <div className="text-[11px] font-medium text-[#9aa4c5]">
                    {(f.size / 1024).toFixed(0)} KB • {f.type.split('/')[1]?.toUpperCase()}
                  </div>
                </div>
              </div>
              <button
                onClick={e => {
                  e.stopPropagation()
                  setSelectedFiles(prev => prev.filter((_, idx) => idx !== i))
                }}
                className="p-1.5 text-[#ef4444] hover:bg-[#ef4444]/5 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Button */}
      <Button
        disabled={selectedFiles.length === 0 || uploading}
        onClick={handleUpload}
        className="w-full h-14 rounded-2xl text-[16px] font-black bg-[#9aa4c5] hover:bg-[#838db0] text-white shadow-lg transition-all active:scale-[0.98]"
      >
        {uploading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            업로드 및 연동 중...
          </span>
        ) : (
          '현재 작업일지에 도면 연동'
        )}
      </Button>
    </div>
  )
}
