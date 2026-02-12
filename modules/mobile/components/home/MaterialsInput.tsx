'use client'

import {
  CustomSelect,
  CustomSelectContent,
  CustomSelectItem,
  CustomSelectTrigger,
  CustomSelectValue,
} from '@/components/ui/custom-select'
import { MaterialEntry } from '@/modules/mobile/hooks/use-worklog-mutations'
import React from 'react'

interface MaterialsInputProps {
  materials: MaterialEntry[]
  onChange: (next: MaterialEntry[]) => void
}

type MaterialOption = {
  id: string
  name: string
  code?: string | null
  unit?: string | null
  specification?: string | null
}

const defaultMaterial: MaterialEntry = {
  material_id: null,
  material_name: '',
  material_code: null,
  quantity: 0,
  unit: '',
  notes: '',
}

const LOADING_VALUE = '__loading__'
const ERROR_VALUE = '__error__'
const EMPTY_VALUE = '__empty__'

export const MaterialsInput: React.FC<MaterialsInputProps> = ({ materials, onChange }) => {
  const [options, setOptions] = React.useState<MaterialOption[]>([])
  const [optionsLoading, setOptionsLoading] = React.useState(false)
  const [optionsError, setOptionsError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const controller = new AbortController()
    let isMounted = true
    const load = async () => {
      if (!isMounted) return
      setOptionsLoading(true)
      setOptionsError(null)
      try {
        const res = await fetch('/api/mobile/materials', { signal: controller.signal })
        if (!res.ok) {
          throw new Error('자재 목록을 불러오지 못했습니다.')
        }
        const json = await res.json()
        if (!json?.success || !Array.isArray(json?.data)) {
          throw new Error(json?.error || '자재 목록을 불러오지 못했습니다.')
        }
        if (!isMounted) return
        setOptions(
          (json.data as any[]).map(option => ({
            id: String(option.id),
            name: String(option.name ?? ''),
            code: option.code ?? null,
            unit: option.unit ?? null,
            specification: option.specification ?? null,
          }))
        )
      } catch (error) {
        if ((error as any)?.name === 'AbortError') return
        console.error('Failed to load materials:', error)
        if (isMounted) {
          setOptionsError((error as Error)?.message || '자재 목록을 불러오지 못했습니다.')
        }
      } finally {
        if (isMounted) {
          setOptionsLoading(false)
        }
      }
    }
    load()
    return () => {
      isMounted = false
      controller.abort()
    }
  }, [])

  const optionsMap = React.useMemo(() => {
    return new Map(options.map(option => [option.id, option]))
  }, [options])

  // Ensure always at least one row exists
  // Ensure always at least one row exists / Set Default NPC-1000
  React.useEffect(() => {
    if (materials.length === 0) {
      // Try to find default option
      const defaultOption = options.find(o => o.name === 'NPC-1000')
      const initialMaterial = defaultOption
        ? {
            ...defaultMaterial,
            material_id: defaultOption.id,
            material_name: defaultOption.name,
            material_code: defaultOption.code ?? null,
            unit: defaultOption.unit ?? '',
          }
        : { ...defaultMaterial }

      onChange([initialMaterial])
    } else if (materials.length === 1 && !materials[0].material_id && options.length > 0) {
      // If there is 1 empty row and options are loaded, try to set default if it matches nothing
      const defaultOption = options.find(o => o.name === 'NPC-1000')
      if (defaultOption) {
        onChange([
          {
            ...materials[0],
            material_id: defaultOption.id,
            material_name: defaultOption.name,
            material_code: defaultOption.code ?? null,
            unit: defaultOption.unit ?? '',
          },
        ])
      }
    }
  }, [materials.length, onChange, options])

  React.useEffect(() => {
    if (optionsMap.size === 0 || materials.length === 0) return
    let changed = false
    const next = materials.map(material => {
      // ... existing mapping logic ...
      if (!material.material_id) return material
      const option = optionsMap.get(material.material_id)
      if (!option) return material
      let updated = material
      if (material.material_name !== option.name) {
        updated = { ...updated, material_name: option.name }
        changed = true
      }
      const nextCode = option.code ?? null
      if ((updated.material_code ?? null) !== nextCode) {
        updated = updated === material ? { ...updated } : updated
        updated.material_code = nextCode
        changed = true
      }
      const nextUnit = option.unit ?? ''
      if ((updated.unit ?? '') !== nextUnit) {
        updated = updated === material ? { ...updated } : updated
        updated.unit = nextUnit
        changed = true
      }
      return updated
    })
    if (changed) {
      onChange(next)
    }
  }, [optionsMap, materials, onChange])

  const handleUpdate = (index: number, updates: Partial<MaterialEntry>) => {
    const next = materials.map((item, idx) => (idx === index ? { ...item, ...updates } : item))
    onChange(next)
  }

  const handleAdd = () => {
    // Add new row with default NPC-1000 if available
    const defaultOption = options.find(o => o.name === 'NPC-1000')
    const newMaterial = defaultOption
      ? {
          ...defaultMaterial,
          material_id: defaultOption.id,
          material_name: defaultOption.name,
          material_code: defaultOption.code ?? null,
          unit: defaultOption.unit ?? '',
        }
      : { ...defaultMaterial }
    onChange([...materials, newMaterial])
  }

  const handleRemove = (index: number) => {
    onChange(materials.filter((_, idx) => idx !== index))
  }

  return (
    <div className="form-section materials-section">
      <div className="section-header">
        <h3 className="section-title">자재 사용 내역</h3>
        <button className="add-btn" type="button" onClick={handleAdd}>
          + 추가
        </button>
      </div>

      {/* materials.length === 0 일 때 힌트 대신 자동으로 빈 행이 추가되도록 useEffect에서 처리함 */}

      {materials.map((material, index) => {
        const matchedOption =
          (material.material_id ? optionsMap.get(material.material_id) : null) ||
          options.find(
            option =>
              option.name === material.material_name || option.code === material.material_code
          )
        const selectValue: string | undefined = matchedOption ? matchedOption.id : undefined

        return (
          <div key={index} className="form-row material-row">
            <div className="form-group">
              <label className="form-label">자재명</label>
              <CustomSelect
                value={selectValue}
                onValueChange={value => {
                  if (value === LOADING_VALUE || value === ERROR_VALUE || value === EMPTY_VALUE) {
                    return
                  }
                  const selected = optionsMap.get(value)
                  if (!selected) return
                  handleUpdate(index, {
                    material_id: selected.id,
                    material_name: selected.name,
                    material_code: selected.code ?? null,
                    unit: selected.unit ?? '',
                  })
                }}
              >
                <CustomSelectTrigger className="form-select w-full justify-between">
                  <CustomSelectValue asChild>
                    <span className="flex-1 text-left">
                      {matchedOption ? matchedOption.name : '자재 선택'}
                    </span>
                  </CustomSelectValue>
                </CustomSelectTrigger>
                <CustomSelectContent className="mobile-select-content">
                  {optionsLoading ? (
                    <CustomSelectItem value={LOADING_VALUE} disabled>
                      자재 목록 불러오는 중...
                    </CustomSelectItem>
                  ) : optionsError ? (
                    <CustomSelectItem value={ERROR_VALUE} disabled>
                      {optionsError}
                    </CustomSelectItem>
                  ) : options.length === 0 ? (
                    <CustomSelectItem value={EMPTY_VALUE} disabled>
                      등록된 자재가 없습니다
                    </CustomSelectItem>
                  ) : (
                    options.map(option => (
                      <CustomSelectItem key={option.id} value={option.id}>
                        {option.name}
                      </CustomSelectItem>
                    ))
                  )}
                </CustomSelectContent>
              </CustomSelect>
            </div>
            <div className="form-group">
              <label className="form-label">수량(말)</label>
              <input
                type="text"
                className="form-input no-spinner"
                value={material.quantity === 0 ? '' : String(material.quantity)}
                onChange={event => {
                  const val = event.target.value
                  // Allow empty, numbers and one decimal point
                  if (val === '' || /^\d*\.?\d*$/.test(val)) {
                    handleUpdate(index, { quantity: val as any })
                  }
                }}
                onBlur={event => {
                  const val = parseFloat(event.target.value) || 0
                  handleUpdate(index, { quantity: val })
                }}
                inputMode="decimal"
                placeholder="0"
                onFocus={e => {
                  if (material.quantity === 0) {
                    e.currentTarget.select()
                  }
                }}
              />
            </div>
            <div
              className="form-group"
              style={{
                gridColumn: '1 / -1',
              }}
            >
              <label className="form-label">비고</label>
              <input
                type="text"
                className="form-input notes-input"
                value={material.notes ?? ''}
                onChange={event => handleUpdate(index, { notes: event.target.value })}
                placeholder="선택 입력"
              />
            </div>
            {materials.length > 1 ? (
              <div
                className="form-group material-remove"
                style={{
                  gridColumn: '1 / -1',
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  // let CSS grid handle width so the item can align to the right edge
                  width: 'auto',
                }}
              >
                <button
                  className="delete-tag-btn"
                  type="button"
                  onClick={() => handleRemove(index)}
                >
                  삭제
                </button>
              </div>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}

export default MaterialsInput
