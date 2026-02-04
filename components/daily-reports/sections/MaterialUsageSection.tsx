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
import { cn } from '@/lib/utils'
import { Package, Plus, Trash2 } from 'lucide-react'
import { useMemo } from 'react'
import { CollapsibleSection } from '../CollapsibleSection'
import {
  DEFAULT_MATERIAL_UNIT,
  MATERIAL_UNIT_OPTIONS,
  MaterialInventoryEntry,
  MaterialOptionItem,
  MaterialUsageFormEntry,
} from '../types'

interface MaterialUsageSectionProps {
  materialUsageEntries: MaterialUsageFormEntry[]
  setMaterialUsageEntries: any
  materialOptions: MaterialOptionItem[]
  materialOptionMap: Map<string, MaterialOptionItem>
  materialInventory: Record<string, MaterialInventoryEntry>
  materialInventoryLoading: boolean
  materialInventoryError: string | null
  isExpanded: boolean
  onToggle: () => void
  permissions: any
  addMaterialEntry: () => void
  handleRemoveMaterial: (id: string) => void
  handleMaterialSelect: (entryId: string, value: string) => void
  handleMaterialQuantityChange: (entryId: string, value: string) => void
  handleMaterialUnitChange: (entryId: string, value: string) => void
  handleMaterialNoteChange: (entryId: string, value: string) => void
}

