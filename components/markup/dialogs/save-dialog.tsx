'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/custom-select'
import { Textarea } from '@/components/ui/textarea'

interface SaveDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (fileName: string, description?: string) => void
  defaultFileName?: string
}

export function SaveDialog({ open, onOpenChange, onSave, defaultFileName = '' }: SaveDialogProps) {
  const [fileName, setFileName] = useState(defaultFileName)
  const [description, setDescription] = useState('')

  const handleSave = () => {
    if (fileName.trim()) {
      onSave(fileName.trim(), description.trim())
      // 다이얼로그 닫기 후 상태 초기화
      onOpenChange(false)
      setFileName('')
      setDescription('')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>마킹 도면 저장</DialogTitle>
          <DialogDescription>
            마킹된 도면을 도면마킹문서함에 저장합니다.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="fileName">파일명</Label>
            <Input
              id="fileName"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="마킹 도면 파일명"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">설명 (선택사항)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="도면에 대한 설명을 입력하세요"
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="min-h-[48px] px-4 py-3 active:scale-95 transition-all duration-200 touch-manipulation focus-visible:ring-4 focus-visible:ring-blue-500/50"
          >
            취소
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!fileName.trim()}
            className="min-h-[48px] px-4 py-3 active:scale-95 transition-all duration-200 touch-manipulation focus-visible:ring-4 focus-visible:ring-blue-500/50"
          >
            저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}