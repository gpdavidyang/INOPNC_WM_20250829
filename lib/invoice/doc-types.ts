export type InvoiceDocTypeCode =
  | 'estimate'
  | 'construction_plan'
  | 'e_tax_invoice'
  | 'photo_grid'
  | 'contract'
  | 'completion_certificate'
  | 'progress_drawing'
  | 'other'

export interface InvoiceDocType {
  code: InvoiceDocTypeCode
  label: string
  required: {
    start: boolean
    progress: boolean
    completion: boolean
  }
  allowMultipleVersions: boolean
  sortOrder: number
  isActive: boolean
}

export const DEFAULT_INVOICE_DOC_TYPES: InvoiceDocType[] = [
  {
    code: 'estimate',
    label: '견적서',
    required: { start: true, progress: false, completion: false },
    allowMultipleVersions: true,
    sortOrder: 10,
    isActive: true,
  },
  {
    code: 'construction_plan',
    label: '시공계획서',
    required: { start: true, progress: false, completion: false },
    allowMultipleVersions: true,
    sortOrder: 20,
    isActive: true,
  },
  {
    code: 'contract',
    label: '계약서',
    required: { start: true, progress: false, completion: false },
    allowMultipleVersions: true,
    sortOrder: 30,
    isActive: true,
  },
  {
    code: 'progress_drawing',
    label: '진행도면',
    required: { start: false, progress: true, completion: false },
    allowMultipleVersions: true,
    sortOrder: 40,
    isActive: true,
  },
  {
    code: 'photo_grid',
    label: '사진대지',
    required: { start: false, progress: false, completion: true },
    allowMultipleVersions: true,
    sortOrder: 50,
    isActive: true,
  },
  {
    code: 'completion_certificate',
    label: '작업완료확인서',
    required: { start: false, progress: false, completion: true },
    allowMultipleVersions: true,
    sortOrder: 60,
    isActive: true,
  },
  {
    code: 'e_tax_invoice',
    label: '전자세금계산서',
    required: { start: false, progress: false, completion: true },
    allowMultipleVersions: true,
    sortOrder: 70,
    isActive: true,
  },
  {
    code: 'other',
    label: '기타',
    required: { start: false, progress: true, completion: false },
    allowMultipleVersions: true,
    sortOrder: 90,
    isActive: true,
  },
]
