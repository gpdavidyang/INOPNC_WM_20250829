'use client'

import React from 'react'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type ButtonSize = 'compact' | 'standard'

export type AdminActionButtonsProps = {
  // Detail
  detailHref?: string
  onDetail?: (event: React.MouseEvent) => void
  // Edit
  editHref?: string
  onEdit?: (event: React.MouseEvent) => void
  // Delete
  deleteHref?: string
  deleteMethod?: 'DELETE' | 'POST'
  onDelete?: (event: React.MouseEvent) => Promise<void> | void
  onDeleted?: () => void
  deleteConfirmMessage?: string

  size?: ButtonSize
  className?: string
  disabled?: boolean
  stopPropagation?: boolean
  labels?: { detail?: string; edit?: string; delete?: string }
}

export default function AdminActionButtons(props: AdminActionButtonsProps) {
  const {
    detailHref,
    onDetail,
    editHref,
    onEdit,
    deleteHref,
    deleteMethod = 'DELETE',
    onDelete,
    onDeleted,
    deleteConfirmMessage = '이 항목을 삭제하시겠습니까? 되돌릴 수 없습니다.',
    size = 'compact',
    className,
    disabled,
    stopPropagation,
    labels,
  } = props

  const [busy, setBusy] = React.useState(false)

  const handleClickWrap =
    (handler?: (e: React.MouseEvent) => void | Promise<void>) => async (e: React.MouseEvent) => {
      if (stopPropagation) e.stopPropagation()
      if (!handler) return
      await handler(e)
    }

  const doDelete = async (e: React.MouseEvent) => {
    if (stopPropagation) e.stopPropagation()
    if (disabled || busy) return
    const ok = window.confirm(deleteConfirmMessage)
    if (!ok) return

    setBusy(true)
    try {
      if (onDelete) {
        await onDelete(e)
      } else if (deleteHref) {
        const res = await fetch(deleteHref, { method: deleteMethod })
        const j = await res.json().catch(() => ({}))
        if (!res.ok || j?.success === false) {
          throw new Error(j?.error || '삭제에 실패했습니다.')
        }
      }
      onDeleted?.()
    } catch (err: any) {
      alert(err?.message || '삭제 중 오류가 발생했습니다.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={cn('inline-flex items-center gap-1 whitespace-nowrap', className)}>
      {detailHref || onDetail ? (
        detailHref ? (
          <Link
            href={detailHref}
            className={buttonVariants({ variant: 'outline', size })}
            role="button"
            onClick={stopPropagation ? e => e.stopPropagation() : undefined}
          >
            {labels?.detail || '상세'}
          </Link>
        ) : (
          <button
            type="button"
            className={buttonVariants({ variant: 'outline', size })}
            disabled={disabled}
            onClick={handleClickWrap(onDetail)}
          >
            {labels?.detail || '상세'}
          </button>
        )
      ) : null}

      {editHref || onEdit ? (
        editHref ? (
          <Link
            href={editHref}
            className={buttonVariants({ variant: 'secondary', size })}
            role="button"
            onClick={stopPropagation ? e => e.stopPropagation() : undefined}
          >
            {labels?.edit || '수정'}
          </Link>
        ) : (
          <button
            type="button"
            className={buttonVariants({ variant: 'secondary', size })}
            disabled={disabled}
            onClick={handleClickWrap(onEdit)}
          >
            {labels?.edit || '수정'}
          </button>
        )
      ) : null}

      {deleteHref || onDelete ? (
        <button
          type="button"
          className={buttonVariants({ variant: 'destructive', size })}
          disabled={disabled || busy}
          onClick={doDelete}
        >
          {labels?.delete || '삭제'}
        </button>
      ) : null}
    </div>
  )
}
