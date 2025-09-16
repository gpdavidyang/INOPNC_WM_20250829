'use client'

import React, { useCallback } from 'react'
import { Modal } from '@/modules/mobile/components/common/Modal'
import { useFileUpload } from '@/modules/mobile/hooks/useFileUpload'
import { useUploadHistory } from '@/modules/mobile/hooks/useLocalStorage'

interface DocumentUploadModalProps {
  isOpen: boolean
  onClose: () => void
  documentId?: string
  documentTitle?: string
  onUploadComplete?: (files: any[]) => void
}

export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  isOpen,
  onClose,
  documentId,
  documentTitle,
  onUploadComplete,
}) => {
  const { addUploadRecord } = useUploadHistory()

  const {
    uploadedFiles,
    isUploading,
    dragActive,
    overallProgress,
    handleFileInput,
    handleDrag,
    handleDrop,
    selectFiles,
    removeFile,
    clearFiles,
    fileInputRef,
    canUploadMore,
    completedFiles,
    errorFiles,
    uploadingFiles,
  } = useFileUpload({
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'],
    maxFiles: 5,
    onUploadComplete: file => {
      // 업로드 기록 추가
      addUploadRecord({
        documentId: documentId || 'unknown',
        fileName: file.name,
        fileSize: file.size,
        success: true,
      })
    },
    onUploadError: (error, fileName) => {
      // 실패 기록 추가
      addUploadRecord({
        documentId: documentId || 'unknown',
        fileName,
        fileSize: 0,
        success: false,
      })
      console.error('Upload error:', error, fileName)
    },
  })

  const handleComplete = useCallback(() => {
    if (completedFiles.length > 0) {
      onUploadComplete?.(completedFiles)
    }
    clearFiles()
    onClose()
  }, [completedFiles, onUploadComplete, clearFiles, onClose])

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`파일 업로드${documentTitle ? ` - ${documentTitle}` : ''}`}
      size="medium"
      showCloseButton={true}
      closeOnBackdropClick={!isUploading}
      closeOnEscape={!isUploading}
    >
      <div className="document-upload-content">
        {/* 파일 입력 */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          onChange={handleFileInput}
          style={{ display: 'none' }}
        />

        {/* 드래그 앤 드롭 영역 */}
        <div
          className={`upload-dropzone ${dragActive ? 'drag-active' : ''} ${
            !canUploadMore ? 'disabled' : ''
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={canUploadMore ? selectFiles : undefined}
        >
          <div className="dropzone-content">
            <div className="dropzone-icon">{dragActive ? '📤' : '📁'}</div>
            <div className="dropzone-text">
              {canUploadMore ? (
                <>
                  <p className="dropzone-primary">파일을 여기에 드래그하거나 클릭하여 업로드</p>
                  <p className="dropzone-secondary">
                    PDF, JPG, PNG, DOC 파일만 업로드 가능 (최대 10MB)
                  </p>
                </>
              ) : (
                <p className="dropzone-disabled">최대 5개의 파일까지만 업로드할 수 있습니다.</p>
              )}
            </div>
          </div>
        </div>

        {/* 업로드 파일 목록 */}
        {uploadedFiles.length > 0 && (
          <div className="uploaded-files">
            <div className="files-header">
              <h4>업로드 파일 ({uploadedFiles.length}/5)</h4>
              {uploadedFiles.length > 0 && !isUploading && (
                <button className="clear-all-btn" onClick={clearFiles} type="button">
                  전체 삭제
                </button>
              )}
            </div>

            <div className="files-list">
              {uploadedFiles.map(file => (
                <div key={file.id} className={`file-item ${file.status}`}>
                  <div className="file-info">
                    <div className="file-name">{file.name}</div>
                    <div className="file-details">
                      <span className="file-size">{formatFileSize(file.size)}</span>
                      <span className="file-status">
                        {file.status === 'uploading' && `${file.progress}%`}
                        {file.status === 'completed' && '✅ 완료'}
                        {file.status === 'error' && '❌ 실패'}
                      </span>
                    </div>
                  </div>

                  {file.status === 'uploading' && (
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${file.progress}%` }} />
                    </div>
                  )}

                  {file.status !== 'uploading' && (
                    <button
                      className="remove-file-btn"
                      onClick={() => removeFile(file.id)}
                      type="button"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* 전체 진행률 */}
            {isUploading && (
              <div className="overall-progress">
                <div className="progress-info">
                  <span>전체 업로드 진행률</span>
                  <span>{Math.round(overallProgress)}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${overallProgress}%` }} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* 업로드 통계 */}
        {uploadedFiles.length > 0 && !isUploading && (
          <div className="upload-stats">
            <div className="stats-item">
              <span className="stats-label">완료:</span>
              <span className="stats-value">{completedFiles.length}개</span>
            </div>
            <div className="stats-item">
              <span className="stats-label">실패:</span>
              <span className="stats-value">{errorFiles.length}개</span>
            </div>
            <div className="stats-item">
              <span className="stats-label">총 크기:</span>
              <span className="stats-value">
                {formatFileSize(completedFiles.reduce((total, file) => total + file.size, 0))}
              </span>
            </div>
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="upload-actions">
          {!isUploading && (
            <>
              {canUploadMore && (
                <button
                  className="action-btn action-btn-secondary"
                  onClick={selectFiles}
                  type="button"
                >
                  <span className="btn-icon">📁</span>
                  파일 선택
                </button>
              )}
              {completedFiles.length > 0 && (
                <button
                  className="action-btn action-btn-primary"
                  onClick={handleComplete}
                  type="button"
                >
                  <span className="btn-icon">✅</span>
                  업로드 완료
                </button>
              )}
            </>
          )}

          {isUploading && (
            <div className="uploading-status">
              <div className="loading-spinner"></div>
              <span>업로드 중... ({uploadingFiles.length}개 파일)</span>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .document-upload-content {
          display: flex;
          flex-direction: column;
          gap: 20px;
          min-height: 300px;
        }

        .upload-dropzone {
          border: 2px dashed var(--border-color, #e0e0e0);
          border-radius: 12px;
          padding: 40px 20px;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
          background: var(--card-bg, #f9fafb);
        }

        .upload-dropzone:hover:not(.disabled) {
          border-color: var(--primary-color, #2563eb);
          background: var(--primary-bg, #eff6ff);
        }

        .upload-dropzone.drag-active {
          border-color: var(--primary-color, #2563eb);
          background: var(--primary-bg, #eff6ff);
          transform: scale(1.02);
        }

        .upload-dropzone.disabled {
          opacity: 0.6;
          cursor: not-allowed;
          border-style: solid;
        }

        .dropzone-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .dropzone-icon {
          font-size: 48px;
          margin-bottom: 8px;
        }

        .dropzone-primary {
          font-size: 16px;
          font-weight: 600;
          color: var(--text-primary, #1a1a1a);
          margin: 0;
        }

        .dropzone-secondary {
          font-size: 14px;
          color: var(--text-secondary, #666666);
          margin: 0;
        }

        .dropzone-disabled {
          font-size: 14px;
          color: var(--text-muted, #9ca3af);
          margin: 0;
        }

        .uploaded-files {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .files-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .files-header h4 {
          font-size: 16px;
          font-weight: 600;
          color: var(--text-primary, #1a1a1a);
          margin: 0;
        }

        .clear-all-btn {
          background: none;
          border: none;
          color: var(--danger-color, #dc2626);
          font-size: 14px;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 4px;
          transition: background 0.2s ease;
        }

        .clear-all-btn:hover {
          background: var(--danger-bg, #fef2f2);
        }

        .files-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-height: 200px;
          overflow-y: auto;
        }

        .file-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: var(--card-bg, #ffffff);
          border: 1px solid var(--border-color, #e0e0e0);
          border-radius: 8px;
          position: relative;
        }

        .file-item.uploading {
          border-color: var(--primary-color, #2563eb);
        }

        .file-item.completed {
          border-color: var(--success-color, #16a34a);
        }

        .file-item.error {
          border-color: var(--danger-color, #dc2626);
          background: var(--danger-bg, #fef2f2);
        }

        .file-info {
          flex: 1;
          min-width: 0;
        }

        .file-name {
          font-size: 14px;
          font-weight: 500;
          color: var(--text-primary, #1a1a1a);
          truncate: ellipsis;
          white-space: nowrap;
          overflow: hidden;
        }

        .file-details {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 4px;
        }

        .file-size {
          font-size: 12px;
          color: var(--text-secondary, #666666);
        }

        .file-status {
          font-size: 12px;
          font-weight: 500;
        }

        .progress-bar {
          height: 4px;
          background: var(--progress-bg, #f1f5f9);
          border-radius: 2px;
          overflow: hidden;
          margin-top: 8px;
        }

        .progress-fill {
          height: 100%;
          background: var(--primary-color, #2563eb);
          transition: width 0.3s ease;
          border-radius: 2px;
        }

        .remove-file-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: background 0.2s ease;
          font-size: 16px;
        }

        .remove-file-btn:hover {
          background: var(--danger-bg, #fef2f2);
        }

        .overall-progress {
          padding: 16px;
          background: var(--progress-card-bg, #f8fafc);
          border-radius: 8px;
          border: 1px solid var(--border-color, #e0e0e0);
        }

        .progress-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary, #1a1a1a);
        }

        .upload-stats {
          display: flex;
          gap: 16px;
          padding: 16px;
          background: var(--stats-bg, #f8fafc);
          border-radius: 8px;
          border: 1px solid var(--border-color, #e0e0e0);
        }

        .stats-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex: 1;
        }

        .stats-label {
          font-size: 12px;
          color: var(--text-secondary, #666666);
          margin-bottom: 4px;
        }

        .stats-value {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary, #1a1a1a);
        }

        .upload-actions {
          display: flex;
          gap: 12px;
          align-items: center;
          padding-top: 16px;
          border-top: 1px solid var(--border-color, #e0e0e0);
        }

        .action-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 16px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .action-btn-primary {
          background: var(--primary-color, #2563eb);
          color: white;
        }

        .action-btn-primary:hover {
          background: var(--primary-hover, #1d4ed8);
        }

        .action-btn-secondary {
          background: var(--secondary-bg, #f1f5f9);
          color: var(--text-primary, #1a1a1a);
          border: 1px solid var(--border-color, #e0e0e0);
        }

        .action-btn-secondary:hover {
          background: var(--secondary-hover, #e2e8f0);
        }

        .btn-icon {
          font-size: 16px;
        }

        .uploading-status {
          display: flex;
          align-items: center;
          gap: 12px;
          color: var(--text-secondary, #666666);
          font-size: 14px;
        }

        .loading-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid var(--border-color, #e0e0e0);
          border-top-color: var(--primary-color, #2563eb);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        /* Dark theme */
        [data-theme='dark'] .files-header h4,
        [data-theme='dark'] .dropzone-primary,
        [data-theme='dark'] .file-name,
        [data-theme='dark'] .progress-info,
        [data-theme='dark'] .stats-value {
          color: var(--text-primary-dark, #f1f5f9);
        }

        [data-theme='dark'] .upload-dropzone {
          background: var(--card-bg-dark, #1e293b);
          border-color: var(--border-color-dark, #334155);
        }

        [data-theme='dark'] .file-item {
          background: var(--card-bg-dark, #1e293b);
          border-color: var(--border-color-dark, #334155);
        }

        [data-theme='dark'] .upload-stats,
        [data-theme='dark'] .overall-progress {
          background: var(--card-bg-dark, #1e293b);
          border-color: var(--border-color-dark, #334155);
        }

        /* Mobile responsive */
        @media (max-width: 640px) {
          .upload-stats {
            flex-direction: column;
            gap: 12px;
          }

          .stats-item {
            flex-direction: row;
            justify-content: space-between;
          }

          .upload-actions {
            flex-direction: column;
          }

          .action-btn {
            width: 100%;
          }

          .file-details {
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;
          }
        }
      `}</style>
    </Modal>
  )
}
