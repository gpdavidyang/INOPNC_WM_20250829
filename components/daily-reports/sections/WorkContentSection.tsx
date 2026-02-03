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
import { FileText, Plus, Trash2 } from 'lucide-react'
import React from 'react'
import { CollapsibleSection, useRolePermissions } from '../CollapsibleSection'
import type { WorkContentEntry } from '../types'

interface WorkContentSectionProps {
  workEntries: WorkContentEntry[]
  setWorkEntries: React.Dispatch<React.SetStateAction<WorkContentEntry[]>>
  componentTypes: any[]
  processTypes: any[]
  isExpanded: boolean
  onToggle: () => void
  permissions: ReturnType<typeof useRolePermissions>
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
          <div key={entry.id} className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 flex items-center">
                <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2">
                  {index + 1}
                </span>
                작업 내역 #{index + 1}
              </h4>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addWorkEntry}
                  className="h-8 border-dashed border-gray-300 hover:border-blue-400 hover:text-blue-600 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  작업 내역 추가
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeWorkEntry(index)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                  title="작업 내역 삭제"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div className="space-y-1.5 md:col-span-1">
                <Label className="text-xs text-gray-500 font-medium">부재명</Label>
                <CustomSelect
                  value={entry.memberName}
                  onValueChange={value => {
                    updateWorkEntry(index, {
                      memberName: value,
                      memberNameOther: value === '기타' ? entry.memberNameOther || '' : '',
                    })
                  }}
                >
                  <CustomSelectTrigger className="h-9">
                    <CustomSelectValue placeholder="선택" />
                  </CustomSelectTrigger>
                  <CustomSelectContent>
                    {componentTypes.map(type => (
                      <CustomSelectItem key={type.id} value={type.option_label}>
                        {type.option_label}
                      </CustomSelectItem>
                    ))}
                    {!componentTypes.some(t => t.option_label === '기타') && (
                      <CustomSelectItem value="기타">기타</CustomSelectItem>
                    )}
                  </CustomSelectContent>
                </CustomSelect>
                {entry.memberName === '기타' && (
                  <Input
                    className="mt-2 h-9"
                    placeholder="직접 입력"
                    value={entry.memberNameOther || ''}
                    onChange={e => updateWorkEntry(index, { memberNameOther: e.target.value })}
                  />
                )}
              </div>

              <div className="space-y-1.5 md:col-span-1">
                <Label className="text-xs text-gray-500 font-medium">작업공정</Label>
                <CustomSelect
                  value={entry.processType}
                  onValueChange={value => {
                    updateWorkEntry(index, {
                      processType: value,
                      processTypeOther: value === '기타' ? entry.processTypeOther || '' : '',
                    })
                  }}
                >
                  <CustomSelectTrigger className="h-9">
                    <CustomSelectValue placeholder="선택" />
                  </CustomSelectTrigger>
                  <CustomSelectContent>
                    {processTypes.map(type => (
                      <CustomSelectItem key={type.id} value={type.option_label}>
                        {type.option_label}
                      </CustomSelectItem>
                    ))}
                    {!processTypes.some(t => t.option_label === '기타') && (
                      <CustomSelectItem value="기타">기타</CustomSelectItem>
                    )}
                  </CustomSelectContent>
                </CustomSelect>
                {entry.processType === '기타' && (
                  <Input
                    className="mt-2 h-9"
                    placeholder="직접 입력"
                    value={entry.processTypeOther || ''}
                    onChange={e => updateWorkEntry(index, { processTypeOther: e.target.value })}
                  />
                )}
              </div>

              <div className="space-y-1.5 md:col-span-1">
                <Label className="text-xs text-gray-500 font-medium">작업 구간</Label>
                <CustomSelect
                  value={entry.workSection}
                  onValueChange={value => {
                    updateWorkEntry(index, {
                      workSection: value,
                      workSectionOther: value === '기타' ? entry.workSectionOther || '' : '',
                    })
                  }}
                >
                  <CustomSelectTrigger className="h-9">
                    <CustomSelectValue placeholder="선택" />
                  </CustomSelectTrigger>
                  <CustomSelectContent>
                    <CustomSelectItem value="지하">지하</CustomSelectItem>
                    <CustomSelectItem value="지상">지상</CustomSelectItem>
                    <CustomSelectItem value="지붕">지붕</CustomSelectItem>
                    <CustomSelectItem value="기타">기타</CustomSelectItem>
                  </CustomSelectContent>
                </CustomSelect>
                {entry.workSection === '기타' && (
                  <Input
                    className="mt-2 h-9"
                    placeholder="직접 입력"
                    value={entry.workSectionOther || ''}
                    onChange={e => updateWorkEntry(index, { workSectionOther: e.target.value })}
                  />
                )}
              </div>

              <div className="space-y-1.5 md:col-span-1">
                <Label className="text-xs text-gray-500 font-medium">블록</Label>
                <Input
                  className="h-9"
                  value={entry.block}
                  onChange={e => updateWorkEntry(index, { block: e.target.value })}
                  placeholder="블록"
                />
              </div>

              <div className="space-y-1.5 md:col-span-1">
                <Label className="text-xs text-gray-500 font-medium">동</Label>
                <Input
                  className="h-9"
                  value={entry.dong}
                  onChange={e => updateWorkEntry(index, { dong: e.target.value })}
                  placeholder="동"
                />
              </div>

              <div className="space-y-1.5 md:col-span-1">
                <Label className="text-xs text-gray-500 font-medium">층</Label>
                <Input
                  className="h-9"
                  value={entry.floor}
                  onChange={e => updateWorkEntry(index, { floor: e.target.value })}
                  placeholder="층"
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
