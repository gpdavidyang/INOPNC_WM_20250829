'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  CustomSelect,
  CustomSelectContent,
  CustomSelectItem,
  CustomSelectTrigger,
  CustomSelectValue,
} from '@/components/ui/custom-select'
import { Plus, Trash2, UserPlus, Users } from 'lucide-react'
import { PremiumNumberInput } from './PremiumNumberInput'

interface ManpowerSectionProps {
  mainManpower: number
  onMainManpowerChange: (v: number) => void
  additionalManpower: any[]
  onAddAdditional: () => void
  onRemoveAdditional: (id: string) => void
  onUpdateAdditional: (id: string, updates: any) => void
  authorId: string
  onAuthorChange: (id: string) => void
  userOptions: any[]
  laborHourValues: number[]
  defaultLaborHour: number
}

export function ManpowerSection({
  mainManpower,
  onMainManpowerChange,
  additionalManpower,
  onAddAdditional,
  onRemoveAdditional,
  onUpdateAdditional,
  authorId,
  onAuthorChange,
  userOptions,
  laborHourValues,
}: ManpowerSectionProps) {
  return (
    <Card className="p-6 rounded-3xl border-none bg-white shadow-xl shadow-blue-900/5">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-foreground tracking-tight">공수 입력</h3>
            <p className="text-xs font-bold text-muted-foreground/60 uppercase tracking-widest">
              Manpower Management
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onAddAdditional}
          className="rounded-xl border-2 font-bold gap-1.5 h-10 px-4"
        >
          <Plus className="w-4 h-4" /> 추가
        </Button>
      </div>

      <div className="space-y-8">
        {/* Main Author Manpower */}
        <div className="space-y-4 p-5 rounded-2xl bg-gray-50/50 border-2 border-dashed border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full uppercase tracking-widest">
              Primary Author
            </span>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest ml-1">
                Author Name
              </label>
              <CustomSelect value={authorId} onValueChange={onAuthorChange}>
                <CustomSelectTrigger className="h-14 rounded-2xl border-2 border-white bg-white shadow-sm px-5 font-bold">
                  <CustomSelectValue placeholder="작성자를 선택하세요" />
                </CustomSelectTrigger>
                <CustomSelectContent className="rounded-2xl border-none shadow-2xl">
                  {userOptions.map(u => (
                    <CustomSelectItem key={u.id} value={u.id} className="h-12 font-bold rounded-xl">
                      {u.name}
                    </CustomSelectItem>
                  ))}
                </CustomSelectContent>
              </CustomSelect>
            </div>
            <PremiumNumberInput
              value={mainManpower}
              onChange={onMainManpowerChange}
              values={laborHourValues}
              label="Labor Hours"
            />
          </div>
        </div>

        {/* Additional Manpower List */}
        {additionalManpower.map((item, idx) => (
          <div
            key={item.id}
            className="space-y-4 p-5 rounded-2xl bg-white border-2 border-gray-100 shadow-sm animate-in slide-in-from-right-4 duration-300"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-widest">
                  Additional #{idx + 1}
                </span>
              </div>
              <button
                onClick={() => onRemoveAdditional(item.id)}
                className="p-2 rounded-xl text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest ml-1">
                  Worker Name
                </label>
                <CustomSelect
                  value={item.workerId}
                  onValueChange={val => {
                    const opt = userOptions.find(u => u.id === val)
                    onUpdateAdditional(item.id, { workerId: val, workerName: opt?.name || '' })
                  }}
                >
                  <CustomSelectTrigger className="h-14 rounded-2xl border-2 border-gray-50 bg-gray-50/30 px-5 font-bold">
                    <CustomSelectValue placeholder="작업자를 선택하세요" />
                  </CustomSelectTrigger>
                  <CustomSelectContent className="rounded-2xl border-none shadow-2xl">
                    {userOptions.map(u => (
                      <CustomSelectItem
                        key={u.id}
                        value={u.id}
                        className="h-12 font-bold rounded-xl"
                      >
                        {u.name}
                      </CustomSelectItem>
                    ))}
                  </CustomSelectContent>
                </CustomSelect>
              </div>
              <PremiumNumberInput
                value={item.manpower}
                onChange={val => onUpdateAdditional(item.id, { manpower: val })}
                values={laborHourValues}
                label="Labor Hours"
              />
            </div>
          </div>
        ))}

        {additionalManpower.length === 0 && (
          <button
            onClick={onAddAdditional}
            className="w-full py-4 rounded-2xl border-2 border-dashed border-gray-200 text-muted-foreground/40 hover:border-blue-200 hover:text-blue-400 hover:bg-blue-50/50 transition-all flex flex-col items-center justify-center gap-1 group"
          >
            <UserPlus className="w-6 h-6 mb-1 opacity-20 group-hover:opacity-100" />
            <span className="text-xs font-black uppercase tracking-widest">Add Support Worker</span>
          </button>
        )}
      </div>
    </Card>
  )
}
