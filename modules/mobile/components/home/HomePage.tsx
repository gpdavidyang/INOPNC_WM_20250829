'use client'

import React, { useState, useEffect } from 'react'
import { QuickMenu } from './QuickMenu'
import { NoticeSection } from './NoticeSection'
import { WorkCard } from './WorkCard'
import { toast } from 'sonner'
import '@/modules/mobile/styles/home.css'

export const HomePage: React.FC = () => {
  const [selectedSite, setSelectedSite] = useState('')
  const [workDate, setWorkDate] = useState('')
  const [workCards, setWorkCards] = useState([{ id: 1 }])
  const [uploadMode, setUploadMode] = useState('bulk')

  // Set today's date on mount
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    setWorkDate(today)
  }, [])

  const handleAddCard = () => {
    const newId = Math.max(...workCards.map(c => c.id)) + 1
    setWorkCards([...workCards, { id: newId }])
  }

  const handleRemoveCard = (cardId: number) => {
    if (workCards.length > 1) {
      setWorkCards(workCards.filter(c => c.id !== cardId))
    }
  }

  const handleReset = () => {
    if (confirm('모든 입력 내용을 초기화하시겠습니까?')) {
      setSelectedSite('')
      setWorkCards([{ id: 1 }])
      const today = new Date().toISOString().split('T')[0]
      setWorkDate(today)
      setUploadMode('bulk')
      toast.success('초기화되었습니다.')
    }
  }

  const handleSave = () => {
    if (!selectedSite) {
      toast.error('현장을 선택해주세요.')
      return
    }
    if (!workDate) {
      toast.error('작업일자를 입력해주세요.')
      return
    }

    toast.success('저장되었습니다.')
  }

  return (
    <main className="container">
      {/* 빠른메뉴 */}
      <QuickMenu />

      {/* 공지사항 */}
      <NoticeSection />

      {/* 현장 선택 */}
      <div className="card p-5 site-selection-card mb-3.5">
        <div className="q mb-3 flex items-center justify-between">
          <span>
            현장선택<span style={{ color: '#EA3829' }}>*</span>
          </span>
          <span className="text-sm text-gray-600" style={{ fontWeight: 600 }}>
            <span style={{ color: '#0068FE' }}>필수입력값(*)작성 후 저장</span>
          </span>
        </div>
        <div className="row-inline">
          <div className="field">
            <button
              className="chip"
              data-role="site"
              data-active={selectedSite === 'site1'}
              onClick={() => setSelectedSite(selectedSite === 'site1' ? '' : 'site1')}
            >
              site1
            </button>
          </div>
          <div className="field">
            <label className="select-shell" aria-label="현장 선택">
              <div className="box">{selectedSite || '선택'}</div>
              <span className="arrow" aria-hidden="true"></span>
              <select value={selectedSite} onChange={e => setSelectedSite(e.target.value)}>
                <option value="">선택</option>
                <option value="Site A">Site A</option>
                <option value="Site B">Site B</option>
                <option value="Site C">Site C</option>
              </select>
            </label>
          </div>
        </div>
      </div>

      {/* 일자/작성자 */}
      <div className="card p-5 mb-3.5">
        <div className="q mb-3 content">
          작성 정보 입력 <span style={{ color: '#EA3829' }}>*</span>
          <div className="important-tag">작성자</div>
        </div>
        <div className="row-inline fix-input-row">
          <div className="field">
            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-600">작업일자</span>
              <input
                type="date"
                className="ctl"
                value={workDate}
                onChange={e => setWorkDate(e.target.value)}
              />
            </label>
          </div>
          <div className="field">
            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-600">선택된 현장</span>
              <input
                type="text"
                className="ctl bg-gray-50"
                placeholder="현장 미선택"
                value={selectedSite}
                readOnly
              />
            </label>
          </div>
        </div>
      </div>

      {/* 작업 내용 기록 카드들 */}
      <div className="mb-3.5">
        {workCards.map((card, index) => (
          <div key={card.id} className={index > 0 ? 'mt-3' : ''}>
            <WorkCard
              cardId={card.id}
              showRemoveButton={workCards.length > 1}
              onRemove={() => handleRemoveCard(card.id)}
            />
          </div>
        ))}

        {/* 카드 추가 버튼 */}
        <div className="mt-3">
          <button
            className="work-action-tag add-card-btn"
            onClick={handleAddCard}
            style={{ marginLeft: 'auto', display: 'block' }}
          >
            추가
          </button>
        </div>
      </div>

      {/* 하단 버튼들 */}
      <div className="mb-4">
        <div className="flex gap-2">
          <button className="flex-1 btn-secondary" onClick={handleReset}>
            처음부터
          </button>
          <button className="flex-1 btn-primary" onClick={handleSave}>
            저장하기
          </button>
        </div>
      </div>

      {/* 사진업로드 */}
      <div className="card p-5">
        <div className="q mb-3 flex items-center justify-between">
          <span>사진·문서 업로드</span>
          <div className="upload-tag">↔ 버튼으로 전/후</div>
        </div>

        {/* 업로드 버튼 (칩 스타일) */}
        <div className="upload-chip-group mb-5" role="group" aria-label="업로드 선택">
          <button
            className="upload-chip"
            data-mode="pre"
            data-active={uploadMode === 'pre'}
            onClick={() => setUploadMode('pre')}
            type="button"
          >
            보수 전
          </button>
          <button
            className="upload-chip"
            data-mode="post"
            data-active={uploadMode === 'post'}
            onClick={() => setUploadMode('post')}
            type="button"
          >
            보수 후
          </button>
          <button
            className="upload-chip"
            data-mode="bulk"
            data-active={uploadMode === 'bulk'}
            onClick={() => setUploadMode('bulk')}
            type="button"
          >
            일괄
          </button>
          <button
            className="upload-chip"
            data-mode="receipt"
            data-active={uploadMode === 'receipt'}
            onClick={() => setUploadMode('receipt')}
            type="button"
          >
            영수증
          </button>
          <button
            className="upload-chip"
            data-mode="drawing"
            data-active={uploadMode === 'drawing'}
            onClick={() => setUploadMode('drawing')}
            type="button"
          >
            도면
          </button>
        </div>

        {/* Upload area placeholder */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <p className="text-gray-500">파일을 드래그하거나 클릭하여 업로드</p>
        </div>
      </div>
    </main>
  )
}
