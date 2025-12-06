'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type DaumPostcodeWindow = typeof window & {
  daum?: {
    Postcode?: new (options: Record<string, any>) => {
      open: () => void
    }
  }
}

const POSTCODE_SCRIPT_SRC = 'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js'

let postcodeScriptPromise: Promise<void> | null = null

const loadPostcodeScript = () => {
  if (typeof window === 'undefined') return Promise.resolve()
  const existing = (window as DaumPostcodeWindow).daum?.Postcode
  if (existing) return Promise.resolve()
  if (!postcodeScriptPromise) {
    postcodeScriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = POSTCODE_SCRIPT_SRC
      script.async = true
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('우편번호 스크립트 로드 실패'))
      document.body.appendChild(script)
    })
  }
  return postcodeScriptPromise
}

export type AddressSearchSelection = {
  address: string
  roadAddress?: string
  jibunAddress?: string
  zonecode?: string
  buildingName?: string
}

type DaumPostcodeResult = {
  address?: string
  autoRoadAddress?: string
  jibunAddress?: string
  roadAddress?: string
  zonecode?: string
  buildingName?: string
}

type Props = {
  id?: string
  value: string
  onValueChange: (value: string) => void
  detailValue: string
  onDetailChange: (value: string) => void
  placeholder?: string
  detailPlaceholder?: string
  buttonLabel?: string
  helperText?: string
  disabled?: boolean
  className?: string
  onSelect?: (selection: AddressSearchSelection) => void
}

export function AddressSearchInput({
  id,
  value,
  onValueChange,
  detailValue,
  onDetailChange,
  placeholder,
  detailPlaceholder,
  buttonLabel = '주소 검색',
  helperText,
  disabled,
  className,
  onSelect,
}: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [scriptReady, setScriptReady] = useState(false)
  const [layerVisible, setLayerVisible] = useState(false)
  const [layerHeight, setLayerHeight] = useState(0)
  const layerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    let mounted = true
    if (typeof window === 'undefined') return
    loadPostcodeScript()
      .then(() => {
        if (mounted) setScriptReady(true)
      })
      .catch(err => {
        console.error('[AddressSearchInput] postcode preload failed', err)
      })
    return () => {
      mounted = false
    }
  }, [])

  const closeLayer = useCallback(() => {
    const container = layerRef.current
    if (container) {
      container.innerHTML = ''
    }
    setLayerHeight(0)
    setLayerVisible(false)
  }, [])

  const handleSearch = useCallback(async () => {
    if (disabled) return
    setError(null)
    setLoading(true)
    try {
      if (!scriptReady) {
        await loadPostcodeScript()
        setScriptReady(true)
      }
      const Postcode = (window as DaumPostcodeWindow).daum?.Postcode
      if (!Postcode) {
        throw new Error('주소 검색 모듈을 찾을 수 없습니다.')
      }
      const container = layerRef.current
      if (!container) {
        throw new Error('주소 검색 영역을 준비하지 못했습니다.')
      }
      container.innerHTML = ''
      const postcode = new Postcode({
        width: '100%',
        height: '100%',
        oncomplete: (data: DaumPostcodeResult) => {
          const address =
            data?.roadAddress || data?.autoRoadAddress || data?.jibunAddress || data?.address || ''
          if (!address) return
          onValueChange(address)
          onDetailChange('')
          if (onSelect) {
            onSelect({
              address,
              roadAddress: data?.roadAddress,
              jibunAddress: data?.jibunAddress,
              zonecode: data?.zonecode,
              buildingName: data?.buildingName,
            })
          }
          closeLayer()
        },
        onclose: closeLayer,
        onresize: (size: { height: number }) => {
          setLayerHeight(size?.height || 360)
        },
      })
      setLayerHeight(360)
      setLayerVisible(true)
      postcode.embed(container)
    } catch (err) {
      console.error('[AddressSearchInput] postcode load failed', err)
      setError('주소 검색 도구를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }, [closeLayer, disabled, onDetailChange, onSelect, onValueChange, scriptReady])

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          id={id}
          value={value}
          placeholder={placeholder ?? '도로명 주소를 검색 후 선택하세요'}
          onChange={event => onValueChange(event.target.value)}
          disabled={disabled}
        />
        <Button
          type="button"
          variant="outline"
          className="shrink-0 sm:w-auto"
          onClick={handleSearch}
          disabled={disabled || loading}
        >
          {loading ? '불러오는 중…' : buttonLabel}
        </Button>
      </div>
      <Input
        value={detailValue}
        placeholder={detailPlaceholder ?? '상세 주소 (동/층/호 등)'}
        onChange={event => onDetailChange(event.target.value)}
        disabled={disabled}
      />
      {helperText ? <p className="text-[11px] text-muted-foreground">{helperText}</p> : null}
      {error ? <p className="text-[11px] text-destructive">{error}</p> : null}
      <div className={cn('overflow-hidden transition-all', layerVisible ? 'mt-2' : 'max-h-0')}>
        <div className="rounded-lg border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <p className="text-sm font-medium text-foreground">주소 검색</p>
            <button
              type="button"
              onClick={closeLayer}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              닫기
            </button>
          </div>
          <div
            ref={layerRef}
            className="w-full"
            style={{ height: layerVisible ? Math.max(layerHeight, 320) : 0 }}
          />
        </div>
      </div>
    </div>
  )
}
