'use client'


interface BottomStatusbarProps {
  fileName: string
  markupCount: number
  zoom: number
  activeTool?: string
  isLargeFont?: boolean
  touchMode?: string
}

export function BottomStatusbar({ fileName, markupCount, zoom, activeTool, isLargeFont = false, touchMode = 'normal' }: BottomStatusbarProps) {
  // 도구별 안내 메시지
  const getToolHint = () => {
    switch (activeTool) {
      case 'text':
        return '텍스트 추가: 원하는 위치를 클릭하세요'
      case 'select':
        return '선택: 객체를 클릭하여 선택하세요'
      case 'pen':
        return '펜: 드래그하여 자유롭게 그리세요'
      case 'box-gray':
      case 'box-red':
      case 'box-blue':
        return '박스: 드래그하여 영역을 지정하세요'
      default:
        return ''
    }
  }

  const toolHint = getToolHint()

  return (
    <div className={`flex items-center justify-between bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 ${
      touchMode === 'glove' ? 'py-3' : touchMode === 'precision' ? 'py-1' : 'py-2'
    } ${getFullTypographyClass('caption', 'xs', isLargeFont)} text-gray-600 dark:text-gray-400`}>
      <div className="flex items-center gap-4">
        <span className={`${getFullTypographyClass('caption', 'xs', isLargeFont)} font-medium`}>파일명: {fileName}</span>
        <span className={`${getFullTypographyClass('caption', 'xs', isLargeFont)} font-medium`}>마킹수: {markupCount}개</span>
        {toolHint && (
          <>
            <span className="text-gray-400 dark:text-gray-500">|</span>
            <span className={`${getFullTypographyClass('caption', 'xs', isLargeFont)} text-blue-600 dark:text-blue-400 font-medium`}>{toolHint}</span>
          </>
        )}
      </div>
      <span className={`${getFullTypographyClass('caption', 'xs', isLargeFont)} font-medium`}>줌: {zoom}%</span>
    </div>
  )
}