'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

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
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const gridTemplate = useMemo(
    () => ({
      gridTemplateColumns: `repeat(${cols}, 1fr)`,
      gridTemplateRows: `repeat(${rows}, 1fr)`,
    }),
    [rows, cols]
  )

  const perPage = rows * cols
  // Per-cell caption is enabled for: 2x2, 1x1, 2x1, 3x1 (rows=1, cols=1..3)
  const perCellCaption =
    !templateMode &&
    ((rows === 2 && cols === 2) || (rows === 1 && (cols === 1 || cols === 2 || cols === 3)))
  // Fixed A4 layout: allocate fixed millimeter heights per section and place images with object-fit: contain
  const headerMm = 24
  const footerMm = 8
  // Reduce padding for fixed layouts to maximize photo cell height
  const paddingMm = perCellCaption
    ? rows === 2 && cols === 2
      ? 6 // 2x2
      : (rows === 1 && cols === 2) || (rows === 2 && cols === 1)
        ? 8 // 2x1
        : 10
    : 10
  // Preset-specific table height and grid gap (mm) to keep layout consistent
  const { metaMm, gapMm } = useMemo(() => {
    // Integrated meta table layout (default)
    if (!templateMode) {
      if (perCellCaption) {
        // Per-cell caption uses no global meta table
        if ((rows === 1 && cols === 1) || (rows === 1 && cols === 1)) return { metaMm: 0, gapMm: 4 }
        if ((rows === 1 && cols === 2) || (rows === 2 && cols === 1))
          return { metaMm: 0, gapMm: 2.5 }
        if ((rows === 1 && cols === 3) || (rows === 3 && cols === 1)) return { metaMm: 0, gapMm: 3 }
        if (rows === 2 && cols === 2) return { metaMm: 0, gapMm: 1.5 }
      }
      if (rows === 1 && cols === 1) return { metaMm: 60, gapMm: 4 }
      if (rows === 1 && cols === 2) return { metaMm: 50, gapMm: 3 } // 2x1
      if (rows === 1 && cols === 3) return { metaMm: 42, gapMm: 3 } // 3x1
      if (rows === 2 && cols === 2) return { metaMm: 36, gapMm: 3 } // 2x2 global table
      // generic fallbacks
      if (rows <= 1) return { metaMm: 60, gapMm: 3 }
      if (rows === 2) return { metaMm: 48, gapMm: 3 }
      if (rows === 3) return { metaMm: 42, gapMm: 3 }
      return { metaMm: 36, gapMm: 2.5 }
    }
    // Template mode (per-cell tables)
    if (rows === 1 && cols === 1) return { metaMm: 62, gapMm: 4 }
    if (rows === 1 && cols === 2) return { metaMm: 56, gapMm: 3 }
    if (rows === 1 && cols === 3) return { metaMm: 50, gapMm: 3 }
    if (rows === 2 && cols === 2) return { metaMm: 44, gapMm: 3 }
    if (rows <= 1) return { metaMm: 62, gapMm: 3 }
    if (rows === 2) return { metaMm: 56, gapMm: 3 }
    if (rows === 3) return { metaMm: 50, gapMm: 3 }
    return { metaMm: 44, gapMm: 2.5 }
  }, [rows, cols, templateMode])
  const pageHeightMm = orientation === 'landscape' ? 210 : 297
  // Reduce inter-section gaps for 2x2/2x1 to give more height to grid
  const pageGapMm = perCellCaption
    ? rows === 2 && cols === 2
      ? 1.5 // 2x2
      : (rows === 1 && cols === 2) || (rows === 2 && cols === 1)
        ? 2.5 // 2x1
        : 4
    : 4
  const sectionGapCount = 2 // header↔grid, grid↔footer
  const gridHeightMm = Math.max(
    40,
    pageHeightMm - 2 * paddingMm - headerMm - footerMm - metaMm - pageGapMm * sectionGapCount
  )
  const pages: ItemMeta[][] = useMemo(() => {
    if (!items || items.length === 0) return [[]]
    const result: ItemMeta[][] = []
    for (let i = 0; i < items.length; i += perPage) {
      result.push(items.slice(i, i + perPage))
    }
    return result.length > 0 ? result : [[]]
  }, [items, perPage])

  const dynamicPrintStyles = useMemo(() => makePrintStyles(orientation), [orientation])
  const totalPages = pages.length

  // Set CSS variables for fixed-layout sections
  const pageVars = useMemo(() => {
    // Per-cell caption heights per preset for a balanced look
    let cellCapMm = 0
    if (perCellCaption) {
      if (rows === 1 && cols === 1) cellCapMm = 30
      else if ((rows === 1 && cols === 2) || (rows === 2 && cols === 1)) cellCapMm = 26
      else if ((rows === 1 && cols === 3) || (rows === 3 && cols === 1)) cellCapMm = 24
      else if (rows === 2 && cols === 2) cellCapMm = 20
    }
    let cellH = gridHeightMm / Math.max(1, rows)
    if (rows > 1) {
      const vGaps = (rows - 1) * gapMm
      cellH = (gridHeightMm - vGaps) / rows
    }
    const cellImgMm = Math.max(8, cellH - cellCapMm)
    return {
      ['--grid-h' as any]: `${gridHeightMm}mm`,
      ['--meta-h' as any]: `${metaMm}mm`,
      ['--gap-mm' as any]: `${gapMm}mm`,
      ['--pad-mm' as any]: `${paddingMm}mm`,
      ['--page-gap-mm' as any]: `${pageGapMm}mm`,
      ['--cell-cap-mm' as any]: `${cellCapMm}mm`,
      ['--cell-h' as any]: `${cellH}mm`,
      ['--cell-img-h' as any]: `${cellImgMm}mm`,
      ['--head-mm' as any]: `${headerMm}mm`,
      ['--foot-mm' as any]: `${footerMm}mm`,
    }
  }, [gridHeightMm, metaMm, gapMm, perCellCaption, rows, cols, paddingMm, pageGapMm])

  return (
    <div className="print-root">
      {/* Style content differs between SSR and client; suppress hydration warnings */}
      <style suppressHydrationWarning>{mounted ? dynamicPrintStyles : ''}</style>
      {pages.map((pageItems, pageIndex) => (
        <div
          key={pageIndex}
          ref={pageIndex === 0 ? containerRef : undefined}
          className={`page ${orientation} ${templateMode ? 'template' : ''}`}
          style={pageVars}
        >
          <div className="page-inner">
            <div className="header">
              {templateMode ? (
                <div className="title site-only">현장명: {siteName || '\u00A0'}</div>
              ) : (
                <>
                  <div className="title">{title || '사진대지'}</div>
                  <div className="site-row">
                    <div className="label">현장명</div>
                    <div className="value">{siteName || '\u00A0'}</div>
                  </div>
                </>
              )}
            </div>

            <div
              className="grid"
              style={{
                gridTemplateColumns: `repeat(${cols}, 1fr)`,
                gridTemplateRows: perCellCaption
                  ? `repeat(${rows}, var(--cell-h))`
                  : gridTemplate.gridTemplateRows,
                height: `var(--grid-h)`,
                gap: `var(--gap-mm, 3mm)`,
              }}
            >
              {Array.from({ length: perPage }).map((_, i) => {
                const it = pageItems[i]
                return (
                  <div key={i} className={`cell${perCellCaption ? ' cell-split' : ''}`}>
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
                    {perCellCaption ? (
                      <table className="cell-caption">
                        <tbody>
                          <tr>
                            <th>전/후</th>
                            <td className="clamp-1">
                              {it?.stage === 'before'
                                ? '보수 전'
                                : it?.stage === 'after'
                                  ? '보수 후'
                                  : ''}
                            </td>
                          </tr>
                          <tr>
                            <th>부재</th>
                            <td className="clamp-1">{it?.member || ''}</td>
                          </tr>
                          <tr>
                            <th>공정</th>
                            <td className="clamp-1">{it?.process || ''}</td>
                          </tr>
                          <tr>
                            <th>내용</th>
                            <td className="clamp-2 content">{it?.content || ''}</td>
                          </tr>
                        </tbody>
                      </table>
                    ) : null}
                  </div>
                )
              })}
            </div>

            {!perCellCaption && templateMode ? (
              <div className="info-grid" style={gridTemplate}>
                {Array.from({ length: perPage }).map((_, i) => {
                  const it = pageItems[i]
                  return (
                    <table key={i} className="info-table">
                      <tbody>
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
                      </tbody>
                    </table>
                  )
                })}
              </div>
            ) : !perCellCaption ? (
              <table className="meta-table">
                <colgroup>
                  <col style={{ width: '16%' }} />
                  <col style={{ width: '22%' }} />
                  <col style={{ width: '22%' }} />
                  <col />
                </colgroup>
                <thead>
                  <tr>
                    <th>보수 전/후</th>
                    <th>부재명</th>
                    <th>공정</th>
                    <th>내용</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: perPage }).map((_, i) => {
                    const it = pageItems[i]
                    return (
                      <tr key={i}>
                        <td className="stage clamp-1">
                          {it?.stage === 'before'
                            ? '보수 전'
                            : it?.stage === 'after'
                              ? '보수 후'
                              : ''}
                        </td>
                        <td className="clamp-1">{it?.member || ''}</td>
                        <td className="clamp-1">{it?.process || ''}</td>
                        <td className="content clamp-3">{it?.content || ''}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            ) : null}
            <div className="footer">
              <div className="foot-left">{siteName || ''}</div>
              <div className="foot-center">{title || '사진대지'}</div>
              <div className="foot-right">
                페이지 {pageIndex + 1} / {totalPages}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function makePrintStyles(orientation: 'portrait' | 'landscape') {
  const pageSize = orientation === 'landscape' ? 'A4 landscape' : 'A4 portrait'
  const pageW = orientation === 'landscape' ? '297mm' : '210mm'
  const pageH = orientation === 'landscape' ? '210mm' : '297mm'
  return `
@page { size: ${pageSize}; margin: 12mm; }
@media print {
  html, body { margin: 0 !important; padding: 0 !important; }
  .print-root { position: static; margin: 0 !important; }
  .page { width: ${pageW}; height: ${pageH}; margin: 0 auto; border: none; padding: var(--pad-mm); overflow: hidden; box-sizing: border-box; gap: var(--page-gap-mm, 4mm); }
  .page-inner { width: 100%; margin: 0 auto; display: flex; flex-direction: column; }
  .header { flex: 0 0 var(--head-mm); height: var(--head-mm); overflow: hidden; }
  .footer { flex: 0 0 var(--foot-mm); height: var(--foot-mm); overflow: hidden; }
  .grid { gap: var(--gap-mm, 3mm); }
  .meta-row .m-label, .meta-row .m-value { padding: 0.8mm 1.2mm; }
  .meta-table th, .meta-table td { padding: 1.2mm 1.8mm; }
}
 .page { width: 210mm; height: 297mm; background: #fff; color: #000; border: 0.3mm solid #D0D0D0; box-sizing: border-box; padding: var(--pad-mm); display: flex; flex-direction: column; gap: var(--page-gap-mm, 4mm); break-after: page; overflow: hidden; margin: 0 auto; font-family: 'Noto Sans KR', system-ui, -apple-system, Segoe UI, Roboto, 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; }
 .page-inner { width: 100%; margin: 0 auto; display: flex; flex-direction: column; }
.page.landscape { width: 297mm; height: 210mm; }
.header .title { font-weight: 700; font-size: 16pt; text-align: center; margin-bottom: 3mm; letter-spacing: 0.2px; }
.header .title.site-only { text-align: left; font-size: 15pt; margin-bottom: 8mm; }
  .site-row { display: grid; grid-template-columns: 30mm 1fr; align-items: center; gap: 2mm; }
  .site-row .label { border: none; padding: 1.6mm 2.4mm; font-weight: 600; text-align: left; background: transparent; }
  .site-row .value { border: none; padding: 1.6mm 2.4mm; min-height: 9mm; }
.grid { flex: 0 0 auto; height: var(--grid-h); display: grid; gap: var(--gap-mm, 3mm); }
.page.template .grid { gap: 0; }
.cell { border: 0.25mm solid #000; display: flex; align-items: center; justify-content: center; overflow: hidden; break-inside: avoid; background: #fff; }
.cell.cell-split { flex-direction: column; align-items: stretch; justify-content: flex-start; padding: 0; }
.cell-image { height: var(--cell-img-h, auto); display: flex; align-items: center; justify-content: center; overflow: hidden; min-height: 0; }
.cell-caption { height: var(--cell-cap-mm, 0mm); width: 100%; border-top: 0.25mm solid #000; border-collapse: collapse; table-layout: fixed; }
.cell-caption th, .cell-caption td { border: 0.25mm solid #000; border-top: none; font-size: 9.5pt; line-height: 1.2; padding: 0.8mm 1.2mm; text-align: left; }
.cell-caption th { width: 9mm; text-align: center; white-space: nowrap; }
.img { max-width: 100%; max-height: 100%; width: auto; height: auto; object-fit: contain; }
.page.template .img { object-fit: contain; }
.placeholder { color: #888; font-size: 12px; }
.meta-table { width: 100%; border-collapse: collapse; flex: 0 0 auto; min-height: var(--meta-h); }
.meta-table { margin-top: 0; }
.meta-table th, .meta-table td { border: 0.25mm solid #000; padding: 1.6mm 2.4mm; font-size: 10pt; line-height: 1.2; }
.meta-table td.clamp-1 { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.meta-table td.clamp-3 { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; white-space: normal; word-break: break-word; }
.meta-table tr, .meta-table thead, .meta-table tbody { break-inside: avoid; }
.meta-table thead th { background: #f6f7f9; font-weight: 700; }
.meta-table td.content { text-align: left; }
.meta-table td.stage { text-align: center; }
tr, td, th { break-inside: avoid; }
* { -webkit-print-color-adjust: exact; print-color-adjust: exact; }

/* Template-mode per-cell info tables */
.info-grid { display: grid; gap: 0; margin-top: 2mm; }
.info-table { width: 100%; border-collapse: collapse; table-layout: fixed; border: 0.25mm solid #000; font-size: 10pt; }
.info-table th, .info-table td { border: 0.25mm solid #000; padding: 1.2mm 1.6mm; text-align: left; }
.info-table th { width: 20mm; text-align: center; font-weight: 700; background: #f6f7f9; }
.footer { display: grid; grid-template-columns: 1fr 1fr 1fr; font-size: 9pt; color: #333; align-items: center; }
.footer .foot-left { text-align: left; }
.footer .foot-center { text-align: center; font-weight: 600; }
.footer .foot-right { text-align: right; }

`
}
