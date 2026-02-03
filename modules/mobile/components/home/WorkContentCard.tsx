'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ClipboardList, MapPin, Plus, Trash2 } from 'lucide-react'
import { LocationInput } from './LocationInput'
import { PremiumMultiSelect } from './PremiumMultiSelect'

interface WorkContentCardProps {
  memberTypes: string[]
  onMemberTypesChange: (v: string[]) => void
  workContents: string[]
  onWorkContentsChange: (v: string[]) => void
  workTypes: string[]
  onWorkTypesChange: (v: string[]) => void
  location: any
  onLocationChange: (v: any) => void
  tasks: any[]
  onAddTask: () => void
  onRemoveTask: (idx: number) => void
  onUpdateTask: (idx: number, updates: any) => void
  MEMBER_TYPE_OPTIONS: any[]
  PROCESS_OPTIONS: any[]
  WORK_TYPE_OPTIONS: any[]
}

export function WorkContentCard({
  memberTypes,
  onMemberTypesChange,
  workContents,
  onWorkContentsChange,
  workTypes,
  onWorkTypesChange,
  location,
  onLocationChange,
  tasks,
  onAddTask,
  onRemoveTask,
  onUpdateTask,
  MEMBER_TYPE_OPTIONS,
  PROCESS_OPTIONS,
  WORK_TYPE_OPTIONS,
}: WorkContentCardProps) {
  return (
    <div className="space-y-6">
      <Card className="p-6 rounded-3xl border-none bg-white shadow-xl shadow-blue-900/5">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-foreground tracking-tight">작업 내용 기록</h3>
              <p className="text-xs font-bold text-muted-foreground/60 uppercase tracking-widest">
                Work Progress Details
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onAddTask}
            className="rounded-xl border-2 font-bold gap-1.5 h-10 px-4"
          >
            <Plus className="w-4 h-4" /> 세트 추가
          </Button>
        </div>

        <div className="space-y-10">
          <PremiumMultiSelect
            label="부재명 (Member Type)"
            options={MEMBER_TYPE_OPTIONS}
            selectedValues={memberTypes}
            onChange={onMemberTypesChange}
          />

          <PremiumMultiSelect
            label="작업공정 (Process)"
            options={PROCESS_OPTIONS}
            selectedValues={workContents}
            onChange={onWorkContentsChange}
          />

          <div className="pt-6 border-t border-dashed border-gray-100">
            <PremiumMultiSelect
              label="작업유형 (Work Type)"
              options={WORK_TYPE_OPTIONS}
              selectedValues={workTypes}
              onChange={onWorkTypesChange}
            />
          </div>

          <div className="pt-2">
            <label className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest ml-1 flex items-center gap-1.5 mb-3">
              <MapPin className="w-3 h-3" /> Location (Block/Dong/Unit)
            </label>
            <LocationInput location={location} onChange={onLocationChange} />
          </div>
        </div>
      </Card>

      {/* Additional Task Sets */}
      {tasks.map((task, i) => (
        <Card
          key={i}
          className="p-6 rounded-3xl border-none bg-white shadow-xl shadow-blue-900/5 animate-in slide-in-from-bottom-4 duration-300"
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-xs font-black text-gray-400 italic">
                #{i + 1}
              </span>
              <h4 className="text-base font-black text-foreground tracking-tight uppercase">
                Custom Task Set
              </h4>
            </div>
            <button
              onClick={() => onRemoveTask(i)}
              className="p-2 rounded-xl text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-8">
            <PremiumMultiSelect
              label="부재명"
              options={MEMBER_TYPE_OPTIONS}
              selectedValues={task.memberTypes}
              onChange={vals => onUpdateTask(i, { memberTypes: vals })}
            />
            <PremiumMultiSelect
              label="작업공정"
              options={PROCESS_OPTIONS}
              selectedValues={task.processes}
              onChange={vals => onUpdateTask(i, { processes: vals })}
            />
            <PremiumMultiSelect
              label="작업유형"
              options={WORK_TYPE_OPTIONS}
              selectedValues={task.workTypes}
              onChange={vals => onUpdateTask(i, { workTypes: vals })}
            />
            <LocationInput
              location={task.location}
              onChange={loc => onUpdateTask(i, { location: loc })}
            />
          </div>
        </Card>
      ))}
    </div>
  )
}
