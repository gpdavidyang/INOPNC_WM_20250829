'use client'

import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { AlertCircle, CheckCircle2, FileText, HelpCircle, Shield, XCircle } from 'lucide-react'

interface SafetySectionProps {
  formData: any
}

export const SafetySection = ({ formData }: SafetySectionProps) => {
  const safetyIncidents = formData?.safety_incidents || []
  const qualityInspections = formData?.quality_inspections || []

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge className="bg-red-600 text-white">중대</Badge>
      case 'major':
        return <Badge className="bg-orange-600 text-white">경증</Badge>
      case 'moderate':
        return <Badge className="bg-yellow-500 text-white">보통</Badge>
      case 'minor':
        return <Badge className="bg-green-600 text-white">미미</Badge>
      default:
        return <Badge variant="outline">{severity}</Badge>
    }
  }

  const getResultBadge = (result: string) => {
    switch (result) {
      case 'pass':
        return (
          <Badge className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            합격
          </Badge>
        )
      case 'fail':
        return (
          <Badge className="bg-red-50 text-red-700 border-red-200 flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5" />
            불합격
          </Badge>
        )
      case 'conditional_pass':
        return (
          <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5" />
            조건부 합격
          </Badge>
        )
      default:
        return <Badge variant="outline">{result}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Safety Incidents */}
      <Card className="p-5 border-gray-200 dark:border-gray-700 shadow-sm">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-red-600" />
          안전 사고 및 이슈
        </h3>
        {safetyIncidents.length > 0 ? (
          <div className="space-y-4">
            {safetyIncidents.map((incident: any, index: number) => (
              <div
                key={index}
                className="group relative border border-gray-100 dark:border-gray-800 rounded-2xl p-4 bg-gray-50/50 dark:bg-gray-900/30 hover:bg-white dark:hover:bg-gray-800 transition-all hover:shadow-md"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    {getSeverityBadge(incident.severity)}
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-tighter">
                      {incident.incident_time}
                    </span>
                  </div>
                  <AlertCircle className="w-4 h-4 text-gray-300 group-hover:text-red-400 transition-colors" />
                </div>
                <p className="text-base font-bold text-gray-900 dark:text-gray-100 mb-2 leading-snug">
                  {incident.description}
                </p>
                <div className="space-y-1.5">
                  {incident.location && (
                    <p className="text-xs text-gray-500 font-medium">
                      위치:{' '}
                      <span className="text-gray-700 dark:text-gray-300">{incident.location}</span>
                    </p>
                  )}
                  {incident.actions_taken && (
                    <div className="mt-2.5 p-3 bg-white dark:bg-gray-950 rounded-xl border border-gray-100 dark:border-gray-800">
                      <p className="text-[11px] font-bold text-green-600 dark:text-green-400 uppercase tracking-widest mb-1">
                        조치사항
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                        {incident.actions_taken}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-10 text-center bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
            <Shield className="w-10 h-10 mx-auto mb-2 text-gray-200 dark:text-gray-700" />
            <p className="text-sm text-gray-400">발생한 안전 사고가 없습니다.</p>
          </div>
        )}
      </Card>

      {/* Quality Inspections */}
      <Card className="p-5 border-gray-200 dark:border-gray-700 shadow-sm">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-500" />
          품질 검사 및 점검
        </h3>
        {qualityInspections.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {qualityInspections.map((inspection: any, index: number) => (
              <div
                key={index}
                className="flex flex-col border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden bg-white dark:bg-gray-900 shadow-sm"
              >
                <div className="px-4 py-3 border-b border-gray-50 dark:border-gray-800 flex justify-between items-center bg-gray-50/30 dark:bg-gray-800/20">
                  <span className="font-bold text-sm text-gray-900 dark:text-gray-100">
                    {inspection.inspection_type}
                  </span>
                  {getResultBadge(inspection.result)}
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-2 text-[11px] font-medium text-gray-500">
                    <User className="w-3 h-3" />
                    <span>검사자: {inspection.inspector_name}</span>
                  </div>
                  {inspection.notes && (
                    <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed italic">
                        "{inspection.notes}"
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-10 text-center bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
            <FileText className="w-10 h-10 mx-auto mb-2 text-gray-200 dark:text-gray-700" />
            <p className="text-sm text-gray-400">기록된 품질 검사 내역이 없습니다.</p>
          </div>
        )}
      </Card>
    </div>
  )
}
