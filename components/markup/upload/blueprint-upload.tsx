'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, FileImage, X } from 'lucide-react'
import { getFullTypographyClass } from '@/contexts/FontSizeContext'

interface BlueprintUploadProps {
  onImageUpload: (imageUrl: string, fileName: string) => void
  onBackToList?: () => void
  currentImage?: string
  currentFileName?: string
  isLargeFont?: boolean
  touchMode?: string
}

export function BlueprintUpload({ onImageUpload, onBackToList, currentImage, currentFileName, isLargeFont = false, touchMode = 'normal' }: BlueprintUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  const handleFileSelect = (file: File) => {
    console.log('File selected:', file.name, file.type, file.size) // 디버깅용
    
    // 지원되는 파일 타입 확인 (이미지 또는 PDF)
    const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
    
    if (!file) {
      console.error('No file selected')
      alert('파일이 선택되지 않았습니다.')
      return
    }
    
    if (!supportedTypes.includes(file.type)) {
      console.error('Unsupported file type:', file.type)
      alert('지원되지 않는 파일 형식입니다.\nJPG, PNG, PDF 파일만 업로드 가능합니다.')
      return
    }
    
    // 파일 크기 제한 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      console.error('File too large:', file.size)
      alert('파일 크기가 너무 큽니다.\n10MB 이하의 파일만 업로드 가능합니다.')
      return
    }
    
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const result = e.target?.result as string
        if (!result) {
          throw new Error('파일 읽기 실패')
        }
        console.log('File read successfully, calling onImageUpload') // 디버깅용
        onImageUpload(result, file.name)
      } catch (error) {
        console.error('Error processing file:', error)
        alert('파일 처리 중 오류가 발생했습니다.')
      }
    }
    
    reader.onerror = (e) => {
      console.error('FileReader error:', e)
      alert('파일을 읽는 중 오류가 발생했습니다.')
    }
    
    reader.readAsDataURL(file)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('File input changed:', e.target.files?.length) // 디버깅용
    
    try {
      const file = e.target.files?.[0]
      if (file) {
        handleFileSelect(file)
      } else {
        console.log('No file selected from input')
      }
    } catch (error) {
      console.error('Error handling file input change:', error)
      alert('파일 선택 중 오류가 발생했습니다.')
    } finally {
      // Reset input value to allow selecting the same file again
      e.target.value = ''
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const clearImage = () => {
    onImageUpload('', '')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  if (currentImage) {
    return (
      <div className={`flex items-center justify-between bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 ${
        touchMode === 'glove' ? 'py-3' : touchMode === 'precision' ? 'py-1.5' : 'py-2'
      }`}>
        <div className="flex items-center gap-2">
          <FileImage className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <span className={`${getFullTypographyClass('body', 'sm', isLargeFont)} font-medium text-gray-700 dark:text-gray-300 truncate max-w-xs`}>
            {currentFileName}
          </span>
        </div>
        <Button
          variant="ghost"
          size={touchMode === 'glove' ? 'standard' : touchMode === 'precision' ? 'compact' : 'compact'}
          onClick={clearImage}
          className={`${
            touchMode === 'glove' ? 'min-w-[56px] min-h-[56px]' : 
            touchMode === 'precision' ? 'min-w-[44px] min-h-[44px]' : 
            'min-w-[48px] min-h-[48px]'
          } p-3 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 active:scale-95 transition-all duration-200 touch-manipulation focus-visible:ring-4 focus-visible:ring-red-500/50`}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
    )
  }

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,application/pdf"
        onChange={handleFileInputChange}
        className="hidden"
      />
      
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg ${
          touchMode === 'glove' ? 'p-8' : touchMode === 'precision' ? 'p-4' : 'p-6'
        } text-center transition-colors cursor-pointer bg-white dark:bg-gray-800 ${
          isDragOver
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50'
        }`}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className={`mx-auto h-12 w-12 mb-4 ${
          isDragOver ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'
        }`} />
        <h3 className={`${getFullTypographyClass('heading', 'lg', isLargeFont)} font-medium text-gray-900 dark:text-gray-100 mb-2`}>
          도면 파일을 업로드하세요
        </h3>
        <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-600 dark:text-gray-400 mb-4`}>
          JPG, PNG, PDF 파일을 드래그하거나 클릭하여 선택하세요
        </p>
        <div className="flex items-center justify-center">
          <Button 
            variant="outline" 
            size={touchMode === 'glove' ? 'field' : touchMode === 'precision' ? 'compact' : 'standard'}
            className={`${
              touchMode === 'glove' ? 'min-h-[64px]' : 
              touchMode === 'precision' ? 'min-h-[48px]' : 
              'min-h-[56px]'
            } px-6 py-3 font-medium active:scale-95 transition-all duration-200 touch-manipulation focus-visible:ring-4 focus-visible:ring-blue-500/50 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500`}
          >
            <FileImage className="h-5 w-5 mr-2 text-gray-600 dark:text-gray-400" />
            파일 선택
          </Button>
        </div>
      </div>
    </div>
  )
}