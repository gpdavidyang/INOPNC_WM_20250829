'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Save, X } from 'lucide-react'

interface SavePageProps {
  onSave: (fileName: string, description?: string) => void
  onCancel: () => void
  defaultFileName?: string
}

export function SavePage({ onSave, onCancel, defaultFileName = '' }: SavePageProps) {
  const [fileName, setFileName] = useState(defaultFileName)
  const [description, setDescription] = useState('')

  const handleSave = () => {
    if (fileName.trim()) {
      onSave(fileName.trim(), description.trim())
      setFileName('')
      setDescription('')
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-gray-900">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onCancel}
              className="hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              마킹 도면 저장
            </h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            className="hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* 컨텐츠 */}
      <div className="max-w-2xl mx-auto p-4">
        <Card className="p-6">
          <div className="space-y-6">
            {/* 안내 메시지 */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                마킹된 도면을 도면마킹문서함에 저장합니다. 저장된 도면은 나중에 다시 열어서 수정할 수 있습니다.
              </p>
            </div>

            {/* 파일명 입력 */}
            <div className="space-y-2">
              <Label htmlFor="fileName" className="text-base font-medium">
                파일명 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="fileName"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="예: 1층 평면도 마킹"
                className="h-12 text-base"
                autoFocus
              />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                파일명은 필수 입력 항목입니다.
              </p>
            </div>

            {/* 설명 입력 */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-base font-medium">
                설명 (선택사항)
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="도면에 대한 설명을 입력하세요. 예: 전기 배선 위치 표시"
                rows={4}
                className="text-base resize-none"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                도면에 대한 추가 설명을 입력할 수 있습니다.
              </p>
            </div>

            {/* 저장 정보 */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">저장 위치</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">도면마킹문서함</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">파일 형식</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">마킹 도면 (.markup)</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">작성자</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">현장관리자</span>
              </div>
            </div>
          </div>
        </Card>

        {/* 하단 버튼 */}
        <div className="sticky bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-4 mt-6 -mx-4">
          <div className="max-w-2xl mx-auto flex gap-3">
            <Button
              variant="outline"
              onClick={onCancel}
              className="flex-1 h-12 text-base"
            >
              취소
            </Button>
            <Button
              onClick={handleSave}
              disabled={!fileName.trim()}
              className="flex-1 h-12 text-base bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Save className="h-5 w-5 mr-2" />
              저장하기
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}