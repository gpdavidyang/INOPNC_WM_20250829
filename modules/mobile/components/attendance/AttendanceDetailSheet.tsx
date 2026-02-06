'use client'

import { BottomSheet } from '@/modules/mobile/components/ui/BottomSheet'
import clsx from 'clsx'
import { format, parseISO } from 'date-fns'
import { ko } from 'date-fns/locale'
import React, { useMemo } from 'react'
import { AttendanceRecord } from '../../types/attendance'

interface AttendanceDetailSheetProps {
  isOpen: boolean
  onClose: () => void
  selectedDayISO: string | null
  selectedDayRecords: AttendanceRecord[]

  // Batch Edit Props
  editedRecords: Record<string, string>
  handleLaborChange: (siteId: string, value: string) => void
  handleBatchSubmit: () => void
  isInputSubmitting: boolean
  handleAddSiteNavigation: () => void

  // Legacy/Other props
  dayWorkLogs: any[]
  dayWorkLogsLoading: boolean
  dayWorkLogsError: string | null
  onWorkLogClick: (id: string) => void
}

export const AttendanceDetailSheet: React.FC<AttendanceDetailSheetProps> = ({
  isOpen,
  onClose,
  selectedDayISO,
  selectedDayRecords,
  editedRecords,
  handleLaborChange,
  handleBatchSubmit,
  isInputSubmitting,
  handleAddSiteNavigation,
  dayWorkLogs,
  dayWorkLogsLoading,
  dayWorkLogsError,
  onWorkLogClick,
}) => {
  if (!selectedDayISO) return null

  // Calculate total labor from edited values
  const totalLabor = useMemo(() => {
    return Object.values(editedRecords).reduce((sum, val) => sum + (parseFloat(val) || 0), 0)
  }, [editedRecords])

  const hasChanges = useMemo(() => {
    // Check if current edits differ from initial records
    // Ideally we should compare against original records, but strictly checking if any edit happened or just showing Save button always is fine.
    // The requirement says "Save button to commit all changes".
    // We'll show it if there are records.
    return selectedDayRecords.length > 0
  }, [selectedDayRecords])

  // Labor Options
  const LABOR_OPTIONS = ['0.5', '1.0', '1.5', '2.0', '2.5', '3.0']

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="출근 상세 정보"
      className="attendance-detail-sheet"
    >
      <div className="attendance-detail flex flex-col h-full space-y-5 pb-6">
        {/* 1. Header */}
        <header className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <p className="text-slate-500 font-bold text-[13px] mb-0.5">
              {format(parseISO(selectedDayISO), 'yyyy.MM.dd (EEE)', { locale: ko })}
            </p>
            <h2 className="text-[18px] font-black text-slate-900 tracking-tight">나의 공수 현황</h2>
          </div>
          <div className="bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 flex flex-col items-end">
            <span className="text-[10px] text-blue-500 font-bold">Total Labor</span>
            <span className="text-[18px] font-black text-blue-600 leading-none">
              {totalLabor.toFixed(1)}{' '}
              <span className="text-[10px] font-normal text-blue-400">공수</span>
            </span>
          </div>
        </header>

        {/* 2. Labor List (Edit Mode) */}
        <section className="space-y-3">
          {selectedDayRecords.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-sm bg-slate-50 rounded-lg">
              기록된 공수가 없습니다.
            </div>
          ) : (
            <ul className="space-y-3">
              {selectedDayRecords.map(record => {
                const isApproved = record.status === 'approved' || record.status === 'present'
                const currentValue = editedRecords[record.siteId || ''] ?? '1.0'

                return (
                  <li
                    key={record.id}
                    className={clsx(
                      'p-3 rounded-xl border transition-all',
                      isApproved
                        ? 'bg-slate-50 border-slate-200'
                        : 'bg-white border-blue-100 shadow-sm'
                    )}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span
                            className={clsx(
                              'w-2 h-2 rounded-full',
                              isApproved ? 'bg-blue-500' : 'bg-emerald-500'
                            )}
                          />
                          <span
                            className={clsx(
                              'text-[10px] font-bold px-1.5 py-0.5 rounded',
                              isApproved
                                ? 'bg-blue-100 text-blue-600'
                                : 'bg-emerald-100 text-emerald-600'
                            )}
                          >
                            {isApproved ? '승인완료' : '제출됨'}
                          </span>
                        </div>
                        <h3 className="font-bold text-slate-800 text-[15px] leading-tight">
                          {record.siteName}
                        </h3>
                      </div>
                    </div>

                    {/* Labor Control */}
                    <div className="flex items-center justify-between bg-slate-50 rounded-lg p-1.5">
                      {isApproved ? (
                        <div className="w-full text-center py-1.5 font-bold text-slate-500">
                          {currentValue} 공수 (수정불가)
                        </div>
                      ) : (
                        <>
                          <button
                            type="button"
                            disabled={isInputSubmitting}
                            onClick={() => {
                              const idx = LABOR_OPTIONS.indexOf(currentValue)
                              if (idx > 0)
                                handleLaborChange(record.siteId || '', LABOR_OPTIONS[idx - 1])
                            }}
                            className="w-8 h-8 flex items-center justify-center rounded-md bg-white border border-slate-200 text-slate-500 active:scale-90 transition-transform disabled:opacity-50"
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                            >
                              <path d="M5 12h14" />
                            </svg>
                          </button>

                          <div className="flex-1 text-center font-black text-slate-900 text-[16px]">
                            {currentValue}{' '}
                            <span className="text-[12px] font-normal text-slate-400">공수</span>
                          </div>

                          <button
                            type="button"
                            disabled={isInputSubmitting}
                            onClick={() => {
                              const idx = LABOR_OPTIONS.indexOf(currentValue)
                              if (idx < LABOR_OPTIONS.length - 1)
                                handleLaborChange(record.siteId || '', LABOR_OPTIONS[idx + 1])
                            }}
                            className="w-8 h-8 flex items-center justify-center rounded-md bg-white border border-slate-200 text-blue-600 active:scale-90 transition-transform disabled:opacity-50"
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                            >
                              <path d="M5 12h14M12 5v14" />
                            </svg>
                          </button>
                        </>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        {/* 3. Add Site Navigation */}
        <section>
          <button
            type="button"
            onClick={handleAddSiteNavigation}
            className="w-full py-3 rounded-xl border border-dashed border-slate-300 text-slate-500 font-bold text-[13px] flex items-center justify-center gap-2 hover:bg-slate-50 active:bg-slate-100 transition-colors"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            다른 현장 작업 추가하기
          </button>
          <p className="text-center text-[11px] text-slate-400 mt-2">
            리스트에 없는 현장은 작업일지를 새로 작성해야 합니다.
          </p>
        </section>

        {/* 4. Footer Actions */}
        <div className="pt-2 mt-auto">
          <button
            type="button"
            onClick={handleBatchSubmit}
            disabled={isInputSubmitting || selectedDayRecords.length === 0}
            className={clsx(
              'w-full h-12 rounded-xl font-bold text-[15px] shadow-sm transition-all flex items-center justify-center gap-2',
              isInputSubmitting || selectedDayRecords.length === 0
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-blue-600 text-white active:scale-[0.98] shadow-blue-200'
            )}
          >
            {isInputSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                저장 중...
              </>
            ) : (
              '변동사항 저장하기'
            )}
          </button>
        </div>
      </div>
    </BottomSheet>
  )
}
