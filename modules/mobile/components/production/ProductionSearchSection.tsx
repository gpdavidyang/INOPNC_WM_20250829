'use client'

import React, { useState } from 'react'
import { SelectField, type OptionItem } from '@/modules/mobile/components/production/SelectField'
import MaterialPartnerSelect from '@/modules/mobile/components/production/MaterialPartnerSelect'
import type { MaterialPartnerOption } from '@/modules/mobile/types/material-partner'

interface ProductionSearchSectionProps {
  materialOptions: OptionItem[]
  siteOptions?: OptionItem[]
  partnerOptions: MaterialPartnerOption[]
  defaultPeriod?: string
  defaultMaterialId?: string
  defaultSiteId?: string
  defaultPartnerCompanyId?: string
  defaultKeyword?: string
  title?: string
  resetHref?: string
  includeStatusSelect?: boolean
  statusOptions?: OptionItem[]
  defaultStatus?: string
  statusLabel?: string
  statusName?: string
  partnerFieldLabel?: string
  partnerPlaceholder?: string
  includeSiteSelect?: boolean
}

export const ProductionSearchSection: React.FC<ProductionSearchSectionProps> = ({
  materialOptions,
  siteOptions = [],
  partnerOptions,
  defaultPeriod = '',
  defaultMaterialId = 'all',
  defaultSiteId = 'all',
  defaultPartnerCompanyId = 'all',
  defaultKeyword = '',
  title = '생산 검색',
  resetHref = '/mobile/production/production',
  includeStatusSelect = false,
  statusOptions = [
    { value: 'all', label: '전체' },
    { value: 'completed', label: '완료' },
    { value: 'pending', label: '대기' },
  ],
  defaultStatus = 'all',
  statusLabel = '상태',
  statusName = 'status',
  partnerFieldLabel = '자재거래처',
  partnerPlaceholder = '자재거래처 선택',
  includeSiteSelect = true,
}) => {
  const [collapsed, setCollapsed] = useState(true)
  const showSiteSelect = includeSiteSelect && siteOptions.length > 0

  return (
    <div className="rounded-lg border p-4 bg-white">
      <div className="flex items-center justify-between mb-3">
        <div className="pm-section-title">{title}</div>
        <button
          type="button"
          className="pm-toggle-link"
          onClick={() => setCollapsed(prev => !prev)}
          aria-expanded={!collapsed}
          aria-controls="production-search-form"
        >
          {collapsed ? '펼치기' : '접기'}
        </button>
      </div>
      {!collapsed && (
        <form id="production-search-form" className="pm-form space-y-3" method="get">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">조회 기간</label>
              <input
                type="month"
                name="period"
                defaultValue={defaultPeriod}
                className="w-full rounded-lg border px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">자재 선택</label>
              <SelectField
                name="material_id"
                options={materialOptions}
                defaultValue={defaultMaterialId || 'all'}
                placeholder="자재 선택"
              />
            </div>
          </div>
          {includeStatusSelect && (
            <div>
              <label className="block text-xs text-muted-foreground mb-1">{statusLabel}</label>
              <SelectField
                name={statusName}
                options={statusOptions}
                defaultValue={defaultStatus || 'all'}
                placeholder="상태 선택"
              />
            </div>
          )}
          {showSiteSelect ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">현장 선택</label>
                <SelectField
                  name="site_id"
                  options={siteOptions}
                  defaultValue={defaultSiteId || 'all'}
                  placeholder="현장 선택"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">
                  {partnerFieldLabel}
                </label>
                <MaterialPartnerSelect
                  name="partner_company_id"
                  options={partnerOptions}
                  defaultValue={defaultPartnerCompanyId || 'all'}
                  placeholder={partnerPlaceholder}
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs text-muted-foreground mb-1">
                {partnerFieldLabel}
              </label>
              <MaterialPartnerSelect
                name="partner_company_id"
                options={partnerOptions}
                defaultValue={defaultPartnerCompanyId || 'all'}
                placeholder={partnerPlaceholder}
              />
            </div>
          )}
          <div>
            <label className="block text-xs text-muted-foreground mb-1">검색어</label>
            <input
              type="text"
              name="q"
              defaultValue={defaultKeyword}
              placeholder="검색어를 입력하세요."
              className="w-full rounded-lg border px-3 py-2"
            />
          </div>
          <div className="pm-form-actions">
            <a href={resetHref} className="pm-btn pm-btn-secondary">
              초기화
            </a>
            <button type="submit" className="pm-btn pm-btn-primary">
              검색
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

export default ProductionSearchSection
