'use client'

import React, { useState } from 'react'

interface WorkCardProps {
  cardId: number
  onRemove?: () => void
  showRemoveButton?: boolean
}

export const WorkCard: React.FC<WorkCardProps> = ({
  cardId,
  onRemove,
  showRemoveButton = false,
}) => {
  const [laborCount, setLaborCount] = useState(1)
  const [selectedPart, setSelectedPart] = useState('')
  const [selectedProc, setSelectedProc] = useState('')
  const [selectedArea, setSelectedArea] = useState('')
  const [customPart, setCustomPart] = useState('')
  const [customProc, setCustomProc] = useState('')
  const [customArea, setCustomArea] = useState('')
  const [block, setBlock] = useState('')
  const [dong, setDong] = useState('')
  const [ho, setHo] = useState('')

  const handleLaborDecrease = () => {
    const values = [0, 0.5, 1, 1.5, 2, 2.5, 3]
    const currentIndex = values.indexOf(laborCount)
    if (currentIndex > 0) {
      setLaborCount(values[currentIndex - 1])
    }
  }

  const handleLaborIncrease = () => {
    const values = [0, 0.5, 1, 1.5, 2, 2.5, 3]
    const currentIndex = values.indexOf(laborCount)
    if (currentIndex < values.length - 1) {
      setLaborCount(values[currentIndex + 1])
    }
  }

  const handleChipClick = (role: string, value: string) => {
    if (role === 'part') {
      setSelectedPart(selectedPart === value ? '' : value)
      if (selectedPart !== value) setCustomPart('')
    } else if (role === 'proc') {
      setSelectedProc(selectedProc === value ? '' : value)
      if (selectedProc !== value) setCustomProc('')
    } else if (role === 'area') {
      setSelectedArea(selectedArea === value ? '' : value)
      if (selectedArea !== value) setCustomArea('')
    }
  }

  return (
    <div className="card p-5 work-card" data-card-id={cardId}>
      {/* 작업 내용 기록 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <div className="q">
          작업 내용 기록 <span style={{ color: '#EA3829' }}>*</span>
        </div>
        {showRemoveButton && (
          <div className="flex items-center gap-2">
            <button className="work-action-tag" onClick={onRemove}>
              삭제
            </button>
          </div>
        )}
      </div>

      {/* 부재명 */}
      <div className="mb-4">
        <div className="text-sm text-gray-600 mb-2">부재명</div>
        <div className="absence-reason">
          <button
            className="chip"
            data-role="part"
            data-active={selectedPart === '슬라브'}
            onClick={() => handleChipClick('part', '슬라브')}
          >
            슬라브
          </button>
          <button
            className="chip"
            data-role="part"
            data-active={selectedPart === '거더'}
            onClick={() => handleChipClick('part', '거더')}
          >
            거더
          </button>
          <button
            className="chip"
            data-role="part"
            data-active={selectedPart === '기둥'}
            onClick={() => handleChipClick('part', '기둥')}
          >
            기둥
          </button>
          <input
            className="custom-input part-custom"
            placeholder="기타 직접입력"
            value={customPart}
            onChange={e => {
              setCustomPart(e.target.value)
              if (e.target.value) setSelectedPart('')
            }}
          />
        </div>
      </div>

      {/* 작업공정 */}
      <div className="mb-4">
        <div className="text-sm text-gray-600 mb-2">작업공정</div>
        <div className="absence-reason">
          <button
            className="chip"
            data-role="proc"
            data-active={selectedProc === '균열'}
            onClick={() => handleChipClick('proc', '균열')}
          >
            균열
          </button>
          <button
            className="chip"
            data-role="proc"
            data-active={selectedProc === '면'}
            onClick={() => handleChipClick('proc', '면')}
          >
            면
          </button>
          <button
            className="chip"
            data-role="proc"
            data-active={selectedProc === '마감'}
            onClick={() => handleChipClick('proc', '마감')}
          >
            마감
          </button>
          <input
            className="custom-input proc-custom"
            placeholder="기타 직접입력"
            value={customProc}
            onChange={e => {
              setCustomProc(e.target.value)
              if (e.target.value) setSelectedProc('')
            }}
          />
        </div>
      </div>

      {/* 구분선 */}
      <div
        className="border-t border-[#E6ECF4] my-6"
        style={{ width: '98%', marginLeft: 'auto', marginRight: 'auto' }}
      />

      {/* 작업구간 */}
      <div className="q mb-3">작업구간</div>
      <div className="mb-4">
        <div className="text-sm text-gray-600 mb-2">작업유형</div>
        <div className="absence-reason">
          <button
            className="chip"
            data-role="area"
            data-active={selectedArea === '지하'}
            onClick={() => handleChipClick('area', '지하')}
          >
            지하
          </button>
          <button
            className="chip"
            data-role="area"
            data-active={selectedArea === '지붕'}
            onClick={() => handleChipClick('area', '지붕')}
          >
            지붕
          </button>
          <input
            className="custom-input area-custom"
            placeholder="기타 직접입력"
            value={customArea}
            onChange={e => {
              setCustomArea(e.target.value)
              if (e.target.value) setSelectedArea('')
            }}
          />
        </div>
      </div>

      <div className="mb-4">
        <div className="text-sm text-gray-600 mb-2">블럭 / 동 / 호수</div>
        <div className="flex items-center gap-2 w-full overflow-hidden">
          <input
            className="ctl flex-1 min-w-0 block-input"
            placeholder="블럭"
            value={block}
            onChange={e => setBlock(e.target.value.toUpperCase())}
          />
          <input
            className="ctl flex-1 min-w-0 dong-input"
            placeholder="동"
            type="number"
            min="0"
            value={dong}
            onChange={e => setDong(e.target.value.replace(/[^0-9]/g, ''))}
          />
          <input
            className="ctl flex-1 min-w-0 ho-input"
            placeholder="호수"
            type="number"
            min="0"
            value={ho}
            onChange={e => setHo(e.target.value.replace(/[^0-9]/g, ''))}
          />
        </div>
      </div>

      {/* 공수(일) */}
      <div className="mb-4">
        <div className="q mb-2">
          공수(일) <span style={{ color: '#EA3829' }}>*</span>
        </div>
        <div className="qty-split3" role="group" aria-label="공수(일)">
          <button
            type="button"
            className="qbtn"
            onClick={handleLaborDecrease}
            aria-label="공수 감소"
          >
            −
          </button>
          <div className="qcenter" aria-live="polite" aria-atomic="true">
            {laborCount}
          </div>
          <button
            type="button"
            className="qbtn"
            onClick={handleLaborIncrease}
            aria-label="공수 증가"
          >
            ＋
          </button>
        </div>
      </div>
    </div>
  )
}
