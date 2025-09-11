'use client'

import { forwardRef, useEffect, useRef, useState, useCallback } from 'react'
import type { MarkupEditorState, MarkupObject, BoxMarkup, TextMarkup, DrawingMarkup } from '@/types/markup'
import { TextInputDialog } from '../dialogs/text-input-dialog'

interface MarkupCanvasProps {
  editorState: MarkupEditorState
  blueprintUrl?: string
  onStateChange: (updater: (prev: MarkupEditorState) => MarkupEditorState) => void
  containerRef: React.RefObject<HTMLDivElement>
}

export const MarkupCanvas = forwardRef<HTMLCanvasElement, MarkupCanvasProps>(
  ({ editorState, blueprintUrl, onStateChange, containerRef }, canvasRef) => {
    const internalCanvasRef = useRef<HTMLCanvasElement>(null)
    const blueprintImageRef = useRef<HTMLImageElement | null>(null)
    const [isMouseDown, setIsMouseDown] = useState(false)
    const [startPoint, setStartPoint] = useState({ x: 0, y: 0 })
    const [currentDrawing, setCurrentDrawing] = useState<Partial<MarkupObject> | null>(null)
    const [textInputOpen, setTextInputOpen] = useState(false)
    const [textInputPosition, setTextInputPosition] = useState({ x: 0, y: 0 })
    const [imageLoadProgress, setImageLoadProgress] = useState(0)
    const [imageLoadError, setImageLoadError] = useState<string | null>(null)
    
    // 팬 기능을 위한 상태
    const [isPanning, setIsPanning] = useState(false)
    const [panStart, setPanStart] = useState({ x: 0, y: 0 })
    const [lastPanPosition, setLastPanPosition] = useState({ x: 0, y: 0 })
    
    // 터치 제스처를 위한 상태
    const [touches, setTouches] = useState<Array<{ id: number, x: number, y: number }>>([])
    const [lastDistance, setLastDistance] = useState(0)
    const [lastTouchCenter, setLastTouchCenter] = useState({ x: 0, y: 0 })
    
    // Canvas ref 처리
    const canvas = canvasRef && 'current' in canvasRef ? canvasRef.current : internalCanvasRef.current

    // 터치 제스처 헬퍼 함수들
    const getTouchDistance = (touch1: { x: number, y: number }, touch2: { x: number, y: number }) => {
      const dx = touch1.x - touch2.x
      const dy = touch1.y - touch2.y
      return Math.sqrt(dx * dx + dy * dy)
    }

    const getTouchCenter = (touch1: { x: number, y: number }, touch2: { x: number, y: number }) => {
      return {
        x: (touch1.x + touch2.x) / 2,
        y: (touch1.y + touch2.y) / 2
      }
    }

    // 도면 이미지 로드 및 크기 조정
    useEffect(() => {
      if (blueprintUrl) {
        // 로딩 상태 초기화
        setImageLoadProgress(0)
        setImageLoadError(null)
        
        const img = new Image()
        
        // 크로스오리진 설정으로 이미지 캐싱 활용
        img.crossOrigin = 'anonymous'
        
        img.onload = () => {
          blueprintImageRef.current = img
          setImageLoadProgress(100)
          
          // 이미지가 로드되면 화면에 맞게 초기 크기 조정
          if (canvas && containerRef.current) {
            const containerRect = containerRef.current.getBoundingClientRect()
            
            // 컨테이너 크기가 0이면 기본값 사용
            const containerWidth = containerRect.width || 800
            const containerHeight = containerRect.height || 400
            
            const imageAspectRatio = img.width / img.height
            const containerAspectRatio = containerWidth / containerHeight
            
            let scale = 1
            let fitWidth, fitHeight
            
            // 이미지를 컨테이너에 맞게 fit하는 스케일 계산
            if (imageAspectRatio > containerAspectRatio) {
              // 이미지가 더 넓음 - 너비 기준으로 맞춤
              scale = containerWidth / img.width
              fitWidth = containerWidth
              fitHeight = img.height * scale
            } else {
              // 이미지가 더 높음 - 높이 기준으로 맞춤
              scale = containerHeight / img.height
              fitWidth = img.width * scale
              fitHeight = containerHeight
            }
            
            // 이미지를 중앙에 위치시키기 위한 offset 계산
            const offsetX = (containerWidth - fitWidth) / 2
            const offsetY = (containerHeight - fitHeight) / 2
            
            // 초기 viewer state 설정 및 로딩 완료
            setTimeout(() => {
              onStateChange(prev => ({
                ...prev,
                viewerState: {
                  ...prev.viewerState,
                  zoom: scale,
                  panX: offsetX,
                  panY: offsetY,
                  imageWidth: img.width,
                  imageHeight: img.height
                },
                isLoading: false // 이미지 로딩 완료
              }))
            }, 100) // 약간의 지연으로 부드러운 전환
          }
        }
        
        img.onerror = (e) => {
          console.error('Failed to load blueprint image:', blueprintUrl, e)
          setImageLoadError('이미지를 불러올 수 없습니다.')
          onStateChange(prev => ({
            ...prev,
            isLoading: false
          }))
        }
        
        // Progress 시뮬레이션 (실제 progress 이벤트는 브라우저에서 지원하지 않음)
        let progressInterval: NodeJS.Timeout
        const startProgress = () => {
          let progress = 0
          progressInterval = setInterval(() => {
            progress += Math.random() * 30
            if (progress < 80) {
              setImageLoadProgress(progress)
            } else {
              clearInterval(progressInterval)
            }
          }, 200)
        }
        
        startProgress()
        img.src = blueprintUrl
        
        return () => {
          if (progressInterval) {
            clearInterval(progressInterval)
          }
        }
      }
    }, [blueprintUrl, canvas, containerRef, onStateChange])

    // 캔버스 크기 조정
    useEffect(() => {
      const resizeCanvas = () => {
        if (canvas && containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect()
          
          // 최소 높이 설정 (높이가 0이면 400px로 설정)
          const width = rect.width || 800
          const height = rect.height || 400
          
          // console.log('Resizing canvas:', { // 디버깅용
          //   originalWidth: rect.width,
          //   originalHeight: rect.height,
          //   usedWidth: width,
          //   usedHeight: height,
          //   canvasExists: !!canvas
          // })
          
          canvas.width = width
          canvas.height = height
          
          // 리사이즈 시 이미지도 다시 fit
          if (blueprintImageRef.current) {
            const img = blueprintImageRef.current
            const imageAspectRatio = img.width / img.height
            const containerAspectRatio = width / height
            
            let scale = 1
            let fitWidth, fitHeight
            
            if (imageAspectRatio > containerAspectRatio) {
              scale = width / img.width
              fitWidth = width
              fitHeight = img.height * scale
            } else {
              scale = height / img.height
              fitWidth = img.width * scale
              fitHeight = height
            }
            
            const offsetX = (width - fitWidth) / 2
            const offsetY = (height - fitHeight) / 2
            
            onStateChange(prev => ({
              ...prev,
              viewerState: {
                ...prev.viewerState,
                zoom: scale,
                panX: offsetX,
                panY: offsetY,
                imageWidth: img.width,
                imageHeight: img.height
              }
            }))
          }
          
          redrawCanvas()
        }
      }

      resizeCanvas()
      
      // DOM이 완전히 렌더링된 후 다시 한번 리사이즈
      const timeoutId = setTimeout(resizeCanvas, 100)
      
      window.addEventListener('resize', resizeCanvas)
      return () => {
        window.removeEventListener('resize', resizeCanvas)
        clearTimeout(timeoutId)
      }
    }, [canvas, containerRef, onStateChange])

    // 캔버스 좌표 변환
    const getCanvasCoordinates = useCallback((e: React.MouseEvent | MouseEvent) => {
      if (!canvas) return { x: 0, y: 0 }
      
      const rect = canvas.getBoundingClientRect()
      const { zoom, panX, panY } = editorState.viewerState
      
      // 마우스 위치를 이미지 좌표계로 변환
      const x = (e.clientX - rect.left - panX) / zoom
      const y = (e.clientY - rect.top - panY) / zoom
      
      // console.log('🔥 Coordinate transform:', {
      //   mouse: { clientX: e.clientX, clientY: e.clientY },
      //   rect: { left: rect.left, top: rect.top },
      //   viewer: { zoom, panX, panY },
      //   result: { x, y }
      // }) // 디버깅용
      
      return { x, y }
    }, [canvas, editorState.viewerState])

    // 캔버스 다시 그리기
    const redrawCanvas = useCallback(() => {
      if (!canvas) {
        // console.log('Canvas not available') // 디버깅용
        return
      }
      
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        // console.log('Canvas context not available') // 디버깅용
        return
      }

      const { zoom, panX, panY } = editorState.viewerState
      
      // console.log('Redrawing canvas:', { // 디버깅용
      //   zoom, panX, panY,
      //   markupObjects: editorState.markupObjects.length,
      //   currentDrawing: !!currentDrawing,
      //   canvasSize: { width: canvas.width, height: canvas.height }
      // })

      // 캔버스 초기화
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      // 변환 적용
      ctx.save()
      ctx.translate(panX, panY)
      ctx.scale(zoom, zoom)

      // 도면 이미지 그리기
      if (blueprintImageRef.current) {
        ctx.drawImage(blueprintImageRef.current, 0, 0)
        // console.log('Blueprint drawn') // 디버깅용
      }

      // 마킹 객체들 그리기
      editorState.markupObjects.forEach((obj, index) => {
        // console.log(`Drawing markup object ${index}:`, obj) // 디버깅용
        drawMarkupObject(ctx, obj, editorState.selectedObjects.includes(obj.id))
      })

      // 현재 그리고 있는 객체 그리기
      if (currentDrawing) {
        // console.log('Drawing current object:', currentDrawing) // 디버깅용
        drawMarkupObject(ctx, currentDrawing as MarkupObject, false)
      }

      ctx.restore()
    }, [canvas, editorState, currentDrawing])

    // 도면 이미지가 로드되었을 때 redraw
    useEffect(() => {
      if (blueprintImageRef.current) {
        // console.log('Blueprint image loaded, redrawing canvas')
        redrawCanvas()
      }
    }, [blueprintUrl, redrawCanvas])

    // 마킹 객체 그리기
    const drawMarkupObject = (ctx: CanvasRenderingContext2D, obj: Partial<MarkupObject>, isSelected: boolean) => {
      ctx.save()

      if (obj.type === 'box') {
        const box = obj as BoxMarkup
        ctx.fillStyle = box.color === 'gray' ? '#9CA3AF' : 
                        box.color === 'red' ? '#EF4444' : '#3B82F6'
        ctx.globalAlpha = 0.5
        ctx.fillRect(box.x || 0, box.y || 0, box.width || 0, box.height || 0)
        
        // 박스 안에 라벨 텍스트 그리기
        if (box.label && (box.width || 0) > 60 && (box.height || 0) > 30) {
          ctx.save()
          ctx.globalAlpha = 1
          ctx.fillStyle = '#FFFFFF'
          ctx.font = 'bold 14px sans-serif'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          
          // 박스 중앙에 텍스트 그리기
          const centerX = (box.x || 0) + (box.width || 0) / 2
          const centerY = (box.y || 0) + (box.height || 0) / 2
          
          // 텍스트 배경 추가 (가독성 향상)
          const textMetrics = ctx.measureText(box.label)
          const textWidth = textMetrics.width
          const textHeight = 16
          const padding = 4
          
          ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
          ctx.fillRect(
            centerX - textWidth/2 - padding,
            centerY - textHeight/2 - padding,
            textWidth + padding * 2,
            textHeight + padding * 2
          )
          
          // 실제 텍스트 그리기
          ctx.fillStyle = '#FFFFFF'
          ctx.fillText(box.label, centerX, centerY)
          ctx.restore()
        }
        
        if (isSelected) {
          ctx.strokeStyle = '#1F2937'
          ctx.lineWidth = 2
          ctx.globalAlpha = 1
          ctx.strokeRect(box.x || 0, box.y || 0, box.width || 0, box.height || 0)
        }
      } else if (obj.type === 'text') {
        const text = obj as TextMarkup
        ctx.font = `${text.fontSize}px sans-serif`
        ctx.fillStyle = text.fontColor
        ctx.globalAlpha = 1
        ctx.fillText(text.content, text.x || 0, text.y || 0)
        
        if (isSelected) {
          const metrics = ctx.measureText(text.content)
          ctx.strokeStyle = '#1F2937'
          ctx.lineWidth = 1
          ctx.strokeRect(
            (text.x || 0) - 2, 
            (text.y || 0) - text.fontSize, 
            metrics.width + 4, 
            text.fontSize + 4
          )
        }
      } else if (obj.type === 'drawing') {
        const drawing = obj as DrawingMarkup
        if (drawing.path.length > 0) {
          ctx.strokeStyle = drawing.strokeColor
          ctx.lineWidth = drawing.strokeWidth
          ctx.globalAlpha = 1
          ctx.beginPath()
          ctx.moveTo(drawing.path[0].x, drawing.path[0].y)
          drawing.path.forEach(point => {
            ctx.lineTo(point.x, point.y)
          })
          ctx.stroke()
        }
      } else if (obj.type === 'stamp') {
        const stamp = obj as any // StampMarkup
        const size = stamp.size === 'small' ? 20 : stamp.size === 'large' ? 60 : 40
        
        ctx.fillStyle = stamp.color
        ctx.strokeStyle = stamp.color
        ctx.lineWidth = 3
        ctx.globalAlpha = 0.4  // 반투명으로 변경 (0.8 -> 0.4)
        
        const x = stamp.x || 0
        const y = stamp.y || 0
        
        if (stamp.shape === 'circle') {
          ctx.beginPath()
          ctx.arc(x, y, size / 2, 0, Math.PI * 2)
          ctx.fill()
        } else if (stamp.shape === 'triangle') {
          ctx.beginPath()
          ctx.moveTo(x, y - size / 2)
          ctx.lineTo(x - size / 2, y + size / 2)
          ctx.lineTo(x + size / 2, y + size / 2)
          ctx.closePath()
          ctx.fill()
        } else if (stamp.shape === 'square') {
          ctx.fillRect(x - size / 2, y - size / 2, size, size)
        } else if (stamp.shape === 'star') {
          // 별 그리기
          const spikes = 5
          const outerRadius = size / 2
          const innerRadius = size / 4
          
          ctx.beginPath()
          for (let i = 0; i < spikes * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius
            const angle = (Math.PI / spikes) * i - Math.PI / 2
            const px = x + Math.cos(angle) * radius
            const py = y + Math.sin(angle) * radius
            
            if (i === 0) {
              ctx.moveTo(px, py)
            } else {
              ctx.lineTo(px, py)
            }
          }
          ctx.closePath()
          ctx.fill()
        }
        
        if (isSelected) {
          ctx.strokeStyle = '#1F2937'
          ctx.lineWidth = 2
          ctx.globalAlpha = 1
          ctx.strokeRect(x - size / 2 - 5, y - size / 2 - 5, size + 10, size + 10)
        }
      }

      ctx.restore()
    }

    // 마우스 이벤트 핸들러
    const handleMouseDown = (e: React.MouseEvent) => {
      // console.log('🔥 handleMouseDown called!', { 
      //   clientX: e.clientX, 
      //   clientY: e.clientY,
      //   target: e.target,
      //   currentTarget: e.currentTarget
      // })
      
      const { activeTool } = editorState.toolState
      const coords = getCanvasCoordinates(e)
      
      // console.log('Mouse down:', { activeTool, coords }) // 디버깅용
      
      // Text tool - open dialog on single click
      if (activeTool === 'text') {
        // console.log('🔥 Text tool click - opening dialog')
        setTextInputPosition(coords)
        setTextInputOpen(true)
        return
      }
      
      // Pan tool - start panning
      if (activeTool === 'pan') {
        // console.log('🔥 Pan tool - starting pan')
        setIsPanning(true)
        setPanStart({ x: e.clientX, y: e.clientY })
        setLastPanPosition({ 
          x: editorState.viewerState.panX, 
          y: editorState.viewerState.panY 
        })
        return
      }
      
      setIsMouseDown(true)
      setStartPoint(coords)

      if (activeTool === 'select') {
        // 선택 도구 로직
        const clickedObject = findObjectAtPoint(coords)
        if (clickedObject) {
          // Shift 키가 눌려있으면 기존 선택에 추가/제거
          if (e.shiftKey) {
            onStateChange(prev => ({
              ...prev,
              selectedObjects: prev.selectedObjects.includes(clickedObject.id)
                ? prev.selectedObjects.filter(id => id !== clickedObject.id)
                : [...prev.selectedObjects, clickedObject.id]
            }))
          } else {
            // 단일 선택
            onStateChange(prev => ({
              ...prev,
              selectedObjects: [clickedObject.id],
              // 이동을 위한 시작 위치 저장
              dragStart: coords,
              draggedObject: clickedObject
            }))
          }
        } else {
          // 빈 공간 클릭 시 선택 해제
          onStateChange(prev => ({
            ...prev,
            selectedObjects: []
          }))
        }
      } else if (activeTool.startsWith('box-')) {
        // 박스 도구 시작
        const color = activeTool.split('-')[1] as 'gray' | 'red' | 'blue'
        const label = color === 'gray' ? '자재구간' : 
                     color === 'red' ? '작업진행' : '작업완료'
        
        // console.log('🔥 Starting box drawing:', { activeTool, color, label }) // 디버깅용
        
        setCurrentDrawing({
          id: `temp-${Date.now()}`,
          type: 'box',
          x: coords.x,
          y: coords.y,
          width: 0,
          height: 0,
          color,
          label,
          createdAt: new Date().toISOString(),
          modifiedAt: new Date().toISOString()
        } as BoxMarkup)
      } else if (activeTool === 'pen') {
        // 펜 도구 시작
        // console.log('🔥 Starting pen drawing:', { activeTool }) // 디버깅용
        
        setCurrentDrawing({
          id: `temp-${Date.now()}`,
          type: 'drawing',
          x: coords.x,
          y: coords.y,
          path: [coords],
          strokeColor: '#EF4444',
          strokeWidth: 2,
          createdAt: new Date().toISOString(),
          modifiedAt: new Date().toISOString()
        } as DrawingMarkup)
      } else if (activeTool === 'stamp') {
        // 스탬프 도구 - 클릭 즉시 스탬프 추가
        const stampSettings = editorState.toolState.stampSettings || {
          shape: 'circle',
          size: 'medium',
          color: '#FF0000'
        }
        
        const newStamp = {
          id: `markup-${Date.now()}`,
          type: 'stamp' as const,
          x: coords.x,
          y: coords.y,
          shape: stampSettings.shape,
          size: stampSettings.size,
          color: stampSettings.color,
          createdAt: new Date().toISOString(),
          modifiedAt: new Date().toISOString()
        }
        
        // 즉시 스탬프를 마킹 객체에 추가
        onStateChange(prev => ({
          ...prev,
          markupObjects: [...prev.markupObjects, newStamp],
          undoStack: [...prev.undoStack, prev.markupObjects],
          redoStack: []
        }))
        
        // 마우스 다운 상태를 false로 유지하여 드래그 방지
        setIsMouseDown(false)
      }
    }

    const handleMouseMove = (e: React.MouseEvent) => {
      const { activeTool } = editorState.toolState
      
      // Pan tool handling
      if (isPanning && activeTool === 'pan') {
        const deltaX = e.clientX - panStart.x
        const deltaY = e.clientY - panStart.y
        
        onStateChange(prev => ({
          ...prev,
          viewerState: {
            ...prev.viewerState,
            panX: lastPanPosition.x + deltaX,
            panY: lastPanPosition.y + deltaY
          }
        }))
        return
      }
      
      if (!isMouseDown) return
      
      const coords = getCanvasCoordinates(e)

      // console.log('🔥 Mouse move:', { activeTool, coords, currentDrawing: !!currentDrawing }) // 디버깅용

      // 선택 도구로 객체 이동
      if (activeTool === 'select' && editorState.selectedObjects.length > 0 && (editorState as any).dragStart) {
        const deltaX = coords.x - (editorState as any).dragStart.x
        const deltaY = coords.y - (editorState as any).dragStart.y
        
        // 선택된 모든 객체 이동
        onStateChange(prev => {
          const updatedObjects = prev.markupObjects.map(obj => {
            if (prev.selectedObjects.includes(obj.id)) {
              return {
                ...obj,
                x: obj.x + deltaX,
                y: obj.y + deltaY
              }
            }
            return obj
          })
          
          return {
            ...prev,
            markupObjects: updatedObjects,
            dragStart: coords // 새로운 시작 위치로 업데이트
          }
        })
        return
      }

      if (currentDrawing) {
        if (currentDrawing.type === 'box') {
          const newWidth = coords.x - startPoint.x
          const newHeight = coords.y - startPoint.y
          // console.log('🔥 Updating box:', { startPoint, coords, newWidth, newHeight }) // 디버깅용
          
          setCurrentDrawing(prev => ({
            ...prev,
            width: newWidth,
            height: newHeight
          }))
        } else if (currentDrawing.type === 'drawing') {
          // console.log('🔥 Adding path point:', coords) // 디버깅용
          setCurrentDrawing(prev => ({
            ...prev,
            path: [...(prev as DrawingMarkup).path, coords]
          }))
        }
      }
    }

    const handleMouseUp = () => {
      // console.log('🔥 Mouse up, currentDrawing:', currentDrawing) // 디버깅용
      
      // Pan tool cleanup
      if (isPanning) {
        setIsPanning(false)
        return
      }
      
      if (currentDrawing) {
        // 현재 그리기를 완료하고 저장
        const newObject = {
          ...currentDrawing,
          id: `markup-${Date.now()}`
        } as MarkupObject

        // console.log('🔥 Saving new markup object:', newObject) // 디버깅용

        onStateChange(prev => ({
          ...prev,
          markupObjects: [...prev.markupObjects, newObject],
          undoStack: [...prev.undoStack, prev.markupObjects],
          redoStack: []
        }))

        setCurrentDrawing(null)
      }
      
      setIsMouseDown(false)
    }

    // 더블클릭으로 텍스트 추가
    const handleDoubleClick = (e: React.MouseEvent) => {
      // console.log('🔥 Double click detected!', { 
      //   activeTool: editorState.toolState.activeTool,
      //   clientX: e.clientX,
      //   clientY: e.clientY
      // })
      
      if (editorState.toolState.activeTool === 'text') {
        const coords = getCanvasCoordinates(e)
        // console.log('🔥 Opening text input dialog at:', coords)
        setTextInputPosition(coords)
        setTextInputOpen(true)
      }
    }

    // 텍스트 입력 확인 핸들러
    const handleTextConfirm = (text: string) => {
      // console.log('🔥 handleTextConfirm called with text:', text)
      // console.log('🔥 Text position:', textInputPosition)
      
      const newText: TextMarkup = {
        id: `text-${Date.now()}`,
        type: 'text',
        x: textInputPosition.x,
        y: textInputPosition.y,
        content: text,
        fontSize: 16,
        fontColor: '#000000',
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString()
      }

      // console.log('🔥 Creating new text object:', newText)

      onStateChange(prev => ({
        ...prev,
        markupObjects: [...prev.markupObjects, newText],
        undoStack: [...prev.undoStack, prev.markupObjects],
        redoStack: []
      }))
      
      // console.log('🔥 Text added to canvas')
    }

    // 마우스 휠 줌 기능
    const handleWheel = useCallback((e: React.WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        
        const delta = e.deltaY > 0 ? 0.9 : 1.1
        const rect = canvas?.getBoundingClientRect()
        if (!rect) return
        
        const { zoom, panX, panY } = editorState.viewerState
        const mouseX = e.clientX - rect.left
        const mouseY = e.clientY - rect.top
        
        const newZoom = Math.max(0.1, Math.min(5, zoom * delta))
        
        // 마우스 위치를 중심으로 줌
        const newPanX = mouseX - (mouseX - panX) * (newZoom / zoom)
        const newPanY = mouseY - (mouseY - panY) * (newZoom / zoom)
        
        onStateChange(prev => ({
          ...prev,
          viewerState: {
            ...prev.viewerState,
            zoom: newZoom,
            panX: newPanX,
            panY: newPanY
          }
        }))
      }
    }, [canvas, editorState.viewerState, onStateChange])

    // 점에서 객체 찾기
    const findObjectAtPoint = (point: { x: number, y: number }): MarkupObject | null => {
      // 역순으로 검색 (최상위 객체부터)
      for (let i = editorState.markupObjects.length - 1; i >= 0; i--) {
        const obj = editorState.markupObjects[i]
        
        if (obj.type === 'box') {
          const box = obj as BoxMarkup
          // 박스 영역 체크
          const minX = Math.min(box.x, box.x + box.width)
          const maxX = Math.max(box.x, box.x + box.width)
          const minY = Math.min(box.y, box.y + box.height)
          const maxY = Math.max(box.y, box.y + box.height)
          
          if (point.x >= minX && point.x <= maxX &&
              point.y >= minY && point.y <= maxY) {
            return obj
          }
        } else if (obj.type === 'text') {
          const text = obj as TextMarkup
          // 텍스트 바운딩 박스 체크 (대략적인 크기)
          const approxWidth = text.content.length * (text.fontSize || 16) * 0.6
          const approxHeight = (text.fontSize || 16) * 1.5
          
          if (point.x >= text.x - 5 && point.x <= text.x + approxWidth + 5 &&
              point.y >= text.y - approxHeight && point.y <= text.y + 5) {
            return obj
          }
        } else if (obj.type === 'stamp') {
          const stamp = obj as any
          // 스탬프 크기 계산
          const sizeMap = { small: 20, medium: 30, large: 40 }
          const size = sizeMap[stamp.size] || 30
          
          // 원형 스탬프 히트 테스트
          const distance = Math.sqrt(
            Math.pow(point.x - stamp.x, 2) + 
            Math.pow(point.y - stamp.y, 2)
          )
          
          if (distance <= size / 2 + 5) { // 약간의 여유 공간 추가
            return obj
          }
        } else if (obj.type === 'drawing') {
          const drawing = obj as DrawingMarkup
          // 드로잉 패스의 각 점 근처 체크
          for (const pathPoint of drawing.path) {
            const distance = Math.sqrt(
              Math.pow(point.x - pathPoint.x, 2) + 
              Math.pow(point.y - pathPoint.y, 2)
            )
            
            if (distance <= 10) { // 10픽셀 이내면 선택
              return obj
            }
          }
        }
      }
      
      return null
    }

    // 터치 제스처 상태
    const [isGesturing, setIsGesturing] = useState(false)
    const [gestureStartZoom, setGestureStartZoom] = useState(1)
    const [gestureStartPan, setGestureStartPan] = useState({ x: 0, y: 0 })

    // 터치 이벤트 핸들러들 - 단순화된 구현
    const handleTouchStart = useCallback((e: React.TouchEvent) => {
      const rect = canvas?.getBoundingClientRect()
      if (!rect) return

      const newTouches = Array.from(e.touches).map(touch => ({
        id: touch.identifier,
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      }))
      
      setTouches(newTouches)
      
      if (newTouches.length === 2) {
        // 두 손가락 제스처 시작
        setIsGesturing(true)
        const distance = getTouchDistance(newTouches[0], newTouches[1])
        const center = getTouchCenter(newTouches[0], newTouches[1])
        
        setLastDistance(distance)
        setLastTouchCenter(center)
        setGestureStartZoom(editorState.viewerState.zoom)
        setGestureStartPan({ x: editorState.viewerState.panX, y: editorState.viewerState.panY })
        
        // console.log('🔥 두 손가락 제스처 시작:', { distance, center })
      } else if (newTouches.length === 1 && !isGesturing) {
        // 단일 터치 - 도구에 따라 다르게 처리
        const { activeTool } = editorState.toolState
        
        if (activeTool === 'pan' || activeTool === 'select') {
          // Pan tool이거나 Select tool인 경우 자연스러운 패닝 허용
          setIsPanning(true)
          setPanStart({ x: newTouches[0].x, y: newTouches[0].y })
          setLastPanPosition({ 
            x: editorState.viewerState.panX, 
            y: editorState.viewerState.panY 
          })
          // console.log('🔥 단일 터치 패닝 시작 (도구:', activeTool, ')')
        } else {
          // Drawing tools (box, pen, text)는 마우스 이벤트로 처리
          // console.log('🔥 터치 시작 - Drawing tool:', activeTool)
          const mouseEvent = {
            clientX: e.touches[0].clientX,
            clientY: e.touches[0].clientY,
            target: e.target,
            currentTarget: e.currentTarget,
            preventDefault: () => {},
            stopPropagation: () => e.stopPropagation()
          } as any
          setIsMouseDown(true) // 터치 시작 시 마우스 다운 상태로 설정
          handleMouseDown(mouseEvent)
        }
      }
    }, [canvas, editorState, isGesturing])

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
      const rect = canvas?.getBoundingClientRect()
      if (!rect) return

      const newTouches = Array.from(e.touches).map(touch => ({
        id: touch.identifier,
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      }))
      
      if (newTouches.length === 2 && isGesturing) {
        // 두 손가락 제스처 처리
        const distance = getTouchDistance(newTouches[0], newTouches[1])
        const center = getTouchCenter(newTouches[0], newTouches[1])
        
        if (lastDistance > 0) {
          // 핀치 줌
          const zoomRatio = distance / lastDistance
          const currentZoom = editorState.viewerState.zoom
          const newZoom = Math.max(0.1, Math.min(5, currentZoom * zoomRatio))
          
          // 두 손가락 중심점을 기준으로 줌
          const { panX, panY } = editorState.viewerState
          const zoomDelta = newZoom / currentZoom
          const newPanX = center.x - (center.x - panX) * zoomDelta
          const newPanY = center.y - (center.y - panY) * zoomDelta
          
          // 두 손가락 팬 (중심점 이동)
          const panDeltaX = center.x - lastTouchCenter.x
          const panDeltaY = center.y - lastTouchCenter.y
          
          onStateChange(prev => ({
            ...prev,
            viewerState: {
              ...prev.viewerState,
              zoom: newZoom,
              panX: newPanX + panDeltaX,
              panY: newPanY + panDeltaY
            }
          }))
        }
        
        setLastDistance(distance)
        setLastTouchCenter(center)
        
        // console.log('🔥 두 손가락 제스처 이동:', { distance, center })
      } else if (newTouches.length === 1 && !isGesturing) {
        const { activeTool } = editorState.toolState
        
        if (isPanning && (activeTool === 'pan' || activeTool === 'select')) {
          // 단일 터치 패닝 (Pan tool 또는 Select tool)
          const deltaX = newTouches[0].x - panStart.x
          const deltaY = newTouches[0].y - panStart.y
          
          onStateChange(prev => ({
            ...prev,
            viewerState: {
              ...prev.viewerState,
              panX: lastPanPosition.x + deltaX,
              panY: lastPanPosition.y + deltaY
            }
          }))
          // console.log('🔥 단일 터치 패닝:', { activeTool, deltaX, deltaY })
        } else if (isMouseDown) {
          // Drawing tools의 drawing 동작
          // console.log('🔥 터치 이동 - Drawing tool:', activeTool, 'currentDrawing:', !!currentDrawing)
          const mouseEvent = {
            clientX: e.touches[0].clientX,
            clientY: e.touches[0].clientY,
            target: e.target,
            currentTarget: e.currentTarget,
            preventDefault: () => {},
            stopPropagation: () => e.stopPropagation()
          } as any
          handleMouseMove(mouseEvent)
        }
      }
      
      setTouches(newTouches)
    }, [canvas, isGesturing, lastDistance, lastTouchCenter, editorState, isPanning, panStart, lastPanPosition, isMouseDown, onStateChange])

    const handleTouchEnd = useCallback((e: React.TouchEvent) => {
      const remainingTouches = Array.from(e.touches).map(touch => ({
        id: touch.identifier,
        x: touch.clientX,
        y: touch.clientY
      }))
      
      setTouches(remainingTouches)
      
      if (remainingTouches.length === 0) {
        // 모든 터치 종료
        const { activeTool } = editorState.toolState
        // console.log('🔥 모든 터치 종료 - activeTool:', activeTool, 'isMouseDown:', isMouseDown, 'currentDrawing:', !!currentDrawing)
        
        setIsGesturing(false)
        setIsPanning(false)
        setLastDistance(0)
        setLastTouchCenter({ x: 0, y: 0 })
        
        // Drawing tools의 경우 반드시 마우스 업 이벤트 처리
        if (isMouseDown || currentDrawing) {
          // console.log('🔥 Drawing tool 터치 종료 - handleMouseUp 호출')
          handleMouseUp()
        }
        
        // console.log('🔥 모든 터치 종료 완료')
      } else if (remainingTouches.length === 1 && isGesturing) {
        // 두 손가락에서 한 손가락으로 변경 - 제스처 종료
        setIsGesturing(false)
        setLastDistance(0)
        // console.log('🔥 제스처 종료, 단일 터치로 변경')
      }
    }, [isGesturing, editorState.toolState, isMouseDown, currentDrawing, handleMouseUp])

    // 마크업 객체 또는 뷰어 상태가 변경될 때마다 다시 그리기
    useEffect(() => {
      // console.log('State changed, triggering redraw') // 디버깅용
      redrawCanvas()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editorState.markupObjects, editorState.viewerState, editorState.selectedObjects, currentDrawing])

    // currentDrawing 상태 변경 감지
    useEffect(() => {
      // console.log('Current drawing changed:', currentDrawing) // 디버깅용
    }, [currentDrawing])

    // 캔버스 요소 상태 디버깅
    useEffect(() => {
      // console.log('Canvas element debug:', {
      //   canvas: !!canvas,
      //   canvasWidth: canvas?.width,
      //   canvasHeight: canvas?.height,
      //   canvasStyle: canvas?.style.cssText,
      //   containerExists: !!containerRef.current,
      //   containerRect: containerRef.current?.getBoundingClientRect(),
      //   activeTool: editorState.toolState.activeTool
      // })
    }, [canvas, containerRef, editorState.toolState.activeTool])

    return (
      <>
        <canvas
          ref={canvasRef || internalCanvasRef}
          className={`w-full h-full ${
            editorState.toolState.activeTool === 'text' ? 'cursor-text' : 
            editorState.toolState.activeTool === 'select' ? 'cursor-pointer' :
            editorState.toolState.activeTool === 'pan' ? 'cursor-move' :
            'cursor-crosshair'
          }`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onDoubleClick={handleDoubleClick}
          onWheel={handleWheel}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={(e) => {
            // console.log('🔥 Canvas clicked:', e.clientX, e.clientY)
          }}
          style={{
            display: 'block',
            touchAction: 'none',
            pointerEvents: 'auto'
          }}
        />
        
        {/* Text Input Dialog */}
        <TextInputDialog
          open={textInputOpen}
          onClose={() => setTextInputOpen(false)}
          onConfirm={handleTextConfirm}
          position={textInputPosition}
        />
      </>
    )
  }
)

MarkupCanvas.displayName = 'MarkupCanvas'