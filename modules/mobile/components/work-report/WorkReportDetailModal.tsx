'use client'

import React from 'react'
import { X, Calendar, User, Building, Clock, Image } from 'lucide-react'
import { WorkReport } from './types'

interface WorkReportDetailModalProps {
  report: WorkReport
  isOpen: boolean
  onClose: () => void
}

export default function WorkReportDetailModal({
  report,
  isOpen,
  onClose,
}: WorkReportDetailModalProps) {
  if (!isOpen) return null

  return (
    <>
      {/* 백드롭 */}
      <div className="modal-backdrop" onClick={onClose} />

      {/* 모달 */}
      <div className="work-report-detail-modal">
        <div className="modal-header">
          <h2 className="modal-title">작업일지 상세보기</h2>
          <button className="close-button" onClick={onClose} aria-label="닫기">
            <X size={24} />
          </button>
        </div>

        <div className="modal-content">
          {/* 현장 정보 */}
          <div className="detail-section">
            <h3 className="section-title">현장 정보</h3>
            <div className="detail-field">
              <span className="field-label">현장명</span>
              <span className="field-value">{report.siteName}</span>
            </div>
            <div className="detail-field">
              <span className="field-label">작업일자</span>
              <span className="field-value">{report.workDate}</span>
            </div>
            <div className="detail-field">
              <span className="field-label">작성자</span>
              <span className="field-value">{report.author}</span>
            </div>
          </div>

          {/* 작업 정보 */}
          <div className="detail-section">
            <h3 className="section-title">작업 정보</h3>
            <div className="detail-field">
              <span className="field-label">건물명</span>
              <span className="field-value">{report.buildingName}</span>
            </div>
            <div className="detail-field">
              <span className="field-label">위치</span>
              <span className="field-value">
                {report.block}-{report.dong}-{report.ho}
              </span>
            </div>
            <div className="detail-field">
              <span className="field-label">작업공정</span>
              <span className="field-value">{report.workProcess}</span>
            </div>
            <div className="detail-field">
              <span className="field-label">작업유형</span>
              <span className="field-value">{report.workType}</span>
            </div>
            <div className="detail-field">
              <span className="field-label">공수</span>
              <span className="field-value">{report.manHours}시간</span>
            </div>
          </div>

          {/* NPC-1000 자재 정보 */}
          <div className="detail-section">
            <h3 className="section-title">NPC-1000 자재</h3>
            <div className="npc-info">
              <div className="npc-item">
                <span className="npc-label">입고</span>
                <span className="npc-value">{report.npcData.inbound}</span>
              </div>
              <div className="npc-item">
                <span className="npc-label">사용</span>
                <span className="npc-value">{report.npcData.used}</span>
              </div>
              <div className="npc-item">
                <span className="npc-label">재고</span>
                <span className="npc-value">{report.npcData.stock}</span>
              </div>
            </div>
          </div>

          {/* 첨부 사진 */}
          {report.photos.length > 0 && (
            <div className="detail-section">
              <h3 className="section-title">첨부 사진</h3>
              <div className="photo-gallery">
                {report.photos.map((photo, idx) => (
                  <div key={idx} className="photo-thumbnail">
                    <img src={photo} alt={`작업 사진 ${idx + 1}`} className="thumbnail-image" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 첨부 문서 */}
          {(report.drawings.length > 0 || report.completionDocs.length > 0) && (
            <div className="detail-section">
              <h3 className="section-title">첨부 문서</h3>
              <div className="document-list">
                {report.drawings.map((doc, idx) => (
                  <div key={`drawing-${idx}`} className="document-item">
                    <span>도면 {idx + 1}</span>
                  </div>
                ))}
                {report.completionDocs.map((doc, idx) => (
                  <div key={`completion-${idx}`} className="document-item">
                    <span>완료 문서 {idx + 1}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
