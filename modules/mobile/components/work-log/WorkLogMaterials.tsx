'use client'

import { Package } from 'lucide-react'
import React, { useState } from 'react'
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
  const [options, setOptions] = useState<string[]>(DEFAULT_OPTIONS)
  const [selectedValue, setSelectedValue] = useState<string>('')
  const [customInput, setCustomInput] = useState<string>('')
  const [qty, setQty] = useState<string>('')

  const isCustomMode = selectedValue === 'custom'

  const handleAdd = () => {
    if (disabled) return

    // Determine exact name
    // If custom mode, user must have confirmed custom input?
    // A's logic: confirm custom -> adds to select -> user selects it -> then adds material.
    // My UI logic can be simpler:
    // If custom mode, use customInput. If select mode, use selectedValue.

    // But A's UI hides custom input after confirm.
    // I will implement "Direct Input" mode: where selecting "Direct Input" shows input.
    // Confirming it adds to options? Or just adds to list?
    // A's `handleConfirmCustomMaterial` adds to options.
    // I can stick to A's flow or simplify.
    // Simplify: If 'custom', show input. Add Button uses input value.

    const materialName = isCustomMode ? customInput.trim() : selectedValue
    const quantity = parseFloat(qty)

    if (!materialName) {
      alert('자재명을 선택하거나 입력해주세요.')
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
    if (isCustomMode) {
      // If we want to keep the custom option available?
      // A adds it to options. I'll do the same for convenience.
      if (!options.includes(materialName)) {
        setOptions(prev => [...prev, materialName])
      }
      setSelectedValue('') // Select the newly added one? Or reset?
      // A resets qty. Keeps material selected?
      // I'll reset selection to allow rapid entry or keep it?
      // Usually reset is safer.
      setCustomInput('')
    } else {
      setSelectedValue('')
    }
  }

  const handleCustomConfirm = () => {
    if (!customInput.trim()) return
    // Add to options and select it
    if (!options.includes(customInput.trim())) {
      setOptions(prev => [...prev, customInput.trim()])
    }
    setSelectedValue(customInput.trim())
    setCustomInput('')
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
        <select
          value={selectedValue}
          onChange={e => setSelectedValue(e.target.value)}
          disabled={disabled}
          className="material-select w-full h-[48px] rounded-xl px-4 font-medium outline-none transition-all appearance-none bg-no-repeat"
          style={{
            background: 'var(--bg-input)',
            border: '1px solid var(--border)',
            backgroundPosition: 'right 14px center',
            // Arrow icon handled by CSS class 'material-select' usually, or I need to add it manually if class not enough
          }}
        >
          <option value="" disabled>
            자재 선택
          </option>
          {options.map(opt => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
          <option value="custom">직접입력</option>
        </select>

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
          disabled={disabled || (isCustomMode && !customInput)} // HandleAdd logic handles validation
          className="w-12 h-[48px] rounded-xl font-black text-lg flex items-center justify-center transition-colors hover:bg-sky-100"
          style={{
            background: 'var(--primary-bg)',
            color: 'var(--primary)',
          }}
        >
          +
        </button>
      </div>

      {/* Custom Input Row */}
      {isCustomMode && (
        <div className="flex gap-2 items-center mb-3 animate-[slideDown_0.2s_ease-out]">
          <input
            type="text"
            value={customInput}
            onChange={e => setCustomInput(e.target.value)}
            disabled={disabled}
            placeholder="자재명 직접 입력"
            className="flex-1 h-[48px] rounded-xl px-3 outline-none transition-all border focus:ring-2 focus:ring-[#87CEEB]/20"
            style={{
              background: 'var(--bg-input)',
              borderColor: 'var(--border)',
              border: '1px solid var(--border)',
            }}
          />
          <button
            type="button"
            onClick={handleCustomConfirm}
            className="px-4 h-[48px] rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap text-white hover:bg-slate-700 transition-colors"
            style={{ background: 'var(--header-navy)' }}
          >
            확인
          </button>
        </div>
      )}

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
