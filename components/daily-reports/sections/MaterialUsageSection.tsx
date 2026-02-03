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
import React, { useMemo } from 'react'
import { CollapsibleSection, useRolePermissions } from '../CollapsibleSection'
import {
  DEFAULT_MATERIAL_UNIT,
  MATERIAL_UNIT_OPTIONS,
  MaterialInventoryEntry,
  MaterialOptionItem,
  MaterialUsageFormEntry,
} from '../types'

interface MaterialUsageSectionProps {
  materialUsageEntries: MaterialUsageFormEntry[]
  setMaterialUsageEntries: React.Dispatch<React.SetStateAction<MaterialUsageFormEntry[]>>
  materialOptionsState: MaterialOptionItem[]
  materialOptionMap: Map<string, MaterialOptionItem>
  materialInventory: Record<string, MaterialInventoryEntry>
  materialInventoryLoading: boolean
  materialInventoryError: string | null
  isExpanded: boolean
  onToggle: () => void
  permissions: ReturnType<typeof useRolePermissions>
  addMaterialEntry: () => void
  handleRemoveMaterial: (id: string) => void
  handleMaterialSelect: (entryId: string, value: string) => void
  handleMaterialQuantityChange: (entryId: string, value: string) => void
  handleMaterialUnitChange: (entryId: string, value: string) => void
  handleMaterialNoteChange: (entryId: string, value: string) => void
}

export const MaterialUsageSection = ({
  materialUsageEntries,
  setMaterialUsageEntries,
  materialOptionsState,
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
}: MaterialUsageSectionProps) => {
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

  if (!permissions.canManageMaterials) return null

  return (
    <CollapsibleSection
      title="자재 사용 내역"
      icon={Package}
      isExpanded={isExpanded}
      onToggle={onToggle}
      managerOnly={true}
      permissions={permissions}
    >
      <div className="space-y-4">
        {materialSummary.length > 0 && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <div className="mb-2 font-medium text-slate-800">자재별 사용 합계</div>
            <div className="flex flex-wrap gap-2">
              {materialSummary.map(item => (
                <Badge
                  key={`${item.name}-${item.unit || 'unit'}`}
                  variant="secondary"
                  className="bg-white text-slate-700 border-slate-200"
                >
                  {item.name}: {item.quantity}
                  {item.unit ? ` ${item.unit}` : ''}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {materialUsageEntries.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600">
            <p className="font-medium text-slate-700">등록된 자재 사용 내역이 없습니다.</p>
            <p className="mt-1 text-slate-500">
              자재는 본사 관리자 &gt; 자재 관리 설정에서 사전에 등록할 수 있으며, 필요한 경우 아래
              “자재 추가” 버튼을 눌러 직접 작성할 수도 있습니다.
            </p>
          </div>
        ) : (
          materialUsageEntries.map((entry, index) => {
            const selectValue = entry.materialId ?? '__unset__'
            const inventoryInfo = entry.materialId ? materialInventory[entry.materialId] : null
            const quantityValue = Number(entry.quantity)
            const exceedsInventory =
              Boolean(inventoryInfo) &&
              Number.isFinite(quantityValue) &&
              quantityValue > (inventoryInfo?.quantity ?? 0)

            return (
              <div
                key={entry.id}
                className="rounded-xl border border-slate-200 bg-white px-4 py-5 shadow-xs"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs text-slate-600">
                      {index + 1}
                    </span>
                    <span>자재 내역 #{index + 1}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addMaterialEntry}
                      className="h-8 border-dashed border-gray-300 hover:border-blue-400 hover:text-blue-600 transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      자재 추가
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleRemoveMaterial(entry.id)}
                      title="자재 삭제"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-gray-500 font-medium">자재 선택</Label>
                    <CustomSelect
                      value={selectValue}
                      onValueChange={value => handleMaterialSelect(entry.id, value)}
                    >
                      <CustomSelectTrigger className="h-9 w-full">
                        <CustomSelectValue placeholder="자재 선택" className="truncate" />
                      </CustomSelectTrigger>
                      <CustomSelectContent>
                        <CustomSelectItem value="__unset__">선택 안 함</CustomSelectItem>
                        {materialOptionsState.map(option => (
                          <CustomSelectItem key={option.id} value={option.id}>
                            {option.name}
                          </CustomSelectItem>
                        ))}
                      </CustomSelectContent>
                    </CustomSelect>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-gray-500 font-medium">사용량</Label>
                    <div className="space-y-1">
                      <Input
                        type="number"
                        inputMode="decimal"
                        className={cn(
                          'h-9',
                          exceedsInventory &&
                            'border-destructive text-destructive focus-visible:ring-destructive'
                        )}
                        value={entry.quantity}
                        onChange={e => handleMaterialQuantityChange(entry.id, e.target.value)}
                        placeholder="0.0"
                        aria-invalid={exceedsInventory || undefined}
                      />
                      <div className="text-[10px] leading-tight flex flex-col gap-0.5">
                        {materialInventoryLoading ? (
                          <span className="text-gray-400">재고 확인 중...</span>
                        ) : inventoryInfo ? (
                          <span
                            className={cn(
                              'text-gray-500',
                              inventoryInfo.quantity <= 0 && 'text-red-500 font-medium'
                            )}
                          >
                            재고: {inventoryInfo.quantity.toLocaleString()}{' '}
                            {inventoryInfo.unit || ''}
                          </span>
                        ) : materialInventoryError ? (
                          <span className="text-gray-400">에러: {materialInventoryError}</span>
                        ) : (
                          <span className="text-gray-400">재고 정보 없음</span>
                        )}
                        {exceedsInventory && (
                          <span className="text-red-500 font-bold italic">재고 초과!</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-gray-500 font-medium">단위</Label>
                    <CustomSelect
                      value={entry.unit || DEFAULT_MATERIAL_UNIT}
                      onValueChange={value => handleMaterialUnitChange(entry.id, value)}
                    >
                      <CustomSelectTrigger className="h-9 w-full">
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
                    <Label className="text-xs text-gray-500 font-medium">비고 (메모)</Label>
                    <Input
                      className="h-9"
                      value={entry.notes ?? ''}
                      onChange={e => handleMaterialNoteChange(entry.id, e.target.value)}
                      placeholder="특이사항 입력"
                    />
                  </div>
                </div>
              </div>
            )
          })
        )}

        {materialUsageEntries.length === 0 && (
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={addMaterialEntry}
              className="h-12 border-dashed"
            >
              <Plus className="h-4 w-4 mr-2" />
              자재 추가
            </Button>
          </div>
        )}
      </div>
    </CollapsibleSection>
  )
}
