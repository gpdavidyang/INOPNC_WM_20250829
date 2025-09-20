'use client'

// Hardcoded categories that work with existing database schema
// This will be replaced when document_categories table is created via migration
export const DOCUMENT_CATEGORIES = [
  { 
    id: '1', 
    name: 'personal', 
    display_name: '개인문서', 
    description: '개인 전용 문서', 
    icon: 'User', 
    color: 'blue', 
    sort_order: 1,
    is_active: true,
    created_at: new Date().toISOString()
  },
  { 
    id: '2', 
    name: 'shared', 
    display_name: '공유문서', 
    description: '팀 공유 문서', 
    icon: 'Users', 
    color: 'green', 
    sort_order: 2,
    is_active: true,
    created_at: new Date().toISOString()
  },
  { 
    id: '3', 
    name: 'blueprint', 
    display_name: '도면마킹', 
    description: '도면 마킹 문서', 
    icon: 'FileImage', 
    color: 'purple', 
    sort_order: 3,
    is_active: true,
    created_at: new Date().toISOString()
  },
  { 
    id: '4', 
    name: 'required', 
    display_name: '필수서류', 
    description: '필수 제출 서류', 
    icon: 'FileCheck', 
    color: 'red', 
    sort_order: 4,
    is_active: true,
    created_at: new Date().toISOString()
  },
  { 
    id: '5', 
    name: 'progress_payment', 
    display_name: '기성청구', 
    description: '기성 청구 문서', 
    icon: 'DollarSign', 
    color: 'orange', 
    sort_order: 5,
    is_active: true,
    created_at: new Date().toISOString()
  },
  { 
    id: '6', 
    name: 'report', 
    display_name: '보고서', 
    description: '각종 보고서', 
    icon: 'FileText', 
    color: 'gray', 
    sort_order: 6,
    is_active: true,
    created_at: new Date().toISOString()
  },
  { 
    id: '7', 
    name: 'certificate', 
    display_name: '인증서', 
    description: '인증서 및 자격증', 
    icon: 'Award', 
    color: 'yellow', 
    sort_order: 7,
    is_active: true,
    created_at: new Date().toISOString()
  },
  { 
    id: '8', 
    name: 'other', 
    display_name: '기타', 
    description: '기타 문서', 
    icon: 'File', 
    color: 'gray', 
    sort_order: 8,
    is_active: true,
    created_at: new Date().toISOString()
  }
]

export const getCategoryByName = (name: string) => {
  return DOCUMENT_CATEGORIES.find(cat => cat.name === name)
}

export const getCategoryDisplayName = (name: string) => {
  const category = getCategoryByName(name)
  return category?.display_name || '기타'
}