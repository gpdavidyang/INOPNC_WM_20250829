'use client'

import {
  CustomSelect,
  CustomSelectContent,
  CustomSelectItem,
  CustomSelectTrigger,
  CustomSelectValue,
} from '@/components/ui/custom-select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Site } from '@/types'
import { MapPin } from 'lucide-react'
import React from 'react'
import { CollapsibleSection } from '../CollapsibleSection'

interface SiteInfoSectionProps {
  formData: {
    site_id: string
    work_date: string
  }
  setFormData: React.Dispatch<React.SetStateAction<any>>
  filteredSites: Site[]
  selectedOrganizationLabel: string
  isExpanded: boolean
  onToggle: () => void
  permissions: any
}

export const SiteInfoSection = ({
  formData,
  setFormData,
  filteredSites,
  selectedOrganizationLabel,
  isExpanded,
  onToggle,
  permissions,
}: SiteInfoSectionProps) => {
  return (
    <CollapsibleSection
      title="현장 정보"
      icon={MapPin}
      isExpanded={isExpanded}
      onToggle={onToggle}
      required={true}
      permissions={permissions}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-1.5 align-top">
          <Label
            htmlFor="site_id"
            className="text-[11px] font-black text-foreground uppercase tracking-tighter opacity-50"
          >
            현장 선택 <span className="text-rose-500">*</span>
          </Label>
          <CustomSelect
            value={formData.site_id}
            onValueChange={value => setFormData((prev: any) => ({ ...prev, site_id: value }))}
          >
            <CustomSelectTrigger className="h-10 rounded-xl bg-gray-50 border-none px-4 text-sm focus:ring-2 focus:ring-blue-500/20 transition-all">
              <CustomSelectValue placeholder="현장을 선택하세요" />
            </CustomSelectTrigger>
            <CustomSelectContent>
              {filteredSites.map(site => (
                <CustomSelectItem key={site.id} value={site.id}>
                  {site.name}
                </CustomSelectItem>
              ))}
            </CustomSelectContent>
          </CustomSelect>
        </div>
        <div className="space-y-1.5 align-top">
          <Label className="text-[11px] font-black text-foreground uppercase tracking-tighter opacity-50">
            소속 (자동)
          </Label>
          <Input
            value={selectedOrganizationLabel}
            readOnly
            className="h-10 rounded-xl bg-gray-100/50 border-none px-4 text-sm font-medium text-gray-500"
          />
          <p className="text-[10px] text-gray-400 mt-1 pl-1">
            현장을 선택하면 연결된 소속이 자동으로 표시됩니다.
          </p>
        </div>
        <div className="space-y-1.5 align-top">
          <Label
            htmlFor="work_date"
            className="text-[11px] font-black text-foreground uppercase tracking-tighter opacity-50"
          >
            작업일자 <span className="text-rose-500">*</span>
          </Label>
          <Input
            id="work_date"
            type="date"
            value={formData.work_date}
            onChange={e => setFormData((prev: any) => ({ ...prev, work_date: e.target.value }))}
            required
            className="h-10 rounded-xl bg-gray-50 border-none px-4 text-sm focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
        </div>
      </div>
    </CollapsibleSection>
  )
}
