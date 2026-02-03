'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/custom-select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload } from 'lucide-react'
import Image from 'next/image'

interface PhotoSheetTileProps {
  index: number
  tile: any
  onFileChange: (files: File[]) => void
  onUpdate: (patch: any) => void
  componentOptions: any[]
  processOptions: any[]
}

export function PhotoSheetTile({
  index,
  tile,
  onFileChange,
  onUpdate,
  componentOptions,
  processOptions,
}: PhotoSheetTileProps) {
  return (
    <div className="group relative rounded-2xl border bg-card p-4 shadow-sm hover:shadow-md hover:border-blue-300 transition-all space-y-4">
      {/* Photo Area */}
      <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-gray-50 border-2 border-dashed border-gray-200 group-hover:border-blue-200 transition-colors">
        {tile.previewUrl ? (
          <>
            <Image
              src={tile.previewUrl}
              alt={`Photo ${index + 1}`}
              fill
              className="object-cover"
              unoptimized
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4">
              <p className="text-white text-[10px] font-black uppercase tracking-widest mb-2">
                이미지 변경
              </p>
              <div className="flex gap-2">
                <label className="bg-white text-blue-600 px-3 py-1.5 rounded-lg text-[10px] font-black cursor-pointer hover:bg-blue-50">
                  파일 업로드
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={e => onFileChange(Array.from(e.target.files || []))}
                  />
                </label>
                <button
                  onClick={() => onUpdate({ file: undefined, previewUrl: undefined })}
                  className="bg-rose-500 text-white px-3 py-1.5 rounded-lg text-[10px] font-black hover:bg-rose-600"
                >
                  삭제
                </button>
              </div>
            </div>
          </>
        ) : (
          <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors">
            <div className="p-3 bg-white rounded-2xl shadow-sm border mb-2 text-gray-400 group-hover:text-blue-500 group-hover:scale-110 transition-all">
              <Upload className="w-6 h-6" />
            </div>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              사진 업로드
            </p>
            <span className="text-[8px] opacity-50 mt-1">드래그 또는 클릭</span>
            <input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={e => onFileChange(Array.from(e.target.files || []))}
            />
          </label>
        )}
        <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white text-[10px] font-black px-2 py-0.5 rounded-md">
          #{index + 1}
        </div>
      </div>

      {/* Metadata Form */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-[9px] font-black uppercase tracking-widest opacity-50">
              구분
            </Label>
            <Select value={tile.stage || ''} onValueChange={v => onUpdate({ stage: v })}>
              <SelectTrigger className="h-8 rounded-lg text-xs font-bold">
                <SelectValue placeholder="보수 전/후" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="before">보수 전</SelectItem>
                <SelectItem value="after">보수 후</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-[9px] font-black uppercase tracking-widest opacity-50">
              부재명
            </Label>
            <Select value={tile.member || ''} onValueChange={v => onUpdate({ member: v })}>
              <SelectTrigger className="h-8 rounded-lg text-xs font-bold">
                <SelectValue placeholder="선택" />
              </SelectTrigger>
              <SelectContent>
                {componentOptions.map(o => (
                  <SelectItem key={o.id} value={o.option_label}>
                    {o.option_label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-[9px] font-black uppercase tracking-widest opacity-50">공정</Label>
          <Select value={tile.process || ''} onValueChange={v => onUpdate({ process: v })}>
            <SelectTrigger className="h-8 rounded-lg text-xs font-bold">
              <SelectValue placeholder="공정을 선택하세요" />
            </SelectTrigger>
            <SelectContent>
              {processOptions.map(o => (
                <SelectItem key={o.id} value={o.option_label}>
                  {o.option_label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-[9px] font-black uppercase tracking-widest opacity-50">
            상세 설명
          </Label>
          <Input
            value={tile.content || ''}
            onChange={e => onUpdate({ content: e.target.value })}
            placeholder="내용을 입력하세요..."
            className="h-8 rounded-lg text-xs"
          />
        </div>
      </div>
    </div>
  )
}
