'use client'

import React, { useState, useRef, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface TextInputDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: (text: string) => void
  position?: { x: number; y: number }
}

export function TextInputDialog({ open, onClose, onConfirm, position }: TextInputDialogProps) {
  const [text, setText] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setText('')
      // Focus input when dialog opens
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [open])

  const handleSubmit = (e: React.FormEvent) => {
    console.log('🔥 TextInputDialog handleSubmit called')
    e.preventDefault()
    console.log('🔥 Text value:', text)
    console.log('🔥 Text trimmed:', text.trim())

    if (text.trim()) {
      console.log('🔥 Calling onConfirm with:', text.trim())
      onConfirm(text.trim())
      onClose()
    } else {
      console.log('🔥 Text is empty, not submitting')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>텍스트 입력</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="text-input">텍스트를 입력하세요</Label>
              <Input
                ref={inputRef}
                id="text-input"
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="여기에 텍스트를 입력..."
                className="col-span-3"
                autoFocus
              />
            </div>
            {position && (
              <div className="text-sm text-gray-500">
                위치: X: {Math.round(position.x)}, Y: {Math.round(position.y)}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="min-h-[48px] px-4 py-3 active:scale-95 transition-all duration-200 touch-manipulation focus-visible:ring-4 focus-visible:ring-blue-500/50"
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={!text.trim()}
              className="min-h-[48px] px-4 py-3 active:scale-95 transition-all duration-200 touch-manipulation focus-visible:ring-4 focus-visible:ring-blue-500/50"
            >
              확인
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
