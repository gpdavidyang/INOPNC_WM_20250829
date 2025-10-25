'use client'

import { useMemo, useRef } from 'react'

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

  const gridTemplate = useMemo(
    () => ({
      gridTemplateColumns: `repeat(${cols}, 1fr)`,
      gridTemplateRows: `repeat(${rows}, 1fr)`,
    }),
    [rows, cols]
  )

  const perPage = rows * cols
  const pages: ItemMeta[][] = useMemo(() => {
    if (!items || items.length === 0) return [[]]
    const result: ItemMeta[][] = []
    for (let i = 0; i < items.length; i += perPage) {
      result.push(items.slice(i, i + perPage))
    }
    return result.length > 0 ? result : [[]]
  }, [items, perPage])

  const dynamicPrintStyles = useMemo(() => makePrintStyles(orientation), [orientation])
  // Enable per-photo captions for 2x2 (already), and also 1x1, 2x1, 3x2 grids
  const usePerCellCaption =
    !templateMode &&
    ((rows === 2 && cols === 2) ||
      (rows === 1 && cols === 1) ||
      (rows === 1 && cols === 2) ||
      (rows === 2 && cols === 1) ||
      (rows === 3 && cols === 2) ||
      (rows === 2 && cols === 3))

  return (
    <div className="print-root">
      <style>{dynamicPrintStyles}</style>
      {pages.map((pageItems, pageIndex) => (
        <div
          key={pageIndex}
          ref={pageIndex === 0 ? containerRef : undefined}
          className={`page ${orientation} ${templateMode ? 'template' : ''}`}
        >
          <div className="header">
            {templateMode ? (
              <div className="title site-only">현장명: {siteName || '\u00A0'}</div>
            ) : (
              <>
                <div className="title">{title || '사진대지'}</div>
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
            className="grid"
            style={{
              ...gridTemplate,
              // For 3x2 (or 2x3) per-photo captions, reserve fixed caption height per cell
              ['--cap-h' as any]:
                usePerCellCaption && ((rows === 3 && cols === 2) || (rows === 2 && cols === 3))
                  ? '24mm'
                  : undefined,
            }}
          >
            {Array.from({ length: perPage }).map((_, i) => {
              const it = pageItems[i]
              return (
                <div key={i} className={`cell${usePerCellCaption ? ' percap' : ''}`}>
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
                    <table className="cell-caption">
                      <tbody>
                        <tr>
                          <td className="cap-cell">
                            <div className="cap-label">보수 전/후</div>
                            <div className="cap-value">
                              {it?.stage === 'before'
                                ? '보수 전'
                                : it?.stage === 'after'
                                  ? '보수 후'
                                  : ''}
                            </div>
                          </td>
                          <td className="cap-cell">
                            <div className="cap-label">부재명</div>
                            <div className="cap-value">{it?.member || ''}</div>
                          </td>
                          <td className="cap-cell">
                            <div className="cap-label">공정</div>
                            <div className="cap-value">{it?.process || ''}</div>
                          </td>
                        </tr>
                        <tr>
                          <td className="cap-content" colSpan={3}>
                            <div className="cap-label">내용</div>
                            <div className="cap-value cap-ellipsis">{it?.content || ''}</div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  ) : null}
                </div>
              )
            })}
          </div>

          {!usePerCellCaption && templateMode ? (
            <div className="info-grid" style={gridTemplate}>
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
          <div className="footer">
            <div className="footer-divider" />
            <div className="footer-row">
              <div className="foot-left">{siteName || ''}</div>
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

function makePrintStyles(orientation: 'portrait' | 'landscape') {
  const pageSize = orientation === 'landscape' ? 'A4 landscape' : 'A4 portrait'
  return `
@page { size: ${pageSize}; margin: 12mm; }
@media print {
  html, body { margin: 0 !important; padding: 0 !important; }
  body * { visibility: hidden; }
  .print-root, .print-root * { visibility: visible; }
  .print-root { position: static; }
}
.print-root .page { width: 210mm; height: 297mm; background: #fff; color: #000; border: 1px solid #ddd; box-sizing: border-box; padding: 10mm; display: flex; flex-direction: column; gap: 6mm; break-after: page; overflow: hidden; margin: 0 auto; }
.print-root .page.landscape { width: 297mm; height: 210mm; }
.print-root .header .title { font-weight: 700; font-size: 16pt; text-align: center; margin-bottom: 2mm; }
.print-root .header-divider { border-top: 2px solid #000; margin: 2mm 0 3mm; }
.print-root .header-sub-divider { border-top: 2px solid #000; margin: 3mm 0 3mm; }
.print-root .header .title.site-only { text-align: left; font-size: 15pt; margin-bottom: 8mm; }
.print-root .site-row { display: grid; grid-template-columns: 35mm 1fr; align-items: center; gap: 3mm; }
.print-root .site-row .label { border: none; padding: 2mm 3mm; font-weight: 600; text-align: center; }
.print-root .site-row .value { border: none; padding: 2mm 3mm; min-height: 10mm; }
.print-root .site-value-strong { font-weight: 800; }
.print-root .grid { flex: 1 1 0; min-height: 0; display: grid; gap: 3mm; }
.print-root .page.template .grid { gap: 0; }
.print-root .cell { border: 0; display: flex; flex-direction: column; align-items: stretch; justify-content: flex-start; overflow: hidden; break-inside: avoid; }
.print-root .cell.percap .cell-image { flex: 1 1 auto; display: flex; align-items: center; justify-content: center; min-height: 0; height: calc(100% - (var(--cap-h, 24mm) + 1.5mm)); }
.print-root .cell.percap .img { object-fit: contain; }
.print-root .cell-caption {
  width: 100%;
  border: 0;
  border-top: 0;
  border-collapse: collapse;
  table-layout: fixed;
  margin-top: 1.5mm;
}
.print-root .cell.percap .cell-image { height: calc(100% - (var(--cap-h, 16mm) + 1.5mm)); }
.print-root .cell.percap .cell-caption { height: var(--cap-h, 16mm); }
.print-root .cell-caption .cap-cell { border: 0; padding: 1mm 1.6mm; vertical-align: top; }
.print-root .cell-caption .cap-content { border: 0; padding: 1mm 1.6mm; }
.print-root .cell-caption .cap-label {
  font-size: 8pt;
  color: #333;
  background: #f3f3f3;
  border-bottom: 0;
  display: block;
  padding: 0;
  margin: 0 0 0.6mm 0;
}
.print-root .cell-caption .cap-value { font-size: 10pt; line-height: 1.2; font-weight: 500; }
.print-root .cell-caption .cap-ellipsis { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; white-space: normal; word-break: break-word; }
.print-root .img { width: 100%; height: 100%; object-fit: cover; }
.print-root .page.template .img { object-fit: contain; }
.print-root .placeholder { color: #888; font-size: 12px; }
.print-root .meta-table { width: 100%; border-collapse: collapse; flex: 0 0 auto; }
.print-root .meta-table th, .print-root .meta-table td { border: 1px solid #000; padding: 2mm 3mm; font-size: 10pt; }
.print-root .meta-table td.content { text-align: left; }
.print-root .meta-table td.stage { text-align: center; }

/* Footer with divider and two columns */
.print-root .footer-divider { border-top: 2px solid #000; margin-top: 3mm; }
.print-root .footer-row { display: flex; align-items: center; justify-content: space-between; padding-top: 2mm; font-size: 8pt; }
.print-root .foot-left { text-align: left; font-weight: 400; }
.print-root .foot-right { text-align: right; font-weight: 400; }
tr, td, th { break-inside: avoid; }
* { -webkit-print-color-adjust: exact; print-color-adjust: exact; }

/* Template-mode per-cell info tables */
.print-root .info-grid { display: grid; gap: 0; margin-top: 2mm; }
.print-root .info-table { width: 100%; border-collapse: collapse; table-layout: fixed; border: 1px solid #000; font-size: 10pt; }
.print-root .info-table th, .print-root .info-table td { border: 1px solid #000; padding: 1.2mm 1.6mm; text-align: left; }
.print-root .info-table th { width: 20mm; text-align: center; font-weight: 700; background: #f5f5f5; }

`
}
