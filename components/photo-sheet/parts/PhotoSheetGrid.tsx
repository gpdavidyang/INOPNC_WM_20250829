'use client'

import { PhotoSheetTile } from './PhotoSheetTile'

interface PhotoSheetGridProps {
  pageCount: number
  photosPerPage: number
  tiles: any[]
  preset: any
  onTileFileChange: (idx: number, files: File[]) => void
  onUpdateTile: (idx: number, patch: any) => void
  componentOptions: any[]
  processOptions: any[]
}

export function PhotoSheetGrid({
  pageCount,
  photosPerPage,
  tiles,
  preset,
  onTileFileChange,
  onUpdateTile,
  componentOptions,
  processOptions,
}: PhotoSheetGridProps) {
  return (
    <div className="space-y-12">
      {Array.from({ length: pageCount }).map((_, pageIdx) => {
        const start = pageIdx * photosPerPage
        const end = start + photosPerPage
        const pageTiles = tiles.slice(start, end)

        return (
          <div
            key={pageIdx}
            className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500"
          >
            <div className="flex items-center justify-between border-b-2 border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <h4 className="text-xl font-black text-foreground uppercase tracking-tight">
                  페이지 {pageIdx + 1}
                </h4>
                <span className="text-[10px] font-black text-muted-foreground bg-gray-100 px-2 py-0.5 rounded-full uppercase tracking-widest">
                  Photos {start + 1} – {Math.min(end, tiles.length)}
                </span>
              </div>
            </div>

            <div
              className="grid gap-6"
              style={{
                gridTemplateColumns: `repeat(${preset.cols}, minmax(0, 1fr))`,
              }}
            >
              {pageTiles.map((tile, i) => (
                <PhotoSheetTile
                  key={tile.id || start + i}
                  index={start + i}
                  tile={tile}
                  onFileChange={files => onTileFileChange(start + i, files)}
                  onUpdate={patch => onUpdateTile(start + i, patch)}
                  componentOptions={componentOptions}
                  processOptions={processOptions}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
