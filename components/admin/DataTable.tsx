'use client'

import React from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'

export type SortDirection = 'asc' | 'desc'

export type Column<T> = {
  key: string
  header: React.ReactNode
  /** If not provided, uses (row as any)[key] */
  accessor?: (row: T) => unknown
  /** Render cell content. Defaults to accessor() value */
  render?: (row: T) => React.ReactNode
  sortable?: boolean
  className?: string
  headerClassName?: string
  align?: 'left' | 'right' | 'center'
  width?: string | number
}

export interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  rowKey: ((row: T) => string | number) | string
  initialSort?: { columnKey: string; direction?: SortDirection }
  onSortChange?: (columnKey: string, direction: SortDirection) => void
  emptyMessage?: string
  dense?: boolean
  stickyHeader?: boolean
  className?: string
}

function getValue<T>(row: T, col: Column<T>) {
  if (col.accessor) return col.accessor(row)
  // fallback to property access
  return (row as any)?.[col.key]
}

function compareValues(a: unknown, b: unknown): number {
  // null/undefined to bottom
  if (a == null && b == null) return 0
  if (a == null) return 1
  if (b == null) return -1

  const at = typeof a
  const bt = typeof b
  if (at === 'number' && bt === 'number') return (a as number) - (b as number)
  const as = String(a)
  const bs = String(b)
  return as.localeCompare(bs, 'ko')
}

export function DataTable<T>(props: DataTableProps<T>) {
  const { data, columns, rowKey, onSortChange, className, dense, stickyHeader } = props
  const [sort, setSort] = React.useState<{ key: string; dir: SortDirection } | null>(
    props.initialSort
      ? { key: props.initialSort.columnKey, dir: props.initialSort.direction || 'asc' }
      : null
  )

  const sorted = React.useMemo(() => {
    if (!sort) return data
    const col = columns.find(c => c.key === sort.key)
    if (!col) return data
    const arr = [...data]
    arr.sort((ra, rb) => {
      const va = getValue(ra, col)
      const vb = getValue(rb, col)
      const base = compareValues(va, vb)
      return sort.dir === 'asc' ? base : -base
    })
    return arr
  }, [data, columns, sort])

  const handleSort = (key: string, enabled: boolean | undefined) => {
    if (!enabled) return
    setSort(prev => {
      const next =
        !prev || prev.key !== key
          ? { key, dir: 'asc' as SortDirection }
          : { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
      onSortChange?.(next.key, next.dir)
      return next
    })
  }

  return (
    <div className={cn('rounded-lg border bg-card p-0 shadow-sm overflow-x-auto', className)}>
      <Table>
        <TableHeader className={cn('bg-[--brand-300]', stickyHeader && 'sticky top-0 z-10')}>
          <TableRow>
            {columns.map(col => {
              const isSorted = sort?.key === col.key
              const ariaSort = isSorted
                ? sort!.dir === 'asc'
                  ? 'ascending'
                  : 'descending'
                : 'none'
              const align = col.align
                ? {
                    className:
                      col.align === 'right'
                        ? 'text-right'
                        : col.align === 'center'
                          ? 'text-center'
                          : 'text-left',
                  }
                : {}
              return (
                <TableHead
                  key={col.key}
                  style={{ width: col.width }}
                  aria-sort={ariaSort as any}
                  className={cn(
                    'font-semibold text-[--neutral-50] select-none',
                    col.headerClassName
                  )}
                >
                  {col.sortable ? (
                    <button
                      type="button"
                      onClick={() => handleSort(col.key, col.sortable)}
                      className={cn(
                        'inline-flex items-center gap-1 hover:underline',
                        align.className,
                        'text-[--neutral-50]'
                      )}
                    >
                      <span>{col.header}</span>
                      {isSorted ? (
                        sort!.dir === 'asc' ? (
                          <ArrowUp className="w-3.5 h-3.5" aria-hidden />
                        ) : (
                          <ArrowDown className="w-3.5 h-3.5" aria-hidden />
                        )
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 opacity-90" aria-hidden />
                      )}
                    </button>
                  ) : (
                    <div
                      className={cn(
                        'inline-flex items-center text-[--neutral-50]',
                        align.className
                      )}
                    >
                      {col.header}
                    </div>
                  )}
                </TableHead>
              )
            })}
          </TableRow>
        </TableHeader>
        <TableBody className={cn(dense && '[&_td]:py-2')}>
          {sorted.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="text-center text-sm text-muted-foreground py-10"
              >
                {props.emptyMessage || '표시할 데이터가 없습니다.'}
              </TableCell>
            </TableRow>
          ) : (
            sorted.map(row => (
              <TableRow
                key={typeof rowKey === 'string' ? String((row as any)?.[rowKey]) : rowKey(row)}
              >
                {columns.map(col => (
                  <TableCell
                    key={col.key}
                    className={cn(
                      col.className,
                      col.align === 'right' && 'text-right',
                      col.align === 'center' && 'text-center'
                    )}
                  >
                    {col.render ? col.render(row) : String(getValue(row, col) ?? '')}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}

export default DataTable
