export interface DynamicDocumentType {
  id: string
  code: string
  name_ko: string
  name_en?: string
  description?: string
  file_types: string[]
  max_file_size: number
  sort_order: number
}

export class DynamicDocumentUtils {
  private static cache: DynamicDocumentType[] | null = null
  private static cacheTimestamp: number = 0
  private static CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  static async getDocumentTypes(
    roleType?: string,
    siteId?: string
  ): Promise<DynamicDocumentType[]> {
    const now = Date.now()

    // Use cache if valid and no specific filters
    if (!roleType && !siteId && this.cache && now - this.cacheTimestamp < this.CACHE_DURATION) {
      return this.cache
    }

    try {
      const params = new URLSearchParams()
      if (roleType) params.append('role_type', roleType)
      if (siteId) params.append('site_id', siteId)

      const response = await fetch(`/api/admin/required-document-types?${params}`)

      if (!response.ok) {
        throw new Error('Failed to fetch document types')
      }

      const data = await response.json()
      const documentTypes = data.document_types || []

      // Only cache if no specific filters
      if (!roleType && !siteId) {
        this.cache = documentTypes
        this.cacheTimestamp = now
      }

      return documentTypes
    } catch (error) {
      console.error('Error fetching dynamic document types:', error)

      // Return cached data if available as fallback
      if (this.cache) {
        return this.cache
      }

      // Fallback to hardcoded data if all else fails
      return this.getFallbackDocumentTypes()
    }
  }

  static async getDocumentTypeByCode(code: string): Promise<DynamicDocumentType | null> {
    const documentTypes = await this.getDocumentTypes()
    return documentTypes.find(dt => dt.code === code) || null
  }

  static async getDocumentTypesForRole(roleType: string): Promise<DynamicDocumentType[]> {
    try {
      const response = await fetch(`/api/required-document-types?role_type=${roleType}`)

      if (!response.ok) {
        throw new Error('Failed to fetch document types for role')
      }

      const data = await response.json()
      return data.required_documents || []
    } catch (error) {
      console.error('Error fetching document types for role:', error)
      return []
    }
  }

  static clearCache(): void {
    this.cache = null
    this.cacheTimestamp = 0
  }

  private static getFallbackDocumentTypes(): DynamicDocumentType[] {
    return [
      {
        id: 'fallback-1',
        code: 'safety_certificate',
        name_ko: '안전교육이수증',
        name_en: 'Safety Training Certificate',
        description: '필수 안전교육증',
        file_types: ['pdf', 'jpg', 'jpeg', 'png'],
        max_file_size: 10485760,
        sort_order: 1,
      },
      {
        id: 'fallback-2',
        code: 'health_certificate',
        name_ko: '건강진단서',
        name_en: 'Health Certificate',
        description: '건강적합 증명',
        file_types: ['pdf', 'jpg', 'jpeg', 'png'],
        max_file_size: 10485760,
        sort_order: 2,
      },
      {
        id: 'fallback-3',
        code: 'insurance_certificate',
        name_ko: '보험증서',
        name_en: 'Insurance Certificate',
        description: '보험 가입증명',
        file_types: ['pdf', 'jpg', 'jpeg', 'png'],
        max_file_size: 10485760,
        sort_order: 3,
      },
      {
        id: 'fallback-4',
        code: 'id_copy',
        name_ko: '신분증 사본',
        name_en: 'ID Card Copy',
        description: '신분증 사본',
        file_types: ['pdf', 'jpg', 'jpeg', 'png'],
        max_file_size: 10485760,
        sort_order: 4,
      },
      {
        id: 'fallback-5',
        code: 'license',
        name_ko: '자격증',
        name_en: 'Professional License',
        description: '자격/면허증',
        file_types: ['pdf', 'jpg', 'jpeg', 'png'],
        max_file_size: 10485760,
        sort_order: 5,
      },
      {
        id: 'fallback-6',
        code: 'employment_contract',
        name_ko: '근로계약서',
        name_en: 'Employment Contract',
        description: '고용 관계를 명시한 근로계약서',
        file_types: ['pdf', 'jpg', 'jpeg', 'png'],
        max_file_size: 10485760,
        sort_order: 6,
      },
      {
        id: 'fallback-7',
        code: 'bank_account',
        name_ko: '통장사본',
        name_en: 'Bank Account Copy',
        description: '급여 지급을 위한 본인 명의 통장 사본',
        file_types: ['pdf', 'jpg', 'jpeg', 'png'],
        max_file_size: 10485760,
        sort_order: 7,
      },
      {
        id: 'fallback-8',
        code: 'other',
        name_ko: '기타 서류',
        name_en: 'Other Documents',
        description: '프로젝트 추가서류',
        file_types: ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'],
        max_file_size: 10485760,
        sort_order: 8,
      },
    ]
  }

  static validateFileForDocumentType(file: File, documentType: DynamicDocumentType): string | null {
    const fileExtension = file.name.split('.').pop()?.toLowerCase()

    if (!fileExtension || !documentType.file_types.includes(fileExtension)) {
      return `허용되지 않는 파일 형식입니다. 허용 형식: ${documentType.file_types.join(', ')}`
    }

    if (file.size > documentType.max_file_size) {
      const maxSizeMB = (documentType.max_file_size / 1048576).toFixed(1)
      return `파일 크기가 너무 큽니다. 최대 크기: ${maxSizeMB}MB`
    }

    return null
  }

  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
}
