'use client'

import React, { useEffect, useMemo } from 'react'
import { useToast } from '@/components/ui/use-toast'
import { TMap } from '@/lib/external-apps'

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

  const mapHandler = (address?: string | null) => {
    if (!address) return
    if (onOpenMap) {
      onOpenMap(address)
      return
    }
    void TMap.search(address)
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
                      disabled={!phone}
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
              <span className="site-info-sheet-address-value">{address || '-'}</span>
            </div>
            <div className="site-info-sheet-address-actions row">
              <button
                type="button"
                onClick={() => copyHandler(address, '현장 주소를 복사했습니다.')}
                disabled={!address}
              >
                복사
              </button>
              <button type="button" onClick={() => mapHandler(address)} disabled={!address}>
                T맵
              </button>
            </div>
          </div>

          <div className="site-info-sheet-address-row">
            <div className="site-info-sheet-address-meta">
              <span className="site-info-sheet-address-label">숙소</span>
              <span className="site-info-sheet-address-value">{accommodation || '미지정'}</span>
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
                onClick={() => mapHandler(accommodation)}
                disabled={!accommodation}
              >
                T맵
              </button>
            </div>
          </div>
        </div>

        <div className="site-info-sheet-actions" role="group" aria-label="현장 관련 작업">
          <button type="button" className="ghost" onClick={openDocsHandler}>
            기타서류업로드
          </button>
          <button type="button" className="primary" onClick={openWorklogHandler}>
            작업일지목록
          </button>
        </div>
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
