'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  CustomSelect,
  CustomSelectContent,
  CustomSelectItem,
  CustomSelectTrigger,
  CustomSelectValue,
} from '@/components/ui/custom-select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FileText, Plus } from 'lucide-react'
import React from 'react'
import { CollapsibleSection } from '../CollapsibleSection'
import type { WorkContentEntry } from '../types'

interface WorkContentSectionProps {
  workEntries: WorkContentEntry[]
  setWorkEntries: React.Dispatch<React.SetStateAction<WorkContentEntry[]>>
  componentTypes: any[]
  processTypes: any[]
  isExpanded: boolean
  onToggle: () => void
  permissions: any
}

export const WorkContentSection = ({
  workEntries,
  setWorkEntries,
  componentTypes,
  processTypes,
  isExpanded,
  onToggle,
  permissions,
}: WorkContentSectionProps) => {
  const addWorkEntry = () => {
    setWorkEntries(prev => [
      ...prev,
      {
        id: `work-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        memberName: '',
        memberNameOther: '',
        processType: '',
        processTypeOther: '',
        workSection: '',
        workSectionOther: '',
        block: '',
        dong: '',
        floor: '',
        beforePhotos: [],
        afterPhotos: [],
        beforePhotoPreviews: [],
        afterPhotoPreviews: [],
      },
    ])
  }

  const removeWorkEntry = (index: number) => {
    setWorkEntries(prev => prev.filter((_, i) => i !== index))
  }

  const updateWorkEntry = (index: number, updates: Partial<WorkContentEntry>) => {
    setWorkEntries(prev => {
      const next = [...prev]
      next[index] = { ...next[index], ...updates }
      return next
    })
  }

  return (
    <CollapsibleSection
      title="작업 내역"
      icon={FileText}
      isExpanded={isExpanded}
      onToggle={onToggle}
      required={true}
      permissions={permissions}
      badge={<Badge variant="outline">{workEntries.length}개</Badge>}
    >
      <div className="space-y-4">
        {workEntries.map((entry, index) => (
          <div
            key={entry.id}
            className="p-6 bg-slate-50/50 dark:bg-gray-900/30 rounded-2xl border border-slate-100 dark:border-gray-800"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="bg-[#1A254F] text-white w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black italic">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h4 className="text-base font-black text-gray-900 dark:text-gray-100 tracking-tight">
                  작업 내역 #{index + 1}
                </h4>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addWorkEntry}
                  className="h-9 rounded-xl border-dashed border-gray-300 hover:border-blue-400 hover:text-blue-600 transition-all whitespace-nowrap px-4"
                >
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  항목 추가
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeWorkEntry(index)}
                  className="h-9 px-3 rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-100 hover:border-rose-200 transition-all font-black text-sm flex items-center justify-center gap-1.5"
                  title="작업 내역 삭제"
                >
                  <span>삭제</span>
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-[11px] font-black text-foreground uppercase tracking-tighter opacity-50 pl-1">
                  부재명
                </Label>
                <CustomSelect
                  value={entry.memberName}
                  onValueChange={value => {
                    updateWorkEntry(index, {
                      memberName: value,
                      memberNameOther: value === '기타' ? entry.memberNameOther || '' : '',
                    })
                  }}
                >
                  <CustomSelectTrigger className="h-10 rounded-xl bg-white border-none shadow-sm px-4 text-sm focus:ring-2 focus:ring-blue-500/20 transition-all">
                    <CustomSelectValue placeholder="선택" />
                  </CustomSelectTrigger>
                  <CustomSelectContent>
                    {componentTypes.map(type => (
                      <CustomSelectItem key={type.id} value={type.option_label}>
                        {type.option_label}
                      </CustomSelectItem>
                    ))}
                    {!componentTypes.some(t => t.option_label === '기타') && (
                      <CustomSelectItem value="기타">기타 (직접 입력)</CustomSelectItem>
                    )}
                  </CustomSelectContent>
                </CustomSelect>
                {entry.memberName === '기타' && (
                  <Input
                    className="mt-2 h-10 rounded-xl bg-white border-none shadow-sm px-4 text-sm animate-in fade-in slide-in-from-top-1"
                    placeholder="부재명 직접 입력"
                    value={entry.memberNameOther || ''}
                    onChange={e => updateWorkEntry(index, { memberNameOther: e.target.value })}
                  />
                )}
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-[11px] font-black text-foreground uppercase tracking-tighter opacity-50 pl-1">
                  작업공정
                </Label>
                <CustomSelect
                  value={entry.processType}
                  onValueChange={value => {
                    updateWorkEntry(index, {
                      processType: value,
                      processTypeOther: value === '기타' ? entry.processTypeOther || '' : '',
                    })
                  }}
                >
                  <CustomSelectTrigger className="h-10 rounded-xl bg-white border-none shadow-sm px-4 text-sm focus:ring-2 focus:ring-blue-500/20 transition-all">
                    <CustomSelectValue placeholder="선택" />
                  </CustomSelectTrigger>
                  <CustomSelectContent>
                    {processTypes.map(type => (
                      <CustomSelectItem key={type.id} value={type.option_label}>
                        {type.option_label}
                      </CustomSelectItem>
                    ))}
                    {!processTypes.some(t => t.option_label === '기타') && (
                      <CustomSelectItem value="기타">기타 (직접 입력)</CustomSelectItem>
                    )}
                  </CustomSelectContent>
                </CustomSelect>
                {entry.processType === '기타' && (
                  <Input
                    className="mt-2 h-10 rounded-xl bg-white border-none shadow-sm px-4 text-sm animate-in fade-in slide-in-from-top-1"
                    placeholder="작업공정 직접 입력"
                    value={entry.processTypeOther || ''}
                    onChange={e => updateWorkEntry(index, { processTypeOther: e.target.value })}
                  />
                )}
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-[11px] font-black text-foreground uppercase tracking-tighter opacity-50 pl-1">
                  작업 구간
                </Label>
                <CustomSelect
                  value={entry.workSection}
                  onValueChange={value => {
                    updateWorkEntry(index, {
                      workSection: value,
                      workSectionOther: value === '기타' ? entry.workSectionOther || '' : '',
                    })
                  }}
                >
                  <CustomSelectTrigger className="h-10 rounded-xl bg-white border-none shadow-sm px-4 text-sm focus:ring-2 focus:ring-blue-500/20 transition-all">
                    <CustomSelectValue placeholder="선택" />
                  </CustomSelectTrigger>
                  <CustomSelectContent>
                    <CustomSelectItem value="지하">지하</CustomSelectItem>
                    <CustomSelectItem value="지상">지상</CustomSelectItem>
                    <CustomSelectItem value="지붕">지붕</CustomSelectItem>
                    <CustomSelectItem value="기타">기타(직접입력)</CustomSelectItem>
                  </CustomSelectContent>
                </CustomSelect>
                {entry.workSection === '기타' && (
                  <Input
                    className="mt-2 h-10 rounded-xl bg-white border-none shadow-sm px-4 text-sm animate-in fade-in slide-in-from-top-1"
                    placeholder="구간 직접 입력"
                    value={entry.workSectionOther || ''}
                    onChange={e => updateWorkEntry(index, { workSectionOther: e.target.value })}
                  />
                )}
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-[11px] font-black text-foreground uppercase tracking-tighter opacity-50 pl-1">
                  블록
                </Label>
                <Input
                  className="h-10 rounded-xl bg-white border-none shadow-sm px-4 text-sm focus:ring-2 focus:ring-blue-500/20 transition-all"
                  value={entry.block}
                  onChange={e => updateWorkEntry(index, { block: e.target.value })}
                  placeholder="블록 입력"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-[11px] font-black text-foreground uppercase tracking-tighter opacity-50 pl-1">
                  동
                </Label>
                <Input
                  className="h-10 rounded-xl bg-white border-none shadow-sm px-4 text-sm focus:ring-2 focus:ring-blue-500/20 transition-all"
                  value={entry.dong}
                  onChange={e => updateWorkEntry(index, { dong: e.target.value })}
                  placeholder="동 입력"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-[11px] font-black text-foreground uppercase tracking-tighter opacity-50 pl-1">
                  층
                </Label>
                <Input
                  className="h-10 rounded-xl bg-white border-none shadow-sm px-4 text-sm focus:ring-2 focus:ring-blue-500/20 transition-all"
                  value={entry.floor}
                  onChange={e => updateWorkEntry(index, { floor: e.target.value })}
                  placeholder="층 입력"
                />
              </div>
            </div>
          </div>
        ))}

        {workEntries.length === 0 && (
          <Button
            type="button"
            variant="outline"
            onClick={addWorkEntry}
            className="w-full h-12 border-dashed"
          >
            <Plus className="h-4 w-4 mr-2" />
            작업 내역 추가
          </Button>
        )}
      </div>
    </CollapsibleSection>
  )
}
