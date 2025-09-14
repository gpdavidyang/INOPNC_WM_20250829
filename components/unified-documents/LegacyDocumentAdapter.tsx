'use client'

import type { AsyncState, ApiResponse } from '@/types/utils'
import React, { useEffect, useState } from 'react'

interface LegacyDocumentAdapterProps {
  // 레거시 컴포넌트 props
  legacyDocumentType?: string
  legacyCategory?: string
  
  // 통합 시스템 매핑
  categoryType: string
  subCategory?: string
  
  // 렌더링 옵션
  children: (props: {
    documents: UnifiedDocument[]
    loading: boolean
    error: string | null
    onUpload: (file: File, metadata?: unknown) => Promise<void>
    onUpdate: (id: string, updates: unknown) => Promise<void>
    onDelete: (id: string) => Promise<void>
    refetch: () => Promise<void>
  }) => React.ReactNode
  
  // 추가 필터
  siteId?: string
  ownerId?: string
}

/**
 * 레거시 문서 컴포넌트와 통합 시스템 간의 어댑터
 * 기존 컴포넌트를 점진적으로 마이그레이션할 때 사용
 */
export default function LegacyDocumentAdapter({
  legacyDocumentType,
  legacyCategory,
  categoryType,
  subCategory,
  children,
  siteId,
  ownerId
}: LegacyDocumentAdapterProps) {
  const [adapterLoading, setAdapterLoading] = useState(false)

  // 필터 설정
  const filters: DocumentFilters = {
    categoryType,
    subCategory,
    siteId,
    ownerId,
    status: 'active'
  }

  const {
    documents,
    loading,
    error,
    uploadDocument,
    updateDocument,
    deleteDocument,
    fetchDocuments
  } = useUnifiedDocuments(filters)

  // 레거시 업로드 핸들러
  const handleLegacyUpload = async (file: File, metadata: unknown = {}) => {
    setAdapterLoading(true)
    try {
      // 레거시 메타데이터를 통합 시스템 형식으로 변환
      const unifiedMetadata = {
        category_type: categoryType,
        sub_category: subCategory,
        site_id: siteId,
        ...mapLegacyMetadata(legacyDocumentType, legacyCategory, metadata)
      }

      await uploadDocument(file, unifiedMetadata)
    } finally {
      setAdapterLoading(false)
    }
  }

  // 레거시 업데이트 핸들러
  const handleLegacyUpdate = async (id: string, updates: unknown) => {
    setAdapterLoading(true)
    try {
      // 레거시 업데이트 데이터를 통합 시스템 형식으로 변환
      const unifiedUpdates = mapLegacyUpdates(updates)
      await updateDocument(id, unifiedUpdates)
    } finally {
      setAdapterLoading(false)
    }
  }

  // 레거시 삭제 핸들러
  const handleLegacyDelete = async (id: string) => {
    setAdapterLoading(true)
    try {
      await deleteDocument(id, false) // 소프트 삭제
    } finally {
      setAdapterLoading(false)
    }
  }

  // 새로고침 핸들러
  const handleRefetch = async () => {
    await fetchDocuments(filters)
  }

  return (
    <>
      {children({
        documents,
        loading: loading || adapterLoading,
        error,
        onUpload: handleLegacyUpload,
        onUpdate: handleLegacyUpdate,
        onDelete: handleLegacyDelete,
        refetch: handleRefetch
      })}
    </>
  )
}

// 레거시 메타데이터를 통합 시스템 형식으로 변환
function mapLegacyMetadata(legacyType?: string, legacyCategory?: string, metadata: unknown = {}) {
  const base = {
    legacy_type: legacyType,
    legacy_category: legacyCategory,
    migration_source: 'legacy_adapter'
  }

  // 레거시 타입별 특별 처리
  switch (legacyType) {
    case 'markup':
      return {
        ...base,
        markup_data: metadata.markupData || [],
        metadata: {
          ...base,
          markup_count: metadata.markupCount || 0,
          preview_image_url: metadata.previewImageUrl
        }
      }
      
    case 'shared':
      return {
        ...base,
        is_public: true,
        metadata: {
          ...base,
          share_settings: metadata.shareSettings
        }
      }
      
    case 'required':
      return {
        ...base,
        approval_required: true,
        metadata: {
          ...base,
          requirement_info: metadata.requirementInfo
        }
      }
      
    default:
      return {
        ...base,
        metadata: base
      }
  }
}

