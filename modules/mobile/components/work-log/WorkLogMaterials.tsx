'use client'

import { Package } from 'lucide-react'
import React, { useState } from 'react'
import {
  CustomSelect,
  CustomSelectContent,
  CustomSelectItem,
  CustomSelectTrigger,
  CustomSelectValue,
} from '@/components/ui/custom-select'
import { MaterialUsageEntry } from '../../types/work-log.types'
import './work-form.css'

interface WorkLogMaterialsProps {
  materials: MaterialUsageEntry[]
  onChange: (materials: MaterialUsageEntry[]) => void
  disabled?: boolean
}

const DEFAULT_OPTIONS = ['NPC-1000', 'NPC-3000Q']

export const WorkLogMaterials: React.FC<WorkLogMaterialsProps> = ({
  materials,
  onChange,
  disabled = false,
}) => {
  const [selectedValue, setSelectedValue] = useState<string>('NPC-1000')
  const [qty, setQty] = useState<string>('')

  const handleAdd = () => {
    if (disabled) return

    const materialName = selectedValue
    const quantity = parseFloat(qty)

    if (!materialName) {
      alert('자재를 선택해주세요.')
      return
    }
    if (isNaN(quantity) || quantity <= 0) {
      alert('올바른 수량을 입력해주세요.')
      return
    }

    const newMaterial: MaterialUsageEntry = {
      material_name: materialName,
      unit: '말',
      quantity: quantity,
      material_code: '', // Optional
      notes: '', // Optional
    }

    onChange([...materials, newMaterial])

    // Reset
    setQty('')
  }

  const handleRemove = (index: number) => {
    if (disabled) return
    const newMaterials = materials.filter((_, i) => i !== index)
    onChange(newMaterials)
  }

  return (
    <div
      className="rounded-2xl p-6 shadow-sm border border-transparent dark:border-slate-700 mb-4"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
      }}
    >
      <div className="flex justify-between items-center mb-3">
        <div
          className="text-xl font-bold text-header-navy dark:text-white flex items-center gap-2"
          style={{ color: 'var(--header-navy)' }}
        >
          <Package className="w-5 h-5" style={{ color: 'var(--header-navy)' }} />
          자재 사용 내역
          <span className="text-[14px] font-medium ml-2" style={{ color: 'var(--text-sub)' }}>
            ㅣ 자재 있을 시 입력
          </span>
        </div>
      </div>

      {/* Input Row */}
      <div className="grid grid-cols-[1.8fr_1fr_auto] gap-2.5 mb-3 items-center">
        <CustomSelect value={selectedValue} onValueChange={setSelectedValue} disabled={disabled}>
          <CustomSelectTrigger
            aria-label="자재 선택"
            className="w-full h-[48px] rounded-xl px-4 text-[15px] font-medium"
            style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border)',
            }}
          >
            <CustomSelectValue placeholder="자재 선택" />
          </CustomSelectTrigger>
          <CustomSelectContent align="start">
            {DEFAULT_OPTIONS.map(opt => (
              <CustomSelectItem key={opt} value={opt}>
                {opt}
              </CustomSelectItem>
            ))}
          </CustomSelectContent>
        </CustomSelect>

        <div
          className="flex items-center rounded-xl h-[48px] px-3 border"
          style={{
            background: 'var(--bg-input)',
            borderColor: 'var(--border)',
          }}
        >
          <input
            type="number"
            min="0"
            placeholder="0"
            value={qty}
            onChange={e => setQty(e.target.value)}
            disabled={disabled}
            className="flex-1 bg-transparent text-right font-medium outline-none w-full"
          />
          <span className="text-[15px] font-medium ml-1" style={{ color: 'var(--text-sub)' }}>
            말
          </span>
        </div>

        <button
          type="button"
          onClick={handleAdd}
          disabled={disabled}
          className="w-12 h-[48px] rounded-xl font-black text-lg flex items-center justify-center transition-colors hover:bg-sky-100"
          style={{
            background: 'var(--primary-bg)',
            color: 'var(--primary)',
          }}
        >
          +
        </button>
      </div>

      {/* List */}
      <div className="flex flex-col gap-2">
        {materials.map((mat, index) => (
          <div
            key={index}
            className="rounded-xl p-3 flex justify-between items-center text-[15px]"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
            }}
          >
            <div>
              <span className="font-semibold">{mat.material_name}</span>
              <span className="ml-2 font-bold" style={{ color: 'var(--primary)' }}>
                {mat.quantity}
                {mat.unit}
              </span>
            </div>
            {!disabled && (
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="bg-red-50 text-red-500 text-sm font-bold px-2.5 py-1 rounded-xl hover:bg-red-100 transition-colors"
              >
                삭제
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
