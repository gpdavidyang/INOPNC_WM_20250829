'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/custom-select'
import { Label } from '@/components/ui/label'
import { PHOTO_SHEET_PRESETS } from '../presets'

interface PhotoSheetHeaderProps {
  siteId: string
  setSiteId: (id: string) => void
  sites: any[]
  presetId: string
  setPresetId: (id: string) => void
  loadingSites: boolean
}

export function PhotoSheetHeader({
  siteId,
  setSiteId,
  sites,
  presetId,
  setPresetId,
  loadingSites,
}: PhotoSheetHeaderProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-6 gap-6 bg-card p-6 rounded-2xl border shadow-sm">
      <div className="md:col-span-2 space-y-2">
        <Label htmlFor="site" className="text-xs font-black uppercase tracking-widest opacity-60">
          현장명 선택
        </Label>
        <Select value={siteId} onValueChange={setSiteId}>
          <SelectTrigger id="site" disabled={loadingSites} className="h-11 rounded-xl">
            <SelectValue
              placeholder={loadingSites ? '현장 목록 로딩 중...' : '현장을 선택하세요'}
            />
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

      <div className="md:col-span-2 space-y-2">
        <Label className="text-xs font-black uppercase tracking-widest opacity-60">
          사진 수량 (행 × 열)
        </Label>
        <Select value={presetId} onValueChange={setPresetId}>
          <SelectTrigger className="h-11 rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PHOTO_SHEET_PRESETS.filter(p => ['1x1', '2x1', '2x2', '3x2'].includes(p.id)).map(p => (
              <SelectItem key={p.id} value={p.id}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="md:col-span-2 flex items-end">
        <p className="text-[10px] font-bold text-muted-foreground bg-gray-50 p-3 rounded-xl border border-dashed w-full">
          페이지 수는 사진 개수에 따라 자동으로 확장되며, 최적의 배치를 유지합니다.
        </p>
      </div>
    </div>
  )
}