export const MaterialUsageSection = (props: MaterialUsageSectionProps) => {
  const {
    materialUsageEntries,
    materialOptionMap,
    materialInventory,
    materialInventoryLoading,
    materialInventoryError,
    isExpanded,
    onToggle,
    permissions,
    addMaterialEntry,
    handleRemoveMaterial,
    handleMaterialSelect,
    handleMaterialQuantityChange,
    handleMaterialUnitChange,
    handleMaterialNoteChange,
    materialOptions,
  } = props

  const materialSummary = useMemo(() => {
    const summaryMap = new Map<string, { name: string; quantity: number; unit: string }>()

    materialUsageEntries.forEach(entry => {
      const quantity = parseFloat(entry.quantity) || 0
      if (quantity <= 0) return

      const option = entry.materialId ? materialOptionMap.get(entry.materialId) : null
      const name = entry.materialName || option?.name || '알 수 없는 자재'
      const unit = entry.unit || option?.unit || ''
      const key = `${name}-${unit}`

      if (summaryMap.has(key)) {
        summaryMap.get(key)!.quantity += quantity
      } else {
        summaryMap.set(key, { name, quantity, unit })
      }
    })

    return Array.from(summaryMap.values())
  }, [materialUsageEntries, materialOptionMap])

  if (!permissions?.canManageMaterials) return null

  return (
    <CollapsibleSection
      title="자재 사용 내역"
      icon={Package}
      isExpanded={isExpanded}
      onToggle={onToggle}
      managerOnly={true}
      permissions={permissions}
    >
      <div className="space-y-6">
        {materialSummary.length > 0 && (
          <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
            <div className="text-[11px] font-black uppercase tracking-tighter text-[#1A254F] opacity-30 mb-3 ml-1">
              자재별 사용 합계
            </div>
            <div className="flex flex-wrap gap-2">
              {materialSummary.map(item => (
                <Badge
                  key={`${item.name}-${item.unit || 'unit'}`}
                  variant="secondary"
                  className="bg-white text-[#1A254F] border-slate-200 px-3 py-1 font-bold shadow-sm"
                >
                  {item.name}: <span className="text-blue-600 ml-1">{item.quantity}</span>
                  {item.unit ? (
                    <span className="opacity-50 ml-0.5 font-medium">{item.unit}</span>
                  ) : (
                    ''
                  )}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {materialUsageEntries.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/30 px-6 py-10 flex flex-col items-center text-center">
            <div className="bg-white p-3 rounded-full shadow-sm mb-4">
              <Package className="h-6 w-6 text-slate-300" />
            </div>
            <p className="font-black text-slate-800 tracking-tight">
              등록된 자재 사용 내역이 없습니다.
            </p>
            <p className="mt-2 text-xs text-slate-500 max-w-sm leading-relaxed mb-6">
              본사 관리자 &gt; 자재 관리 설정에서 사전에 등록된 자재를 선택하거나,
              <br />
              아래 “항목 추가” 버튼을 눌러 직접 작성할 수 있습니다.
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={addMaterialEntry}
              className="h-10 rounded-xl border-dashed border-slate-300 hover:border-blue-400 hover:text-blue-600 px-6 font-bold"
            >
              <Plus className="h-4 w-4 mr-2" />
              항목 추가
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {materialUsageEntries.map((entry, index) => {
              const selectValue = entry.materialId ?? '__unset__'
              const inventoryInfo = entry.materialId ? materialInventory[entry.materialId] : null
              const quantityValue = parseFloat(entry.quantity)
              const exceedsInventory =
                Boolean(inventoryInfo) &&
                Number.isFinite(quantityValue) &&
                quantityValue > (inventoryInfo?.quantity ?? 0)

              return (
                <div
                  key={entry.id}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-100/50 transition-all hover:shadow-md hover:shadow-slate-200/50"
                >
                  <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="bg-[#1A254F] text-white w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black italic">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span className="text-base font-black text-gray-900 tracking-tight">
                        자재 내역 #{index + 1}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addMaterialEntry}
                        className="h-9 rounded-xl border-dashed border-gray-300 hover:border-blue-400 hover:text-blue-600 transition-all whitespace-nowrap px-4"
                      >
                        <Plus className="h-3.5 w-3.5 mr-1.5" />
                        항목 추가
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-9 rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-100 px-3 transition-all"
                        onClick={() => handleRemoveMaterial(entry.id)}
                        title="자재 삭제"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-black text-foreground uppercase tracking-tighter opacity-50 pl-1">
                        자재 선택
                      </Label>
                      <CustomSelect
                        value={selectValue}
                        onValueChange={value => handleMaterialSelect(entry.id, value)}
                      >
                        <CustomSelectTrigger className="h-10 rounded-xl bg-gray-50 border-none px-4 text-sm focus:ring-2 focus:ring-blue-500/20 transition-all">
                          <CustomSelectValue placeholder="자재 선택" className="truncate" />
                        </CustomSelectTrigger>
                        <CustomSelectContent>
                          <CustomSelectItem value="__unset__" className="text-slate-400">
                            선택 안 함
                          </CustomSelectItem>
                          {(materialOptions || []).map(option => (
                            <CustomSelectItem key={option.id} value={option.id}>
                              <div className="flex items-center justify-between w-full">
                                <span className="font-bold">{option.name}</span>
                                {option.code && (
                                  <span className="text-[10px] bg-slate-100 px-1 rounded ml-2">
                                    {option.code}
                                  </span>
                                )}
                              </div>
                            </CustomSelectItem>
                          ))}
                        </CustomSelectContent>
                      </CustomSelect>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-black text-foreground uppercase tracking-tighter opacity-50 pl-1">
                        사용량
                      </Label>
                      <div className="space-y-2">
                        <Input
                          type="number"
                          inputMode="decimal"
                          className={cn(
                            'h-10 rounded-xl bg-gray-50 border-none px-4 text-sm focus:ring-2 transition-all font-bold',
                            exceedsInventory
                              ? 'text-rose-600 focus:ring-rose-500/20 bg-rose-50/50'
                              : 'focus:ring-blue-500/20'
                          )}
                          value={entry.quantity}
                          onChange={e => handleMaterialQuantityChange(entry.id, e.target.value)}
                          placeholder="0.0"
                          aria-invalid={exceedsInventory || undefined}
                        />
                        <div className="px-2">
                          {materialInventoryLoading ? (
                            <div className="flex items-center gap-1.5 animate-pulse">
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                              <span className="text-[10px] font-bold text-blue-400">
                                재고 실시간 확인 중...
                              </span>
                            </div>
                          ) : inventoryInfo ? (
                            <div className="flex items-center justify-between">
                              <span
                                className={cn(
                                  'text-[10px] font-black uppercase tracking-tight',
                                  inventoryInfo.quantity <= 0 ? 'text-rose-500' : 'text-slate-400'
                                )}
                              >
                                현재 재고 : {inventoryInfo.quantity.toLocaleString()}{' '}
                                {inventoryInfo.unit || ''}
                              </span>
                              {exceedsInventory && (
                                <span className="text-[10px] font-black text-rose-600 animate-bounce">
                                  재고 초과!
                                </span>
                              )}
                            </div>
                          ) : materialInventoryError ? (
                            <span className="text-[10px] font-bold text-rose-400">
                              재고 확인 불가
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-300">
                              재고 정보 없음
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-black text-foreground uppercase tracking-tighter opacity-50 pl-1">
                        단위
                      </Label>
                      <CustomSelect
                        value={entry.unit || DEFAULT_MATERIAL_UNIT}
                        onValueChange={value => handleMaterialUnitChange(entry.id, value)}
                      >
                        <CustomSelectTrigger className="h-10 rounded-xl bg-gray-50 border-none px-4 text-sm focus:ring-2 focus:ring-blue-500/20 transition-all font-medium">
                          <CustomSelectValue placeholder="단위" />
                        </CustomSelectTrigger>
                        <CustomSelectContent>
                          {MATERIAL_UNIT_OPTIONS.map(option => (
                            <CustomSelectItem key={option} value={option}>
                              {option}
                            </CustomSelectItem>
                          ))}
                        </CustomSelectContent>
                      </CustomSelect>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-black text-foreground uppercase tracking-tighter opacity-50 pl-1">
                        비고 (메모)
                      </Label>
                      <Input
                        className="h-10 rounded-xl bg-gray-50 border-none px-4 text-sm focus:ring-2 focus:ring-blue-500/20 transition-all"
                        value={entry.notes ?? ''}
                        onChange={e => handleMaterialNoteChange(entry.id, e.target.value)}
                        placeholder="특이사항 입력"
                      />
                    </div>
                  </div>
                </div>
              )
            })}
            {/* 하단 추가 버튼 제거 (항목별 우측 버튼으로 대체) */}
          </div>
        )}
      </div>
    </CollapsibleSection>
  )
}
