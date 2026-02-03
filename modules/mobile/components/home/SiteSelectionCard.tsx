'use client'

import { Card } from '@/components/ui/card'
import {
  CustomSelect,
  CustomSelectContent,
  CustomSelectItem,
  CustomSelectTrigger,
  CustomSelectValue,
} from '@/components/ui/custom-select'
import { Briefcase, Building2 } from 'lucide-react'

interface SiteSelectionCardProps {
  sites: any[]
  selectedSite: string
  onSelect: (id: string) => void
  loading: boolean
}

export function SiteSelectionCard({
  sites,
  selectedSite,
  onSelect,
  loading,
}: SiteSelectionCardProps) {
  const selectedSiteItem = sites.find(s => s.id === selectedSite)

  return (
    <Card className="p-6 rounded-3xl border-none bg-white shadow-xl shadow-blue-900/5 overflow-hidden">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
          <Building2 className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-black text-foreground tracking-tight">현장 선택</h3>
          <p className="text-xs font-bold text-muted-foreground/60 uppercase tracking-widest">
            Select your working site
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <CustomSelect value={selectedSite} onValueChange={onSelect}>
          <CustomSelectTrigger className="h-14 rounded-2xl border-2 border-gray-100 bg-gray-50/50 px-5 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-base font-bold">
            <CustomSelectValue
              placeholder={loading ? '현장 불러오는 중...' : '현장을 선택하세요'}
            />
          </CustomSelectTrigger>
          <CustomSelectContent className="rounded-2xl border-none shadow-2xl">
            {sites.map(site => (
              <CustomSelectItem
                key={site.id}
                value={site.id}
                className="h-12 font-bold rounded-xl cursor-pointer"
              >
                {site.name}
              </CustomSelectItem>
            ))}
          </CustomSelectContent>
        </CustomSelect>

        {selectedSiteItem && (
          <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-blue-600/60 uppercase tracking-widest">
                  Selected Site Organization
                </span>
                <span className="text-sm font-bold text-blue-700">
                  {selectedSiteItem.organization_name || '소속사 정보 없음'}
                </span>
              </div>
              <Briefcase className="w-5 h-5 text-blue-300" />
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
