'use client'

import React, { useEffect, useMemo } from 'react'
import { useToast } from '@/components/ui/use-toast'
import { MAP_APP_LABELS, openSmartMap, SmartMapResult } from '@/lib/external-apps'

export interface SiteManagerContact {
  role?: string | null
  name?: string | null
  phone?: string | null
}

export interface SiteContactItem {
  label: string
  contact?: SiteManagerContact
}

export interface SiteInfoLike {
  id: string
  name: string
  customer_company?: { company_name?: string | null } | null
  address?: { full_address?: string | null } | null
  accommodation?: { full_address?: string | null } | null
  managers?: SiteManagerContact[]
}

export interface SiteInfoDocumentFile {
  id?: string | number
  name?: string | null
  date?: string | null
  uploader?: string | null
  [key: string]: any
}

export interface SiteInfoDocumentSection {
  key: string
  title: string
  files: SiteInfoDocumentFile[]
  emptyText?: string
  onClick?: () => void
  onPreview?: (file: SiteInfoDocumentFile) => void
}

interface SiteInfoWorkDetails {
  memberName?: string | null
  workProcess?: string | null
  workType?: string | null
  blockInfo?: string | null
}

interface SiteInfoUploadSummary {
  photoCount?: number
  drawingCount?: number
  ptwCount?: number
}

interface SiteInfoActionButton {
  label: string
  variant?: 'primary' | 'ghost' | 'outline'
  onClick?: () => void
}

export const buildSiteContactItems = (
  managers?: SiteManagerContact[] | null
): SiteContactItem[] => {
  if (!managers || !managers.length) {
    return [
      { label: '담당자', contact: undefined },
      { label: '안전', contact: undefined },
    ]
  }

  const siteManager = managers.find(m => m?.role === 'construction_manager')
  const safetyManager = managers.find(m => m?.role === 'safety_manager')
  const others = managers.filter(
    m => m?.role !== 'construction_manager' && m?.role !== 'safety_manager'
  )

  const items: SiteContactItem[] = [
    { label: '담당자', contact: siteManager },
    { label: '안전', contact: safetyManager },
  ]

  others.forEach(manager => items.push({ label: '담당', contact: manager }))
  return items
}

interface SiteInfoBottomSheetProps {
  open: boolean
  site: SiteInfoLike | null
  dateLabel: string
  workerCount?: number | null
  contactItems?: SiteContactItem[]
  accommodationAddress?: string
  workDetails?: SiteInfoWorkDetails
  uploadSummary?: SiteInfoUploadSummary
  documents?: SiteInfoDocumentSection[]
  actionButtons?: SiteInfoActionButton[]
  onClose?: () => void
  onCopy?: (value: string, message: string) => void
  onOpenMap?: (value?: string | null) => void
  onCallContact?: (phone?: string) => void
  onOpenOtherDocuments?: () => void
  onOpenWorklogList?: () => void
}

