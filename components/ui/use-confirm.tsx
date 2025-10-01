'use client'

import { useEffect, useState } from 'react'

type ConfirmVariant = 'default' | 'destructive' | 'warning' | 'info'

export interface ConfirmOptions {
  title?: string
  description?: string
  confirmText?: string
  cancelText?: string
  variant?: ConfirmVariant
}

interface ConfirmState {
  open: boolean
  options: ConfirmOptions
  resolve?: (value: boolean) => void
}

let memoryState: ConfirmState = {
  open: false,
  options: {},
}

const listeners: Array<(s: ConfirmState) => void> = []

function dispatch(action: (s: ConfirmState) => ConfirmState) {
  memoryState = action(memoryState)
  listeners.forEach(l => l(memoryState))
}

export function useConfirm() {
  const [state, setState] = useState<ConfirmState>(memoryState)

  useEffect(() => {
    listeners.push(setState)
    return () => {
      const i = listeners.indexOf(setState)
      if (i >= 0) listeners.splice(i, 1)
    }
  }, [])

  const confirm = (options: ConfirmOptions): Promise<boolean> => {
    return new Promise<boolean>(resolve => {
      dispatch(() => ({ open: true, options, resolve }))
    })
  }

  const resolve = (value: boolean) => {
    const r = memoryState.resolve
    dispatch(s => ({ ...s, open: false, resolve: undefined }))
    try {
      r?.(value)
    } catch (error) {
      // Swallow handler errors to avoid crashing confirmation flow
      console.warn('useConfirm resolve handler error:', error)
    }
  }

  return { ...state, confirm, resolve }
}

// Simple dialog renderer component
export function ConfirmDialog() {
  const { open, options, resolve } = useConfirm()
  if (!open) return null

  const variant = options.variant || 'default'
  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    zIndex: 2000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--overlay, rgba(15,23,42,0.45))',
    padding: 16,
  }
  const panelStyle: React.CSSProperties = {
    width: 'min(420px, 92%)',
    background: 'var(--card)',
    color: 'var(--text)',
    borderRadius: 16,
    border: '1px solid var(--line)',
    boxShadow: '0 24px 60px rgba(2,6,23,0.25)',
    padding: 16,
  }
  const titleStyle: React.CSSProperties = {
    fontWeight: 700,
    fontSize: 18,
    marginBottom: 8,
    color: 'var(--text)',
  }
  const descStyle: React.CSSProperties = {
    fontSize: 14,
    color: 'var(--text-muted, var(--muted))',
    marginBottom: 16,
  }
  const btnBase: React.CSSProperties = {
    height: 40,
    padding: '0 12px',
    borderRadius: 10,
    fontWeight: 600,
    cursor: 'pointer',
  }
  const cancelBtn: React.CSSProperties = {
    ...btnBase,
    border: '1px solid var(--line)',
    background: 'var(--surface, var(--card))',
    color: 'var(--text)',
  }
  const confirmBtn: React.CSSProperties = {
    ...btnBase,
    border:
      variant === 'destructive'
        ? '1px solid var(--danger, #dc2626)'
        : '1px solid var(--brand, #1a254f)',
    background: variant === 'destructive' ? 'var(--danger, #dc2626)' : 'var(--brand, #1a254f)',
    color: '#fff',
  }
  return (
    <div role="dialog" aria-modal="true" style={overlayStyle} onClick={() => resolve(false)}>
      <div onClick={e => e.stopPropagation()} style={panelStyle}>
        <div style={titleStyle}>{options.title || '확인'}</div>
        {options.description && <div style={descStyle}>{options.description}</div>}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" onClick={() => resolve(false)} style={cancelBtn}>
            {options.cancelText || '취소'}
          </button>
          <button type="button" onClick={() => resolve(true)} style={confirmBtn}>
            {options.confirmText || '확인'}
          </button>
        </div>
      </div>
    </div>
  )
}
