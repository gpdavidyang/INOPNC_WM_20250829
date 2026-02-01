'use client'

import { useCallback, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react'

type ItemMeta = {
  id: string
  member?: string
  process?: string
  content?: string
  stage?: 'before' | 'after'
  previewUrl?: string
}

export interface PhotoSheetPrintProps {
  title: string
  siteName: string
  rows: number
  cols: number
  orientation: 'portrait' | 'landscape'
  items: ItemMeta[]
  templateMode?: boolean
}

export default function PhotoSheetPrint({
  title,
  siteName,
  rows,
  cols,
  orientation,
  items,
  templateMode = false,
}: PhotoSheetPrintProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement | null>(null)
  const footerRef = useRef<HTMLDivElement | null>(null)
  const [primaryGrid, setPrimaryGrid] = useState<HTMLDivElement | null>(null)
  const [gridMetrics, setGridMetrics] = useState<{ maxHeight: number; rowHeight: number | null }>({
    maxHeight: 0,
    rowHeight: null,
  })

  const perPage = rows * cols
  const firstMemberName = useMemo(() => {
    for (const it of items) {
      const member = (it?.member || '').trim()
      if (member) return member
    }
    return ''
  }, [items])

  const pages: ItemMeta[][] = useMemo(() => {
    if (!items || items.length === 0) return [[]]
    const result: ItemMeta[][] = []
    for (let i = 0; i < items.length; i += perPage) {
      result.push(items.slice(i, i + perPage))
    }
    return result.length > 0 ? result : [[]]
  }, [items, perPage])

  const dynamicPrintStyles = useMemo(
    () => makePrintStyles({ orientation, rows, cols, title, siteName }),
    [orientation, rows, cols, title, siteName]
  )
  const isThreeByTwo = (rows === 3 && cols === 2) || (rows === 2 && cols === 3)
  const isConstrainedGrid = isThreeByTwo || (rows === 2 && cols === 1)
  // Enable per-photo captions for 2x2 (already), and also 1x1, 2x1, 3x2 grids
  const usePerCellCaption =
    !templateMode &&
    ((rows === 2 && cols === 2) ||
      (rows === 1 && cols === 1) ||
      (rows === 1 && cols === 2) ||
      (rows === 2 && cols === 1) ||
      (rows === 3 && cols === 2) ||
      (rows === 2 && cols === 3))
  const fillPageGrid = usePerCellCaption
  const gridStyle = useMemo<CSSProperties>(() => {
    const base: CSSProperties = {
      display: 'grid',
      gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
      gap: '2mm',
      alignContent: 'start',
      justifyItems: 'stretch',
    }

    if (isThreeByTwo) {
      return {
        ...base,
        gap: '1.2mm',
      }
    }

    return base
  }, [cols, isThreeByTwo])

  const measureLayout = useCallback(() => {
    const pageEl = containerRef.current
    const headerEl = headerRef.current
    const footerEl = footerRef.current
    const gridEl = primaryGrid
    if (!pageEl || !headerEl || !footerEl || !gridEl) return

    const pageStyles = getComputedStyle(pageEl)
    const paddingTop = parseFloat(pageStyles.paddingTop) || 0
    const paddingBottom = parseFloat(pageStyles.paddingBottom) || 0
    const headerHeight = headerEl.getBoundingClientRect().height
    const footerHeight = footerEl.getBoundingClientRect().height
    const available = pageEl.clientHeight - paddingTop - paddingBottom - headerHeight - footerHeight
    if (available <= 0) {
      setGridMetrics({ maxHeight: 0, rowHeight: null })
      return
    }

    let rowHeight: number | null = null
    let usedHeight = available
    if (isConstrainedGrid) {
      const gridStyles = getComputedStyle(gridEl)
      const gap = parseFloat(gridStyles.rowGap) || 0
      const cells = Array.from(gridEl.querySelectorAll<HTMLElement>('.cell'))
      if (cells.length) {
        const rowHeights = Array.from({ length: rows }, () => 0)
        cells.forEach((cell, index) => {
          const rowIndex = Math.floor(index / cols)
          const cellHeight = cell.getBoundingClientRect().height
          rowHeights[rowIndex] = Math.max(rowHeights[rowIndex], cellHeight)
        })
        const naturalMax = Math.max(...rowHeights)
        const target = (available - gap * (rows - 1)) / rows
        if (target > 0) {
          rowHeight = Math.min(naturalMax, target)
        } else {
          rowHeight = naturalMax
        }
        if (rowHeight != null) {
          usedHeight = Math.min(available, rowHeight * rows + gap * (rows - 1))
        }
      }
    }

    setGridMetrics({
      maxHeight: usedHeight,
      rowHeight: rowHeight && rowHeight > 0 ? rowHeight : null,
    })
  }, [isConstrainedGrid, rows, primaryGrid])

  useLayoutEffect(() => {
    if (typeof ResizeObserver === 'undefined') {
      const frame = requestAnimationFrame(measureLayout)
      return () => cancelAnimationFrame(frame)
    }

    measureLayout()
    const observer = new ResizeObserver(() => measureLayout())
    const targets = [
      containerRef.current,
      headerRef.current,
      footerRef.current,
      primaryGrid,
    ].filter((el): el is Element => !!el)
    targets.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [measureLayout, items, rows, cols, orientation, title, siteName, templateMode, primaryGrid])

  const registerGridRef = useCallback(
    (index: number) => (el: HTMLDivElement | null) => {
      if (index === 0) {
        setPrimaryGrid(el)
      }
    },
    []
  )

  const fallbackTitle = useMemo(() => {
    const normalizedSite = (siteName || '').trim()
    return normalizedSite
  }, [siteName])

  const resolvedTitle = useMemo(() => {
    const trimmed = (title || '').trim()
    const normalizedMember = firstMemberName.trim()
    const normalize = (value: string) => value.replace(/\s+/g, '').toLowerCase()
    const isPlaceholder = trimmed && normalize(trimmed) === normalize('사진대지')
    const looksLikeMemberTitle =
      trimmed && normalizedMember && normalize(trimmed) === normalize(normalizedMember)
    const displayTitle = !trimmed || looksLikeMemberTitle || isPlaceholder ? fallbackTitle : trimmed
    return displayTitle || ''
  }, [title, fallbackTitle, firstMemberName])

  return (
    <div className="print-root">
      <style>{dynamicPrintStyles}</style>
      {pages.map((pageItems, pageIndex) => (
        <div
          key={pageIndex}
          ref={pageIndex === 0 ? containerRef : undefined}
          className={`page ${orientation} ${templateMode ? 'template' : ''}`}
        >
          <div className="header" ref={pageIndex === 0 ? headerRef : undefined}>
            {templateMode ? (
              <div className="title site-only">현장명: {siteName || '\u00A0'}</div>
            ) : (
              <>
                <div className="title">{resolvedTitle}</div>
                <div className="header-divider" />
                <div className="site-row">
                  <div className="label">현장명</div>
                  <div className="value site-value-strong">{siteName || '\u00A0'}</div>
                </div>
                <div className="header-sub-divider" />
              </>
            )}
          </div>

          <div
            className={`grid${isThreeByTwo ? ' grid-3x2' : ''}${fillPageGrid ? ' fill-page' : ''}`}
            ref={registerGridRef(pageIndex)}
            style={{
              ...gridStyle,
              ...(fillPageGrid ? { gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))` } : {}),
              ...(!fillPageGrid && gridMetrics.maxHeight > 0
                ? { maxHeight: `${gridMetrics.maxHeight}px` }
                : {}),
              ...(!fillPageGrid && isConstrainedGrid && gridMetrics.rowHeight
                ? {
                    height: `${gridMetrics.maxHeight}px`,
                    gridTemplateRows: `repeat(${rows}, ${gridMetrics.rowHeight}px)`,
                  }
                : {}),
            }}
          >
            {Array.from({ length: perPage }).map((_, i) => {
              const it = pageItems[i]
              const cellClasses = ['cell']
              if (usePerCellCaption) {
                if (isThreeByTwo) cellClasses.push('cap3x2')
                else cellClasses.push('percap')
              }

              return (
                <div key={i} className={cellClasses.join(' ')}>
                  <div className="cell-image">
                    {it?.previewUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        className="img"
                        src={it.previewUrl}
                        alt={`사진 ${pageIndex * perPage + i + 1}`}
                      />
                    ) : (
                      <div className="placeholder">이미지</div>
                    )}
                  </div>
                  {usePerCellCaption ? (
                    isThreeByTwo ? (
                      <div className="cell-caption cap3x2">
                        <div className="cap-grid">
                          <div className="cap-row">
                            <span className="cap-label">보수 전/후</span>
                            <span className="cap-value">
                              {it?.stage === 'before'
                                ? '보수 전'
                                : it?.stage === 'after'
                                  ? '보수 후'
                                  : ''}
                            </span>
                            <span className="cap-label">부재명</span>
                            <span className="cap-value">{it?.member || ''}</span>
                            <span className="cap-label">공정</span>
                            <span className="cap-value">{it?.process || ''}</span>
                          </div>
                          <div className="cap-row">
                            <span className="cap-label">내용</span>
                            <span className="cap-value cap-ellipsis">{it?.content || ''}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="cell-caption cap-percap">
                        <div className="cap-grid">
                          <div className="cap-row">
                            <span className="cap-label">보수 전/후</span>
                            <span className="cap-value">
                              {it?.stage === 'before'
                                ? '보수 전'
                                : it?.stage === 'after'
                                  ? '보수 후'
                                  : ''}
                            </span>
                            <span className="cap-label">부재명</span>
                            <span className="cap-value">{it?.member || ''}</span>
                            <span className="cap-label">공정</span>
                            <span className="cap-value">{it?.process || ''}</span>
                          </div>
                          <div className="cap-row">
                            <span className="cap-label">내용</span>
                            <span className="cap-value cap-ellipsis">{it?.content || ''}</span>
                          </div>
                        </div>
                      </div>
                    )
                  ) : null}
                </div>
              )
            })}
          </div>

          {!usePerCellCaption && templateMode ? (
            <div
              className="info-grid"
              style={{
                gridTemplateColumns: `repeat(${cols}, 1fr)`,
                gridTemplateRows: `repeat(${rows}, 1fr)`,
              }}
            >
              {Array.from({ length: perPage }).map((_, i) => {
                const it = pageItems[i]
                return (
                  <table key={i} className="info-table">
                    <tbody>
                      <tr>
                        <th>부재명</th>
                        <td>{it?.member || ''}</td>
                      </tr>
                      <tr>
                        <th>공 정</th>
                        <td>{it?.process || ''}</td>
                      </tr>
                      <tr>
                        <th>내 용</th>
                        <td className="content">{it?.content || ''}</td>
                      </tr>
                      <tr>
                        <th>보수 전/후</th>
                        <td className="stage">
                          {it?.stage === 'before'
                            ? '보수 전'
                            : it?.stage === 'after'
                              ? '보수 후'
                              : ''}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                )
              })}
            </div>
          ) : !usePerCellCaption ? (
            <table className="meta-table">
              <thead>
                <tr>
                  <th>부재명</th>
                  <th>공정</th>
                  <th>내용</th>
                  <th>보수 전/후</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: perPage }).map((_, i) => {
                  const it = pageItems[i]
                  return (
                    <tr key={i}>
                      <td>{it?.member || ''}</td>
                      <td>{it?.process || ''}</td>
                      <td className="content">{it?.content || ''}</td>
                      <td className="stage">
                        {it?.stage === 'before'
                          ? '보수 전'
                          : it?.stage === 'after'
                            ? '보수 후'
                            : ''}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          ) : null}
          <div className="footer" ref={pageIndex === 0 ? footerRef : undefined}>
            <div className="footer-divider" />
            <div className="footer-row">
              <div className="foot-left">주식회사 이노피앤씨</div>
              <div className="foot-right">
                페이지 {pageIndex + 1} / {pages.length}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

type PrintStyleParams = {
  orientation: 'portrait' | 'landscape'
  rows: number
  cols: number
  title?: string
  siteName?: string
}

function makePrintStyles({ orientation }: PrintStyleParams) {
  const pageSize = orientation === 'landscape' ? 'A4 landscape' : 'A4 portrait'
  return `
.print-root {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 28px;
  padding: 32px 0 72px;
  overflow: visible;
}
  @page { size: ${pageSize}; margin: 0; }
@media print {
  html, body,
  body.admin-role,
  body.role-admin,
  body.role-system-admin,
  body.desktop-ui,
  body.force-desktop-ui {
    margin: 0 !important;
    padding: 0 !important;
    background: #fff !important;
    color: #000 !important;
    width: auto !important;
    min-width: 0 !important;
    max-width: none !important;
    height: auto !important;
    min-height: 0 !important;
    max-height: none !important;
    overflow: visible !important;
  }
  #__next,
  body.admin-role #__next,
  body.role-admin #__next,
  body.role-system-admin #__next,
  body.desktop-ui #__next,
  body.force-desktop-ui #__next,
  body.admin-role main,
  body.role-admin main,
  body.role-system-admin main,
  body.desktop-ui main,
  body.force-desktop-ui main,
  body.admin-role .container,
  body.role-admin .container,
  body.role-system-admin .container {
    margin: 0 !important;
    padding: 0 !important;
    width: auto !important;
    min-width: 0 !important;
    max-width: none !important;
    height: auto !important;
    min-height: 0 !important;
    max-height: none !important;
    overflow: visible !important;
  }
  .print-hide,
  .admin-header,
  .admin-sidebar {
    display: none !important;
  }
  .admin-shell,
  .admin-main,
  .admin-main-content,
  .admin-main-inner,
  .photo-sheet-preview-page,
  .photo-sheet-preview-stage,
  .photo-sheet-preview-scroll,
  .photo-sheet-preview-canvas {
    margin: 0 !important;
    padding: 0 !important;
    width: auto !important;
    min-width: 0 !important;
    max-width: none !important;
    height: auto !important;
    min-height: 0 !important;
    max-height: none !important;
    background: transparent !important;
  }
  .admin-main {
    padding-left: 0 !important;
    padding-right: 0 !important;
    min-width: 0 !important;
    padding-top: 0 !important;
  }
  .admin-main-content {
    padding-top: 0 !important;
  }
  .photo-sheet-preview-scroll {
    overflow: visible !important;
  }
  .print-root {
    position: static;
    display: block;
    padding: 0;
    overflow: visible;
    margin: 0 auto;
  }
  .print-root .page {
    box-shadow: none;
    page-break-after: always;
    -webkit-region-break-after: always;
    break-after: page;
  }
  .print-root .page:last-child {
    page-break-after: auto;
    break-after: auto;
  }
}
.print-root .page { width: 210mm; height: 297mm; background: #fff; color: #000; border: 1px solid #ddd; box-sizing: border-box; padding: 3.5mm 7mm 10mm; display: flex; flex-direction: column; gap: 2mm; break-after: page; overflow: visible; margin: 0 auto; box-shadow: 0 16px 36px rgba(15, 23, 42, 0.08); }
.print-root .page.landscape { width: 297mm; height: 210mm; }
.print-root .header .title { font-weight: 700; font-size: 14pt; text-align: center; margin-bottom: 0.1mm; }
.print-root .header-divider { border-top: 1.5px solid #000; margin: 0.2mm 0 0.5mm; }
.print-root .header-sub-divider { border-top: 1.5px solid #000; margin: 0.5mm 0 0.5mm; }
.print-root .header .title.site-only { text-align: left; font-size: 13pt; margin-bottom: 2mm; }
.print-root .site-row { display: grid; grid-template-columns: 24mm 1fr; align-items: center; gap: 0.6mm; }
.print-root .site-row .label { border: none; padding: 0.4mm 1mm; font-weight: 600; text-align: center; }
.print-root .site-row .value { border: none; padding: 0.4mm 1mm; min-height: 4mm; }
.print-root .site-value-strong { font-weight: 800; }
.print-root .grid { flex: 0 0 auto; min-height: 0; align-content: start; justify-items: stretch; }
.print-root .grid.fill-page { flex: 1 1 auto; min-height: 0; }
.print-root .page.template .grid { gap: 0; }
.print-root .cell { border: 0; display: flex; flex-direction: column; align-items: stretch; justify-content: flex-start; overflow: hidden; break-inside: avoid; }
.print-root .cell.percap,
.print-root .cell.cap3x2 {
  display: flex;
  flex-direction: column;
  gap: 0.6mm;
  overflow: visible;
  min-height: 0;
  height: 100%;
}
.print-root .cell.percap .cell-image,
.print-root .cell.cap3x2 .cell-image {
  width: 100%;
  flex: 1 1 auto;
  min-height: 12mm;
  max-height: 100%;
  position: relative;
  border: 0.5px solid #d4d4d4;
  border-radius: 2mm;
  background: transparent;
  overflow: hidden;
}
.print-root .cell.percap .cell-image { min-height: 20mm; }
.print-root .cell.cap3x2 .cell-image { min-height: 10mm; }
.print-root .cell.percap .cell-caption,
.print-root .cell.cap3x2 .cell-caption { flex: 0 0 auto; margin-top: 0; }
.print-root .cell.percap .cap-grid,
.print-root .cell.cap3x2 .cap-grid {
  width: 100%;
  display: grid;
  row-gap: 0.4mm;
}
.print-root .cell.percap .cap-row,
.print-root .cell.cap3x2 .cap-row {
  display: grid;
  column-gap: 0.8mm;
  align-items: start;
}
.print-root .cell.percap .cap-row:first-child,
.print-root .cell.cap3x2 .cap-row:first-child {
  grid-template-columns: repeat(3, minmax(0, auto) minmax(0, 1fr));
  align-items: center;
}
.print-root .cell.percap .cap-row:last-child,
.print-root .cell.cap3x2 .cap-row:last-child {
  grid-template-columns: minmax(0, auto) minmax(0, 1fr);
  align-items: center;
}
.print-root .cell.percap .cap-label,
.print-root .cell.cap3x2 .cap-label {
  font-size: 7pt;
  font-weight: 600;
  color: #333;
  padding: 0.25mm 0.2mm;
  white-space: nowrap;
}
.print-root .cell.percap .cap-value,
.print-root .cell.cap3x2 .cap-value {
  font-size: 9pt;
  font-weight: 500;
  padding: 0.25mm 0.2mm;
  min-width: 0;
}
.print-root .cell.percap .cap-value.cap-ellipsis,
.print-root .cell.cap3x2 .cap-value.cap-ellipsis {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  white-space: normal;
  word-break: break-word;
}
/* use single rule below with fallback; 3x2 sets --cap-h inline */
.print-root .cell.percap .img { object-fit: cover; object-position: center; }

.print-root .cell .cell-image img,
.print-root .img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  position: absolute;
  inset: 0;
}
.print-root .cell.cap3x2 .img { object-fit: cover; }
.print-root .page.template .img { object-fit: cover; }
.print-root .placeholder { color: #888; font-size: 12px; }
.print-root .meta-table { width: 100%; border-collapse: collapse; flex: 0 0 auto; }
.print-root .meta-table th, .print-root .meta-table td { border: 1px solid #000; padding: 2mm 3mm; font-size: 10pt; }
.print-root .meta-table td.content { text-align: left; }
.print-root .meta-table td.stage { text-align: center; }

/* Footer with divider and two columns */
.print-root .footer-divider { border-top: 2px solid #000; margin-top: 1.5mm; }
.print-root .footer { margin-top: auto; padding-top: 1mm; }
.print-root .footer-row { display: flex; align-items: center; justify-content: space-between; padding-top: 0.5mm; font-size: 8.5pt; }
.print-root .foot-left { text-align: left; font-weight: 400; }
.print-root .foot-right { text-align: right; font-weight: 400; }
tr, td, th { break-inside: avoid; }
* { -webkit-print-color-adjust: exact; print-color-adjust: exact; }

/* Template-mode per-cell info tables */
.print-root .info-grid { display: grid; gap: 0; margin-top: 1mm; }
.print-root .info-table { width: 100%; border-collapse: collapse; table-layout: fixed; border: 1px solid #000; font-size: 10pt; }
.print-root .info-table th, .print-root .info-table td { border: 1px solid #000; padding: 1.2mm 1.6mm; text-align: left; }
.print-root .info-table th { width: 20mm; text-align: center; font-weight: 700; background: #f5f5f5; }

`
}