export const SiteInfoBottomSheet: React.FC<SiteInfoBottomSheetProps> = ({
  open,
  site,
  dateLabel,
  workerCount,
  contactItems,
  accommodationAddress,
  workDetails,
  uploadSummary,
  documents,
  actionButtons,
  onClose,
  onCopy,
  onOpenMap,
  onCallContact,
  onOpenOtherDocuments,
  onOpenWorklogList,
}) => {
  const { toast } = useToast()

  useEffect(() => {
    if (!open) return

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose?.()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = prevOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onClose])

  const copyHandler = (value?: string | null, message?: string) => {
    if (!value) return
    if (onCopy) {
      onCopy(value, message || '')
      return
    }

    navigator.clipboard
      ?.writeText(value)
      .then(() => {
        toast({
          title: '복사 되었습니다.',
          description: message || '선택한 내용을 복사했습니다.',
          variant: 'success',
        })
      })
      .catch(() => {
        toast({ title: '복사에 실패했습니다.', variant: 'destructive' })
      })
  }

  const showMapResultToast = (result: SmartMapResult) => {
    if (!result.success) {
      toast({
        title: '지도 앱을 열 수 없습니다.',
        description: '주소를 복사해 직접 검색해주세요.',
        variant: 'destructive',
      })
      return
    }

    if (result.usedApp === 'web') {
      toast({
        title: '웹으로 이동합니다.',
        description: '설치된 지도 앱이 없어 브라우저에서 검색합니다.',
        variant: 'info',
      })
      return
    }

    if (result.failedApps.length && result.usedApp !== 'web') {
      const previous = result.failedApps[result.failedApps.length - 1]
      toast({
        title: `${MAP_APP_LABELS[result.usedApp]}으로 이동합니다.`,
        description: `${MAP_APP_LABELS[previous]} 실행에 실패하여 자동으로 전환했습니다.`,
        variant: 'info',
      })
    }
  }

  const mapHandler = async (address?: string | null) => {
    if (!address) return
    if (onOpenMap) {
      onOpenMap(address)
      return
    }
    try {
      const result = await openSmartMap(address)
      showMapResultToast(result)
    } catch (error) {
      console.error('[SiteInfoBottomSheet] open map failed', error)
      toast({
        title: '지도 앱을 열 수 없습니다.',
        description: '잠시 후 다시 시도해주세요.',
        variant: 'destructive',
      })
    }
  }

  const handleAddressKeyDown = (
    event: React.KeyboardEvent<HTMLSpanElement>,
    value?: string | null
  ) => {
    if (!value) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      void mapHandler(value)
    }
  }

  const callHandler = (phone?: string | null) => {
    if (!phone) return
    if (onCallContact) {
      onCallContact(phone)
      return
    }
    if (typeof window !== 'undefined') {
      window.location.href = `tel:${phone}`
    }
  }

  const openDocsHandler = () => {
    if (onOpenOtherDocuments) {
      onOpenOtherDocuments()
      return
    }
    onClose?.()
    if (typeof window !== 'undefined') {
      window.location.href = '/mobile/documents'
    }
  }

  const openWorklogHandler = () => {
    if (onOpenWorklogList) {
      onOpenWorklogList()
      return
    }
    onClose?.()
    if (typeof window !== 'undefined') {
      window.location.href = '/mobile/worklog'
    }
  }

  const derivedContacts = useMemo(() => {
    if (contactItems && contactItems.length) return contactItems
    return buildSiteContactItems(site?.managers)
  }, [contactItems, site?.managers])

  const accommodation =
    accommodationAddress?.trim() || site?.accommodation?.full_address?.trim() || ''
  const address = site?.address?.full_address?.trim() || ''
  const workerLabel =
    workerCount != null && Number.isFinite(workerCount)
      ? `${Number(workerCount).toLocaleString()}명`
      : '-'

  const hasWorkDetails = Boolean(
    workDetails?.memberName ||
      workDetails?.workProcess ||
      workDetails?.workType ||
      workDetails?.blockInfo
  )

  const hasUploadSummary =
    uploadSummary &&
    (uploadSummary.photoCount != null ||
      uploadSummary.drawingCount != null ||
      uploadSummary.ptwCount != null)

  const resolvedDocuments = (documents || []).filter(section => !!section)

  const resolvedActions: SiteInfoActionButton[] = useMemo(() => {
    if (actionButtons && actionButtons.length > 0) {
      return actionButtons
    }
    const defaults: SiteInfoActionButton[] = []
    if (onOpenOtherDocuments) {
      defaults.push({ label: '기타서류업로드', variant: 'ghost', onClick: openDocsHandler })
    }
    if (onOpenWorklogList) {
      defaults.push({ label: '작업일지목록', variant: 'primary', onClick: openWorklogHandler })
    }
    return defaults
  }, [actionButtons, openDocsHandler, openWorklogHandler])

  if (!open || !site) {
    return null
  }

  return (
    <div className="site-info-bottomsheet" role="dialog" aria-modal="true">
      <div className="site-info-bottomsheet-overlay" onClick={onClose} />
      <div className="site-info-bottomsheet-content">
        <div className="site-info-bottomsheet-header">
          <h3 className="site-info-bottomsheet-title">{site.name}</h3>
          <button type="button" className="site-info-bottomsheet-close" onClick={onClose}>
            닫기
          </button>
        </div>

        <div className="site-info-sheet-summary" role="group" aria-label="현장 요약">
          <div className="site-info-sheet-summary-row">
            <span className="site-info-sheet-summary-label">소속</span>
            <span className="site-info-sheet-summary-value">
              {site.customer_company?.company_name?.trim() || '미배정'}
            </span>
          </div>
          <div className="site-info-sheet-summary-row">
            <span className="site-info-sheet-summary-label">현장명</span>
            <span className="site-info-sheet-summary-value">{site.name}</span>
          </div>
          <div className="site-info-sheet-summary-row">
            <span className="site-info-sheet-summary-label">작업일</span>
            <span className="site-info-sheet-summary-value">{dateLabel}</span>
          </div>
          <div className="site-info-sheet-summary-row">
            <span className="site-info-sheet-summary-label">출력인원</span>
            <span className="site-info-sheet-summary-value">{workerLabel}</span>
          </div>
        </div>

        {derivedContacts.length > 0 && (
          <div className="site-info-sheet-section" role="group" aria-label="담당자 정보">
            {derivedContacts.map(item => {
              const phone = item.contact?.phone?.trim() || ''
              const isUnassigned =
                !item.contact?.name ||
                item.contact.name.trim() === '' ||
                item.contact.name.trim() === '미지정'
              return (
                <div
                  className="site-info-sheet-contact"
                  key={`${item.label}-${phone || item.contact?.name || 'empty'}`}
                >
                  <div className="site-info-sheet-contact-left">
                    <span className="site-info-sheet-contact-label">{item.label}</span>
                    <span className="site-info-sheet-contact-name">
                      {item.contact?.name || '-'}
                    </span>
                  </div>
                  <div className="site-info-sheet-contact-actions">
                    <span className="site-info-sheet-contact-phone">{phone || '-'}</span>
                    <button
                      type="button"
                      className="site-info-sheet-contact-call"
                      onClick={() => callHandler(phone)}
                      disabled={!phone || isUnassigned}
                    >
                      전화
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className="site-info-sheet-section" role="group" aria-label="주소 정보">
          <div className="site-info-sheet-address-row">
            <div className="site-info-sheet-address-meta">
              <span className="site-info-sheet-address-label">주소</span>
              <span
                className="site-info-sheet-address-value"
                role={address ? 'button' : undefined}
                tabIndex={address ? 0 : -1}
                aria-disabled={!address}
                aria-label={address ? '주소를 지도 앱으로 열기' : undefined}
                onClick={address ? () => void mapHandler(address) : undefined}
                onKeyDown={event => handleAddressKeyDown(event, address)}
              >
                {address || '-'}
              </span>
            </div>
            <div className="site-info-sheet-address-actions row">
              <button
                type="button"
                onClick={() => copyHandler(address, '현장 주소를 복사했습니다.')}
                disabled={!address}
              >
                복사
              </button>
              <button type="button" onClick={() => void mapHandler(address)} disabled={!address}>
                T맵
              </button>
            </div>
          </div>

          <div className="site-info-sheet-address-row">
            <div className="site-info-sheet-address-meta">
              <span className="site-info-sheet-address-label">숙소</span>
              <span
                className="site-info-sheet-address-value"
                role={accommodation ? 'button' : undefined}
                tabIndex={accommodation ? 0 : -1}
                aria-disabled={!accommodation}
                aria-label={accommodation ? '숙소를 지도 앱으로 열기' : undefined}
                onClick={accommodation ? () => void mapHandler(accommodation) : undefined}
                onKeyDown={event => handleAddressKeyDown(event, accommodation)}
              >
                {accommodation || '미지정'}
              </span>
            </div>
            <div className="site-info-sheet-address-actions row">
              <button
                type="button"
                onClick={() => copyHandler(accommodation, '숙소 주소를 복사했습니다.')}
                disabled={!accommodation}
              >
                복사
              </button>
              <button
                type="button"
                onClick={() => void mapHandler(accommodation)}
                disabled={!accommodation}
              >
                T맵
              </button>
            </div>
          </div>
        </div>

        {hasWorkDetails && (
          <div className="site-info-sheet-section" role="group" aria-label="작업 정보">
            <div className="site-info-sheet-grid">
              <div className="site-info-sheet-kv">
                <span className="site-info-sheet-kv-label">부재명</span>
                <span className="site-info-sheet-kv-value">{workDetails?.memberName || '-'}</span>
              </div>
              <div className="site-info-sheet-kv">
                <span className="site-info-sheet-kv-label">작업공정</span>
                <span className="site-info-sheet-kv-value">{workDetails?.workProcess || '-'}</span>
              </div>
              <div className="site-info-sheet-kv">
                <span className="site-info-sheet-kv-label">작업유형</span>
                <span className="site-info-sheet-kv-value">{workDetails?.workType || '-'}</span>
              </div>
              <div className="site-info-sheet-kv">
                <span className="site-info-sheet-kv-label">블럭/동/층</span>
                <span className="site-info-sheet-kv-value">{workDetails?.blockInfo || '-'}</span>
              </div>
            </div>
          </div>
        )}

        {hasUploadSummary && (
          <div className="site-info-sheet-section" role="group" aria-label="업로드 현황">
            <div className="site-info-sheet-upload">
              <div className="site-info-sheet-upload-item">
                <span className="upload-label">사진 업로드</span>
                <span className="upload-value">{uploadSummary?.photoCount ?? 0}건</span>
              </div>
              <div className="site-info-sheet-upload-item">
                <span className="upload-label">도면 업로드</span>
                <span className="upload-value">{uploadSummary?.drawingCount ?? 0}건</span>
              </div>
              <div className="site-info-sheet-upload-item">
                <span className="upload-label">PTW</span>
                <span className="upload-value">{uploadSummary?.ptwCount ?? 0}건</span>
              </div>
            </div>
          </div>
        )}

        {!!resolvedDocuments.length && (
          <div className="site-info-sheet-section" role="group" aria-label="문서">
            <div className="site-info-sheet-documents">
              {resolvedDocuments.map(section => (
                <div key={section.key} className="document-card">
                  <button
                    type="button"
                    className="document-card-button"
                    onClick={section.onClick}
                    disabled={!section.onClick}
                  >
                    {section.title}
                  </button>
                  <div className="document-card-list">
                    {section.files.length ? (
                      section.files.map(file => (
                        <div
                          key={file.id ?? `${section.key}-${file.name}`}
                          className="document-card-item"
                        >
                          <div className="document-card-info">
                            <div className="document-card-name">{file.name || '문서'}</div>
                            <div className="document-card-meta">
                              {file.date ? new Date(file.date).toLocaleDateString('ko-KR') : '-'}
                              {file.uploader ? ` · ${file.uploader}` : ''}
                            </div>
                          </div>
                          {section.onPreview ? (
                            <button
                              type="button"
                              className="document-card-view"
                              onClick={() => section.onPreview?.(file)}
                            >
                              보기
                            </button>
                          ) : null}
                        </div>
                      ))
                    ) : (
                      <div className="document-card-empty">
                        {section.emptyText || '등록된 문서가 없습니다.'}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!!resolvedActions.length && (
          <div className="site-info-sheet-actions" role="group" aria-label="현장 관련 작업">
            {resolvedActions.map(action => {
              const variant = action.variant || 'ghost'
              return (
                <button
                  type="button"
                  key={action.label}
                  className={variant}
                  onClick={action.onClick}
                  disabled={!action.onClick}
                >
                  {action.label}
                </button>
              )
            })}
          </div>
        )}
      </div>

      <style jsx>{`
        .site-info-bottomsheet {
          position: fixed;
          inset: 0;
          z-index: 1300;
          display: flex;
          align-items: flex-end;
          justify-content: center;
        }
        .site-info-bottomsheet-overlay {
          position: absolute;
          inset: 0;
          background: rgba(15, 23, 42, 0.45);
        }
        .site-info-bottomsheet-content {
          position: relative;
          width: min(640px, 100%);
          background: var(--card, #ffffff);
          border-radius: 20px 20px 0 0;
          padding: 14px 14px calc(18px + env(safe-area-inset-bottom, 0px));
          box-shadow: 0 -18px 48px rgba(15, 23, 42, 0.18);
          max-height: 90vh;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .site-info-bottomsheet-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .site-info-bottomsheet-title {
          font-size: 20px;
          font-weight: 800;
          margin: 0;
          color: #0f172a;
        }
        .site-info-bottomsheet-close {
          border: 1px solid #d8ddef;
          background: #f6f9ff;
          color: #1a254f;
          font-size: 14px;
          font-weight: 700;
          padding: 6px 14px;
          border-radius: 12px;
          cursor: pointer;
          line-height: 1.2;
          transition: all 0.2s ease;
        }
        .site-info-bottomsheet-close:hover {
          background: #e9eefa;
        }

        .site-info-sheet-summary {
          background: #f6f9ff;
          border: 1px solid #e4e8f4;
          border-radius: 12px;
          padding: 10px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .site-info-sheet-summary-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          font-size: 15px;
        }
        .site-info-sheet-summary-label {
          color: #6b7280;
          font-weight: 600;
        }
        .site-info-sheet-summary-value {
          color: #111c44;
          font-weight: 700;
          text-align: right;
        }

        .site-info-sheet-section {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .site-info-sheet-contact {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 6px;
          padding: 6px 0;
        }
        .site-info-sheet-contact-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .site-info-sheet-contact-label {
          font-size: 13px;
          color: #6b7280;
          font-weight: 600;
        }
        .site-info-sheet-contact-name {
          font-size: 15px;
          font-weight: 700;
          color: #0f172a;
        }
        .site-info-sheet-contact-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .site-info-sheet-contact-phone {
          font-size: 14px;
          color: #111c44;
          min-width: 90px;
          text-align: right;
        }
        .site-info-sheet-contact-call {
          border: 1px solid #d4dcf0;
          background: #ffffff;
          color: #1a254f;
          font-weight: 700;
          border-radius: 10px;
          padding: 6px 12px;
        }
        .site-info-sheet-contact-call:disabled {
          opacity: 0.4;
        }

        .site-info-sheet-address-row {
          display: flex;
          flex-direction: column;
          gap: 3px;
          padding: 6px 0;
        }
        .site-info-sheet-address-meta {
          display: flex;
          justify-content: space-between;
          gap: 12px;
        }
        .site-info-sheet-address-label {
          color: #6b7280;
          font-weight: 600;
        }
        .site-info-sheet-address-value {
          color: #111c44;
          font-weight: 600;
          text-align: right;
          flex: 1;
        }
        .site-info-sheet-address-actions {
          display: flex;
          gap: 8px;
        }
        .site-info-sheet-address-actions.row {
          flex-direction: row;
          justify-content: flex-end;
        }
        .site-info-sheet-address-actions.row button {
          flex: 0 0 auto;
          width: auto;
          min-width: auto;
          padding: 6px 12px;
        }
        .site-info-sheet-address-actions button {
          border: 1px solid #d4dcf0;
          background: #fff;
          border-radius: 10px;
          padding: 10px;
          font-weight: 600;
          color: #1a254f;
        }
        .site-info-sheet-address-actions button:disabled {
          opacity: 0.4;
        }
        .site-info-sheet-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
          background: #f8f9ff;
          border: 1px solid #e4e8f4;
          border-radius: 12px;
          padding: 10px;
        }
        .site-info-sheet-kv {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .site-info-sheet-kv-label {
          font-size: 12px;
          color: #6b7280;
        }
        .site-info-sheet-kv-value {
          font-size: 15px;
          font-weight: 700;
          color: #0f172a;
        }
        .site-info-sheet-upload {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 8px;
        }
        .site-info-sheet-upload-item {
          border: 1px solid #e4e8f4;
          border-radius: 12px;
          padding: 10px;
          background: #ffffff;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .upload-label {
          font-size: 12px;
          color: #6b7280;
        }
        .upload-value {
          font-size: 16px;
          font-weight: 700;
          color: #0f172a;
        }
        .site-info-sheet-documents {
          display: grid;
          gap: 12px;
        }
        @media (min-width: 480px) {
          .site-info-sheet-documents {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }
        .document-card {
          border: 1px solid #e4e8f4;
          border-radius: 12px;
          padding: 10px;
          background: #fff;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .document-card-button {
          width: 100%;
          border: 1px solid #d4dcf0;
          background: #f6f9ff;
          border-radius: 10px;
          padding: 8px 12px;
          font-weight: 700;
          color: #1a254f;
        }
        .document-card-button:disabled {
          opacity: 0.5;
        }
        .document-card-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .document-card-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }
        .document-card-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .document-card-name {
          font-size: 14px;
          font-weight: 600;
          color: #0f172a;
        }
        .document-card-meta {
          font-size: 12px;
          color: #6b7280;
        }
        .document-card-view {
          border: 1px solid #d4dcf0;
          background: #ffffff;
          border-radius: 8px;
          padding: 4px 10px;
          font-size: 12px;
          font-weight: 600;
          color: #1a254f;
        }
        .document-card-empty {
          font-size: 12px;
          color: #9ca3af;
          padding: 6px 0;
        }

        .site-info-sheet-actions {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 4px;
        }
        .site-info-sheet-actions button {
          padding: 14px;
          border-radius: 16px;
          font-weight: 700;
          font-size: 15px;
        }
        .site-info-sheet-actions .ghost {
          border: 1px solid #d4dcf0;
          background: transparent;
          color: #1a254f;
        }
        .site-info-sheet-actions .outline {
          border: 1px solid #d4dcf0;
          background: #fff;
          color: #1a254f;
        }
        .site-info-sheet-actions .primary {
          border: none;
          background: #1a254f;
          color: #fff;
        }

        @media (min-width: 520px) {
          .site-info-sheet-address-meta {
            flex-direction: row;
          }
          .site-info-sheet-address-value {
            text-align: left;
          }
          .site-info-sheet-address-row {
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
          }
          .site-info-sheet-address-actions {
            width: auto;
          }
          .site-info-sheet-address-actions button {
            width: auto;
          }
        }

        @media (max-width: 420px) {
          .site-info-bottomsheet-content {
            padding: 24px 18px calc(28px + env(safe-area-inset-bottom, 0px));
          }
          .site-info-sheet-address-actions {
            flex-direction: column;
          }
          .site-info-sheet-address-actions.row {
            flex-direction: row !important;
            justify-content: flex-end;
          }
          .site-info-sheet-address-actions.row button {
            width: auto;
          }
          .site-info-sheet-address-actions button {
            width: 100%;
          }
        }
      `}</style>
      <style jsx global>{`
        :global([data-theme='dark'] .site-info-bottomsheet-content) {
          background: #11151b;
          color: #e9eef5;
        }
        :global([data-theme='dark'] .site-info-bottomsheet-title) {
          color: #f8fafc;
        }
        :global([data-theme='dark'] .site-info-bottomsheet-close) {
          background: rgba(148, 163, 184, 0.15);
          color: #e2e8f0;
          border-color: rgba(148, 163, 184, 0.35);
        }
      `}</style>
    </div>
  )
}

export default SiteInfoBottomSheet
