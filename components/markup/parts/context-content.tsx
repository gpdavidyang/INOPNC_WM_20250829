'use client'

import type { MarkupEditorState, ToolType } from '@/types/markup'
import { MousePointer, Trash2 } from 'lucide-react'
import { TEXT_SIZE_MAP } from '../SharedMarkupEditor'
import { ColorChip, ShapeChip, SizeChip, StampColorChip, WidthChip } from './ui-atoms'

interface ContextContentProps {
  state: MarkupEditorState
  activeTool: ToolType

  // States
  boxShape: string
  setBoxShape: (s: any) => void
  boxSize: string
  setBoxSize: (s: any) => void
  textSize: string
  setTextSize: (s: any) => void
  textColor: string
  setTextColor: (s: any) => void
  penColor: string
  setPenColor: (s: any) => void
  penWidth: number
  setPenWidth: (w: any) => void

  // Actions
  setTool: (t: ToolType) => void
  deleteSelected: () => void
  copySelected: () => void
  pasteSelected: () => void
  updateObject: (id: string, updates: any) => void
  setStamp: (updates: any) => void
}

export function ContextContent({
  state,
  activeTool,
  boxShape,
  setBoxShape,
  boxSize,
  setBoxSize,
  textSize,
  setTextSize,
  textColor,
  setTextColor,
  penColor,
  setPenColor,
  penWidth,
  setPenWidth,
  setTool,
  deleteSelected,
  copySelected,
  pasteSelected,
  updateObject,
  setStamp,
}: ContextContentProps) {
  const hasSelection = state.selectedObjects.length > 0
  const selectedObj = hasSelection
    ? state.markupObjects.find(o => o.id === state.selectedObjects[0])
    : null

  // Helper for detecting text size label
  const detectTextSize = (fs?: number) => {
    if (!fs) return 'medium'
    if (fs <= TEXT_SIZE_MAP.small) return 'small'
    if (fs >= TEXT_SIZE_MAP.large) return 'large'
    return 'medium'
  }

  if (activeTool === 'select' && !hasSelection) {
    return (
      <div className="flex flex-col items-center justify-center space-y-3 py-10 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
          <MousePointer className="h-6 w-6 text-blue-400" />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-700">선택된 항목이 없습니다</p>
          <p className="mt-1 text-xs text-gray-400">
            도면 위를 클릭(터치)하여 이미 작성된 마킹을
            <br />
            선택하거나 정보를 수정할 수 있습니다.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {hasSelection ? (
        <div className="space-y-5">
          <div className="space-y-3">
            <div className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
              선택 항목 관리
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-100 bg-red-50/50 text-sm font-bold text-red-600 active:bg-red-100 transition-colors"
                onClick={deleteSelected}
              >
                <Trash2 className="w-4 h-4" />
                선택 삭제
              </button>
              <button
                className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-700 shadow-sm active:bg-gray-50"
                onClick={copySelected}
              >
                복사
              </button>
              <button
                className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-700 shadow-sm active:bg-gray-50"
                onClick={pasteSelected}
              >
                붙여넣기
              </button>
            </div>
          </div>

          {selectedObj && (
            <div className="space-y-5 pt-5 border-t border-gray-100 mt-5">
              {selectedObj.type === 'box' && (
                <>
                  <div className="space-y-3">
                    <div className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
                      도형 모양 수정
                    </div>
                    <div className="flex gap-2">
                      {(['square', 'circle', 'triangle', 'star', 'diagonal'] as const).map(sh => (
                        <ShapeChip
                          key={sh}
                          shape={sh}
                          active={(selectedObj as any).shape === sh}
                          onClick={() => updateObject(selectedObj.id, { shape: sh })}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
                      속성 및 라벨
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <ColorChip
                        color="gray"
                        active={(selectedObj as any).color === 'gray'}
                        label="기타"
                        onClick={() =>
                          updateObject(selectedObj.id, {
                            color: 'gray',
                            label: (selectedObj as any).label || '기타',
                          })
                        }
                      />
                      <ColorChip
                        color="red"
                        active={(selectedObj as any).color === 'red'}
                        label="작업진행"
                        onClick={() =>
                          updateObject(selectedObj.id, { color: 'red', label: undefined })
                        }
                      />
                      <ColorChip
                        color="blue"
                        active={(selectedObj as any).color === 'blue'}
                        label="작업완료"
                        onClick={() =>
                          updateObject(selectedObj.id, { color: 'blue', label: undefined })
                        }
                      />
                    </div>
                  </div>
                </>
              )}

              {selectedObj.type === 'text' && (
                <div className="space-y-4">
                  <div className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
                    텍스트 수정
                  </div>
                  <button
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 leading-relaxed text-left text-sm font-bold text-gray-800"
                    onClick={() => {
                      const t = window.prompt('텍스트 수정', (selectedObj as any).content || '')
                      if (t != null) updateObject(selectedObj.id, { content: t })
                    }}
                  >
                    {(selectedObj as any).content || '(내용 없음)'}
                  </button>
                  <div className="flex gap-2">
                    {(['small', 'medium', 'large'] as const).map(s => (
                      <SizeChip
                        key={s}
                        size={s}
                        active={detectTextSize((selectedObj as any).fontSize) === s}
                        onClick={() => updateObject(selectedObj.id, { fontSize: TEXT_SIZE_MAP[s] })}
                      />
                    ))}
                  </div>
                </div>
              )}

              {selectedObj.type === 'stamp' && (
                <div className="space-y-4">
                  <div className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
                    스탬프 수정
                  </div>
                  <div className="flex gap-4">
                    {(['red', 'blue', 'gray'] as const).map(c => (
                      <StampColorChip
                        key={c}
                        color={c}
                        active={(selectedObj as any).color === c}
                        onClick={() => updateObject(selectedObj.id, { color: c })}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {activeTool.startsWith('box-') && (
            <div className="space-y-5">
              <div className="space-y-3">
                <div className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
                  마킹 색상
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <ColorChip
                    color="gray"
                    active={activeTool === 'box-gray'}
                    label="기타"
                    onClick={() => setTool('box-gray')}
                  />
                  <ColorChip
                    color="red"
                    active={activeTool === 'box-red'}
                    label="작업진행"
                    onClick={() => setTool('box-red')}
                  />
                  <ColorChip
                    color="blue"
                    active={activeTool === 'box-blue'}
                    label="작업완료"
                    onClick={() => setTool('box-blue')}
                  />
                </div>
              </div>
              <div className="space-y-3">
                <div className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
                  도형 모양
                </div>
                <div className="flex gap-2">
                  {(['square', 'circle', 'triangle', 'star', 'diagonal'] as const).map(sh => (
                    <ShapeChip
                      key={sh}
                      shape={sh}
                      active={boxShape === sh}
                      onClick={() => setBoxShape(sh)}
                    />
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <div className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
                  선 굵기
                </div>
                <div className="flex gap-2">
                  {(['small', 'medium', 'large'] as const).map(s => (
                    <SizeChip
                      key={s}
                      size={s}
                      active={boxSize === s}
                      onClick={() => setBoxSize(s)}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTool === 'pen' && (
            <div className="space-y-5">
              <div className="space-y-3">
                <div className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
                  펜 색상
                </div>
                <div className="flex gap-4">
                  {(['red', 'blue', 'gray'] as const).map(c => (
                    <StampColorChip
                      key={c}
                      color={c}
                      active={penColor === c}
                      onClick={() => setPenColor(c)}
                    />
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <div className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
                  펜 굵기
                </div>
                <div className="flex gap-2">
                  {([1, 3, 5] as const).map(w => (
                    <WidthChip
                      key={w}
                      w={w}
                      active={penWidth === w}
                      onClick={() => setPenWidth(w)}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTool === 'text' && (
            <div className="space-y-5">
              <div className="space-y-3">
                <div className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
                  글자 색상
                </div>
                <div className="flex gap-4">
                  {(['red', 'blue', 'gray'] as const).map(c => (
                    <StampColorChip
                      key={c}
                      color={c}
                      active={textColor === c}
                      onClick={() => setTextColor(c)}
                    />
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <div className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
                  글자 크기
                </div>
                <div className="flex gap-2">
                  {(['small', 'medium', 'large'] as const).map(s => (
                    <SizeChip
                      key={s}
                      size={s}
                      active={textSize === s}
                      onClick={() => setTextSize(s)}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTool === 'stamp' && (
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
                  스탬프 모양
                </div>
                <div className="flex gap-2">
                  {(['circle', 'triangle', 'square', 'star', 'diagonal'] as const).map(sh => (
                    <ShapeChip
                      key={sh}
                      shape={sh}
                      active={state.toolState.stampSettings?.shape === sh}
                      onClick={() => setStamp({ shape: sh })}
                    />
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <div className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
                  스탬프 색상
                </div>
                <div className="flex gap-4">
                  {(['red', 'blue', 'gray'] as const).map(c => (
                    <StampColorChip
                      key={c}
                      color={c}
                      active={state.toolState.stampSettings?.color === c}
                      onClick={() => setStamp({ color: c })}
                    />
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <div className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
                  스탬프 크기
                </div>
                <div className="flex gap-2">
                  {(['small', 'medium', 'large'] as const).map(sz => (
                    <SizeChip
                      key={sz}
                      size={sz}
                      active={state.toolState.stampSettings?.size === sz}
                      onClick={() => setStamp({ size: sz })}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
