'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import type { 
  MarkupDocument, 
  MarkupObject, 
  ToolType, 
  ToolState, 
  ViewerState,
  MarkupEditorState 
} from '@/types/markup'
import { ToolPalette } from './toolbar/tool-palette'
import { TopToolbar } from './toolbar/top-toolbar'
import { BottomStatusbar } from './toolbar/bottom-statusbar'
import { MarkupCanvas } from './canvas/markup-canvas'
import { SaveDialog } from './dialogs/save-dialog'
import { OpenDialog } from './dialogs/open-dialog'
import { ShareDialog } from './dialogs/share-dialog'
import { useMarkupTools } from './hooks/use-markup-tools'
import { useCanvasState } from './hooks/use-canvas-state'
import { useFileManager } from './hooks/use-file-manager'
import { BlueprintUpload } from './upload/blueprint-upload'
import { MarkupDocumentList } from './list/markup-document-list'
import { useFontSize } from '@/contexts/FontSizeContext'
import { useTouchMode } from '@/contexts/TouchModeContext'

interface MarkupEditorProps {
  initialFile?: MarkupDocument
  blueprintUrl?: string
  onSave?: (document: MarkupDocument) => void
  onClose?: () => void
  profile?: any
}

export function MarkupEditor({ 
  initialFile, 
  blueprintUrl: initialBlueprintUrl,
  onSave,
  onClose,
  profile
}: MarkupEditorProps) {
  const { isLargeFont } = useFontSize()
  const { touchMode } = useTouchMode()
  
  // 도면 업로드 상태
  const [blueprintUrl, setBlueprintUrl] = useState<string>(initialBlueprintUrl || '')
  const [blueprintFileName, setBlueprintFileName] = useState<string>('')
  const [currentView, setCurrentView] = useState<'list' | 'editor'>('list')

  // 상태 관리
  const [editorState, setEditorState] = useState<MarkupEditorState>({
    currentFile: initialFile || null,
    originalBlueprint: null,
    toolState: {
      activeTool: 'select',
      isDrawing: false,
      selectedObjects: [],
      clipboard: []
    },
    viewerState: {
      zoom: 1,
      panX: 0,
      panY: 0,
      imageWidth: 0,
      imageHeight: 0
    },
    markupObjects: initialFile?.markupObjects || [],
    selectedObjects: [],
    undoStack: [],
    redoStack: [],
    isLoading: false,
    isSaving: false,
    showSaveDialog: false,
    showOpenDialog: false
  })

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // 커스텀 훅
  const markupTools = useMarkupTools(editorState, setEditorState)
  const canvasState = useCanvasState(editorState, setEditorState)
  const fileManager = useFileManager(editorState, setEditorState)

  // 도면 이미지 로드
  useEffect(() => {
    if (blueprintUrl) {
      const img = new Image()
      img.onload = () => {
        setEditorState(prev => ({
          ...prev,
          viewerState: {
            ...prev.viewerState,
            imageWidth: img.width,
            imageHeight: img.height
          }
        }))
      }
      img.src = blueprintUrl
    }
  }, [blueprintUrl])

  // 키보드 단축키
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'z':
            e.preventDefault()
            if (e.shiftKey) {
              markupTools.redo()
            } else {
              markupTools.undo()
            }
            break
          case 'y':
            e.preventDefault()
            markupTools.redo()
            break
          case 's':
            e.preventDefault()
            setEditorState(prev => ({ ...prev, showSaveDialog: true }))
            break
          case 'o':
            e.preventDefault()
            setEditorState(prev => ({ ...prev, showOpenDialog: true }))
            break
          case 'c':
            e.preventDefault()
            markupTools.copySelected()
            break
          case 'v':
            e.preventDefault()
            markupTools.paste()
            break
        }
      } else if (e.key === 'Delete') {
        e.preventDefault()
        markupTools.deleteSelected()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        markupTools.deselectAll()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [markupTools])

  const handleToolChange = (tool: ToolType) => {
    console.log('Tool changed to:', tool) // 디버깅용
    
    // 줌 도구 처리
    if (tool === 'zoom-in') {
      const newZoom = Math.min(5, editorState.viewerState.zoom * 1.2)
      setEditorState(prev => ({
        ...prev,
        viewerState: {
          ...prev.viewerState,
          zoom: newZoom
        }
      }))
      return
    }
    
    if (tool === 'zoom-out') {
      const newZoom = Math.max(0.1, editorState.viewerState.zoom * 0.8)
      setEditorState(prev => ({
        ...prev,
        viewerState: {
          ...prev.viewerState,
          zoom: newZoom
        }
      }))
      return
    }

    // 일반 도구 변경 (팬 도구 포함)
    setEditorState(prev => ({
      ...prev,
      toolState: {
        ...prev.toolState,
        activeTool: tool
      }
    }))
  }

  const handleSave = async (fileName: string, location: 'personal' | 'shared', description?: string) => {
    try {
      if (!blueprintUrl || !blueprintFileName) {
        alert('도면이 업로드되지 않았습니다.')
        return
      }

      const savedDocument = await fileManager.saveDocument({
        fileName,
        location,
        description,
        blueprintUrl,
        blueprintFileName
      })

      if (savedDocument) {
        // 성공 메시지 표시
        alert(`마킹 도면이 성공적으로 저장되었습니다.\n\n파일명: ${fileName}\n위치: ${location === 'personal' ? '내문서함' : '공유문서함'}`)
        
        if (onSave) {
          onSave(savedDocument)
        }
        
        // 문서 목록 화면으로 이동
        setTimeout(() => {
          setCurrentView('list')
        }, 100)
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : '저장 중 오류가 발생했습니다.')
    }
  }

  const handleOpen = async (fileId: string) => {
    await fileManager.openDocument(fileId as any)
  }

  const handleOpenDocument = async (document: MarkupDocument) => {
    try {
      // 로딩 상태 즉시 설정
      setEditorState(prev => ({ ...prev, isLoading: true }))
      
      const result = await fileManager.openDocument(document as any)
      if (result) {
        setBlueprintUrl(result.blueprintUrl)
        setBlueprintFileName(result.blueprintFileName)
        setCurrentView('editor')
        // 이미지 로딩은 캔버스에서 완료 처리됨
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : '문서를 열 수 없습니다.')
      setEditorState(prev => ({ ...prev, isLoading: false }))
    }
  }

  const handleEditDocument = async (document: MarkupDocument) => {
    await handleOpenDocument(document)
  }

  const handleCreateNew = () => {
    // 새 문서 생성 - 에디터로 이동
    setCurrentView('editor')
    setBlueprintUrl('')
    setBlueprintFileName('')
    setEditorState(prev => ({
      ...prev,
      currentFile: null,
      markupObjects: [],
      selectedObjects: [],
      undoStack: [],
      redoStack: []
    }))
  }

  const handleBackToList = () => {
    setCurrentView('list')
  }

  const handleShare = async (permissions: any) => {
    // 공유 로직 구현
    console.log('Sharing with permissions:', permissions)
  }

  const handleImageUpload = (imageUrl: string, fileName: string) => {
    console.log('handleImageUpload called:', { fileName, urlLength: imageUrl.length }) // 디버깅용
    
    try {
      if (!imageUrl || !fileName) {
        console.error('Invalid image data:', { imageUrl: !!imageUrl, fileName })
        alert('유효하지 않은 파일 데이터입니다.')
        return
      }
      
      setBlueprintUrl(imageUrl)
      setBlueprintFileName(fileName)
      
      // 새 도면이 업로드되면 기존 마킹 초기화
      setEditorState(prev => ({
        ...prev,
        markupObjects: [],
        selectedObjects: [],
        undoStack: [],
        redoStack: [],
        currentFile: null
      }))
      
      console.log('Blueprint uploaded successfully:', fileName) // 디버깅용
    } catch (error) {
      console.error('Error handling image upload:', error)
      alert('이미지 업로드 처리 중 오류가 발생했습니다.')
    }
  }

  // 모바일 여부 확인
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

  // 문서 목록 보기
  if (currentView === 'list') {
    return (
      <MarkupDocumentList
        onCreateNew={handleCreateNew}
        onOpenDocument={handleOpenDocument as any}
        onEditDocument={handleEditDocument as any}
      />
    )
  }

  // 에디터 보기
  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900 relative">
      {/* 전체 화면 로딩 오버레이 */}
      {editorState.isLoading && (
        <div className="absolute inset-0 bg-white/90 dark:bg-gray-900/90 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="text-center max-w-sm mx-auto p-6">
            <div className="relative w-16 h-16 mx-auto mb-6">
              <div className="absolute inset-0 border-4 border-blue-200 dark:border-blue-800 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">도면을 불러오는 중</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              고해상도 도면을 로딩하고 있습니다
            </p>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: '75%' }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
              네트워크 상태에 따라 시간이 소요될 수 있습니다
            </p>
          </div>
        </div>
      )}
      
      {/* 상단 툴바 */}
      <TopToolbar
        fileName={blueprintFileName || (editorState.currentFile as any)?.title || '새 마킹'}
        onHome={handleBackToList}
        onOpen={() => setEditorState(prev => ({ ...prev, showOpenDialog: true }))}
        onSave={() => setEditorState(prev => ({ ...prev, showSaveDialog: true }))}
        onShare={() => console.log('Share clicked')}
        onClose={onClose}
        isMobile={isMobile}
        isLargeFont={isLargeFont}
        touchMode={touchMode}
      />

      {/* 메인 영역 */}
      <div className="flex-1 flex overflow-hidden">
        {blueprintUrl ? (
          <>
            {/* 데스크톱: 좌측 도구 패널 */}
            {!isMobile && (
              <div className={`${
                touchMode === 'glove' ? 'w-28' : touchMode === 'precision' ? 'w-20' : 'w-24'
              } bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col`}>
                <div className="flex-1 overflow-y-auto overflow-x-hidden py-2">
                  <ToolPalette
                    activeTool={editorState.toolState.activeTool}
                    onToolChange={handleToolChange}
                    onUndo={markupTools.undo}
                    onRedo={markupTools.redo}
                    onDelete={markupTools.deleteSelected}
                    canUndo={editorState.undoStack.length > 0}
                    canRedo={editorState.redoStack.length > 0}
                    hasSelection={editorState.selectedObjects.length > 0}
                    isMobile={false}
                    isLargeFont={isLargeFont}
                    touchMode={touchMode}
                  />
                </div>
              </div>
            )}

            {/* 캔버스 영역 */}
            <div className="flex-1 relative bg-gray-100 dark:bg-gray-900 overflow-hidden min-h-96" ref={containerRef} style={{ height: '100%' }}>
              <MarkupCanvas
                ref={canvasRef}
                editorState={editorState}
                blueprintUrl={blueprintUrl}
                onStateChange={setEditorState}
                containerRef={containerRef}
              />
            </div>
          </>
        ) : (
          /* 도면 업로드 영역 */
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="max-w-lg w-full">
              <BlueprintUpload
                onImageUpload={handleImageUpload}
                currentImage={blueprintUrl}
                currentFileName={blueprintFileName}
                isLargeFont={isLargeFont}
                touchMode={touchMode}
              />
            </div>
          </div>
        )}
      </div>

      {/* 모바일: 하단 도구바 */}
      {isMobile && blueprintUrl && (
        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <ToolPalette
            activeTool={editorState.toolState.activeTool}
            onToolChange={handleToolChange}
            onUndo={markupTools.undo}
            onRedo={markupTools.redo}
            onDelete={markupTools.deleteSelected}
            canUndo={editorState.undoStack.length > 0}
            canRedo={editorState.redoStack.length > 0}
            hasSelection={editorState.selectedObjects.length > 0}
            isMobile={true}
            isLargeFont={isLargeFont}
            touchMode={touchMode}
          />
        </div>
      )}

      {/* 하단 상태바 (데스크톱만) */}
      {!isMobile && blueprintUrl && (
        <BottomStatusbar
          fileName={blueprintFileName || editorState.currentFile?.fileName || '새 마킹'}
          markupCount={editorState.markupObjects.length}
          zoom={Math.round(editorState.viewerState.zoom * 100)}
          activeTool={editorState.toolState.activeTool}
          isLargeFont={isLargeFont}
          touchMode={touchMode}
        />
      )}

      {/* 다이얼로그 */}
      <SaveDialog
        open={editorState.showSaveDialog}
        onOpenChange={(open) => setEditorState(prev => ({ ...prev, showSaveDialog: open }))}
        onSave={handleSave}
        defaultFileName={editorState.currentFile?.fileName || ''}
      />

      <OpenDialog
        open={editorState.showOpenDialog}
        onOpenChange={(open) => setEditorState(prev => ({ ...prev, showOpenDialog: open }))}
        onOpen={handleOpenDocument as any}
      />

      <ShareDialog
        open={false}
        onOpenChange={() => {}}
        onShare={handleShare}
        currentPermissions={editorState.currentFile?.permissions}
      />
    </div>
  )
}

export default MarkupEditor