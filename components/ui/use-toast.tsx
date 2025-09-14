import { useState, useEffect } from 'react'

export interface Toast {
  id?: string
  title?: string
  description?: string
  variant?: 'default' | 'destructive' | 'success' | 'warning' | 'info'
}

interface ToastState {
  toasts: Toast[]
}

const listeners: Array<(state: ToastState) => void> = []
let memoryState: ToastState = { toasts: [] }

function dispatch(action: unknown) {
  memoryState = action(memoryState)
  listeners.forEach((listener: unknown) => {
    listener(memoryState)
  })
}

export function toast(toast: Toast) {
  const id = Date.now().toString()
  const newToast = { ...toast, id }
  
  dispatch((state: ToastState) => ({
    ...state,
    toasts: [...state.toasts, newToast],
  }))

  setTimeout(() => {
    dismiss(id)
  }, 5000)
}

export function dismiss(toastId?: string) {
  dispatch((state: ToastState) => ({
    ...state,
    toasts: state.toasts.filter((toast: unknown) => toast.id !== toastId),
  }))
}

export function useToast() {
  const [state, setState] = useState<ToastState>(memoryState)

  useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  return {
    ...state,
    toast,
    dismiss,
  }
}