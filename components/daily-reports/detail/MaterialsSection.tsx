'use client'

import { Card } from '@/components/ui/card'
import { Package, Wrench } from 'lucide-react'

interface MaterialsSectionProps {
  formData: any
}

export const MaterialsSection = ({ formData }: MaterialsSectionProps) => {
  const materialUsage = formData?.materials || formData?.material_usage || []
  const equipmentUsage = formData?.equipment_usage || []

  return (
    <div className="space-y-6">
      {/* Material Usage */}
      <Card className="overflow-hidden border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/20">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-500" />
            자재 사용 내역
          </h3>
        </div>
        <div className="overflow-x-auto">
          {materialUsage.length > 0 ? (
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 font-medium">
                <tr>
                  <th className="px-6 py-3 font-semibold uppercase tracking-wider">자재명</th>
                  <th className="px-6 py-3 font-semibold uppercase tracking-wider">수량</th>
                  <th className="px-6 py-3 font-semibold uppercase tracking-wider">단위</th>
                  <th className="px-6 py-3 font-semibold uppercase tracking-wider">비고</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {materialUsage.map((material: any, index: number) => (
                  <tr
                    key={index}
                    className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">
                      {material.materialName || material.material_name}
                    </td>
                    <td className="px-6 py-4 text-blue-600 dark:text-blue-400 font-bold">
                      {material.quantity}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                      {material.unit || 'EA'}
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs">{material.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-10 text-center text-gray-400 dark:text-gray-600">
              <Package className="w-10 h-10 mx-auto mb-2 opacity-20" />
              <p>기록된 자재 사용 내역이 없습니다.</p>
            </div>
          )}
        </div>
      </Card>

      {/* (Equipment usage omitted if empty for brevity but supported if exists) */}
      {equipmentUsage.length > 0 && (
        <Card className="overflow-hidden border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/20">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Wrench className="w-5 h-5 text-orange-500" />
              장비 사용 내역
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 font-medium">
                <tr>
                  <th className="px-6 py-3 font-semibold uppercase tracking-wider">장비명</th>
                  <th className="px-6 py-3 font-semibold uppercase tracking-wider">사용시간</th>
                  <th className="px-6 py-3 font-semibold uppercase tracking-wider">운전자</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {equipmentUsage.map((equipment: any, index: number) => (
                  <tr
                    key={index}
                    className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">
                      {equipment.equipmentName || equipment.equipment_name}
                    </td>
                    <td className="px-6 py-4 text-orange-600 dark:text-orange-400 font-bold">
                      {equipment.hours_used}시간
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                      {equipment.operatorName || equipment.operator_name || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
