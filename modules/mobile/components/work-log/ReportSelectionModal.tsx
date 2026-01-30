'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/modules/shared/ui/button'
import React, { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { WorkLog } from '../../types/work-log.types'

interface ReportSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  workLog: WorkLog
  onGenerate: (selectedItems: ReportSelectionData) => void
}

export interface ReportSelectionData {
  includeWorkLog: boolean
  selectedPhotoSheets: string[] // IDs of selected photo sheets
  selectedDrawings: string[] // IDs of selected marked drawings
}

interface availableItem {
  id: string
  title: string
  date: string
  thumbnail?: string
}

export const ReportSelectionModal: React.FC<ReportSelectionModalProps> = ({
  isOpen,
  onClose,
  workLog,
  onGenerate,
}) => {
  const [includeWorkLog, setIncludeWorkLog] = useState(true)
  const [availablePhotoSheets, setAvailablePhotoSheets] = useState<availableItem[]>([])
  const [availableDrawings, setAvailableDrawings] = useState<availableItem[]>([])
  const [selectedPhotoSheets, setSelectedPhotoSheets] = useState<string[]>([])
  const [selectedDrawings, setSelectedDrawings] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    if (isOpen && workLog.siteId) {
      fetchAvailableItems()
    }
  }, [isOpen, workLog.siteId])

  const fetchAvailableItems = async () => {
    setIsLoading(true)
    try {
      // Fetch Photo Sheets (from photo_grid_reports or similar)
      // For now, we simulate fetching related photo sheets.
      // In a real scenario, we might filtering by date or site.
      const { data: photoData, error: photoError } = await supabase
        .from('photo_grid_reports')
        .select('id, title, created_at')
        .eq('site_id', workLog.siteId)
        .order('created_at', { ascending: false })
        .limit(10) // Limit for now

      if (photoData) {
        setAvailablePhotoSheets(
          photoData.map(item => ({
            id: item.id,
            title: item.title || '사진대지',
            date: item.created_at,
          }))
        )
      }

      // Fetch Marked Drawings (markup_documents)
      // Check linkage or just list site drawings
      const { data: drawingData, error: drawingError } = await supabase
        .from('markup_documents')
        .select('id, title, created_at, blueprint_url')
        .eq('site_id', workLog.siteId)
        .order('created_at', { ascending: false })
        .limit(10)

      if (drawingData) {
        setAvailableDrawings(
          drawingData.map(item => ({
            id: item.id,
            title: item.title || '도면',
            date: item.created_at,
            thumbnail: item.blueprint_url,
          }))
        )
      }
    } catch (error) {
      console.error('Error fetching report items:', error)
      toast.error('데이터를 불러오는데 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerate = () => {
    onGenerate({
      includeWorkLog,
      selectedPhotoSheets,
      selectedDrawings,
    })
    onClose()
  }

  const toggleSelection = (id: string, list: string[], setList: (ids: string[]) => void) => {
    if (list.includes(id)) {
      setList(list.filter(item => item !== id))
    } else {
      setList([...list, id])
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-xl animate-scaleUp">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-bold">작업보고서 생성</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-4 max-h-[70vh] overflow-y-auto space-y-6">
          {/* 1. Work Log Section */}
          <div className="border rounded-xl p-4 bg-gray-50 dark:bg-gray-700/30">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="include-worklog"
                checked={includeWorkLog}
                onChange={e => setIncludeWorkLog(e.target.checked)}
                className="w-5 h-5 accent-blue-600"
              />
              <label htmlFor="include-worklog" className="font-semibold cursor-pointer">
                작업일지 본문 포함
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-1 ml-8">
              작업 내용, 인원, 자재, 메모 등이 포함됩니다.
            </p>
          </div>

          {/* 2. Photo Sheets Section */}
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <span className="text-lg">📸</span> 사진대지 선택
            </h4>
            {isLoading ? (
              <div className="text-center py-4 text-gray-400">불러오는 중...</div>
            ) : availablePhotoSheets.length === 0 ? (
              <div className="text-sm text-gray-400 p-3 text-center border rounded-lg border-dashed">
                생성된 사진대지가 없습니다.
              </div>
            ) : (
              <div className="space-y-2">
                {availablePhotoSheets.map(sheet => (
                  <div
                    key={sheet.id}
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedPhotoSheets.includes(sheet.id)
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                    onClick={() =>
                      toggleSelection(sheet.id, selectedPhotoSheets, setSelectedPhotoSheets)
                    }
                  >
                    <div>
                      <p className="font-medium text-sm">{sheet.title}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(sheet.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        selectedPhotoSheets.includes(sheet.id)
                          ? 'bg-blue-500 border-blue-500 text-white'
                          : 'border-gray-300'
                      }`}
                    >
                      {selectedPhotoSheets.includes(sheet.id) && '✓'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3. Drawings Section */}
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <span className="text-lg">📐</span> 마킹 도면 선택
            </h4>
            {isLoading ? (
              <div className="text-center py-4 text-gray-400">불러오는 중...</div>
            ) : availableDrawings.length === 0 ? (
              <div className="text-sm text-gray-400 p-3 text-center border rounded-lg border-dashed">
                저장된 마킹 도면이 없습니다.
              </div>
            ) : (
              <div className="space-y-2">
                {availableDrawings.map(drawing => (
                  <div
                    key={drawing.id}
                    className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedDrawings.includes(drawing.id)
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                    onClick={() =>
                      toggleSelection(drawing.id, selectedDrawings, setSelectedDrawings)
                    }
                  >
                    <div className="w-10 h-10 rounded bg-gray-200 overflow-hidden mr-3">
                      {drawing.thumbnail ? (
                        <img
                          src={drawing.thumbnail}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">📐</div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{drawing.title}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(drawing.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        selectedDrawings.includes(drawing.id)
                          ? 'bg-blue-500 border-blue-500 text-white'
                          : 'border-gray-300'
                      }`}
                    >
                      {selectedDrawings.includes(drawing.id) && '✓'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            취소
          </Button>
          <Button
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            onClick={handleGenerate}
            disabled={
              !includeWorkLog && selectedPhotoSheets.length === 0 && selectedDrawings.length === 0
            }
          >
            작업보고서 생성 (
            {Number(includeWorkLog) + selectedPhotoSheets.length + selectedDrawings.length}건)
          </Button>
        </div>
      </div>
    </div>
  )
}
