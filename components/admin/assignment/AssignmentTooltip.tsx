'use client'

import React from 'react'
import { HelpCircle, Info } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface AssignmentTooltipProps {
  type: 'partner' | 'assignment' | 'mapping' | 'workflow'
  className?: string
}

const tooltipContent = {
  partner: {
    title: '파트너사 소속',
    description: '사용자가 소속된 파트너 회사입니다. 현장 변경 시 자주 바뀔 수 있습니다.',
    details: '• 사용자의 기본 회사 정보\n• 급여 및 계약 관리 기준\n• 현장 배정과는 별도 관리'
  },
  assignment: {
    title: '현장 배정',
    description: '관리자가 개별적으로 지정하는 작업 현장입니다. 명확한 업무 할당을 위해 필요합니다.',
    details: '• 실제 작업할 현장 지정\n• 관리자의 명시적 배정 필요\n• 배정 이력 완전 추적'
  },
  mapping: {
    title: '파트너사-현장 매핑',
    description: '파트너사가 담당하는 현장을 미리 연결해놓는 기능입니다.',
    details: '• 파트너사별 담당 현장 사전 지정\n• 효율적인 배정 관리를 위한 기초 작업\n• 일괄 배정의 기준이 됨'
  },
  workflow: {
    title: '배정 프로세스',
    description: '2단계 배정 시스템으로 체계적인 인력 관리가 가능합니다.',
    details: '1단계: 파트너사 ↔ 현장 매핑\n2단계: 사용자 ↔ 현장 개별 배정\n\n• 각 단계는 독립적으로 관리\n• 이력 추적으로 투명한 관리\n• 접근 제한 없이 유연한 운영'
  }
}

export default function AssignmentTooltip({ type, className = '' }: AssignmentTooltipProps) {
  const content = tooltipContent[type]

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button className={`inline-flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 ${className}`}>
            <HelpCircle className="h-4 w-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-sm p-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-blue-500" />
              <h4 className="font-semibold text-sm">{content.title}</h4>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {content.description}
            </p>
            <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
              <pre className="text-xs text-gray-500 dark:text-gray-400 whitespace-pre-wrap">
                {content.details}
              </pre>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// Individual tooltip components for easier usage
export const PartnerTooltip = ({ className }: { className?: string }) => (
  <AssignmentTooltip type="partner" className={className} />
)

export const AssignmentExplanationTooltip = ({ className }: { className?: string }) => (
  <AssignmentTooltip type="assignment" className={className} />
)

export const MappingTooltip = ({ className }: { className?: string }) => (
  <AssignmentTooltip type="mapping" className={className} />
)

export const WorkflowTooltip = ({ className }: { className?: string }) => (
  <AssignmentTooltip type="workflow" className={className} />
)