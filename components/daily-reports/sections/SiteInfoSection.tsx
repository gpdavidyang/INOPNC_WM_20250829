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
import { CollapsibleSection, useRolePermissions } from '../CollapsibleSection'

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
  permissions: ReturnType<typeof useRolePermissions>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="site_id" className="text-xs text-gray-500 font-medium">
            현장 선택 *
          </Label>
          <CustomSelect
            value={formData.site_id}
            onValueChange={value => setFormData((prev: any) => ({ ...prev, site_id: value }))}
          >
            <CustomSelectTrigger className="h-9">
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
        <div className="space-y-1.5">
          <Label className="text-xs text-gray-500 font-medium">소속 (자동)</Label>
          <Input value={selectedOrganizationLabel} readOnly className="h-9 bg-gray-50" />
          <p className="text-[10px] text-gray-400 mt-0.5">
            현장을 선택하면 연결된 소속이 자동으로 표시됩니다.
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="work_date" className="text-xs text-gray-500 font-medium">
            작업일자 *
          </Label>
          <Input
            id="work_date"
            type="date"
            value={formData.work_date}
            onChange={e => setFormData((prev: any) => ({ ...prev, work_date: e.target.value }))}
            required
            className="h-9"
          />
        </div>
      </div>
    </CollapsibleSection>
  )
}
