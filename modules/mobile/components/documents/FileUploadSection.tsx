'use client'

import React, { useState } from 'react'
import { useToast } from '@/components/ui/use-toast'
import { useFileUpload } from '@/modules/mobile/hooks/useFileUpload'

interface FileUploadSectionProps {
  documentId: string
  documentTitle: string
  onUploadComplete?: (files: any[]) => void
  onUploadError?: (error: string) => void
  onClose?: () => void
}

export const FileUploadSection: React.FC<FileUploadSectionProps> = ({
  documentId,
  documentTitle,
  onUploadComplete,
  onUploadError,
  onClose,
}) => {
  const [showUpload, setShowUpload] = useState(false)
  const { toast } = useToast()

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
      console.log('Upload completed:', file)
      onUploadComplete?.(completedFiles)
    },
    onUploadError: (error, fileName) => {
      console.error('Upload error:', error, fileName)
      onUploadError?.(error)
    },
    onUploadProgress: (progress, fileName) => {
      console.log(`Upload progress for ${fileName}: ${progress}%`)
    },
  })

  const handleUploadClick = () => {
    setShowUpload(true)
  }

  const handleCloseUpload = () => {
    setShowUpload(false)
    clearFiles()
    onClose?.()
  }

  const handleSaveUploads = () => {
    if (completedFiles.length > 0) {
      toast({
        title: '업로드 완료',
        description: `${completedFiles.length}개 파일이 업로드되었습니다.`,
        variant: 'success',
      })
      onUploadComplete?.(completedFiles)
      handleCloseUpload()
    }
  }

  if (!showUpload) {
    return (
      <button className="upload-trigger-btn" onClick={handleUploadClick} disabled={isUploading}>
        <span className="upload-icon">📁</span>
        업로드
      </button>
    )
  }

  return (
    <div className="file-upload-overlay">
      <div className="file-upload-container">
        {/* Header */}
        <div className="upload-header">
          <h3>{documentTitle} 파일 업로드</h3>
          <button className="upload-close-btn" onClick={handleCloseUpload} aria-label="업로드 닫기">
            닫기
          </button>
        </div>

        {/* Drag & Drop Zone */}
        <div
          className={`drag-drop-zone ${dragActive ? 'drag-active' : ''} ${isUploading ? 'uploading' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={selectFiles}
        >
          <div className="drag-drop-content">
            <div className="drag-drop-icon">{isUploading ? '⏳' : dragActive ? '📤' : '📁'}</div>
            <div className="drag-drop-text">
              {isUploading
                ? '업로드 중...'
                : dragActive
                  ? '파일을 여기에 놓으세요'
                  : '파일을 드래그하거나 클릭하여 업로드'}
            </div>
            <div className="drag-drop-subtitle">
              {!isUploading && 'PDF, JPG, PNG, DOC 파일 (최대 10MB)'}
            </div>
          </div>
          {isUploading && (
            <div className="upload-progress-bar">
              <div className="upload-progress-fill" style={{ width: `${overallProgress}%` }} />
            </div>
          )}
        </div>

        {/* File Input (Hidden) */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          onChange={handleFileInput}
          style={{ display: 'none' }}
        />

        {/* Upload Status */}
        {uploadedFiles.length > 0 && (
          <div className="upload-status">
            <div className="status-header">
              <h4>파일 목록 ({uploadedFiles.length}개)</h4>
              {uploadedFiles.length > 0 && !isUploading && (
                <button className="clear-all-btn" onClick={clearFiles}>
                  모두 제거
                </button>
              )}
            </div>

            <div className="file-list">
              {uploadedFiles.map(file => (
                <div key={file.id} className={`file-item file-${file.status}`}>
                  <div className="file-info">
                    <div className="file-name">{file.name}</div>
                    <div className="file-details">
                      <span className="file-size">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                      <span className="file-status">
                        {file.status === 'uploading' && '업로드 중...'}
                        {file.status === 'completed' && '✅ 완료'}
                        {file.status === 'error' && '❌ 실패'}
                      </span>
                    </div>
                  </div>

                  {file.status === 'uploading' && (
                    <div className="file-progress">
                      <div className="file-progress-bar">
                        <div
                          className="file-progress-fill"
                          style={{ width: `${file.progress}%` }}
                        />
                      </div>
                      <span className="file-progress-text">{file.progress}%</span>
                    </div>
                  )}

                  {(file.status === 'completed' || file.status === 'error') && (
                    <button
                      className="file-remove-btn"
                      onClick={() => removeFile(file.id)}
                      aria-label={`${file.name} 제거`}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload Actions */}
        <div className="upload-actions">
          <div className="upload-info">
            {completedFiles.length > 0 && (
              <span className="completed-count">{completedFiles.length}개 파일 업로드 완료</span>
            )}
            {errorFiles.length > 0 && (
              <span className="error-count">{errorFiles.length}개 파일 업로드 실패</span>
            )}
          </div>

          <div className="action-buttons">
            <button
              className="action-btn action-btn-secondary"
              onClick={handleCloseUpload}
              disabled={isUploading}
            >
              취소
            </button>
            <button
              className="action-btn action-btn-primary"
              onClick={handleSaveUploads}
              disabled={completedFiles.length === 0 || isUploading}
            >
              {isUploading ? '업로드 중...' : '저장하기'}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .file-upload-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .file-upload-container {
          background: var(--card-bg, #ffffff);
          border-radius: 12px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          max-width: 500px;
          width: 100%;
          max-height: 80vh;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
        }

        .upload-trigger-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          background: var(--primary-color, #2563eb);
          color: white;
          border: none;
          border-radius: 6px;
          font-size: var(--fs-ctl, 14px);
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .upload-trigger-btn:hover {
          background: var(--primary-hover, #1d4ed8);
          transform: translateY(-1px);
        }

        .upload-trigger-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .upload-icon {
          font-size: var(--fs-body, 15px);
        }

        .upload-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px 0;
          margin-bottom: 20px;
        }

        .upload-header h3 {
          font-size: var(--fs-heading, 20px);
          font-weight: 600;
          color: var(--text-primary, #1a1a1a);
          margin: 0;
        }

        .upload-close-btn {
          background: transparent;
          border: 1px solid rgba(148, 163, 184, 0.35);
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary, #1a1a1a);
          cursor: pointer;
          padding: 6px 14px;
          border-radius: 999px;
          transition: all 0.2s ease;
        }

        .upload-close-btn:hover {
          background: var(--hover-bg, #f1f5f9);
        }

        .drag-drop-zone {
          margin: 0 24px;
          min-height: 200px;
          border: 2px dashed var(--border-color, #d1d5db);
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
          background: var(--card-bg, #f9fafb);
        }

        .drag-drop-zone:hover {
          border-color: var(--primary-color, #2563eb);
          background: var(--primary-bg, #eff6ff);
        }

        .drag-drop-zone.drag-active {
          border-color: var(--primary-color, #2563eb);
          background: var(--primary-bg, #eff6ff);
          transform: scale(1.02);
        }

        .drag-drop-zone.uploading {
          cursor: not-allowed;
          opacity: 0.8;
        }

        .drag-drop-content {
          text-align: center;
          padding: 20px;
        }

        .drag-drop-icon {
          font-size: 48px;
          margin-bottom: 16px;
          animation: float 2s ease-in-out infinite;
        }

        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-5px);
          }
        }

        .drag-drop-text {
          font-size: var(--fs-body, 15px);
          font-weight: 600;
          color: var(--text-primary, #1a1a1a);
          margin-bottom: 8px;
        }

        .drag-drop-subtitle {
          font-size: var(--fs-ctl, 14px);
          color: var(--text-secondary, #666666);
        }

        .upload-progress-bar {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: rgba(255, 255, 255, 0.3);
          border-radius: 0 0 12px 12px;
          overflow: hidden;
        }

        .upload-progress-fill {
          height: 100%;
          background: var(--primary-color, #2563eb);
          transition: width 0.3s ease;
          border-radius: 0 0 12px 12px;
        }

        .upload-status {
          margin: 20px 24px 0;
        }

        .status-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .status-header h4 {
          font-size: var(--fs-body, 15px);
          font-weight: 600;
          color: var(--text-primary, #1a1a1a);
          margin: 0;
        }

        .clear-all-btn {
          font-size: var(--fs-ctl, 14px);
          color: var(--danger-color, #dc2626);
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 4px;
          transition: all 0.2s ease;
        }

        .clear-all-btn:hover {
          background: var(--danger-bg, #fef2f2);
        }

        .file-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-height: 200px;
          overflow-y: auto;
        }

        .file-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px;
          background: var(--item-bg, #f8fafc);
          border-radius: 8px;
          border: 1px solid var(--border-color, #e2e8f0);
          transition: all 0.2s ease;
        }

        .file-item.file-completed {
          border-color: var(--success-color, #10b981);
          background: var(--success-bg, #ecfdf5);
        }

        .file-item.file-error {
          border-color: var(--danger-color, #dc2626);
          background: var(--danger-bg, #fef2f2);
        }

        .file-info {
          flex: 1;
          min-width: 0;
        }

        .file-name {
          font-size: var(--fs-body, 15px);
          font-weight: 500;
          color: var(--text-primary, #1a1a1a);
          margin-bottom: 4px;
          word-break: break-all;
        }

        .file-details {
          display: flex;
          gap: 12px;
          font-size: var(--fs-tiny, 12px);
          color: var(--text-secondary, #666666);
        }

        .file-progress {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-left: 12px;
        }

        .file-progress-bar {
          width: 60px;
          height: 4px;
          background: var(--border-color, #e2e8f0);
          border-radius: 2px;
          overflow: hidden;
        }

        .file-progress-fill {
          height: 100%;
          background: var(--primary-color, #2563eb);
          transition: width 0.3s ease;
        }

        .file-progress-text {
          font-size: var(--fs-tiny, 12px);
          color: var(--text-secondary, #666666);
          min-width: 30px;
        }

        .file-remove-btn {
          background: none;
          border: none;
          color: var(--text-secondary, #666666);
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          font-size: var(--fs-ctl, 14px);
          transition: all 0.2s ease;
        }

        .file-remove-btn:hover {
          background: var(--danger-bg, #fef2f2);
          color: var(--danger-color, #dc2626);
        }

        .upload-actions {
          padding: 20px 24px;
          border-top: 1px solid var(--border-color, #e2e8f0);
          margin-top: 20px;
        }

        .upload-info {
          display: flex;
          gap: 16px;
          margin-bottom: 16px;
          font-size: var(--fs-ctl, 14px);
        }

        .completed-count {
          color: var(--success-color, #10b981);
        }

        .error-count {
          color: var(--danger-color, #dc2626);
        }

        .action-buttons {
          display: flex;
          gap: 12px;
        }

        .action-btn {
          flex: 1;
          padding: 12px 16px;
          border: none;
          border-radius: 8px;
          font-size: var(--fs-ctl, 14px);
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .action-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .action-btn-primary {
          background: var(--primary-color, #2563eb);
          color: white;
        }

        .action-btn-primary:hover:not(:disabled) {
          background: var(--primary-hover, #1d4ed8);
        }

        .action-btn-secondary {
          background: var(--secondary-bg, #f1f5f9);
          color: var(--text-primary, #1a1a1a);
          border: 1px solid var(--border-color, #e2e8f0);
        }

        .action-btn-secondary:hover:not(:disabled) {
          background: var(--secondary-hover, #e2e8f0);
        }

        /* Dark theme support */
        [data-theme='dark'] .file-upload-container {
          background: var(--card-bg-dark, #1e293b);
        }

        [data-theme='dark'] .upload-header h3 {
          color: var(--text-primary-dark, #f1f5f9);
        }

        [data-theme='dark'] .drag-drop-zone {
          background: var(--card-bg-dark, #0f172a);
          border-color: var(--border-color-dark, #334155);
        }

        [data-theme='dark'] .drag-drop-text {
          color: var(--text-primary-dark, #f1f5f9);
        }

        [data-theme='dark'] .file-item {
          background: var(--item-bg-dark, #0f172a);
          border-color: var(--border-color-dark, #334155);
        }

        [data-theme='dark'] .file-name {
          color: var(--text-primary-dark, #f1f5f9);
        }

        /* Mobile responsive */
        @media (max-width: 640px) {
          .file-upload-overlay {
            padding: 10px;
          }

          .file-upload-container {
            max-height: 90vh;
          }

          .upload-header {
            padding: 16px 20px 0;
          }

          .drag-drop-zone {
            margin: 0 20px;
            min-height: 160px;
          }

          .drag-drop-content {
            padding: 16px;
          }

          .drag-drop-icon {
            font-size: 40px;
            margin-bottom: 12px;
          }

          .upload-status {
            margin: 16px 20px 0;
          }

          .upload-actions {
            padding: 16px 20px;
          }

          .action-buttons {
            flex-direction: column;
          }

          .file-details {
            flex-direction: column;
            gap: 4px;
          }

          .file-progress {
            margin-left: 0;
            margin-top: 8px;
          }

          .file-progress-bar {
            flex: 1;
            width: auto;
          }
        }
      `}</style>
    </div>
  )
}
