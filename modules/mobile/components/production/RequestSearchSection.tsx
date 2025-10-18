'use client'

import React, { useState } from 'react'
import { SelectField, type OptionItem } from '@/modules/mobile/components/production/SelectField'

interface RequestSearchSectionProps {
  materialOptions: OptionItem[]
  siteOptions: OptionItem[]
  partnerOptions: OptionItem[]
  defaultPeriod?: string
  defaultMaterialId?: string
  defaultSiteId?: string
  defaultPartnerCompanyId?: string
  defaultKeyword?: string
  resetHref?: string
}

export const RequestSearchSection: React.FC<RequestSearchSectionProps> = ({
  materialOptions,
  siteOptions,
  partnerOptions,
  defaultPeriod = '',
  defaultMaterialId = 'all',
  defaultSiteId = 'all',
  defaultPartnerCompanyId = 'all',
  defaultKeyword = '',
  resetHref = '/mobile/production/requests',
}) => {
  const [collapsed, setCollapsed] = useState(true)

  return (
    <div className="rounded-lg border p-4 bg-white">
      <div className="flex items-center justify-between mb-3">
        <div className="pm-section-title">요청 검색</div>
        <button
          type="button"
          className="pm-toggle-link"
          onClick={() => setCollapsed(prev => !prev)}
          aria-expanded={!collapsed}
          aria-controls="request-search-form"
        >
          {collapsed ? '펼치기' : '접기'}
        </button>
      </div>
      {!collapsed && (
        <form id="request-search-form" className="space-y-3" method="get">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">기간 (년월)</label>
              <input
                type="month"
                name="period"
                defaultValue={defaultPeriod}
                className="w-full rounded border px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">자재선택</label>
              <SelectField
                name="material_id"
                options={materialOptions}
                defaultValue={defaultMaterialId}
                placeholder="자재 선택"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">현장 선택</label>
              <SelectField
                name="site_id"
                options={siteOptions}
                defaultValue={defaultSiteId}
                placeholder="현장 선택"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">거래처 선택</label>
              <SelectField
                name="partner_company_id"
                options={partnerOptions}
                defaultValue={defaultPartnerCompanyId}
                placeholder="거래처 선택"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">검색어</label>
            <input
              type="text"
              name="q"
              defaultValue={defaultKeyword}
              placeholder="요청번호/현장/자재/요청자 검색"
              className="w-full rounded border px-3 py-2"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <a href={resetHref} className="rounded-md border px-3 py-3 text-sm text-center w-full">
              초기화
            </a>
            <button
              type="submit"
              className="rounded-md border px-3 py-3 text-sm bg-black text-white w-full"
            >
              검색
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

export default RequestSearchSection
