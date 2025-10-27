'use client'

import React from 'react'
import {
  CustomSelect,
  CustomSelectContent,
  CustomSelectItem,
  CustomSelectTrigger,
  CustomSelectValue,
} from '@/components/ui/custom-select'
import { MaterialEntry } from '@/modules/mobile/hooks/use-worklog-mutations'

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

  React.useEffect(() => {
    if (optionsMap.size === 0 || materials.length === 0) return
    let changed = false
    const next = materials.map(material => {
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
    onChange([...materials, { ...defaultMaterial }])
  }

  const handleRemove = (index: number) => {
    onChange(materials.filter((_, idx) => idx !== index))
  }

  return (
    <div className="form-section materials-section">
      <div className="section-header">
        <h3 className="section-title">자재 사용 내역</h3>
        <button className="add-btn" type="button" onClick={handleAdd}>
          추가
        </button>
      </div>

      {materials.length === 0 ? (
        <p className="materials-hint mt-2">사용한 자재가 있다면 추가 버튼으로 입력</p>
      ) : null}

      {materials.map((material, index) => {
        const matchedOption = material.material_id
          ? optionsMap.get(material.material_id)
          : options.find(
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
                <CustomSelectTrigger className="form-select">
                  <CustomSelectValue placeholder="자재 선택" />
                </CustomSelectTrigger>
                <CustomSelectContent>
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
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium">{option.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {[option.code, option.unit].filter(Boolean).join(' · ') || '정보 없음'}
                          </span>
                        </div>
                      </CustomSelectItem>
                    ))
                  )}
                </CustomSelectContent>
              </CustomSelect>
            </div>
            <div className="form-group">
              <label className="form-label">수량</label>
              <input
                type="number"
                className="form-input"
                value={material.quantity === 0 ? '' : material.quantity}
                onChange={event =>
                  handleUpdate(index, { quantity: Number(event.target.value) || 0 })
                }
                min={0}
                step={0.5}
                onFocus={e => {
                  // UX: clear default 0 when user focuses the field
                  if (material.quantity === 0) {
                    // let controlled value render as empty; no state write needed here
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
              <button className="delete-tag-btn" type="button" onClick={() => handleRemove(index)}>
                삭제
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default MaterialsInput
