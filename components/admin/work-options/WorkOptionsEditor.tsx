'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Activity,
  ArrowDown,
  ArrowUp,
  Check,
  Clock,
  Edit2,
  Layers,
  Loader2,
  Plus,
  RotateCcw,
  Trash2,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

type OptionType = 'component_type' | 'process_type' | 'labor_hour'

interface WorkOptionSetting {
  id: string
  option_type: OptionType
  option_value: string
  option_label: string
  display_order: number
  is_active?: boolean
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s/]+/g, '_')
    .replace(/[^a-z0-9_\-]/g, '')
}

function Section({
  title,
  description,
  type,
  icon: Icon,
}: {
  title: string
  description: string
  type: OptionType
  icon: any
}) {
  const [items, setItems] = useState<WorkOptionSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newLabel, setNewLabel] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingLabel, setEditingLabel] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const url = new URL('/api/admin/work-options', window.location.origin)
      url.searchParams.set('option_type', type)
      const res = await fetch(url.toString(), {
        cache: 'no-store',
      })
      if (!res.ok) throw new Error('옵션을 불러오지 못했습니다')
      const data = (await res.json()) as WorkOptionSetting[]
      setItems(Array.isArray(data) ? data.sort((a, b) => a.display_order - b.display_order) : [])
    } catch (e: any) {
      setError(e?.message || '불러오기 실패')
    } finally {
      setLoading(false)
    }
  }, [type])

  useEffect(() => {
    void load()
  }, [load])

  const handleAdd = async () => {
    const label = newLabel.trim()
    if (!label) return
    let optionLabel = label
    let optionValue = slugify(label)

    if (type === 'labor_hour') {
      const numeric = Number(label)
      if (!Number.isFinite(numeric) || numeric < 0) {
        alert('공수 값은 0 이상의 숫자로 입력해주세요. 예: 0.5, 1, 1.5')
        return
      }
      optionValue = numeric.toString()
      optionLabel = `${numeric} 공수`
    }
    try {
      const res = await fetch('/api/admin/work-options', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          option_type: type,
          option_value: optionValue,
          option_label: optionLabel,
          display_order: (items[items.length - 1]?.display_order ?? 0) + 1,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || (json as any)?.error) throw new Error((json as any)?.error || '추가 실패')
      setNewLabel('')
      await load()
    } catch (e) {
      console.error(e)
      alert(e instanceof Error ? e.message : '추가 실패')
    }
  }

  const handleUpdate = async (id: string, patch: Partial<WorkOptionSetting>) => {
    try {
      const res = await fetch('/api/admin/work-options', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id, ...patch }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || (json as any)?.error) throw new Error((json as any)?.error || '수정 실패')
      await load()
    } catch (e) {
      console.error(e)
      alert(e instanceof Error ? e.message : '수정 실패')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('이 옵션을 삭제하시겠습니까? 삭제 시 복구할 수 없습니다.')) return
    try {
      const res = await fetch(`/api/admin/work-options?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('삭제 실패')
      await load()
    } catch (e) {
      console.error(e)
      alert(e instanceof Error ? e.message : '삭제 실패')
    }
  }

  const move = async (id: string, dir: 'up' | 'down') => {
    const idx = items.findIndex(i => i.id === id)
    if (idx < 0) return
    if ((dir === 'up' && idx === 0) || (dir === 'down' && idx === items.length - 1)) return
    const a = items[idx]
    const b = items[dir === 'up' ? idx - 1 : idx + 1]
    try {
      await Promise.all([
        handleUpdate(a.id, { display_order: b.display_order }),
        handleUpdate(b.id, { display_order: a.display_order }),
      ])
    } catch {
      // handled in handleUpdate
    }
  }

  return (
    <Card className="rounded-3xl border-gray-200 shadow-sm shadow-gray-200/40 overflow-hidden h-full flex flex-col">
      <CardHeader className="border-b border-gray-100 bg-gray-50/30 px-6 py-6 sm:px-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 rounded-xl">
            <Icon className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg font-bold text-[#1A254F]">{title}</CardTitle>
            <CardDescription className="text-xs font-medium text-slate-400 truncate">
              {description}
            </CardDescription>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => void load()}
            className="h-8 w-8 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-6 flex-1 flex flex-col">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-2 text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
            <span className="text-sm font-medium">불러오는 중...</span>
          </div>
        ) : error ? (
          <div className="py-6 text-center">
            <p className="text-sm font-bold text-rose-500">{error}</p>
            <Button
              variant="link"
              onClick={() => void load()}
              className="text-xs text-indigo-600 mt-2"
            >
              다시 조회하기
            </Button>
          </div>
        ) : (
          <div className="space-y-3 flex-1">
            <div className="max-h-[500px] overflow-y-auto pr-1 space-y-2 custom-scrollbar">
              {items.map((opt, i) => (
                <div
                  key={opt.id}
                  className="group flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all"
                >
                  <div className="w-6 h-6 flex items-center justify-center rounded-lg bg-slate-50 text-[10px] font-black text-slate-400">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    {editingId === opt.id ? (
                      <Input
                        value={editingLabel}
                        onChange={e => setEditingLabel(e.target.value)}
                        className="h-8 rounded-lg text-sm font-bold border-indigo-200 focus:ring-indigo-100"
                        autoFocus
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            void handleUpdate(opt.id, { option_label: editingLabel })
                            setEditingId(null)
                            setEditingLabel('')
                          }
                          if (e.key === 'Escape') {
                            setEditingId(null)
                            setEditingLabel('')
                          }
                        }}
                      />
                    ) : (
                      <div className="font-bold text-slate-700 text-sm truncate">
                        {opt.option_label}
                      </div>
                    )}
                    <div className="text-[10px] font-mono font-bold text-slate-300 uppercase tracking-tighter">
                      {opt.option_value}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => move(opt.id, 'up')}
                      disabled={i === 0}
                      className="h-7 w-7 rounded-lg hover:bg-slate-100 text-slate-400"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => move(opt.id, 'down')}
                      disabled={i === items.length - 1}
                      className="h-7 w-7 rounded-lg hover:bg-slate-100 text-slate-400"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>

                    {editingId === opt.id ? (
                      <>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            void handleUpdate(opt.id, { option_label: editingLabel })
                            setEditingId(null)
                            setEditingLabel('')
                          }}
                          className="h-7 w-7 rounded-lg text-emerald-500 hover:bg-emerald-50"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setEditingId(null)
                            setEditingLabel('')
                          }}
                          className="h-7 w-7 rounded-lg text-rose-500 hover:bg-rose-50"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setEditingId(opt.id)
                            setEditingLabel(opt.option_label)
                          }}
                          disabled={opt.option_value === 'other'}
                          className="h-7 w-7 rounded-lg text-indigo-500 hover:bg-indigo-50"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(opt.id)}
                          disabled={opt.option_value === 'other'}
                          className="h-7 w-7 rounded-lg text-rose-500 hover:bg-rose-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-auto pt-4 flex items-center gap-2 border-t border-slate-50">
              <Input
                className="h-10 rounded-xl bg-slate-50 border-slate-100 text-sm font-bold placeholder:text-slate-300 focus:bg-white transition-all pr-10"
                placeholder={type === 'labor_hour' ? '예: 0.5, 1, 1.5' : '항목 추가'}
                value={newLabel}
                onChange={e => setNewLabel(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') void handleAdd()
                }}
              />
              <Button
                onClick={() => void handleAdd()}
                className="h-10 w-10 shrink-0 rounded-xl bg-[#1A254F] hover:bg-[#2A355F] text-white p-0 shadow-sm transition-all"
              >
                <Plus className="w-5 h-5" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function WorkOptionsEditor() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6 px-4 sm:px-0">
      <Section
        title="부재명 옵션"
        description="작업일지에 표시될 부재 목록을 설정합니다."
        type="component_type"
        icon={Layers}
      />
      <Section
        title="작업공정 옵션"
        description="현장에서 수행되는 표준 작업 공정을 관리합니다."
        type="process_type"
        icon={Activity}
      />
      <Section
        title="공수 옵션"
        description="작업일지에 입력 가능한 표준 공수 단위를 설정합니다."
        type="labor_hour"
        icon={Clock}
      />
    </div>
  )
}
