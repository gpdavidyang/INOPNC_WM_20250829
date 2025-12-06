'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

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

function Section({ title, type }: { title: string; type: OptionType }) {
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

  const list = useMemo(() => items, [items])

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="py-10 text-center text-sm text-muted-foreground">불러오는 중…</div>
        ) : error ? (
          <div className="py-3 text-sm text-red-600">{error}</div>
        ) : (
          <div className="space-y-2">
            {list.map((opt, i) => (
              <div key={opt.id} className="flex items-center gap-3 rounded-lg border p-2.5">
                <div className="w-8 text-xs text-muted-foreground text-center">{i + 1}</div>
                <div className="flex-1">
                  {editingId === opt.id ? (
                    <Input
                      value={editingLabel}
                      onChange={e => setEditingLabel(e.target.value)}
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
                    <div className="font-medium">{opt.option_label}</div>
                  )}
                  <div className="text-xs text-muted-foreground">{opt.option_value}</div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    className="px-2 py-1 text-xs rounded border hover:bg-muted"
                    onClick={() => move(opt.id, 'up')}
                    aria-label="위로"
                    title="위로"
                  >
                    ↑
                  </button>
                  <button
                    className="px-2 py-1 text-xs rounded border hover:bg-muted"
                    onClick={() => move(opt.id, 'down')}
                    aria-label="아래로"
                    title="아래로"
                  >
                    ↓
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  {editingId === opt.id ? (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          void handleUpdate(opt.id, { option_label: editingLabel })
                          setEditingId(null)
                          setEditingLabel('')
                        }}
                      >
                        저장
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingId(null)
                          setEditingLabel('')
                        }}
                      >
                        취소
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingId(opt.id)
                          setEditingLabel(opt.option_label)
                        }}
                        disabled={opt.option_value === 'other'}
                      >
                        수정
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(opt.id)}
                        disabled={opt.option_value === 'other'}
                      >
                        삭제
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}

            <div className="mt-3 flex items-center gap-2 flex-nowrap">
              <Input
                className="w-auto flex-1 min-w-0"
                placeholder={
                  type === 'labor_hour' ? '공수 값 입력 (예: 0.5, 1, 1.5)' : `${title} 추가`
                }
                value={newLabel}
                onChange={e => setNewLabel(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') void handleAdd()
                }}
              />
              <Button className="shrink-0" onClick={() => void handleAdd()}>
                추가
              </Button>
              <Button
                className="shrink-0 bg-[#F3F7FA] border-[#8DA0CD] text-[#15347C] hover:bg-[#8DA0CD] hover:text-white hover:border-[#5F7AB9]"
                variant="outline"
                onClick={() => void load()}
              >
                새로고침
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      <Section title="부재명 옵션" type="component_type" />
      <Section title="작업공정 옵션" type="process_type" />
      <Section title="공수 옵션" type="labor_hour" />
    </div>
  )
}
