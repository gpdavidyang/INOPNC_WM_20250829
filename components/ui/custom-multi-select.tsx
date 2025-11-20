'use client'

import React from 'react'
import {
  CustomSelect,
  CustomSelectContent,
  CustomSelectTrigger,
} from '@/components/ui/custom-select'
import { ChevronDown, Check, X } from 'lucide-react'

export interface MultiOption {
  value: string
  label: string
  group?: string
}

interface CustomMultiSelectProps {
  label?: string
  options: MultiOption[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
  grouped?: boolean
}

export function CustomMultiSelect({
  label,
  options,
  selected,
  onChange,
  placeholder = '전체 (미선택 시 전체)',
  grouped = false,
}: CustomMultiSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')

  const filtered = React.useMemo(
    () => options.filter(o => o.label.toLowerCase().includes(search.toLowerCase())),
    [options, search]
  )

  const groupedMap = React.useMemo(() => {
    if (!grouped) return { '': filtered }
    return filtered.reduce(
      (acc, o) => {
        const g = o.group || '기타'
        if (!acc[g]) acc[g] = []
        acc[g].push(o)
        return acc
      },
      {} as Record<string, MultiOption[]>
    )
  }, [filtered, grouped])

  const toggle = (v: string) => {
    if (selected.includes(v)) onChange(selected.filter(x => x !== v))
    else onChange([...selected, v])
  }
  const toggleAll = () => {
    if (selected.length === options.length) onChange([])
    else onChange(options.map(o => o.value))
  }
  const clear = () => onChange([])

  const summary = React.useMemo(() => {
    if (selected.length === 0) return placeholder
    if (selected.length === options.length) return '전체 선택됨'
    const labels = selected
      .map(v => options.find(o => o.value === v)?.label)
      .filter(Boolean) as string[]
    const head = labels.slice(0, 2).join(', ')
    return labels.length > 2 ? `${head} 외 ${labels.length - 2}개` : head
  }, [selected, options, placeholder])

  return (
    <div>
      {label && <label className="block text-sm text-muted-foreground mb-1">{label}</label>}
      <CustomSelect open={open} onOpenChange={setOpen} value="__multi__">
        <CustomSelectTrigger className="h-10">
          <div className="flex w-full items-center justify-between">
            <span className="text-sm text-gray-900 dark:text-gray-100 truncate">{summary}</span>
            {selected.length > 0 && (
              <button
                type="button"
                onClick={e => {
                  e.preventDefault()
                  e.stopPropagation()
                  clear()
                }}
                className="ml-2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                aria-label="선택 해제"
              >
                <X className="h-3.5 w-3.5 text-gray-500" />
              </button>
            )}
          </div>
        </CustomSelectTrigger>
        <CustomSelectContent sideOffset={6} align="start">
          <div className="min-w-[220px] max-w-[320px]">
            <div className="sticky top-0 bg-white dark:bg-[#0f172a]/95 border-b border-gray-200 dark:border-gray-700 p-2">
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="검색..."
                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div className="sticky top-[38px] bg-white dark:bg-[#0f172a]/95 border-b border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={toggleAll}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <div
                  className={`w-4 h-4 border rounded flex items-center justify-center ${
                    selected.length === options.length
                      ? 'bg-blue-600 border-blue-600'
                      : selected.length > 0
                        ? 'bg-blue-100 border-blue-600'
                        : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  {selected.length === options.length && <Check className="h-3 w-3 text-white" />}
                  {selected.length > 0 && selected.length < options.length && (
                    <div className="w-2 h-0.5 bg-blue-600" />
                  )}
                </div>
                <span className="font-medium text-gray-900 dark:text-gray-100">전체 선택</span>
              </button>
            </div>

            <div className="max-h-60 overflow-auto p-1">
              {Object.entries(groupedMap).map(([g, list]) => (
                <div key={g}>
                  {g && (
                    <div className="px-3 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      {g}
                    </div>
                  )}
                  {list.map(o => (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => toggle(o.value)}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                    >
                      <div
                        className={`w-4 h-4 border rounded flex items-center justify-center ${
                          selected.includes(o.value)
                            ? 'bg-blue-600 border-blue-600'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}
                      >
                        {selected.includes(o.value) && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <span className="text-gray-900 dark:text-gray-100">{o.label}</span>
                    </button>
                  ))}
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                  검색 결과가 없습니다
                </div>
              )}
            </div>
          </div>
        </CustomSelectContent>
      </CustomSelect>
    </div>
  )
}

export default CustomMultiSelect
