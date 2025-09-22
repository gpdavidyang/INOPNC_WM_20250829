'use client'

import { useState, useCallback } from 'react'

export interface ToastProps {
  title?: string
  description?: string
  variant?: 'default' | 'destructive' | 'success'
  duration?: number
}

interface Toast extends ToastProps {
  id: string
  createdAt: number
}

const toasts: Toast[] = []
const listeners: Array<(toasts: Toast[]) => void> = []

let toastCount = 0

function genId() {
  toastCount = (toastCount + 1) % Number.MAX_SAFE_INTEGER
  return toastCount.toString()
}

const addToast = (toast: ToastProps) => {
  const id = genId()
  const newToast: Toast = {
    id,
    createdAt: Date.now(),
    ...toast,
  }
  
  toasts.push(newToast)
  listeners.forEach((listener) => listener([...toasts]))
  
  // Auto-dismiss after duration (default 5 seconds)
  const duration = toast.duration ?? 5000
  if (duration > 0) {
    setTimeout(() => {
      dismissToast(id)
    }, duration)
  }
  
  return id
}

const dismissToast = (id: string) => {
  const index = toasts.findIndex((toast) => toast.id === id)
  if (index > -1) {
    toasts.splice(index, 1)
    listeners.forEach((listener) => listener([...toasts]))
  }
}

export function toast(props: ToastProps) {
  return addToast(props)
}

export function useToast() {
  const [toastList, setToastList] = useState<Toast[]>([...toasts])

  const subscribe = useCallback((listener: (toasts: Toast[]) => void) => {
    listeners.push(listener)
    return () => {
      const index = listeners.indexOf(listener)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [])

  const dismiss = useCallback((id: string) => {
    dismissToast(id)
  }, [])

  // Subscribe to toast updates
  useState(() => {
    const unsubscribe = subscribe(setToastList)
    return unsubscribe
  })

  return {
    toasts: toastList,
    toast: addToast,
    dismiss,
  }
}

export { type Toast }