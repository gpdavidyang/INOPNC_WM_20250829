'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import {
  DEFAULT_SHARED_DOCUMENT_CATEGORIES,
  generateSharedCategoryValue,
} from '@/lib/constants/shared-document-categories'
import { cn } from '@/lib/utils'
import { ArrowDown, ArrowUp, Layers, Loader2, Plus, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

type EditableCategory = {
  value: string
  label: string
  auto: boolean
}

type RowError = {
  label?: string
}

const DEFAULT_CATEGORY_STATE: EditableCategory[] = DEFAULT_SHARED_DOCUMENT_CATEGORIES.map(
  option => ({
    value: option.value,
    label: option.label,
    auto: false,
  })
)

export default function SharedDocumentCategoryManager() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState<EditableCategory[]>(DEFAULT_CATEGORY_STATE)
  const [initialCategories, setInitialCategories] =
    useState<EditableCategory[]>(DEFAULT_CATEGORY_STATE)
  const [fetchError, setFetchError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    const controller = new AbortController()
    async function loadCategories() {
      try {
        const res = await fetch('/api/admin/document-categories/shared', {
          credentials: 'include',
          cache: 'no-store',
          signal: controller.signal,
        })
        const json = await res.json().catch(() => ({}))
        if (!isMounted) return
        if (res.ok && Array.isArray(json?.data)) {
          const loaded = json.data.map(
            (item: { value: string; label: string }) =>
              ({
                value: String(item.value || '').trim(),
                label: String(item.label || '').trim(),
                auto: false,
              }) satisfies EditableCategory
          )
          setCategories(loaded.length > 0 ? loaded : DEFAULT_CATEGORY_STATE)
          setInitialCategories(loaded.length > 0 ? loaded : DEFAULT_CATEGORY_STATE)
          setFetchError(null)
        } else {
          const detail = json?.details
          setFetchError(
            (json?.error && detail ? `${json.error}: ${detail}` : json?.error) ||
              detail ||
              '설정을 불러올 수 없습니다.'
          )
        }
      } catch (error) {
        console.error('[SharedDocumentCategoryManager] load failed:', error)
        if (isMounted) {
          setFetchError('설정을 불러올 수 없습니다.')
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    void loadCategories()
    return () => {
      isMounted = false
      controller.abort()
    }
  }, [])

  const rowErrors: RowError[] = useMemo(() => {
    return categories.map(category => {
      const errors: RowError = {}
      if (!category.label.trim()) {
        errors.label = '표시 이름을 입력해 주세요.'
      }
      return errors
    })
  }, [categories])

  const hasValidationError =
    categories.length === 0 || rowErrors.some(error => Boolean(error.label))

  const isDirty = useMemo(() => {
    if (categories.length !== initialCategories.length) return true
    return categories.some((category, index) => {
      const initial = initialCategories[index]
      if (!initial) return true
      return initial.label !== category.label || initial.value !== category.value
    })
  }, [categories, initialCategories])

  const handleAdd = useCallback(() => {
    setCategories(prev => {
      const used = prev.map(item => item.value)
      const value = generateSharedCategoryValue('새 분류', used)
      return [...prev, { label: '새 분류', value, auto: true }]
    })
  }, [])

  const handleLabelChange = useCallback((index: number, nextLabel: string) => {
    setCategories(prev => {
      const next = [...prev]
      const item = next[index]
      if (!item) return prev

      const label = nextLabel
      let value = item.value
      if (item.auto) {
        const used = next.filter((_, idx) => idx !== index).map(entry => entry.value)
        value = generateSharedCategoryValue(label, used)
      }

      next[index] = {
        ...item,
        label,
        value,
      }
      return next
    })
  }, [])

  const handleRemove = useCallback((index: number) => {
    setCategories(prev => prev.filter((_, idx) => idx !== index))
  }, [])

  const handleMove = useCallback((index: number, direction: 'up' | 'down') => {
    setCategories(prev => {
      const next = [...prev]
      const targetIndex = direction === 'up' ? index - 1 : index + 1
      if (targetIndex < 0 || targetIndex >= next.length) return prev
      const temp = next[targetIndex]
      next[targetIndex] = next[index]
      next[index] = temp
      return next
    })
  }, [])

  const handleSave = useCallback(async () => {
    if (hasValidationError || categories.length === 0) {
      toast({
        title: '저장할 수 없습니다',
        description: '모든 분류에 표시 이름을 입력해 주세요.',
        variant: 'destructive',
      })
      return
    }
    setSaving(true)
    try {
      const payload = categories.map(category => ({
        label: category.label.trim(),
        value: category.value,
      }))

      const res = await fetch('/api/admin/document-categories/shared', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categories: payload }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json?.success || !Array.isArray(json?.data)) {
        console.error('[SharedDocumentCategoryManager] save response', json)
        const errorMessage =
          (json?.error && json?.details ? `${json.error}: ${json.details}` : json?.error) ||
          json?.details ||
          res.statusText ||
          '분류를 저장할 수 없습니다.'
        throw new Error(errorMessage)
      }
      const saved = json.data.map(
        (item: { value: string; label: string }) =>
          ({
            value: String(item.value || '').trim(),
            label: String(item.label || '').trim(),
            auto: false,
          }) satisfies EditableCategory
      )
      setCategories(saved)
      setInitialCategories(saved)
      toast({ title: '저장 완료', description: '공유문서 분류가 업데이트되었습니다.' })
    } catch (error: any) {
      console.error('[SharedDocumentCategoryManager] save failed:', error)
      toast({
        title: '저장 실패',
        description: error?.message || '공유문서 분류를 저장할 수 없습니다.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }, [categories, hasValidationError, toast])

  const handleReset = useCallback(async () => {
    if (!window.confirm('공유문서 분류를 기본값으로 복원하시겠습니까?')) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/document-categories/shared', {
        method: 'DELETE',
        credentials: 'include',
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json?.success || !Array.isArray(json?.data)) {
        console.error('[SharedDocumentCategoryManager] reset response', json)
        const errorMessage =
          (json?.error && json?.details ? `${json.error}: ${json.details}` : json?.error) ||
          json?.details ||
          res.statusText ||
          '분류를 복원할 수 없습니다.'
        throw new Error(errorMessage)
      }
      const restored = json.data.map(
        (item: { value: string; label: string }) =>
          ({
            value: String(item.value || '').trim(),
            label: String(item.label || '').trim(),
            auto: false,
          }) satisfies EditableCategory
      )
      setCategories(restored)
      setInitialCategories(restored)
      toast({ title: '복원 완료', description: '기본 공유문서 분류가 적용되었습니다.' })
    } catch (error: any) {
      console.error('[SharedDocumentCategoryManager] reset failed:', error)
      toast({
        title: '복원 실패',
        description: error?.message || '기본값 복원에 실패했습니다.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }, [toast])

  return (
    <Card className="rounded-3xl border-gray-200 shadow-sm shadow-gray-200/40 overflow-hidden">
      <CardHeader className="border-b border-gray-100 bg-gray-50/30 px-6 py-6 sm:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-xl">
              <Layers className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-[#1A254F]">공유문서 분류 관리</CardTitle>
              <CardDescription className="text-sm font-medium text-slate-400">
                공유자료 탭과 업로드 폼에서 사용할 분류 체계를 구성합니다.
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAdd}
              disabled={saving || loading}
              className="h-9 rounded-xl border-slate-200 text-slate-600 font-bold px-4 hover:bg-slate-50 transition-all gap-1.5"
            >
              <Plus className="h-4 w-4" />
              분류 추가
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleReset}
              disabled={saving || loading}
              className="h-9 rounded-xl text-slate-400 font-bold px-4 hover:bg-slate-50 transition-all"
            >
              기본값 복원
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={saving || loading || hasValidationError || !isDirty}
              className="h-9 rounded-xl bg-[#1A254F] hover:bg-[#2A355F] text-white font-bold px-6 shadow-sm transition-all"
            >
              {saving ? '저장 중...' : '설정 저장'}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 sm:p-8">
        <div className="space-y-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-12 text-sm text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
              <span className="font-medium">분류 설정을 불러오는 중입니다...</span>
            </div>
          ) : categories.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-10 text-center text-sm text-slate-400">
              설정된 분류가 없습니다. <br />
              상단의 <span className="text-slate-600 font-bold">분류 추가</span> 버튼으로 새 분류
              체계를 등록해 주세요.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((category, index) => {
                const labelError = rowErrors[index]?.label
                return (
                  <div
                    key={`${category.value}-${index}`}
                    className="group relative flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all"
                  >
                    <div className="flex flex-1 flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-tight ml-1">
                          분류 레이블
                        </label>
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleMove(index, 'up')}
                            disabled={index === 0 || saving || loading}
                            className="h-7 w-7 rounded-lg hover:bg-slate-100"
                          >
                            <ArrowUp className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleMove(index, 'down')}
                            disabled={index === categories.length - 1 || saving || loading}
                            className="h-7 w-7 rounded-lg hover:bg-slate-100"
                          >
                            <ArrowDown className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemove(index)}
                            disabled={saving || loading || categories.length === 1}
                            className="h-7 w-7 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      <Input
                        value={category.label}
                        onChange={event => handleLabelChange(index, event.target.value)}
                        disabled={saving || loading}
                        placeholder="예: 공문, 지시서 등"
                        className={cn(
                          'h-10 rounded-xl bg-slate-50/50 border-slate-100 px-3 text-sm font-bold text-slate-700 focus:bg-white transition-all',
                          labelError && 'border-rose-300 focus-visible:ring-rose-500 bg-rose-50/30'
                        )}
                      />
                      <div className="flex items-center justify-between px-1">
                        <span className="font-mono text-[10px] font-bold text-slate-300 bg-slate-50 px-1.5 py-0.5 rounded uppercase">
                          {category.value || '-'}
                        </span>
                        <span className="text-[10px] font-bold text-slate-300 uppercase">
                          {category.auto ? 'Auto' : 'Fixed'}
                        </span>
                      </div>
                      {labelError && (
                        <p className="text-[10px] font-bold text-rose-500 ml-1">{labelError}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {fetchError && (
          <div className="mt-6 p-4 rounded-xl bg-rose-50 border border-rose-100 flex items-center gap-3 text-rose-600">
            <Loader2 className="h-4 w-4" />
            <p className="text-sm font-bold">{fetchError}</p>
          </div>
        )}

        <div className="mt-8 rounded-2xl bg-indigo-50/50 border border-indigo-100/50 p-4">
          <ul className="space-y-1.5">
            <li className="flex gap-2 text-[12px] font-medium text-indigo-900/60 items-start">
              <span className="mt-1 flex-shrink-0 w-1 h-1 rounded-full bg-indigo-400" />
              저장 즉시 공유자료 목록과 업로드 폼의 분류 항목에 반영됩니다.
            </li>
            <li className="flex gap-2 text-[12px] font-medium text-indigo-900/60 items-start">
              <span className="mt-1 flex-shrink-0 w-1 h-1 rounded-full bg-indigo-400" />
              분류 이름을 비우거나 중복된 분류를 생성할 수 없습니다.
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