// 레거시 업데이트를 통합 시스템 형식으로 변환
function mapLegacyUpdates(updates: unknown) {
  const mapped: unknown = {}
  
  // 직접 매핑 가능한 필드들
  const directMappings = {
    title: 'title',
    description: 'description',
    isPublic: 'is_public',
    isArchived: 'is_archived',
    tags: 'tags'
  }
  
  Object.entries(directMappings).forEach(([legacy, unified]) => {
    if (updates[legacy] !== undefined) {
      mapped[unified] = updates[legacy]
    }
  })
  
  // 메타데이터 업데이트
  if (updates.metadata) {
    mapped.metadata = updates.metadata
  }
  
  // 특별 처리가 필요한 필드들
  if (updates.markupData) {
    mapped.markup_data = updates.markupData
  }
  
  if (updates.photoMetadata) {
    mapped.photo_metadata = updates.photoMetadata
  }
  
  if (updates.receiptMetadata) {
    mapped.receipt_metadata = updates.receiptMetadata
  }
  
  return mapped
}

// HOC: 레거시 컴포넌트를 통합 시스템으로 래핑
export function withUnifiedDocuments<T extends object>(
  WrappedComponent: React.ComponentType<T>,
  adapterConfig: {
    categoryType: string
    subCategory?: string
    mapProps?: (unifiedProps: unknown) => Partial<T>
  }
) {
  return function UnifiedDocumentWrapper(props: T) {
    const { categoryType, subCategory, mapProps } = adapterConfig

    return (
      <LegacyDocumentAdapter
        categoryType={categoryType}
        subCategory={subCategory}
      >
        {(unifiedProps) => {
          // props 매핑
          const mappedProps = mapProps ? mapProps(unifiedProps) : {}
          
          return (
            <WrappedComponent
              {...props}
              {...mappedProps}
              // 레거시 prop 이름으로 매핑
              documents={unifiedProps.documents}
              loading={unifiedProps.loading}
              onRefresh={unifiedProps.refetch}
            />
          )
        }}
      </LegacyDocumentAdapter>
    )
  }
}

// 레거시 컴포넌트 예제 래핑
export const LegacySharedDocuments = withUnifiedDocuments(
  (props: unknown) => <div>Legacy Shared Documents Component</div>,
  {
    categoryType: 'shared',
    mapProps: (unifiedProps) => ({
      sharedDocuments: unifiedProps.documents,
      isLoading: unifiedProps.loading
    })
  }
)

export const LegacyMarkupDocuments = withUnifiedDocuments(
  (props: unknown) => <div>Legacy Markup Documents Component</div>,
  {
    categoryType: 'markup',
    mapProps: (unifiedProps) => ({
      markupDocuments: unifiedProps.documents.filter((doc: UnifiedDocument) => doc.markup_data),
      isLoading: unifiedProps.loading
    })
  }
)

export const LegacyRequiredDocuments = withUnifiedDocuments(
  (props: unknown) => <div>Legacy Required Documents Component</div>,
  {
    categoryType: 'required',
    mapProps: (unifiedProps) => ({
      requiredDocuments: unifiedProps.documents,
      isLoading: unifiedProps.loading
    })
  }
)

export const LegacyInvoiceDocuments = withUnifiedDocuments(
  (props: unknown) => <div>Legacy Invoice Documents Component</div>,
  {
    categoryType: 'invoice',
    mapProps: (unifiedProps) => ({
      invoiceDocuments: unifiedProps.documents,
      isLoading: unifiedProps.loading
    })
  }
)

export const LegacyPhotoGridDocuments = withUnifiedDocuments(
  (props: unknown) => <div>Legacy Photo Grid Documents Component</div>,
  {
    categoryType: 'photo_grid',
    mapProps: (unifiedProps) => ({
      photoDocuments: unifiedProps.documents.filter((doc: UnifiedDocument) => doc.photo_metadata),
      isLoading: unifiedProps.loading
    })
  }
)