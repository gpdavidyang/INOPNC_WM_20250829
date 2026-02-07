export type RequiredDocStatus = 'not_submitted' | 'pending' | 'submitted' | 'approved' | 'rejected'

export const REQUIRED_DOC_STATUS_LABELS: Record<RequiredDocStatus, string> = {
  not_submitted: '미제출',
  pending: '검토중',
  submitted: '검토중',
  approved: '승인완료',
  rejected: '반려',
}

export function normalizeRequiredDocStatus(input?: string | null): RequiredDocStatus {
  if (!input) return 'not_submitted'
  const lowered = input.toLowerCase()
  if (lowered === 'approved') return 'approved'
  if (lowered === 'rejected') return 'rejected'
  if (lowered === 'not_submitted' || lowered === 'missing') return 'not_submitted'
  if (
    lowered === 'pending' ||
    lowered === 'uploading' ||
    lowered === 'uploaded' ||
    lowered === 'submitted'
  ) {
    return 'pending'
  }
  return 'not_submitted'
}

export function isFinalRequiredDocStatus(status: RequiredDocStatus): boolean {
  return status === 'approved' || status === 'rejected'
}
