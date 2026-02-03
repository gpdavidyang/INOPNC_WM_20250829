'use client'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/custom-select'
import { Label } from '@/components/ui/label'
import { RotateCcw, Zap } from 'lucide-react'

interface PhotoSheetBulkActionsProps {
  bulkMember: string
  setBulkMember: (v: string) => void
  bulkProcess: string
  setBulkProcess: (v: string) => void
  componentOptions: any[]
  processOptions: any[]
  onApply: () => void
  onReset: () => void
}

export function PhotoSheetBulkActions({
  bulkMember,
  setBulkMember,
  bulkProcess,
  setBulkProcess,
  componentOptions,
  processOptions,
  onApply,
  onReset,
}: PhotoSheetBulkActionsProps) {
  return (
    <div className="bg-blue-50/50 border-2 border-blue-100 rounded-2xl p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Zap className="w-4 h-4 text-blue-600 fill-blue-600" />
        <h3 className="text-sm font-black text-blue-900 uppercase tracking-tight">
          부재/공정 일괄 적용
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
        <div className="lg:col-span-2 space-y-1.5">
          <Label className="text-[10px] font-black uppercase tracking-widest text-blue-800/60">
            부재명
          </Label>
          <Select value={bulkMember} onValueChange={setBulkMember}>
            <SelectTrigger className="h-10 rounded-xl bg-white border-blue-200">
              <SelectValue placeholder="부재를 선택하세요" />
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

        <div className="lg:col-span-2 space-y-1.5">
          <Label className="text-[10px] font-black uppercase tracking-widest text-blue-800/60">
            공정
          </Label>
          <Select value={bulkProcess} onValueChange={setBulkProcess}>
            <SelectTrigger className="h-10 rounded-xl bg-white border-blue-200">
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

        <div className="flex items-center gap-2">
          <Button
            onClick={onApply}
            disabled={!bulkMember && !bulkProcess}
            className="flex-1 h-10 rounded-xl font-bold border-2 border-blue-600 shadow-lg shadow-blue-500/20"
          >
            전체 적용
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onReset}
            className="h-10 w-10 rounded-xl text-blue-600 hover:bg-white"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
