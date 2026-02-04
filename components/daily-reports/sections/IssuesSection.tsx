'use client'

import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { MessageSquare } from 'lucide-react'
import React from 'react'
import { CollapsibleSection } from '../CollapsibleSection'

interface IssuesSectionProps {
  formData: {
    issues: string
    hq_request: string
  }
  setFormData: React.Dispatch<React.SetStateAction<any>>
  isExpanded: boolean
  onToggle: () => void
  permissions: any
}

export const IssuesSection = ({
  formData,
  setFormData,
  isExpanded,
  onToggle,
  permissions,
}: IssuesSectionProps) => {
  return (
    <CollapsibleSection
      title="특이사항 및 본사 요청"
      icon={MessageSquare}
      isExpanded={isExpanded}
      onToggle={onToggle}
      permissions={permissions}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-2">
          <Label className="text-[11px] font-black text-foreground uppercase tracking-tighter opacity-50 pl-1">
            특이사항 (선택)
          </Label>
          <Textarea
            value={formData.issues || ''}
            onChange={e => setFormData((prev: any) => ({ ...prev, issues: e.target.value }))}
            placeholder="현장 특이사항이나 이슈가 있다면 입력해 주세요."
            className="h-32 rounded-2xl bg-slate-50 border-none px-5 py-4 text-sm focus:ring-2 focus:ring-blue-500/20 transition-all resize-none leading-relaxed"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[11px] font-black text-foreground uppercase tracking-tighter opacity-50 pl-1">
            본사 요청사항 (선택)
          </Label>
          <Textarea
            value={formData.hq_request || ''}
            onChange={e => setFormData((prev: any) => ({ ...prev, hq_request: e.target.value }))}
            placeholder="본사에 요청하거나 보고할 사항을 입력해 주세요."
            className="h-32 rounded-2xl bg-slate-50 border-none px-5 py-4 text-sm focus:ring-2 focus:ring-blue-500/20 transition-all resize-none leading-relaxed"
          />
        </div>
      </div>
    </CollapsibleSection>
  )
}
