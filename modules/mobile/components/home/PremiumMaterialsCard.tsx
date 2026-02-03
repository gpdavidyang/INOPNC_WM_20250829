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
import { MaterialEntry } from '@/modules/mobile/hooks/use-worklog-mutations'
import { Package, Plus, StickyNote, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'

interface PremiumMaterialsCardProps {
  materials: MaterialEntry[]
  onChange: (next: MaterialEntry[]) => void
}

const defaultMaterial: MaterialEntry = {
  material_id: null,
  material_name: '',
  material_code: null,
  quantity: 0,
  unit: '',
  notes: '',
}

export function PremiumMaterialsCard({ materials, onChange }: PremiumMaterialsCardProps) {
  const [options, setOptions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/mobile/materials')
        const json = await res.json()
        setOptions(json.data || [])
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleAdd = () => {
    const npcDefault = options.find(o => o.name === 'NPC-1000')
    const newItem = npcDefault
      ? {
          ...defaultMaterial,
          material_id: npcDefault.id,
          material_name: npcDefault.name,
          material_code: npcDefault.code,
          unit: npcDefault.unit ?? '',
        }
      : { ...defaultMaterial }
    onChange([...materials, newItem])
  }

  const handleUpdate = (idx: number, updates: Partial<MaterialEntry>) => {
    onChange(materials.map((m, i) => (i === idx ? { ...m, ...updates } : m)))
  }

  return (
    <Card className="p-6 rounded-3xl border-none bg-white shadow-xl shadow-blue-900/5">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-foreground tracking-tight">자재 사용 내역</h3>
            <p className="text-xs font-bold text-muted-foreground/60 uppercase tracking-widest">
              Material Consumption
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleAdd}
          className="rounded-xl border-2 font-bold gap-1.5 h-10 px-4"
        >
          <Plus className="w-4 h-4" /> 추가
        </Button>
      </div>

      <div className="space-y-6">
        {materials.map((m, idx) => (
          <div
            key={idx}
            className="p-5 rounded-2xl bg-gray-50/50 border-2 border-gray-100 space-y-4 relative animate-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-amber-600 bg-amber-100/50 px-2 py-0.5 rounded-full uppercase tracking-widest">
                Material Item #{idx + 1}
              </span>
              {materials.length > 1 && (
                <button
                  onClick={() => onChange(materials.filter((_, i) => i !== idx))}
                  className="text-rose-400 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-2">
                <label className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest ml-1">
                  Material Name
                </label>
                <CustomSelect
                  value={m.material_id || undefined}
                  onValueChange={val => {
                    const opt = options.find(o => o.id === val)
                    if (opt)
                      handleUpdate(idx, {
                        material_id: opt.id,
                        material_name: opt.name,
                        unit: opt.unit ?? '',
                      })
                  }}
                >
                  <CustomSelectTrigger className="h-12 rounded-xl border-2 border-white bg-white shadow-sm px-4 font-bold">
                    <CustomSelectValue placeholder="자재를 선택하세요" />
                  </CustomSelectTrigger>
                  <CustomSelectContent className="rounded-2xl border-none shadow-2xl">
                    {options.map(o => (
                      <CustomSelectItem key={o.id} value={o.id} className="font-bold rounded-lg">
                        {o.name}
                      </CustomSelectItem>
                    ))}
                  </CustomSelectContent>
                </CustomSelect>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest ml-1">
                  Quantity
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={m.quantity || ''}
                    onChange={e => handleUpdate(idx, { quantity: parseFloat(e.target.value) || 0 })}
                    className="w-full h-12 rounded-xl border-2 border-white bg-white shadow-sm px-4 pr-10 font-bold italic"
                    placeholder="0"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-muted-foreground/30 uppercase">
                    {m.unit || '말'}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest ml-1">
                  Notes
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={m.notes || ''}
                    onChange={e => handleUpdate(idx, { notes: e.target.value })}
                    className="w-full h-12 rounded-xl border-2 border-white bg-white shadow-sm px-4 font-bold text-sm"
                    placeholder="비고"
                  />
                  <StickyNote className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/20" />
                </div>
              </div>
            </div>
          </div>
        ))}

        {materials.length === 0 && (
          <div className="py-12 border-2 border-dashed border-gray-100 rounded-3xl flex flex-col items-center justify-center text-muted-foreground/20 italic">
            <Package className="w-10 h-10 mb-2 opacity-10" />
            <p className="text-sm font-bold">등록된 자재 사용 내역이 없습니다.</p>
          </div>
        )}
      </div>
    </Card>
  )
}
