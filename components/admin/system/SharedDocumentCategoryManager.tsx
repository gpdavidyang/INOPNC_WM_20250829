'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, Plus, Save, Trash2, ArrowUp, ArrowDown, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import {
  DEFAULT_SHARED_DOCUMENT_CATEGORIES,
  generateSharedCategoryValue,
} from '@/lib/constants/shared-document-categories'

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
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">공유문서 분류 관리</h2>
          <p className="text-sm text-muted-foreground">
            공유자료 탭과 업로드 폼에서 사용할 분류를 간단히 정리할 수 있습니다. 분류 값은 레이블에
            맞춰 자동 생성됩니다.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAdd}
            disabled={saving || loading}
            className="gap-1"
          >
            <Plus className="h-4 w-4" />
            분류 추가
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            disabled={saving || loading}
            className="gap-1"
          >
            <RotateCcw className="h-4 w-4" />
            기본값 복원
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={saving || loading || hasValidationError || !isDirty}
            className="gap-1"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            저장
          </Button>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-muted-foreground/40 bg-muted/30 px-4 py-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            불러오는 중입니다...
          </div>
        ) : categories.length === 0 ? (
          <div className="rounded-md border border-dashed border-muted-foreground/40 bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
            설정된 분류가 없습니다. 상단의 <strong>분류 추가</strong> 버튼으로 새 분류를 등록해
            주세요.
          </div>
        ) : (
          categories.map((category, index) => {
            const labelError = rowErrors[index]?.label
            return (
              <div
                key={`${category.value}-${index}`}
                className="flex flex-col gap-3 rounded-lg border border-border/60 bg-background/80 p-3 shadow-sm sm:flex-row sm:items-center"
              >
                <div className="flex flex-1 flex-col gap-1">
                  <Input
                    value={category.label}
                    onChange={event => handleLabelChange(index, event.target.value)}
                    disabled={saving || loading}
                    placeholder="분류 이름"
                    className={`h-9 ${labelError ? 'border-rose-500 focus-visible:ring-rose-500' : ''}`}
                  />
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="font-mono text-muted-foreground/80">
                      {category.value || '-'}
                    </span>
                    <span>{category.auto ? '자동 생성됨' : '기존 값 유지'}</span>
                  </div>
                  {labelError ? <p className="text-[11px] text-rose-600">{labelError}</p> : null}
                </div>
                <div className="flex items-center justify-end gap-1 self-stretch sm:flex-col sm:justify-center sm:gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleMove(index, 'up')}
                    disabled={index === 0 || saving || loading}
                    className="h-8 w-8"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleMove(index, 'down')}
                    disabled={index === categories.length - 1 || saving || loading}
                    className="h-8 w-8"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemove(index)}
                    disabled={saving || loading || categories.length === 1}
                    className="h-8 w-8 text-rose-600 hover:text-rose-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {fetchError ? <p className="mt-4 text-sm text-rose-600">{fetchError}</p> : null}

      <div className="mt-4 rounded-md border border-dashed border-muted-foreground/40 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
        • 저장 후 공유자료 목록과 업로드 폼에 즉시 반영됩니다. <br />• 분류 이름을 비우면 저장할 수
        없습니다.
      </div>
    </div>
  )
}
